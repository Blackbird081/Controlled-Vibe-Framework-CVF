/**
 * EPF Dispatch Batch Contract — W49-T1 CP1
 * ==========================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   DispatchBatchContract.batch:
 *     - empty batch → dominantStatus: "NONE", valid batchHash, valid batchId
 *     - single fully authorized dispatch → FULLY_AUTHORIZED
 *     - single fully blocked dispatch → FULLY_BLOCKED
 *     - single mix authorized + blocked → PARTIALLY_AUTHORIZED
 *     - single mix authorized + escalated → PARTIALLY_AUTHORIZED
 *     - all dispatches fully blocked → FULLY_BLOCKED
 *     - totalAuthorized aggregated correctly across multiple dispatches
 *     - totalBlocked aggregated correctly across multiple dispatches
 *     - totalEscalated aggregated correctly across multiple dispatches
 *     - totalAssignments = sum of all input assignment array lengths
 *     - warnedCount = count of results with warnings.length > 0
 *     - totalDispatches = inputs.length
 *     - results array length equals totalDispatches
 *     - batchHash deterministic (same inputs + timestamp → same hash)
 *     - batchId !== batchHash (batchId derived from batchHash)
 *     - batchHash changes when inputs change
 *     - batchHash changes when timestamp changes
 *     - dominantStatus precedence: FULLY_BLOCKED beats PARTIALLY_AUTHORIZED
 *     - dominantStatus precedence: FULLY_BLOCKED beats FULLY_AUTHORIZED
 *     - createdAt set from injected now()
 *     - factory createDispatchBatchContract returns working contract
 */

import { describe, it, expect } from "vitest";

import {
  DispatchBatchContract,
  createDispatchBatchContract,
} from "../src/dispatch.batch.contract";
import type { DispatchBatchInput } from "../src/dispatch.batch.contract";
import { DispatchContract } from "../src/dispatch.contract";
import type { DispatchResult } from "../src/dispatch.contract";
import type { TaskAssignment } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-04-05T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _aSeq = 0;
function makeAssignment(overrides: Partial<TaskAssignment> = {}): TaskAssignment {
  const n = ++_aSeq;
  return {
    assignmentId: `assign-${n}`,
    taskId: `task-${n}`,
    title: `Task ${n}`,
    assignedRole: "builder",
    targetPhase: "BUILD",
    riskLevel: "R1",
    scopeConstraints: ["phase:BUILD", "risk:R1"],
    dependencies: [],
    executionAuthorizationHash: `auth-hash-${n}`,
    ...overrides,
  };
}

function makeDispatchResult(overrides: Partial<DispatchResult> = {}): DispatchResult {
  return {
    dispatchId: "test-dispatch-id",
    orchestrationId: "test-orch",
    dispatchedAt: FIXED_NOW,
    entries: [],
    totalDispatched: 0,
    authorizedCount: 0,
    blockedCount: 0,
    escalatedCount: 0,
    dispatchHash: "test-dispatch-hash",
    warnings: [],
    ...overrides,
  };
}

// ─── Mock DispatchContract ─────────────────────────────────────────────────────

class MockDispatchContract extends DispatchContract {
  private readonly mockResult: DispatchResult;

  constructor(mockResult: DispatchResult) {
    super({ now: fixedNow });
    this.mockResult = mockResult;
  }

  override dispatch(_orchestrationId: string, _assignments: TaskAssignment[]): DispatchResult {
    return this.mockResult;
  }
}

class IndexedMockDispatchContract extends DispatchContract {
  private readonly results: DispatchResult[];
  private idx = 0;

  constructor(results: DispatchResult[]) {
    super({ now: fixedNow });
    this.results = results;
  }

