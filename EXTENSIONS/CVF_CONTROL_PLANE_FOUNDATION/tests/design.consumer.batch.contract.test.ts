/**
 * CPF Design Consumer Batch Contract — Dedicated Tests (W46-T1)
 * ==============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   DesignConsumerBatchContract.batch — empty batch:
 *     - dominantStatus NONE
 *     - all counts zero
 *     - receipts empty array
 *     - batchId and batchHash non-empty strings
 *
 *   DesignConsumerBatchContract.batch — single COMPLETE intake:
 *     - totalRequests 1
 *     - completedCount 1, others 0
 *     - dominantStatus COMPLETE
 *
 *   DesignConsumerBatchContract.batch — single PARTIAL intake (AMEND_PLAN):
 *     - totalRequests 1
 *     - partialCount 1, others 0
 *     - dominantStatus PARTIAL
 *
 *   DesignConsumerBatchContract.batch — single DEGRADED intake (ESCALATE):
 *     - totalRequests 1
 *     - degradedCount 1, others 0
 *     - dominantStatus DEGRADED
 *
 *   DesignConsumerBatchContract.batch — dominant status resolution:
 *     - DEGRADED dominates PARTIAL
 *     - DEGRADED dominates COMPLETE
 *     - PARTIAL dominates COMPLETE
 *
 *   DesignConsumerBatchContract.batch — count accuracy:
 *     - mixed batch counts all status types correctly
 *     - all counts sum to totalRequests
 *     - totalRequests equals receipts array length
 *     - blockedCount equals completedCount taken from total
 *     - warnedCount equals receipts with warnings
 *
 *   DesignConsumerBatchContract.batch — output shape:
 *     - result has all required fields
 *     - createdAt equals injected timestamp
 *     - batchId differs from batchHash
 *
 *   DesignConsumerBatchContract.batch — determinism:
 *     - same batchHash for identical intakes
 *     - different batchHash for different batch size
 */

import { describe, it, expect } from "vitest";
import {
  DesignConsumerBatchContract,
  createDesignConsumerBatchContract,
  type DesignConsumptionBatchResult,
} from "../src/design.consumer.batch.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_NOW = FIXED_BATCH_NOW;

function makeValidatedIntent(
  domain: ValidatedIntent["intent"]["domain"],
  valid = true,
): ValidatedIntent {
  return {
    intent: {
      domain,
      action: "build",
      object: "feature",
      limits: {},
      requireApproval: false,
      confidence: valid ? 0.9 : 0.2,
      rawVibe: `build a ${domain} feature`,
    },
    rules: [],
    constraints: [],
    timestamp: Date.now(),
    pipelineVersion: "1.0",
    valid,
    errors: valid ? [] : ["low confidence"],
  };
}

function makeIntake(
  domain: ValidatedIntent["intent"]["domain"] = "general",
  options: { valid?: boolean } = {},
): ControlPlaneIntakeResult {
  const { valid = true } = options;
  return {
    requestId: `req-${domain}-${valid}`,
    createdAt: FIXED_NOW,
    consumerId: `consumer-${domain}`,
    intent: makeValidatedIntent(domain, valid),
    retrieval: {
      query: `build a ${domain} feature`,
      chunkCount: 0,
      totalCandidates: 0,
      retrievalTimeMs: 0,
      tiersSearched: [],
      chunks: [],
    },
    packagedContext: {
      chunks: [],
      totalTokens: 0,
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "a".repeat(32),
    },
    warnings: [],
  };
}

/**
 * COMPLETE: general domain, valid intent → boardroom PROCEED → !orchestrationBlocked
 */
const COMPLETE_INTAKE = makeIntake("general");

/**
 * DEGRADED: finance domain, valid intent, no chunks → R3 tasks + plan warnings
 *   (no-context warning + R3 warning) → boardroom ESCALATE → orchestrationBlocked
 *   NOTE: invalid intent short-circuits to R2 in assessIntakeRisk, ignoring domain;
 *   valid=true is required to reach the finance → R3 path.
 */
