import { describe, expect, it } from "vitest";
import { resolveRole } from "../src/mao/role.resolver.contract";
import type { MaoRoleResolutionDecision, MaoRoleResolutionReasonCode } from "../src/mao/role.resolver.contract";
import { compileTaskGraph } from "../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_T2_RISK_BASED_ROLE_RESOLVER_2026-07-11.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: {
      maxInvocations: 5,
      maxConcurrentRoles: 3,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function task(
  taskId: string,
  role: MaoTaskDefinitionInput["role"],
  riskLevel: MaoTaskDefinitionInput["riskLevel"],
  fileScope: string[] = [`src/${taskId}.ts`],
  requiresIsolatedSourcePacket?: boolean,
): MaoTaskDefinitionInput {
  return { taskId, role, riskLevel, fileScope, requiresIsolatedSourcePacket };
}

function compile(
  authority: MaoAuthorityEnvelopeInput,
  tasks: MaoTaskDefinitionInput[],
  dependencyManifest?: { taskId: string; dependsOn: string[] }[],
): MaoTaskGraph {
  const result = compileTaskGraph({ authority, tasks, dependencyManifest });
  if (!result.ok) {
    throw new Error(`test fixture graph failed to compile: ${result.reason} - ${result.detail}`);
  }
  return result.graph;
}

// --- Deterministic replay ---

describe("resolveRole determinism", () => {
  it("returns an identical receipt across two independent calls with the same graph and seed", () => {
    const graph = compile(authorityInput(), [task("t1", "worker", "R1")]);
    const first = resolveRole({ graph, receiptId: "seed-1" });
    const second = resolveRole({ graph, receiptId: "seed-1" });
    expect(first).toEqual(second);
    expect(first.receiptId).toBe(second.receiptId);
  });

  it("produces a different receiptId for a different caller-supplied seed", () => {
    const graph = compile(authorityInput(), [task("t1", "worker", "R1")]);
    const first = resolveRole({ graph, receiptId: "seed-1" });
    const second = resolveRole({ graph, receiptId: "seed-2" });
    expect(first.receiptId).not.toBe(second.receiptId);
    expect(first.decision).toBe(second.decision); // decision itself is still deterministic on graph content
  });

  it("returns a frozen, immutable receipt", () => {
    const graph = compile(authorityInput(), [task("t1", "worker", "R1")]);
    const receipt = resolveRole({ graph, receiptId: "seed-1" });
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.admittedRoles)).toBe(true);
  });
});

// --- Table-driven decision cases ---

interface ResolverCase {
  name: string;
  authority?: Partial<MaoAuthorityEnvelopeInput>;
  tasks: MaoTaskDefinitionInput[];
  expectedDecision: MaoRoleResolutionDecision;
  expectedReason: MaoRoleResolutionReasonCode;
  expectedApprovalRequired: boolean;
}

