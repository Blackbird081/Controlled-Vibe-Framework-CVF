import { describe, expect, it } from "vitest";
import { MaoDelegationAdapter, createMaoDelegationAdapter } from "../src/mao/delegation.adapter.contract";
import type { MaoAdmissionReceiptLike, MaoCapabilityDeclaration, MaoInvocationRequest } from "../src/mao/delegation.adapter.contract";
import { compileTaskGraph } from "../src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../src/mao/task.graph.contract";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_T3_PROVIDER_NEUTRAL_DELEGATION_ADAPTER_2026-07-11.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: { maxInvocations: 5, maxConcurrentRoles: 1, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function task(taskId: string, fileScope: string[] = [`src/${taskId}.ts`]): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R1", fileScope };
}

function compileGraph(authority: MaoAuthorityEnvelopeInput = authorityInput(), tasks: MaoTaskDefinitionInput[] = [task("t1")]): MaoTaskGraph {
  const result = compileTaskGraph({ authority, tasks });
  if (!result.ok) throw new Error(`test fixture graph failed to compile: ${result.reason} - ${result.detail}`);
  return result.graph;
}

function admittedReceipt(graph: MaoTaskGraph, decision: MaoAdmissionReceiptLike["decision"] = "SINGLE_WORKER_ADMITTED", approvalRequired = false): MaoAdmissionReceiptLike {
  return { taskGraphId: graph.taskGraphId, decision, approvalRequired, admittedRoles: ["worker"] };
}

function capability(overrides: Partial<MaoCapabilityDeclaration> = {}): MaoCapabilityDeclaration {
  return { role: "worker", requiredCapabilities: ["text-generation"], offeredCapabilities: ["text-generation"], ...overrides };
}

function requestFor(
  graph: MaoTaskGraph,
  overrides: Partial<MaoInvocationRequest> = {},
): MaoInvocationRequest {
  return {
    graph,
    admission: admittedReceipt(graph),
    taskId: "t1",
    capability: capability(),
    inputManifest: ["docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_T3_PROVIDER_NEUTRAL_DELEGATION_ADAPTER_2026-07-11.md"],
    idempotencyKey: "key-1",
    startedAt: "2026-07-11T00:00:00.000Z",
    ...overrides,
  };
}

// --- Positive path and determinism ---

describe("MaoDelegationAdapter positive invocation", () => {
  it("issues a receipt for an admitted single-worker task", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    const result = adapter.invoke(requestFor(graph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.replayed).toBe(false);
      expect(result.receipt.taskId).toBe("t1");
      expect(result.receipt.authorityHash).toBe(graph.authorityEnvelope.authorityHash);
      expect(result.receipt.role).toBe("worker");
      expect(result.receipt.diagnosticClass).toBeNull();
      expect(Object.isFrozen(result.receipt)).toBe(true);
    }
  });

  it("produces a deterministic invocationId for two independent adapters given identical inputs", () => {
    const graph = compileGraph();
    const adapterA = createMaoDelegationAdapter();
    const adapterB = createMaoDelegationAdapter();
    const resultA = adapterA.invoke(requestFor(graph, { idempotencyKey: "det-key" }));
    const resultB = adapterB.invoke(requestFor(graph, { idempotencyKey: "det-key" }));
    expect(resultA.ok && resultB.ok).toBe(true);
    if (resultA.ok && resultB.ok) {
      expect(resultA.receipt.invocationId).toBe(resultB.receipt.invocationId);
      expect(resultA.receipt.attemptId).toBe(resultB.receipt.attemptId);
      expect(resultA.receipt.inputManifestHash).toBe(resultB.receipt.inputManifestHash);
    }
  });

  it("input manifest hash is insensitive to input array order", () => {
    const graph = compileGraph();
    const adapterA = createMaoDelegationAdapter();
    const adapterB = createMaoDelegationAdapter();
    const resultA = adapterA.invoke(requestFor(graph, { idempotencyKey: "order-a", inputManifest: ["a.md", "b.md"] }));
    const resultB = adapterB.invoke(requestFor(graph, { idempotencyKey: "order-b", inputManifest: ["b.md", "a.md"] }));
    expect(resultA.ok && resultB.ok).toBe(true);
    if (resultA.ok && resultB.ok) {
      expect(resultA.receipt.inputManifestHash).toBe(resultB.receipt.inputManifestHash);
    }
  });
});

