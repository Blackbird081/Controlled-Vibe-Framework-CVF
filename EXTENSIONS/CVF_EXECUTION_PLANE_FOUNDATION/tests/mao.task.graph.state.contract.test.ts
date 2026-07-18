import { describe, expect, it } from "vitest";
import {
  buildAuthorityEnvelope,
  compileTaskGraph,
  computeAuthorityHash,
  detectDependencyCycle,
  directDependencies,
  directDependents,
  verifyAuthorityEnvelope,
} from "../src/mao/task.graph.contract";
import type { MaoAuthorityEnvelopeInput, MaoTaskDefinitionInput, MaoTaskGraph } from "../src/mao/task.graph.contract";
import { MaoEventLedger, descendantPropagationFor, isTerminalState } from "../src/mao/event.ledger.contract";
import type { MaoTaskState } from "../src/mao/event.ledger.contract";
import { buildReadModel, readModelsAreEqual } from "../src/mao/read.model.contract";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_T1_TASK_GRAPH_AND_STATE_CONTRACT_2026-07-11.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: {
      maxInvocations: 5,
      maxConcurrentRoles: 1,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function worker(taskId: string, fileScope: string[] = [`src/${taskId}.ts`]): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R1", fileScope };
}

function reviewer(taskId: string, fileScope: string[] = [`review/${taskId}.md`]): MaoTaskDefinitionInput {
  return { taskId, role: "reviewer", riskLevel: "R1", fileScope };
}

// --- Authority envelope ---

describe("authority envelope", () => {
  it("computes the same hash for identical content", () => {
    const a = computeAuthorityHash(authorityInput());
    const b = computeAuthorityHash(authorityInput());
    expect(a).toBe(b);
  });

  it("computes a different hash when any field changes", () => {
    const base = computeAuthorityHash(authorityInput());
    const changedRoute = computeAuthorityHash(authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }));
    const changedBudget = computeAuthorityHash(
      authorityInput({ budget: { maxInvocations: 9, maxConcurrentRoles: 1, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null } }),
    );
    expect(changedRoute).not.toBe(base);
    expect(changedBudget).not.toBe(base);
  });

  it("verifies an untampered envelope", () => {
    const envelope = buildAuthorityEnvelope(authorityInput());
    expect(verifyAuthorityEnvelope(envelope)).toBe(true);
  });

  it("rejects an envelope whose recorded hash no longer matches its content (stale authority)", () => {
    const envelope = buildAuthorityEnvelope(authorityInput());
    const tampered = { ...envelope, riskLevel: "R3" as const };
    expect(verifyAuthorityEnvelope(tampered)).toBe(false);
  });
});

// --- Task graph compilation: positive cases ---

describe("compileTaskGraph positive cases", () => {
  it("compiles a single-task graph deterministically", () => {
    const input = { authority: authorityInput(), tasks: [worker("t1")] };
    const first = compileTaskGraph(input);
    const second = compileTaskGraph(input);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.graph.taskGraphId).toBe(second.graph.taskGraphId);
      expect(first.graph.authorityEnvelope.authorityHash).toBe(second.graph.authorityEnvelope.authorityHash);
    }
  });

  it("compiles a linear worker -> reviewer dependency chain", () => {
    const result = compileTaskGraph({
      authority: authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }),
      tasks: [worker("t1"), reviewer("t2")],
      dependencyManifest: [
        { taskId: "t1", dependsOn: [] },
        { taskId: "t2", dependsOn: ["t1"] },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(directDependents(result.graph, "t1")).toEqual(["t2"]);
      expect(directDependencies(result.graph, "t2")).toEqual(["t1"]);
      expect(result.graph.tasks.find((t) => t.taskId === "t2")?.requiresIsolatedSourcePacket).toBe(true);
    }
  });

  it("produces an immutable graph (frozen tasks/manifest/envelope)", () => {
    const result = compileTaskGraph({ authority: authorityInput(), tasks: [worker("t1")] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result.graph)).toBe(true);
      expect(Object.isFrozen(result.graph.tasks)).toBe(true);
      expect(Object.isFrozen(result.graph.authorityEnvelope)).toBe(true);
      expect(() => {
        // Frozen objects reject writes at runtime under strict mode; TS's structural
        // typing does not know about Object.freeze, so this assignment type-checks
        // but throws when executed, which is exactly the property under test.
        (result.graph.tasks[0] as { taskId: string }).taskId = "mutated";
      }).toThrow();
    }
  });
});