const cases: ResolverCase[] = [
  {
    name: "R0 single task admits single worker by default",
    tasks: [task("t1", "worker", "R0")],
    expectedDecision: "SINGLE_WORKER_ADMITTED",
    expectedReason: "SINGLE_TASK_LOW_RISK_DEFAULT",
    expectedApprovalRequired: false,
  },
  {
    name: "R1 single task admits single worker by default",
    tasks: [task("t1", "worker", "R1")],
    expectedDecision: "SINGLE_WORKER_ADMITTED",
    expectedReason: "SINGLE_TASK_LOW_RISK_DEFAULT",
    expectedApprovalRequired: false,
  },
  {
    name: "R1 multi-task graph with non-overlapping scope and closer admits a bounded role plan",
    authority: { route: "MULTI_AGENT_MULTI_ROLE" },
    tasks: [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", ["review/a.md"], true),
    ],
    expectedDecision: "BOUNDED_ROLE_PLAN_ADMITTED",
    expectedReason: "SINGLE_TASK_LOW_RISK_DEFAULT",
    expectedApprovalRequired: false,
  },
  {
    name: "R2 with worker plus reviewer admits a bounded role plan",
    authority: { route: "MULTI_AGENT_MULTI_ROLE" },
    tasks: [
      task("t1", "worker", "R2", ["src/a.ts"]),
      task("t2", "reviewer", "R2", ["review/a.md"], true),
    ],
    expectedDecision: "BOUNDED_ROLE_PLAN_ADMITTED",
    expectedReason: "MEDIUM_RISK_REVIEWER_REQUIRED",
    expectedApprovalRequired: false,
  },
  {
    name: "R2 single task (no reviewer) is rejected",
    tasks: [task("t1", "worker", "R2")],
    expectedDecision: "REJECTED",
    expectedReason: "HIGH_RISK_SPECIALIST_CHAIN_REQUIRED",
    expectedApprovalRequired: false,
  },
  {
    name: "R3 with worker, specialist, reviewer, closer requires operator approval checkpoint",
    authority: { route: "MULTI_AGENT_MULTI_ROLE" },
    tasks: [
      task("t1", "worker", "R3", ["src/a.ts"]),
      task("t2", "specialist", "R3", ["src/b.ts"]),
      task("t3", "reviewer", "R3", ["review/a.md"], true),
    ],
    expectedDecision: "OPERATOR_APPROVAL_REQUIRED",
    expectedReason: "HIGH_RISK_CHECKPOINT_REQUIRED",
    expectedApprovalRequired: true,
  },
];

describe("resolveRole table-driven decisions", () => {
  for (const testCase of cases) {
    it(testCase.name, () => {
      const graph = compile(authorityInput(testCase.authority), testCase.tasks);
      const receipt = resolveRole({ graph, receiptId: "case-seed" });
      expect(receipt.decision).toBe(testCase.expectedDecision);
      expect(receipt.riskReason).toBe(testCase.expectedReason);
      expect(receipt.approvalRequired).toBe(testCase.expectedApprovalRequired);
      expect(receipt.taskGraphId).toBe(graph.taskGraphId);
      expect(receipt.admittedRoles.every((role) => ["worker", "reviewer", "specialist", "closer"].includes(role))).toBe(true);
    });
  }
});

// --- R3 missing-role negatives. Closer identity is an authority-envelope
// property (AHB CF-07), never a graph task, so a missing closer is caught
// by the earlier structural REJECTED_NO_CLOSER_DESIGNATED check, before
// resolveRole ever reaches R3-specific risk-tier routing. ---

describe("resolveRole R3 missing-role rejection", () => {
  it("rejects R3 admission missing the specialist task role", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }), [
      task("t1", "worker", "R3", ["src/a.ts"]),
      task("t2", "reviewer", "R3", ["review/a.md"], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_MISSING_REQUIRED_ROLE_FOR_RISK_TIER");
    expect(receipt.costJustification).toContain("specialist");
  });

  it("rejects R3 admission with all task roles present but no designated closer on the envelope", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE", closerActorId: "" }), [
      task("t1", "worker", "R3", ["src/a.ts"]),
      task("t2", "specialist", "R3", ["src/b.ts"]),
      task("t3", "reviewer", "R3", ["review/a.md"], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_NO_CLOSER_DESIGNATED");
  });
});

// --- Structural fail-closed negatives ---