// --- Idempotency: replay and conflict ---

describe("MaoDelegationAdapter idempotency", () => {
  it("rejects replay when the same key is reused with a different input manifest", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    expect(adapter.invoke(requestFor(graph)).ok).toBe(true);
    const conflict = adapter.invoke(requestFor(graph, { inputManifest: ["different.md"] }));
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.reason).toBe("REJECTED_IDEMPOTENCY_KEY_CONFLICT");
  });
  it("returns the existing receipt (replayed: true) for a repeated idempotencyKey on the same task/authority", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    const first = adapter.invoke(requestFor(graph));
    const second = adapter.invoke(requestFor(graph));
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.replayed).toBe(true);
      expect(second.receipt.invocationId).toBe(first.receipt.invocationId);
    }
  });

  it("does not execute a duplicate attempt (attempt sequence advances only once)", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    adapter.invoke(requestFor(graph));
    adapter.invoke(requestFor(graph));
    const thirdWithNewKey = adapter.invoke(requestFor(graph, { idempotencyKey: "key-2" }));
    expect(thirdWithNewKey.ok).toBe(true);
    if (thirdWithNewKey.ok) {
      // attemptId for key-2 should reflect attempt sequence 2, not 3, proving
      // the replayed key-1 call never advanced the sequence a second time.
      const freshAdapter = createMaoDelegationAdapter();
      freshAdapter.invoke(requestFor(graph, { idempotencyKey: "unused-first" }));
      const expectedSecond = freshAdapter.invoke(requestFor(graph, { idempotencyKey: "key-2" }));
      expect(expectedSecond.ok).toBe(true);
      if (expectedSecond.ok) {
        expect(thirdWithNewKey.receipt.attemptId).toBe(expectedSecond.receipt.attemptId);
      }
    }
  });

  it("rejects reusing the same idempotencyKey for a different task as a conflict", () => {
    const graph = compileGraph(authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }), [task("t1"), task("t2", ["src/t2.ts"])]);
    const adapter = createMaoDelegationAdapter();
    const first = adapter.invoke(requestFor(graph, { taskId: "t1" }));
    expect(first.ok).toBe(true);
    const conflict = adapter.invoke(requestFor(graph, { taskId: "t2" }));
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.reason).toBe("REJECTED_IDEMPOTENCY_KEY_CONFLICT");
    }
  });

  it("getReceiptByIdempotencyKey returns null for an unknown key and the receipt for a known key", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    expect(adapter.getReceiptByIdempotencyKey("never-used")).toBeNull();
    adapter.invoke(requestFor(graph));
    expect(adapter.getReceiptByIdempotencyKey("key-1")).not.toBeNull();
  });
});

// --- Table-driven fail-closed negatives ---

interface AdapterNegativeCase {
  name: string;
  build: (adapter: MaoDelegationAdapter) => ReturnType<MaoDelegationAdapter["invoke"]>;
  expectedReason: string;
}

