import {
  GovernanceSignalConsumerPipelineBatchContract,
  createGovernanceSignalConsumerPipelineBatchContract,
} from "../src/governance.signal.consumer.pipeline.batch.contract";
import {
  GovernanceSignalConsumerPipelineContract,
} from "../src/governance.signal.consumer.pipeline.contract";
import type { ThresholdAssessment } from "../src/evaluation.threshold.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T18:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildAssessment(overrides: Partial<ThresholdAssessment> = {}): ThresholdAssessment {
  return {
    assessmentId: "batch-assessment-id",
    assessedAt: FIXED_NOW,
    totalVerdicts: 5,
    passCount: 5,
    warnCount: 0,
    failCount: 0,
    inconclusiveCount: 0,
    overallStatus: "PASSING",
    summary: "Threshold assessment: PASSING",
    assessmentHash: "batch-assessment-hash",
    ...overrides,
  };
}

const pipeline = new GovernanceSignalConsumerPipelineContract({ now: fixedNow });

// NO_ACTION — PASSING assessment
const noActionResult = pipeline.execute({
  assessment: buildAssessment({ assessmentId: "ba-pass", overallStatus: "PASSING", passCount: 5, warnCount: 0, failCount: 0, inconclusiveCount: 0, assessmentHash: "h-pass" }),
});

// TRIGGER_REVIEW — WARNING assessment
const reviewResult = pipeline.execute({
  assessment: buildAssessment({ assessmentId: "ba-warn", overallStatus: "WARNING", passCount: 3, warnCount: 2, failCount: 0, inconclusiveCount: 0, assessmentHash: "h-warn" }),
});

// ESCALATE — FAILING assessment
const escalateResult = pipeline.execute({
  assessment: buildAssessment({ assessmentId: "ba-fail", overallStatus: "FAILING", passCount: 2, warnCount: 0, failCount: 3, inconclusiveCount: 0, assessmentHash: "h-fail" }),
});

// Second ESCALATE — different FAILING assessment
const escalateResult2 = pipeline.execute({
  assessment: buildAssessment({ assessmentId: "ba-fail2", overallStatus: "FAILING", passCount: 0, warnCount: 0, failCount: 5, inconclusiveCount: 0, assessmentHash: "h-fail2" }),
});

// MONITOR — INSUFFICIENT_DATA assessment
const monitorResult = pipeline.execute({
  assessment: buildAssessment({ assessmentId: "ba-insuf", overallStatus: "INSUFFICIENT_DATA", passCount: 0, warnCount: 0, failCount: 0, inconclusiveCount: 5, assessmentHash: "h-insuf" }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceSignalConsumerPipelineBatchContract", () => {
  const contract = new GovernanceSignalConsumerPipelineBatchContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GovernanceSignalConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGovernanceSignalConsumerPipelineBatchContract({ now: fixedNow });
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("empty batch", () => {
    const b = contract.batch([]);

    it("totalResults = 0", () => {
      expect(b.totalResults).toBe(0);
    });

    it("escalateCount = 0", () => {
      expect(b.escalateCount).toBe(0);
    });

    it("reviewCount = 0", () => {
      expect(b.reviewCount).toBe(0);
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
      const b = contract.batch([noActionResult]);
      expect(b.batchId).not.toBe(b.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same inputs", () => {
      const b1 = contract.batch([noActionResult, reviewResult]);
      const b2 = contract.batch([noActionResult, reviewResult]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const b1 = contract.batch([escalateResult]);
      const b2 = contract.batch([escalateResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = contract.batch([noActionResult]);
      const b2 = contract.batch([escalateResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("empty vs non-empty batch have different hashes", () => {
      const b1 = contract.batch([]);
      const b2 = contract.batch([noActionResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });
  });

  describe("escalateCount", () => {
    it("escalateCount = 0 for all NO_ACTION results", () => {
      const b = contract.batch([noActionResult]);
      expect(b.escalateCount).toBe(0);
    });

    it("escalateCount = 1 for one ESCALATE result", () => {
      const b = contract.batch([escalateResult]);
      expect(b.escalateCount).toBe(1);
    });

    it("escalateCount = 2 for two ESCALATE results", () => {
      const b = contract.batch([escalateResult, escalateResult2]);
      expect(b.escalateCount).toBe(2);
    });

    it("escalateCount = 1 in mixed batch (ESCALATE + NO_ACTION + TRIGGER_REVIEW)", () => {
      const b = contract.batch([escalateResult, noActionResult, reviewResult]);
      expect(b.escalateCount).toBe(1);
    });

    it("escalateCount is independent of reviewCount", () => {
      const b = contract.batch([escalateResult, reviewResult, noActionResult]);
      expect(b.escalateCount).toBe(1);
      expect(b.reviewCount).toBe(1);
    });
  });

  describe("reviewCount", () => {
    it("reviewCount = 0 for all NO_ACTION results", () => {
      const b = contract.batch([noActionResult]);
      expect(b.reviewCount).toBe(0);
    });

    it("reviewCount = 1 for one TRIGGER_REVIEW result", () => {
      const b = contract.batch([reviewResult]);
      expect(b.reviewCount).toBe(1);
    });

    it("reviewCount = 0 for all ESCALATE results", () => {
      const b = contract.batch([escalateResult, escalateResult2]);
      expect(b.reviewCount).toBe(0);
    });

    it("reviewCount = 0 for MONITOR results", () => {
      const b = contract.batch([monitorResult]);
      expect(b.reviewCount).toBe(0);
    });

    it("reviewCount is independent of escalateCount in mixed batch", () => {
      const b = contract.batch([escalateResult, reviewResult, monitorResult]);
      expect(b.reviewCount).toBe(1);
      expect(b.escalateCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("dominantTokenBudget = 0 for empty batch", () => {
      const b = contract.batch([]);
      expect(b.dominantTokenBudget).toBe(0);
    });

    it("dominantTokenBudget = max(estimatedTokens) for non-empty batch", () => {
      const b = contract.batch([noActionResult, escalateResult, reviewResult]);
      const expected = Math.max(
        noActionResult.consumerPackage.typedContextPackage.estimatedTokens,
        escalateResult.consumerPackage.typedContextPackage.estimatedTokens,
        reviewResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(b.dominantTokenBudget).toBe(expected);
    });
  });

  describe("general fields", () => {
    it("totalResults matches input length", () => {
      const b = contract.batch([noActionResult, reviewResult, escalateResult]);
      expect(b.totalResults).toBe(3);
    });

    it("totalResults = 0 for empty batch", () => {
      const b = contract.batch([]);
      expect(b.totalResults).toBe(0);
    });
  });
});