// --- Task graph compilation: table-driven negative cases ---

interface NegativeCase {
  name: string;
  build: () => ReturnType<typeof compileTaskGraph>;
  expectedReason: string;
}

const negativeCases: NegativeCase[] = [
  {
    name: "rejects an empty task set",
    build: () => compileTaskGraph({ authority: authorityInput(), tasks: [] }),
    expectedReason: "EMPTY_TASK_SET",
  },
  {
    name: "rejects a budget whose maxConcurrentRoles exceeds the pilot ceiling of 3",
    build: () =>
      compileTaskGraph({
        authority: authorityInput({
          budget: { maxInvocations: 5, maxConcurrentRoles: 4, maxRevisionDepth: 1, tokenCostCeiling: null, wallClockCeilingMs: null },
        }),
        tasks: [worker("t1")],
      }),
    expectedReason: "BUDGET_CONCURRENCY_EXCEEDS_CEILING",
  },
  {
    name: "rejects duplicate task IDs",
    build: () => compileTaskGraph({ authority: authorityInput(), tasks: [worker("t1"), worker("t1")] }),
    expectedReason: "DUPLICATE_TASK_ID",
  },
  {
    name: "rejects a dependency on an unknown task",
    build: () =>
      compileTaskGraph({
        authority: authorityInput(),
        tasks: [worker("t1")],
        dependencyManifest: [{ taskId: "t1", dependsOn: ["ghost"] }],
      }),
    expectedReason: "UNKNOWN_DEPENDENCY_TASK",
  },
  {
    name: "rejects a task that depends on itself",
    build: () =>
      compileTaskGraph({
        authority: authorityInput(),
        tasks: [worker("t1")],
        dependencyManifest: [{ taskId: "t1", dependsOn: ["t1"] }],
      }),
    expectedReason: "SELF_DEPENDENCY",
  },
  {
    name: "rejects a two-node dependency cycle",
    build: () =>
      compileTaskGraph({
        authority: authorityInput(),
        tasks: [worker("t1"), worker("t2")],
        dependencyManifest: [
          { taskId: "t1", dependsOn: ["t2"] },
          { taskId: "t2", dependsOn: ["t1"] },
        ],
      }),
    expectedReason: "DEPENDENCY_CYCLE_DETECTED",
  },
  {
    name: "rejects a three-node dependency cycle",
    build: () =>
      compileTaskGraph({
        authority: authorityInput(),
        tasks: [worker("t1"), worker("t2"), worker("t3")],
        dependencyManifest: [
          { taskId: "t1", dependsOn: ["t3"] },
          { taskId: "t2", dependsOn: ["t1"] },
          { taskId: "t3", dependsOn: ["t2"] },
        ],
      }),
    expectedReason: "DEPENDENCY_CYCLE_DETECTED",
  },
  {
    name: "rejects overlapping declared write scope between concurrent tasks",
    build: () =>
      compileTaskGraph({
        authority: authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }),
        tasks: [worker("t1", ["shared/file.ts"]), worker("t2", ["shared/file.ts"])],
      }),
    expectedReason: "OVERLAPPING_WRITE_SCOPE",
  },
];

describe("compileTaskGraph negative cases", () => {
  for (const testCase of negativeCases) {
    it(testCase.name, () => {
      const result = testCase.build();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe(testCase.expectedReason);
      }
    });
  }
});

describe("compileTaskGraph serialized write scope", () => {
  it("allows overlapping file scope when dependency order serializes the tasks", () => {
    const result = compileTaskGraph({
      authority: authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }),
      tasks: [worker("t1", ["shared/file.ts"]), worker("t2", ["shared/file.ts"])],
      dependencyManifest: [
        { taskId: "t1", dependsOn: [] },
        { taskId: "t2", dependsOn: ["t1"] },
      ],
    });
    expect(result.ok).toBe(true);
  });
});

describe("detectDependencyCycle", () => {
  it("returns null for an acyclic manifest", () => {
    expect(
      detectDependencyCycle([
        { taskId: "t1", dependsOn: [] },
        { taskId: "t2", dependsOn: ["t1"] },
      ]),
    ).toBeNull();
  });

  it("returns the cycle path for a cyclic manifest", () => {
    const cycle = detectDependencyCycle([
      { taskId: "t1", dependsOn: ["t2"] },
      { taskId: "t2", dependsOn: ["t1"] },
    ]);
    expect(cycle).not.toBeNull();
    expect(cycle).toContain("t1");
    expect(cycle).toContain("t2");
  });
});