describe("MaoDelegationAdapter fail-closed rejections", () => {
  it("rejects a task role omitted from the admission receipt", () => {
    const graph = compileGraph();
    const result = createMaoDelegationAdapter().invoke(requestFor(graph, { admission: { ...admittedReceipt(graph), admittedRoles: [] } }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("REJECTED_ROLE_NOT_ADMITTED");
  });

  it("rejects a capability declaration for a different role", () => {
    const graph = compileGraph();
    const result = createMaoDelegationAdapter().invoke(requestFor(graph, { capability: capability({ role: "reviewer" }) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("REJECTED_CAPABILITY_ROLE_MISMATCH");
  });
  const cases: AdapterNegativeCase[] = [
    {
      name: "rejects an invocation for a task not declared in the graph",
      build: (adapter) => adapter.invoke(requestFor(compileGraph(), { taskId: "ghost" })),
      expectedReason: "REJECTED_TASK_NOT_IN_GRAPH",
    },
    {
      name: "rejects an admission receipt bound to a different taskGraphId",
      build: (adapter) => {
        const graph = compileGraph();
        const otherGraph = compileGraph(authorityInput({ workOrderId: "different-work-order" }));
        return adapter.invoke(requestFor(graph, { admission: admittedReceipt(otherGraph) }));
      },
      expectedReason: "REJECTED_ADMISSION_GRAPH_MISMATCH",
    },
    {
      name: "rejects an admission decision of REJECTED",
      build: (adapter) => {
        const graph = compileGraph();
        return adapter.invoke(requestFor(graph, { admission: admittedReceipt(graph, "REJECTED") }));
      },
      expectedReason: "REJECTED_ADMISSION_DECISION_REJECTED",
    },
    {
      name: "rejects an unapproved OPERATOR_APPROVAL_REQUIRED admission",
      build: (adapter) => {
        const graph = compileGraph();
        return adapter.invoke(requestFor(graph, { admission: admittedReceipt(graph, "OPERATOR_APPROVAL_REQUIRED", true) }));
      },
      expectedReason: "REJECTED_ADMISSION_APPROVAL_PENDING",
    },
    {
      name: "rejects a graph whose authority envelope has been tampered with",
      build: (adapter) => {
        const graph = compileGraph();
        const tamperedGraph: MaoTaskGraph = { ...graph, authorityEnvelope: { ...graph.authorityEnvelope, riskLevel: "R3" } };
        return adapter.invoke(requestFor(tamperedGraph, { admission: admittedReceipt(graph) }));
      },
      expectedReason: "REJECTED_AUTHORITY_HASH_INVALID",
    },
    {
      name: "rejects an empty input manifest",
      build: (adapter) => adapter.invoke(requestFor(compileGraph(), { inputManifest: [] })),
      expectedReason: "REJECTED_INVALID_INPUT_MANIFEST",
    },
    {
      name: "rejects a capability declaration missing a required capability",
      build: (adapter) =>
        adapter.invoke(requestFor(compileGraph(), { capability: capability({ requiredCapabilities: ["text-generation", "tool-use"], offeredCapabilities: ["text-generation"] }) })),
      expectedReason: "REJECTED_MISSING_CAPABILITY",
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      const adapter = createMaoDelegationAdapter();
      const result = testCase.build(adapter);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe(testCase.expectedReason);
      }
    });
  }
});

// --- Provider-neutrality and secret-safety invariants ---

describe("MaoDelegationAdapter provider-neutrality and secret safety", () => {
  it("never mentions a provider brand name anywhere in a successful receipt", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    const result = adapter.invoke(requestFor(graph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const serialized = JSON.stringify(result.receipt).toLowerCase();
      for (const brand of ["claude", "anthropic", "codex", "openai", "gemini", "gpt"]) {
        expect(serialized).not.toContain(brand);
      }
    }
  });

  it("never mentions a provider brand name in a rejection detail", () => {
    const adapter = createMaoDelegationAdapter();
    const result = adapter.invoke(requestFor(compileGraph(), { taskId: "ghost" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const serialized = result.detail.toLowerCase();
      for (const brand of ["claude", "anthropic", "codex", "openai", "gemini", "gpt"]) {
        expect(serialized).not.toContain(brand);
      }
    }
  });

  it("usage envelope reports UNAVAILABLE rather than fabricating provider-reported usage", () => {
    const graph = compileGraph();
    const adapter = createMaoDelegationAdapter();
    const result = adapter.invoke(requestFor(graph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.receipt.usage.measurementLabel).toBe("UNAVAILABLE");
      expect(result.receipt.usage.tokensReported).toBeNull();
    }
  });

  it("does not throw or leak input content on a rejection path (secret-safe diagnostic)", () => {
    const adapter = createMaoDelegationAdapter();
    const secretLikeManifest = ["SECRET_API_KEY=sk-not-a-real-secret-but-should-not-leak"];
    const result = adapter.invoke(requestFor(compileGraph(), { taskId: "ghost", inputManifest: secretLikeManifest }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.detail).not.toContain("SECRET_API_KEY");
    }
  });
});