describe("resolveRole fail-closed structural rejections", () => {
  it("rejects a graph whose authority content no longer matches its hash", () => {
    const compiled = compile(authorityInput(), [task("t1", "worker", "R1")]);
    const graph: MaoTaskGraph = {
      ...compiled,
      authorityEnvelope: { ...compiled.authorityEnvelope, riskLevel: "R3" },
    };
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.riskReason).toBe("REJECTED_AUTHORITY_HASH_INVALID");
  });

  it("allows overlapping write scope when dependency order serializes the tasks", () => {
    const graph = compile(
      authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }),
      [task("t1", "worker", "R1", ["src/shared.ts"]), task("t2", "reviewer", "R1", ["src/shared.ts"], true)],
      [{ taskId: "t1", dependsOn: [] }, { taskId: "t2", dependsOn: ["t1"] }],
    );
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("BOUNDED_ROLE_PLAN_ADMITTED");
  });

  it("rejects multiple distinct roles when the authority route is single-role", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }), [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", ["review/a.md"], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.riskReason).toBe("REJECTED_ROUTE_ROLE_PATTERN_MISMATCH");
  });

  it("uses authority risk when it is higher than every task risk", () => {
    const graph = compile(authorityInput({ riskLevel: "R3", route: "MULTI_AGENT_MULTI_ROLE" }), [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "specialist", "R1", ["src/b.ts"]),
      task("t3", "reviewer", "R1", ["review/a.md"], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("OPERATOR_APPROVAL_REQUIRED");
  });

  it("rejects a graph whose maxRevisionDepth exceeds the pilot ceiling", () => {
    const graph = compile(
      authorityInput({ budget: { maxInvocations: 5, maxConcurrentRoles: 1, maxRevisionDepth: 2, tokenCostCeiling: null, wallClockCeilingMs: null } }),
      [task("t1", "worker", "R1")],
    );
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_REVISION_DEPTH_EXCEEDS_PILOT_CEILING");
  });

  it("rejects a multi-task graph where a task declares an empty file scope (not decomposable)", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }), [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", [], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_NO_DECOMPOSABLE_SCOPE");
  });

  it("rejects a multi-task graph with no designated closer on the authority envelope", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE", closerActorId: "" }), [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", ["review/a.md"], true),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_NO_CLOSER_DESIGNATED");
  });

  it("rejects a multi-task graph where a reviewer task does not require an isolated source packet", () => {
    const graph = compile(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }), [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", ["review/a.md"], false),
    ]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_MISSING_SOURCE_PACKET_FOR_ROLE");
  });

  it("rejects a multi-task graph whose budget cannot fund the declared role count", () => {
    const graph = compile(
      authorityInput({
        route: "MULTI_AGENT_MULTI_ROLE",
        budget: { maxInvocations: 1, maxConcurrentRoles: 1, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null },
      }),
      [
        task("t1", "worker", "R1", ["src/a.ts"]),
        task("t2", "reviewer", "R1", ["review/a.md"], true),
      ],
    );
    const receipt = resolveRole({ graph, receiptId: "seed" });
    expect(receipt.decision).toBe("REJECTED");
    expect(receipt.riskReason).toBe("REJECTED_BUDGET_INSUFFICIENT_FOR_ROLE_COUNT");
  });
});

// --- No-provider / no-authority-widening invariants ---

describe("resolveRole provider-neutrality and authority invariants", () => {
  it("never widens the compiled graph's route, budget, or closer", () => {
    const authority = authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" });
    const graph = compile(authority, [
      task("t1", "worker", "R1", ["src/a.ts"]),
      task("t2", "reviewer", "R1", ["review/a.md"], true),
    ]);
    const beforeRoute = graph.authorityEnvelope.route;
    const beforeBudget = { ...graph.authorityEnvelope.budget };
    const beforeCloser = graph.authorityEnvelope.closerActorId;
    resolveRole({ graph, receiptId: "seed" });
    expect(graph.authorityEnvelope.route).toBe(beforeRoute);
    expect(graph.authorityEnvelope.budget).toEqual(beforeBudget);
    expect(graph.authorityEnvelope.closerActorId).toBe(beforeCloser);
  });

  it("receipt never contains a provider name or brand-specific field", () => {
    const graph = compile(authorityInput(), [task("t1", "worker", "R1")]);
    const receipt = resolveRole({ graph, receiptId: "seed" });
    const serialized = JSON.stringify(receipt).toLowerCase();
    for (const brand of ["claude", "anthropic", "codex", "openai", "gemini", "gpt"]) {
      expect(serialized).not.toContain(brand);
    }
  });
});