// --- Event ledger: state transition table ---

function compileSimpleGraph(): MaoTaskGraph {
  const result = compileTaskGraph({
    authority: authorityInput(),
    tasks: [worker("t1"), worker("t2")],
    dependencyManifest: [
      { taskId: "t1", dependsOn: [] },
      { taskId: "t2", dependsOn: ["t1"] },
    ],
  });
  if (!result.ok) throw new Error("test fixture graph failed to compile");
  return result.graph;
}

describe("MaoEventLedger positive transitions", () => {
  it("accepts the full planned -> admitted -> running -> succeeded path", () => {
    const graph = compileSimpleGraph();
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";

    const r1 = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    const r2 = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    const r3 = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    const r4 = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "succeeded", occurredAt });

    expect(r1.ok && r2.ok && r3.ok && r4.ok).toBe(true);
    expect(ledger.getCurrentState("t1")).toBe("succeeded");
    expect(isTerminalState("succeeded")).toBe(true);
  });

  it("allows timed_out to recover back to running", () => {
    const graph = compileSimpleGraph();
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    const timedOut = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TIMEOUT_DETECTED", resultingState: "timed_out", occurredAt });
    const recovered = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "ORPHAN_RECOVERY_ACTION", resultingState: "running", occurredAt });
    expect(timedOut.ok).toBe(true);
    expect(recovered.ok).toBe(true);
    expect(ledger.getCurrentState("t1")).toBe("running");
  });
});

interface LedgerNegativeCase {
  name: string;
  run: () => { ok: boolean; reason?: string };
  expectedReason: string;
}

describe("MaoEventLedger negative cases", () => {
  const occurredAt = "2026-07-11T00:00:00.000Z";

  const cases: LedgerNegativeCase[] = [
    {
      name: "rejects an event for an unknown task ID",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        return ledger.append({ taskGraphId: graph.taskGraphId, taskId: "ghost", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
      },
      expectedReason: "UNKNOWN_TASK_ID",
    },
    {
      name: "rejects an event whose graph ID does not match the ledger's bound graph",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        return ledger.append({ taskGraphId: "some-other-graph", taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
      },
      expectedReason: "GRAPH_ID_MISMATCH",
    },
    {
      name: "rejects an invalid transition (planned straight to succeeded)",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        return ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "succeeded", occurredAt });
      },
      expectedReason: "INVALID_STATE_TRANSITION",
    },
    {
      name: "rejects any transition out of a terminal state (succeeded -> running)",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
        ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
        ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
        ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "succeeded", occurredAt });
        return ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
      },
      expectedReason: "INVALID_STATE_TRANSITION",
    },
    {
      name: "rejects a resubmitted event carrying the same idempotencyKey (duplicate protection)",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        const first = ledger.append({
          taskGraphId: graph.taskGraphId,
          taskId: "t1",
          eventType: "TASK_ADMITTED",
          resultingState: "planned",
          occurredAt,
          idempotencyKey: "retry-key-1",
        });
        expect(first.ok).toBe(true);
        // Retried submission of the identical logical event, same idempotencyKey.
        return ledger.append({
          taskGraphId: graph.taskGraphId,
          taskId: "t1",
          eventType: "TASK_ADMITTED",
          resultingState: "planned",
          occurredAt,
          idempotencyKey: "retry-key-1",
        });
      },
      expectedReason: "DUPLICATE_EVENT_ID",
    },
    {
      name: "rejects appending the exact same transition twice without an idempotencyKey (no blind replay)",
      run: () => {
        const graph = compileSimpleGraph();
        const ledger = new MaoEventLedger(graph);
        const first = ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
        expect(first.ok).toBe(true);
        return ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
      },
      expectedReason: "INVALID_STATE_TRANSITION",
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = testCase.run();
      expect(result.ok).toBe(false);
      expect(result.reason).toBe(testCase.expectedReason);
    });
  }

  it("rejects appends against a ledger built from a tampered authority envelope", () => {
    const graph = compileSimpleGraph();
    const tamperedGraph: MaoTaskGraph = { ...graph, authorityEnvelope: { ...graph.authorityEnvelope, riskLevel: "R3" } };
    expect(() => new MaoEventLedger(tamperedGraph)).toThrow();
  });
});

// --- Terminal outcome propagation ---