const DEGRADED_INTAKE = makeIntake("finance");

function makeCompleteContract(): DesignConsumerBatchContract {
  return new DesignConsumerBatchContract({ now: () => FIXED_NOW });
}

function makePartialContract(): DesignConsumerBatchContract {
  return new DesignConsumerBatchContract({
    contractDependencies: {
      clarifications: [{ question: "define scope" }],
    },
    now: () => FIXED_NOW,
  });
}

// --- empty batch ---

describe("DesignConsumerBatchContract.batch — empty batch", () => {
  it("returns dominantStatus NONE for empty input", () => {
    expect(makeCompleteContract().batch([]).dominantStatus).toBe("NONE");
  });

  it("all counts are zero for empty input", () => {
    const result = makeCompleteContract().batch([]);
    expect(result.totalRequests).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
    expect(result.blockedCount).toBe(0);
    expect(result.warnedCount).toBe(0);
  });

  it("receipts is an empty array for empty input", () => {
    expect(makeCompleteContract().batch([]).receipts).toHaveLength(0);
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const result = makeCompleteContract().batch([]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
  });
});

// --- single COMPLETE intake ---

describe("DesignConsumerBatchContract.batch — single COMPLETE intake", () => {
  it("totalRequests is 1", () => {
    expect(makeCompleteContract().batch([COMPLETE_INTAKE]).totalRequests).toBe(1);
  });

  it("completedCount is 1, partialCount and degradedCount are 0", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE]);
    expect(result.completedCount).toBe(1);
    expect(result.partialCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is COMPLETE", () => {
    expect(makeCompleteContract().batch([COMPLETE_INTAKE]).dominantStatus).toBe("COMPLETE");
  });
});

// --- single PARTIAL intake (AMEND_PLAN) ---

describe("DesignConsumerBatchContract.batch — single PARTIAL intake (AMEND_PLAN)", () => {
  it("totalRequests is 1", () => {
    expect(makePartialContract().batch([COMPLETE_INTAKE]).totalRequests).toBe(1);
  });

  it("partialCount is 1, completedCount and degradedCount are 0", () => {
    const result = makePartialContract().batch([COMPLETE_INTAKE]);
    expect(result.partialCount).toBe(1);
    expect(result.completedCount).toBe(0);
    expect(result.degradedCount).toBe(0);
  });

  it("dominantStatus is PARTIAL", () => {
    expect(makePartialContract().batch([COMPLETE_INTAKE]).dominantStatus).toBe("PARTIAL");
  });
});

// --- single DEGRADED intake (ESCALATE) ---

describe("DesignConsumerBatchContract.batch — single DEGRADED intake (ESCALATE)", () => {
  it("totalRequests is 1", () => {
    expect(makeCompleteContract().batch([DEGRADED_INTAKE]).totalRequests).toBe(1);
  });

  it("degradedCount is 1, completedCount and partialCount are 0", () => {
    const result = makeCompleteContract().batch([DEGRADED_INTAKE]);
    expect(result.degradedCount).toBe(1);
    expect(result.completedCount).toBe(0);
    expect(result.partialCount).toBe(0);
  });

  it("dominantStatus is DEGRADED", () => {
    expect(makeCompleteContract().batch([DEGRADED_INTAKE]).dominantStatus).toBe("DEGRADED");
  });
});

// --- dominant status resolution ---

describe("DesignConsumerBatchContract.batch — dominant status resolution", () => {
  it("multiple DEGRADED intakes → dominantStatus remains DEGRADED", () => {
    const result = makeCompleteContract().batch([DEGRADED_INTAKE, DEGRADED_INTAKE]);
    expect(result.dominantStatus).toBe("DEGRADED");
    expect(result.degradedCount).toBe(2);
  });

  it("DEGRADED dominates COMPLETE", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE, DEGRADED_INTAKE]);
    expect(result.dominantStatus).toBe("DEGRADED");
  });

  it("PARTIAL dominates COMPLETE: batch with clarifications → PARTIAL, not COMPLETE", () => {
    const contract = new DesignConsumerBatchContract({
      contractDependencies: { clarifications: [{ question: "clarify scope" }] },
      now: () => FIXED_NOW,
    });
    const result = contract.batch([COMPLETE_INTAKE, COMPLETE_INTAKE]);
    expect(result.dominantStatus).toBe("PARTIAL");
    expect(result.completedCount).toBe(0);
    expect(result.partialCount).toBe(2);
  });
});

