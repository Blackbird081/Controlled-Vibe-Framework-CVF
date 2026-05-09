import {
  PatternDetectionConsumerPipelineBatchContract,
  createPatternDetectionConsumerPipelineBatchContract,
} from "../src/pattern.detection.consumer.pipeline.batch.contract";
import {
  PatternDetectionConsumerPipelineContract,
} from "../src/pattern.detection.consumer.pipeline.contract";
import type { FeedbackLedger } from "../src/feedback.ledger.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T17:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildLedger(overrides: Partial<FeedbackLedger> = {}): FeedbackLedger {
  return {
    ledgerId: "batch-ledger-1",
    compiledAt: FIXED_NOW,
    records: [],
    totalRecords: 10,
    acceptCount: 10,
    retryCount: 0,
    escalateCount: 0,
    rejectCount: 0,
    ledgerHash: "hash-batch-ledger",
    ...overrides,
  };
}

const pipeline = new PatternDetectionConsumerPipelineContract({ now: fixedNow });

// HEALTHY: acceptCount=10, no escalate/reject
const healthyResult = pipeline.execute({
  ledger: buildLedger({ ledgerId: "l-h1" }),
});

// DEGRADED: escalateCount=5, rejectCount=0
const degradedResult = pipeline.execute({
  ledger: buildLedger({
    ledgerId: "l-d1",
    totalRecords: 10,
    acceptCount: 4,
    retryCount: 1,
    escalateCount: 5,
    rejectCount: 0,
  }),
});

// CRITICAL: rejectCount=5
const criticalResult = pipeline.execute({
  ledger: buildLedger({
    ledgerId: "l-c1",
    totalRecords: 10,
    acceptCount: 4,
    retryCount: 1,
    escalateCount: 0,
    rejectCount: 5,
  }),
});

// Second CRITICAL
const criticalResult2 = pipeline.execute({
  ledger: buildLedger({
    ledgerId: "l-c2",
    totalRecords: 10,
    acceptCount: 2,
    retryCount: 1,
    escalateCount: 0,
    rejectCount: 7,
  }),
});

// Second DEGRADED: escalateCount=3, badRate=0.3 (>=0.3, <0.6, rejectRate=0) → DEGRADED
const degradedResult2 = pipeline.execute({
  ledger: buildLedger({
    ledgerId: "l-d2",
    totalRecords: 10,
    acceptCount: 6,
    retryCount: 1,
    escalateCount: 3,
    rejectCount: 0,
  }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PatternDetectionConsumerPipelineBatchContract", () => {
  const contract = new PatternDetectionConsumerPipelineBatchContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDetectionConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDetectionConsumerPipelineBatchContract({ now: fixedNow });
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("empty batch", () => {
    const b = contract.batch([]);

    it("totalResults = 0", () => {
      expect(b.totalResults).toBe(0);
    });

    it("criticalCount = 0", () => {
      expect(b.criticalCount).toBe(0);
    });

    it("degradedCount = 0", () => {
      expect(b.degradedCount).toBe(0);
    });

    it("dominantTokenBudget = 0", () => {
      expect(b.dominantTokenBudget).toBe(0);
    });

    it("has batchId", () => {
      expect(typeof b.batchId).toBe("string");
      expect(b.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof b.batchHash).toBe("string");
      expect(b.batchHash.length).toBeGreaterThan(0);
    });

    it("createdAt = FIXED_NOW", () => {
      expect(b.createdAt).toBe(FIXED_NOW);
    });
  });

  describe("batchId vs batchHash invariant", () => {
    it("batchId differs from batchHash for empty batch", () => {
      const b = contract.batch([]);
      expect(b.batchId).not.toBe(b.batchHash);
    });

    it("batchId differs from batchHash for non-empty batch", () => {
      const b = contract.batch([healthyResult]);
      expect(b.batchId).not.toBe(b.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same inputs", () => {
      const b1 = contract.batch([healthyResult, degradedResult]);
      const b2 = contract.batch([healthyResult, degradedResult]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const b1 = contract.batch([healthyResult]);
      const b2 = contract.batch([healthyResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = contract.batch([healthyResult]);
      const b2 = contract.batch([criticalResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("empty vs non-empty batch have different hashes", () => {
      const b1 = contract.batch([]);
      const b2 = contract.batch([healthyResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });
  });

  describe("criticalCount", () => {
    it("criticalCount = 0 for all HEALTHY results", () => {
      const b = contract.batch([healthyResult]);
      expect(b.criticalCount).toBe(0);
    });

    it("criticalCount = 1 for one CRITICAL result", () => {
      const b = contract.batch([criticalResult]);
      expect(b.criticalCount).toBe(1);
    });

    it("criticalCount = 2 for two CRITICAL results", () => {
      const b = contract.batch([criticalResult, criticalResult2]);
      expect(b.criticalCount).toBe(2);
    });

    it("criticalCount = 1 in mixed batch (CRITICAL + HEALTHY + DEGRADED)", () => {
      const b = contract.batch([criticalResult, healthyResult, degradedResult]);
      expect(b.criticalCount).toBe(1);
    });

    it("criticalCount is independent of degradedCount", () => {
      const b = contract.batch([criticalResult, degradedResult, degradedResult2]);
      expect(b.criticalCount).toBe(1);
      expect(b.degradedCount).toBe(2);
    });
  });

  describe("degradedCount", () => {
    it("degradedCount = 0 for all HEALTHY results", () => {
      const b = contract.batch([healthyResult]);
      expect(b.degradedCount).toBe(0);
    });

    it("degradedCount = 1 for one DEGRADED result", () => {
      const b = contract.batch([degradedResult]);
      expect(b.degradedCount).toBe(1);
    });

    it("degradedCount = 2 for two DEGRADED results", () => {
      const b = contract.batch([degradedResult, degradedResult2]);
      expect(b.degradedCount).toBe(2);
    });

    it("degradedCount = 0 for all CRITICAL results", () => {
      const b = contract.batch([criticalResult, criticalResult2]);
      expect(b.degradedCount).toBe(0);
    });

    it("degradedCount is independent of criticalCount in mixed batch", () => {
      const b = contract.batch([criticalResult, degradedResult, healthyResult]);
      expect(b.degradedCount).toBe(1);
      expect(b.criticalCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("dominantTokenBudget = 0 for empty batch", () => {
      const b = contract.batch([]);
      expect(b.dominantTokenBudget).toBe(0);
    });

    it("dominantTokenBudget = max(estimatedTokens) for non-empty batch", () => {
      const b = contract.batch([healthyResult, criticalResult, degradedResult]);
      const expected = Math.max(
        healthyResult.consumerPackage.typedContextPackage.estimatedTokens,
        criticalResult.consumerPackage.typedContextPackage.estimatedTokens,
        degradedResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(b.dominantTokenBudget).toBe(expected);
    });
  });

  describe("general fields", () => {
    it("totalResults matches input length", () => {
      const b = contract.batch([healthyResult, degradedResult, criticalResult]);
      expect(b.totalResults).toBe(3);
    });

    it("totalResults = 0 for empty batch", () => {
      const b = contract.batch([]);
      expect(b.totalResults).toBe(0);
    });
  });
});