describe("terminal outcome propagation", () => {
  const propagationTable: Array<{ outcome: MaoTaskState; expected: MaoTaskState }> = [
    { outcome: "succeeded", expected: "planned" },
    { outcome: "rejected", expected: "blocked" },
    { outcome: "cancelled", expected: "blocked" },
    { outcome: "timed_out", expected: "blocked" },
    { outcome: "exhausted", expected: "blocked" },
    { outcome: "failed", expected: "blocked" },
  ];

  for (const row of propagationTable) {
    it(`propagates ${row.outcome} to descendants as ${row.expected}`, () => {
      expect(descendantPropagationFor(row.outcome)).toBe(row.expected);
    });
  }

  it("propagates a rejected outcome to a real dependent task via the ledger", () => {
    const graph = compileSimpleGraph(); // t2 depends on t1
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "rejected", occurredAt });

    const dependents = directDependents(graph, "t1");
    expect(dependents).toEqual(["t2"]);

    const propagationResults = ledger.propagateTerminalOutcome(graph.taskGraphId, "t1", "rejected", dependents, occurredAt);
    expect(propagationResults.every((r) => r.ok)).toBe(true);
    expect(ledger.getCurrentState("t2")).toBe("blocked");
  });

  it("leaves an independent sibling untouched by a terminal outcome on an unrelated task", () => {
    const result = compileTaskGraph({
      authority: authorityInput({ route: "MULTI_AGENT_SINGLE_ROLE" }),
      tasks: [worker("t1"), worker("sibling")],
      dependencyManifest: [
        { taskId: "t1", dependsOn: [] },
        { taskId: "sibling", dependsOn: [] },
      ],
    });
    if (!result.ok) throw new Error("fixture graph failed to compile");
    const graph = result.graph;
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "failed", occurredAt });

    const dependents = directDependents(graph, "t1");
    expect(dependents).toEqual([]); // sibling does not depend on t1
    expect(ledger.getCurrentState("sibling")).toBeNull();
  });
});

// --- Deterministic read-model replay ---

describe("deterministic read-model replay", () => {
  it("produces structurally identical read models across two independent rebuilds from the same ledger", () => {
    const graph = compileSimpleGraph();
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "succeeded", occurredAt });

    const entries = ledger.getEntries();
    const replayA = buildReadModel({ graph, entries, generatedAt: "2026-07-11T01:00:00.000Z" });
    const replayB = buildReadModel({ graph, entries, generatedAt: "2026-07-11T02:00:00.000Z" });

    expect(readModelsAreEqual(replayA, replayB)).toBe(true);
    expect(replayA.generatedAt).not.toBe(replayB.generatedAt); // timestamps legitimately differ
  });

  it("is insensitive to the input entry array's order (reducer sorts by sequence)", () => {
    const graph = compileSimpleGraph();
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });

    const entries = ledger.getEntries();
    const reversedEntries = [...entries].reverse();

    const forward = buildReadModel({ graph, entries, generatedAt: occurredAt });
    const reversed = buildReadModel({ graph, entries: reversedEntries, generatedAt: occurredAt });

    expect(readModelsAreEqual(forward, reversed)).toBe(true);
  });

  it("includes every declared task even when the ledger has no events for it yet", () => {
    const graph = compileSimpleGraph();
    const readModel = buildReadModel({ graph, entries: [], generatedAt: "2026-07-11T00:00:00.000Z" });
    expect(readModel.taskStates.map((t) => t.taskId).sort()).toEqual(["t1", "t2"]);
    expect(readModel.taskStates.every((t) => t.state === "planned" && t.terminalOutcome === null)).toBe(true);
  });

  it("reports a terminal outcome only for tasks whose latest state is terminal", () => {
    const graph = compileSimpleGraph();
    const ledger = new MaoEventLedger(graph);
    const occurredAt = "2026-07-11T00:00:00.000Z";
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "planned", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "TASK_ADMITTED", resultingState: "admitted", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_STARTED", resultingState: "running", occurredAt });
    ledger.append({ taskGraphId: graph.taskGraphId, taskId: "t1", eventType: "INVOCATION_COMPLETED", resultingState: "cancelled", occurredAt });

    const readModel = buildReadModel({ graph, entries: ledger.getEntries(), generatedAt: occurredAt });
    const t1 = readModel.taskStates.find((t) => t.taskId === "t1");
    const t2 = readModel.taskStates.find((t) => t.taskId === "t2");
    expect(t1?.terminalOutcome).toBe("cancelled");
    expect(t2?.terminalOutcome).toBeNull();
  });
});