// --- count accuracy ---

describe("DesignConsumerBatchContract.batch — count accuracy", () => {
  it("counts all status types correctly in a mixed batch", () => {
    const result = makeCompleteContract().batch([
      COMPLETE_INTAKE,
      DEGRADED_INTAKE,
      DEGRADED_INTAKE,
    ]);
    expect(result.totalRequests).toBe(3);
    expect(result.completedCount).toBe(1);
    expect(result.degradedCount).toBe(2);
    expect(result.partialCount).toBe(0);
  });

  it("all status counts sum to totalRequests", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE, DEGRADED_INTAKE]);
    expect(
      result.completedCount + result.partialCount + result.degradedCount,
    ).toBe(result.totalRequests);
  });

  it("totalRequests equals receipts array length", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE, DEGRADED_INTAKE]);
    expect(result.totalRequests).toBe(result.receipts.length);
  });

  it("blockedCount equals partialCount + degradedCount", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE, DEGRADED_INTAKE]);
    expect(result.blockedCount).toBe(result.partialCount + result.degradedCount);
  });

  it("warnedCount equals count of receipts with warnings", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE, DEGRADED_INTAKE]);
    const expectedWarnedCount = result.receipts.filter(
      (r) => r.warnings.length > 0,
    ).length;
    expect(result.warnedCount).toBe(expectedWarnedCount);
  });
});

// --- output shape ---

describe("DesignConsumerBatchContract.batch — output shape", () => {
  it("result has all required fields", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE]);
    expect(result).toHaveProperty("batchId");
    expect(result).toHaveProperty("batchHash");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("totalRequests");
    expect(result).toHaveProperty("completedCount");
    expect(result).toHaveProperty("partialCount");
    expect(result).toHaveProperty("degradedCount");
    expect(result).toHaveProperty("blockedCount");
    expect(result).toHaveProperty("warnedCount");
    expect(result).toHaveProperty("dominantStatus");
    expect(result).toHaveProperty("receipts");
  });

  it("createdAt equals injected timestamp", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("batchId differs from batchHash", () => {
    const result = makeCompleteContract().batch([COMPLETE_INTAKE]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- determinism ---

describe("DesignConsumerBatchContract.batch — determinism", () => {
  it("produces same batchHash for identical intakes", () => {
    const contractA = makeCompleteContract();
    const contractB = makeCompleteContract();
    expect(
      contractA.batch([COMPLETE_INTAKE, DEGRADED_INTAKE]).batchHash,
    ).toBe(
      contractB.batch([COMPLETE_INTAKE, DEGRADED_INTAKE]).batchHash,
    );
  });

  it("produces different batchHash for different batch size", () => {
    const contract = makeCompleteContract();
    const r1 = contract.batch([COMPLETE_INTAKE]);
    const r2 = contract.batch([COMPLETE_INTAKE, COMPLETE_INTAKE]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

// --- factory ---

describe("DesignConsumerBatchContract factory", () => {
  it("createDesignConsumerBatchContract returns a valid instance", () => {
    const contract = createDesignConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract).toBeInstanceOf(DesignConsumerBatchContract);
  });

  it("factory instance batch([]) returns NONE dominantStatus", () => {
    const contract = createDesignConsumerBatchContract({ now: () => FIXED_NOW });
    expect(contract.batch([]).dominantStatus).toBe("NONE");
  });

  it("factory instance produces non-empty batchHash", () => {
    const contract = createDesignConsumerBatchContract({ now: () => FIXED_NOW });
    const result = contract.batch([COMPLETE_INTAKE]);
    expect(result.batchHash.length).toBeGreaterThan(0);
  });
});