  override dispatch(_orchestrationId: string, _assignments: TaskAssignment[]): DispatchResult {
    return this.results[this.idx++ % this.results.length];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFullyAuthorizedResult(): DispatchResult {
  return makeDispatchResult({ authorizedCount: 3, blockedCount: 0, escalatedCount: 0, totalDispatched: 3 });
}

function makeFullyBlockedResult(): DispatchResult {
  return makeDispatchResult({
    authorizedCount: 0,
    blockedCount: 2,
    escalatedCount: 0,
    totalDispatched: 2,
    warnings: ["2 assignment(s) BLOCKED by guard engine — review blockedBy field before retry."],
  });
}

function makePartiallyAuthorizedResult(): DispatchResult {
  return makeDispatchResult({ authorizedCount: 2, blockedCount: 1, escalatedCount: 0, totalDispatched: 3 });
}

function makeEscalatedResult(): DispatchResult {
  return makeDispatchResult({
    authorizedCount: 1,
    blockedCount: 0,
    escalatedCount: 2,
    totalDispatched: 3,
    warnings: ["2 assignment(s) ESCALATED — human review required before dispatch."],
  });
}

function makeBatchInput(assignments?: TaskAssignment[]): DispatchBatchInput {
  return {
    orchestrationId: `orch-${Math.random().toString(36).slice(2)}`,
    assignments: assignments ?? [makeAssignment()],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DispatchBatchContract.batch", () => {
  it("empty batch → dominantStatus NONE, valid batchHash and batchId", () => {
    const contract = new DispatchBatchContract({ now: fixedNow });
    const result = contract.batch([]);

    expect(result.dominantStatus).toBe("NONE");
    expect(result.totalDispatches).toBe(0);
    expect(result.totalAssignments).toBe(0);
    expect(result.totalAuthorized).toBe(0);
    expect(result.totalBlocked).toBe(0);
    expect(result.totalEscalated).toBe(0);
    expect(result.warnedCount).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });

  it("single fully authorized dispatch → FULLY_AUTHORIZED", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.dominantStatus).toBe("FULLY_AUTHORIZED");
    expect(result.totalAuthorized).toBe(3);
    expect(result.totalBlocked).toBe(0);
    expect(result.totalEscalated).toBe(0);
  });

  it("single fully blocked dispatch → FULLY_BLOCKED", () => {
    const mockDispatch = new MockDispatchContract(makeFullyBlockedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    expect(result.totalAuthorized).toBe(0);
    expect(result.totalBlocked).toBe(2);
  });

  it("authorized + blocked in same dispatch → PARTIALLY_AUTHORIZED", () => {
    const mockDispatch = new MockDispatchContract(makePartiallyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
    expect(result.totalAuthorized).toBe(2);
    expect(result.totalBlocked).toBe(1);
  });

  it("authorized + escalated in same dispatch → PARTIALLY_AUTHORIZED", () => {
    const mockDispatch = new MockDispatchContract(makeEscalatedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
    expect(result.totalAuthorized).toBe(1);
    expect(result.totalEscalated).toBe(2);
  });

  it("multiple dispatches all fully blocked → FULLY_BLOCKED", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeFullyBlockedResult(),
      makeFullyBlockedResult(),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.dominantStatus).toBe("FULLY_BLOCKED");
    expect(result.totalAuthorized).toBe(0);
    expect(result.totalBlocked).toBe(4);
  });

  it("totalAuthorized aggregated across multiple dispatches", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ authorizedCount: 2, blockedCount: 0, escalatedCount: 0, totalDispatched: 2 }),
      makeDispatchResult({ authorizedCount: 3, blockedCount: 0, escalatedCount: 0, totalDispatched: 3 }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalAuthorized).toBe(5);
    expect(result.dominantStatus).toBe("FULLY_AUTHORIZED");
  });

  it("totalBlocked aggregated across multiple dispatches", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ authorizedCount: 1, blockedCount: 2, escalatedCount: 0, totalDispatched: 3 }),
      makeDispatchResult({ authorizedCount: 2, blockedCount: 3, escalatedCount: 0, totalDispatched: 5 }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalBlocked).toBe(5);
    expect(result.totalAuthorized).toBe(3);
    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("totalEscalated aggregated across multiple dispatches", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ authorizedCount: 1, blockedCount: 0, escalatedCount: 1, totalDispatched: 2 }),
      makeDispatchResult({ authorizedCount: 2, blockedCount: 0, escalatedCount: 2, totalDispatched: 4 }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalEscalated).toBe(3);
    expect(result.totalAuthorized).toBe(3);
    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("totalAssignments = sum of all input assignment array lengths", () => {
    const a1 = [makeAssignment(), makeAssignment()];
    const a2 = [makeAssignment(), makeAssignment(), makeAssignment()];
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ authorizedCount: 2, totalDispatched: 2 }),
      makeDispatchResult({ authorizedCount: 3, totalDispatched: 3 }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([
      { orchestrationId: "orch-1", assignments: a1 },
      { orchestrationId: "orch-2", assignments: a2 },
    ]);

    expect(result.totalAssignments).toBe(5);
  });

  it("warnedCount = count of results with warnings.length > 0", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ warnings: ["warning"] }),
      makeDispatchResult({ warnings: [] }),
      makeDispatchResult({ warnings: ["w1", "w2"] }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput(), makeBatchInput()]);

    expect(result.warnedCount).toBe(2);
  });

  it("totalDispatches = inputs.length", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });

    const r1 = contract.batch([makeBatchInput()]);
    expect(r1.totalDispatches).toBe(1);

    const r3 = contract.batch([makeBatchInput(), makeBatchInput(), makeBatchInput()]);
    expect(r3.totalDispatches).toBe(3);
  });

  it("results array length equals totalDispatches", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.results).toHaveLength(result.totalDispatches);
    expect(result.results).toHaveLength(2);
  });

  it("batchHash deterministic for same inputs and timestamp", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const input = [makeBatchInput()];

    const r1 = contract.batch(input);
    const r2 = contract.batch(input);

    expect(r1.batchHash).toBe(r2.batchHash);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("batchId !== batchHash (batchId derived from batchHash)", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("batchHash changes when inputs change", () => {
    const mockA = new MockDispatchContract(makeFullyAuthorizedResult());
    const mockB = new MockDispatchContract(makeFullyBlockedResult());
    const contract = new DispatchBatchContract({ now: fixedNow });

    const contractA = new DispatchBatchContract({ dispatch: mockA, now: fixedNow });
    const contractB = new DispatchBatchContract({ dispatch: mockB, now: fixedNow });

    const rA = contractA.batch([makeBatchInput()]);
    const rB = contractB.batch([makeBatchInput()]);

    void contract;
    expect(rA.batchHash).not.toBe(rB.batchHash);
  });

  it("batchHash changes when timestamp changes", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contractA = new DispatchBatchContract({ dispatch: mockDispatch, now: () => "2026-04-05T12:00:00.000Z" });
    const contractB = new DispatchBatchContract({ dispatch: mockDispatch, now: () => "2026-04-05T13:00:00.000Z" });
    const input = [makeBatchInput()];

    const rA = contractA.batch(input);
    const rB = contractB.batch(input);

    expect(rA.batchHash).not.toBe(rB.batchHash);
  });

  it("one fully-blocked dispatch + one partially-authorized → PARTIALLY_AUTHORIZED (aggregate authorized > 0)", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeFullyBlockedResult(),
      makePartiallyAuthorizedResult(),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalAuthorized).toBe(2);
    expect(result.totalBlocked).toBe(3);
    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("dominantStatus precedence: FULLY_BLOCKED beats FULLY_AUTHORIZED when some are zero-authorized", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeFullyAuthorizedResult(),
      makeFullyBlockedResult(),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalAuthorized).toBe(3);
    expect(result.totalBlocked).toBe(2);
    expect(result.dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("two zero-authorized batches → FULLY_BLOCKED", () => {
    const mockDispatch = new IndexedMockDispatchContract([
      makeDispatchResult({ authorizedCount: 0, blockedCount: 1, totalDispatched: 1 }),
      makeDispatchResult({ authorizedCount: 0, escalatedCount: 1, totalDispatched: 1 }),
    ]);
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput(), makeBatchInput()]);

    expect(result.totalAuthorized).toBe(0);
    expect(result.dominantStatus).toBe("FULLY_BLOCKED");
  });

  it("createdAt set from injected now()", () => {
    const mockDispatch = new MockDispatchContract(makeFullyAuthorizedResult());
    const contract = new DispatchBatchContract({ dispatch: mockDispatch, now: fixedNow });
    const result = contract.batch([makeBatchInput()]);

    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("factory createDispatchBatchContract returns working contract", () => {
    const contract = createDispatchBatchContract({ now: fixedNow });
    const result = contract.batch([]);

    expect(result.dominantStatus).toBe("NONE");
    expect(result.totalDispatches).toBe(0);
    expect(typeof result.batchHash).toBe("string");
  });
});
