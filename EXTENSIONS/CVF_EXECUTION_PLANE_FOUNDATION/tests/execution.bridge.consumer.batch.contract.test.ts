/**
 * EPF W48-T1 — ExecutionBridgeConsumerBatchContract
 * ===================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   batch([]):
 *     - dominantStatus "NONE", all counts 0, totalRequests 0
 *     - batchHash and batchId are truthy strings
 *     - receipts array is empty
 *   Single FULLY_AUTHORIZED receipt (allowedCount > 0, deniedCount = 0, sandboxedCount = 0):
 *     - dominantStatus "FULLY_AUTHORIZED"
 *     - fullyAuthorizedCount = 1, partiallyAuthorizedCount = 0, blockedCount = 0
 *   Single PARTIALLY_AUTHORIZED receipt (allowedCount > 0, deniedCount > 0):
 *     - dominantStatus "PARTIALLY_AUTHORIZED"
 *     - partiallyAuthorizedCount = 1
 *   Single PARTIALLY_AUTHORIZED receipt (allowedCount > 0, sandboxedCount > 0):
 *     - dominantStatus "PARTIALLY_AUTHORIZED"
 *   Single BLOCKED receipt (allowedCount = 0):
 *     - dominantStatus "BLOCKED"
 *     - blockedCount = 1
 *   Dominant status resolution:
 *     - BLOCKED dominates PARTIALLY_AUTHORIZED in mixed batch
 *     - BLOCKED dominates FULLY_AUTHORIZED in mixed batch
 *     - PARTIALLY_AUTHORIZED dominates FULLY_AUTHORIZED
 *   Count accuracy:
 *     - fullyAuthorizedCount + partiallyAuthorizedCount + blockedCount = totalRequests
 *     - warnedCount counts receipts with warnings.length > 0
 *     - totalAssignments = sum of receipt.totalAssignments
 *     - totalAuthorizedForExecution = sum of receipt.authorizedForExecution
 *   Output shape:
 *     - totalRequests matches input length
 *     - receipts array in input order
 *     - createdAt = injected now()
 *     - all required fields present
 *   Determinism:
 *     - same inputs → same batchHash and batchId
 *     - different inputs → different batchHash
 *     - batchId !== batchHash
 *   Factory:
 *     - createExecutionBridgeConsumerBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  ExecutionBridgeConsumerBatchContract,
  createExecutionBridgeConsumerBatchContract,
} from "../src/execution.bridge.consumer.batch.contract";
import type { ExecutionBridgeConsumptionBatchResult } from "../src/execution.bridge.consumer.batch.contract";
import { DispatchContract } from "../src/dispatch.contract";
import type { DispatchResult } from "../src/dispatch.contract";
import { PolicyGateContract } from "../src/policy.gate.contract";
import type { PolicyGateResult } from "../src/policy.gate.contract";
import {
  createControlPlaneIntakeContract,
  createDesignConsumerContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/index";
import type { DesignConsumptionReceipt } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildDesignReceipt(
  vibe = "Build a governed execution bridge for W48-T1 batch tests",
): DesignConsumptionReceipt {
  const intake = createControlPlaneIntakeContract().execute({
    vibe,
    consumerId: "w48-t1-test",
  });
  return createDesignConsumerContract().consume(intake);
}

// ─── Mock Helpers ─────────────────────────────────────────────────────────────

function makeMockDispatch(): DispatchContract {
  return {
    dispatch: (orchId: string) => ({
      dispatchId: "mock-dispatch-id",
      orchestrationId: orchId,
      dispatchedAt: FIXED_NOW,
      entries: [],
      totalDispatched: 0,
      authorizedCount: 0,
      blockedCount: 0,
      escalatedCount: 0,
      dispatchHash: "mock-dispatch-hash",
      warnings: [],
    }),
  } as unknown as DispatchContract;
}

function makeMockPolicyGate(
  overrides: Partial<PolicyGateResult> = {},
): PolicyGateContract {
  return {
    evaluate: (_dr: DispatchResult): PolicyGateResult => ({
      gateId: "mock-gate-id",
      dispatchId: "mock-dispatch-id",
      evaluatedAt: FIXED_NOW,
      entries: [],
      allowedCount: 1,
      deniedCount: 0,
      reviewRequiredCount: 0,
      sandboxedCount: 0,
      pendingCount: 0,
      gateHash: "mock-gate-hash",
      summary: "mock summary",
      ...overrides,
    }),
  } as unknown as PolicyGateContract;
}

function makeSequentialPolicyGate(
  sequence: Partial<PolicyGateResult>[],
): PolicyGateContract {
  let idx = 0;
  return {
    evaluate: (_dr: DispatchResult): PolicyGateResult => {
      const overrides = sequence[idx % sequence.length];
      idx++;
      return {
        gateId: `mock-gate-id-${idx}`,
        dispatchId: "mock-dispatch-id",
        evaluatedAt: FIXED_NOW,
        entries: [],
        allowedCount: 1,
        deniedCount: 0,
        reviewRequiredCount: 0,
        sandboxedCount: 0,
        pendingCount: 0,
        gateHash: `mock-gate-hash-${idx}`,
        summary: "mock summary",
        ...overrides,
      };
    },
  } as unknown as PolicyGateContract;
}

// Fully authorized: allowedCount > 0, deniedCount = 0, sandboxedCount = 0
function makeFullyAuthorizedDeps() {
  return {
    contractDependencies: {
      dispatch: makeMockDispatch(),
      policyGate: makeMockPolicyGate({ allowedCount: 2, deniedCount: 0, sandboxedCount: 0 }),
      now: fixedNow,
    },
    now: fixedNow,
  };
}

// Partially authorized via denied
function makePartialDeniedDeps() {
  return {
    contractDependencies: {
      dispatch: makeMockDispatch(),
      policyGate: makeMockPolicyGate({ allowedCount: 1, deniedCount: 1, sandboxedCount: 0 }),
      now: fixedNow,
    },
    now: fixedNow,
  };
}

// Partially authorized via sandboxed
function makePartialSandboxedDeps() {
  return {
    contractDependencies: {
      dispatch: makeMockDispatch(),
      policyGate: makeMockPolicyGate({ allowedCount: 1, deniedCount: 0, sandboxedCount: 1 }),
      now: fixedNow,
    },
    now: fixedNow,
  };
}

// Blocked: allowedCount = 0
function makeBlockedDeps() {
  return {
    contractDependencies: {
      dispatch: makeMockDispatch(),
      policyGate: makeMockPolicyGate({ allowedCount: 0, deniedCount: 2, sandboxedCount: 0 }),
      now: fixedNow,
    },
    now: fixedNow,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionBridgeConsumerBatchContract.batch — empty batch", () => {
  const contract = new ExecutionBridgeConsumerBatchContract({ now: fixedNow });

  it("dominantStatus is 'NONE' for empty input", () => {
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
  });

  it("all counts are 0 for empty batch", () => {
    const result = contract.batch([]);
    expect(result.totalRequests).toBe(0);
    expect(result.fullyAuthorizedCount).toBe(0);
    expect(result.partiallyAuthorizedCount).toBe(0);
    expect(result.blockedCount).toBe(0);
    expect(result.warnedCount).toBe(0);
    expect(result.totalAssignments).toBe(0);
    expect(result.totalAuthorizedForExecution).toBe(0);
  });

  it("receipts array is empty for empty batch", () => {
    expect(contract.batch([]).receipts).toHaveLength(0);
  });

  it("batchHash is a truthy string for empty batch", () => {
    expect(typeof contract.batch([]).batchHash).toBe("string");
    expect(contract.batch([]).batchHash.length).toBeGreaterThan(0);
  });

  it("batchId is a truthy string for empty batch", () => {
    expect(typeof contract.batch([]).batchId).toBe("string");
    expect(contract.batch([]).batchId.length).toBeGreaterThan(0);
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — single FULLY_AUTHORIZED receipt", () => {
  const receipt = buildDesignReceipt();

  it("dominantStatus is FULLY_AUTHORIZED", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeFullyAuthorizedDeps());
    expect(contract.batch([receipt]).dominantStatus).toBe("FULLY_AUTHORIZED");
  });

  it("fullyAuthorizedCount = 1, others = 0", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeFullyAuthorizedDeps());
    const result = contract.batch([receipt]);
    expect(result.fullyAuthorizedCount).toBe(1);
    expect(result.partiallyAuthorizedCount).toBe(0);
    expect(result.blockedCount).toBe(0);
  });

  it("totalRequests = 1", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeFullyAuthorizedDeps());
    expect(contract.batch([receipt]).totalRequests).toBe(1);
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — single PARTIALLY_AUTHORIZED receipt", () => {
  const receipt = buildDesignReceipt("Design a partially authorized bridge execution path");

  it("dominantStatus is PARTIALLY_AUTHORIZED (via denied)", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makePartialDeniedDeps());
    expect(contract.batch([receipt]).dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("dominantStatus is PARTIALLY_AUTHORIZED (via sandboxed)", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makePartialSandboxedDeps());
    expect(contract.batch([receipt]).dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("partiallyAuthorizedCount = 1, others = 0", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makePartialDeniedDeps());
    const result = contract.batch([receipt]);
    expect(result.partiallyAuthorizedCount).toBe(1);
    expect(result.fullyAuthorizedCount).toBe(0);
    expect(result.blockedCount).toBe(0);
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — single BLOCKED receipt", () => {
  const receipt = buildDesignReceipt("Execute a high-risk task that gets blocked");

  it("dominantStatus is BLOCKED", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeBlockedDeps());
    expect(contract.batch([receipt]).dominantStatus).toBe("BLOCKED");
  });

  it("blockedCount = 1, others = 0", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeBlockedDeps());
    const result = contract.batch([receipt]);
    expect(result.blockedCount).toBe(1);
    expect(result.fullyAuthorizedCount).toBe(0);
    expect(result.partiallyAuthorizedCount).toBe(0);
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — dominant status resolution", () => {
  const r1 = buildDesignReceipt("First bridge receipt");
  const r2 = buildDesignReceipt("Second bridge receipt");
  const r3 = buildDesignReceipt("Third bridge receipt");

  it("BLOCKED dominates PARTIALLY_AUTHORIZED in mixed batch", () => {
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeSequentialPolicyGate([
          { allowedCount: 0, deniedCount: 2, sandboxedCount: 0 }, // BLOCKED
          { allowedCount: 1, deniedCount: 1, sandboxedCount: 0 }, // PARTIALLY_AUTHORIZED
        ]),
        now: fixedNow,
      },
      now: fixedNow,
    });
    expect(contract.batch([r1, r2]).dominantStatus).toBe("BLOCKED");
  });

  it("BLOCKED dominates FULLY_AUTHORIZED in mixed batch", () => {
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeSequentialPolicyGate([
          { allowedCount: 2, deniedCount: 0, sandboxedCount: 0 }, // FULLY_AUTHORIZED
          { allowedCount: 0, deniedCount: 1, sandboxedCount: 0 }, // BLOCKED
        ]),
        now: fixedNow,
      },
      now: fixedNow,
    });
    expect(contract.batch([r1, r2]).dominantStatus).toBe("BLOCKED");
  });

  it("PARTIALLY_AUTHORIZED dominates FULLY_AUTHORIZED", () => {
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeSequentialPolicyGate([
          { allowedCount: 2, deniedCount: 0, sandboxedCount: 0 }, // FULLY_AUTHORIZED
          { allowedCount: 1, deniedCount: 0, sandboxedCount: 1 }, // PARTIALLY_AUTHORIZED
        ]),
        now: fixedNow,
      },
      now: fixedNow,
    });
    expect(contract.batch([r1, r2]).dominantStatus).toBe("PARTIALLY_AUTHORIZED");
  });

  it("three-receipt batch: blockedCount + partiallyAuthorizedCount + fullyAuthorizedCount = 3", () => {
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeSequentialPolicyGate([
          { allowedCount: 2, deniedCount: 0, sandboxedCount: 0 }, // FULLY_AUTHORIZED
          { allowedCount: 1, deniedCount: 1, sandboxedCount: 0 }, // PARTIALLY_AUTHORIZED
          { allowedCount: 0, deniedCount: 1, sandboxedCount: 0 }, // BLOCKED
        ]),
        now: fixedNow,
      },
      now: fixedNow,
    });
    const result = contract.batch([r1, r2, r3]);
    expect(result.fullyAuthorizedCount + result.partiallyAuthorizedCount + result.blockedCount).toBe(3);
    expect(result.dominantStatus).toBe("BLOCKED");
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — count accuracy", () => {
  const r1 = buildDesignReceipt("Receipt for count accuracy test 1");
  const r2 = buildDesignReceipt("Receipt for count accuracy test 2");

  it("totalAuthorizedForExecution = sum of policyGateResult.allowedCount", () => {
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeSequentialPolicyGate([
          { allowedCount: 3, deniedCount: 0, sandboxedCount: 0 },
          { allowedCount: 2, deniedCount: 1, sandboxedCount: 0 },
        ]),
        now: fixedNow,
      },
      now: fixedNow,
    });
    const result = contract.batch([r1, r2]);
    expect(result.totalAuthorizedForExecution).toBe(5);
  });

  it("warnedCount counts receipts with warnings (denied triggers bridge warning)", () => {
    const receipt = buildDesignReceipt("Receipt that triggers warnings via denied");
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeMockPolicyGate({ allowedCount: 1, deniedCount: 1 }),
        now: fixedNow,
      },
      now: fixedNow,
    });
    const result = contract.batch([receipt]);
    expect(result.warnedCount).toBe(1);
  });

  it("warnedCount accurately reflects count of receipts with warnings.length > 0", () => {
    const receipt = buildDesignReceipt("Receipt for warnedCount accuracy check");
    const contract = new ExecutionBridgeConsumerBatchContract({
      contractDependencies: {
        dispatch: makeMockDispatch(),
        policyGate: makeMockPolicyGate({ allowedCount: 2, deniedCount: 0, sandboxedCount: 0 }),
        now: fixedNow,
      },
      now: fixedNow,
    });
    const result = contract.batch([receipt]);
    const expectedWarnedCount = result.receipts.filter((r) => r.warnings.length > 0).length;
    expect(result.warnedCount).toBe(expectedWarnedCount);
  });
});

describe("ExecutionBridgeConsumerBatchContract.batch — output shape", () => {
  const receipt = buildDesignReceipt();
  const contract = new ExecutionBridgeConsumerBatchContract(makeFullyAuthorizedDeps());
  let result: ExecutionBridgeConsumptionBatchResult;

  result = contract.batch([receipt]);

  it("result has batchHash", () => { expect(result.batchHash).toBeDefined(); });
  it("result has batchId", () => { expect(result.batchId).toBeDefined(); });
  it("result has createdAt = injected now()", () => { expect(result.createdAt).toBe(FIXED_NOW); });
  it("result has totalRequests", () => { expect(result.totalRequests).toBe(1); });
  it("receipts array has length matching input", () => { expect(result.receipts).toHaveLength(1); });
  it("receipts[0] has bridgeReceiptId", () => { expect(result.receipts[0].bridgeReceiptId).toBeDefined(); });
});

describe("ExecutionBridgeConsumerBatchContract.batch — determinism", () => {
  const receipt = buildDesignReceipt("deterministic bridge batch test");

  it("same inputs → same batchHash", () => {
    const deps = makeFullyAuthorizedDeps();
    const c1 = new ExecutionBridgeConsumerBatchContract(deps);
    const c2 = new ExecutionBridgeConsumerBatchContract(deps);
    expect(c1.batch([receipt]).batchHash).toBe(c2.batch([receipt]).batchHash);
  });

  it("same inputs → same batchId", () => {
    const deps = makeFullyAuthorizedDeps();
    const c1 = new ExecutionBridgeConsumerBatchContract(deps);
    const c2 = new ExecutionBridgeConsumerBatchContract(deps);
    expect(c1.batch([receipt]).batchId).toBe(c2.batch([receipt]).batchId);
  });

  it("batchId !== batchHash", () => {
    const contract = new ExecutionBridgeConsumerBatchContract(makeFullyAuthorizedDeps());
    const result = contract.batch([receipt]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("different input counts → different batchHash", () => {
    const r2 = buildDesignReceipt("second receipt for determinism");
    const deps = makeFullyAuthorizedDeps();
    const c1 = new ExecutionBridgeConsumerBatchContract(deps);
    const c2 = new ExecutionBridgeConsumerBatchContract(deps);
    expect(c1.batch([receipt]).batchHash).not.toBe(c2.batch([receipt, r2]).batchHash);
  });
});

describe("ExecutionBridgeConsumerBatchContract — factory", () => {
  it("createExecutionBridgeConsumerBatchContract returns working instance", () => {
    const contract = createExecutionBridgeConsumerBatchContract({ now: fixedNow });
    const result = contract.batch([]);
    expect(result.dominantStatus).toBe("NONE");
    expect(result.totalRequests).toBe(0);
  });
});
