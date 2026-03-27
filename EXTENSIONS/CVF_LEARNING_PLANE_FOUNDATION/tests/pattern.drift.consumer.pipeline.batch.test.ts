import {
  PatternDriftConsumerPipelineBatchContract,
  createPatternDriftConsumerPipelineBatchContract,
} from "../src/pattern.drift.consumer.pipeline.batch.contract";
import { PatternDriftConsumerPipelineContract } from "../src/pattern.drift.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-27T18:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildModel(overrides: Partial<TruthModel> = {}): TruthModel {
  return {
    modelId: "model-base",
    createdAt: FIXED_NOW,
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "ACCEPT",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-base",
    ...overrides,
  };
}

const pipeline = new PatternDriftConsumerPipelineContract({ now: fixedNow });

const stableResult = pipeline.execute({
  baseline: buildModel({ modelId: "b-stable" }),
  current: buildModel({ modelId: "c-stable" }),
});

const driftingResult = pipeline.execute({
  baseline: buildModel({ modelId: "b-drifting", dominantPattern: "ACCEPT" }),
  current: buildModel({ modelId: "c-drifting", dominantPattern: "ESCALATE" }),
});

const criticalResult = pipeline.execute({
  baseline: buildModel({ modelId: "b-critical", currentHealthSignal: "HEALTHY" }),
  current: buildModel({ modelId: "c-critical", currentHealthSignal: "CRITICAL" }),
});

const criticalResult2 = pipeline.execute({
  baseline: buildModel({ modelId: "b-critical2", confidenceLevel: 0.9 }),
  current: buildModel({ modelId: "c-critical2", confidenceLevel: 0.5 }),
});

const batchContract = new PatternDriftConsumerPipelineBatchContract({ now: fixedNow });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PatternDriftConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDriftConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDriftConsumerPipelineBatchContract({ now: fixedNow });
      const b = c.batch([]);
      expect(b).toBeDefined();
    });
  });

  describe("empty batch", () => {
    const emptyBatch = batchContract.batch([]);

    it("totalResults = 0", () => {
      expect(emptyBatch.totalResults).toBe(0);
    });

    it("criticalDriftCount = 0", () => {
      expect(emptyBatch.criticalDriftCount).toBe(0);
    });

    it("driftingCount = 0", () => {
      expect(emptyBatch.driftingCount).toBe(0);
    });

    it("dominantTokenBudget = 0", () => {
      expect(emptyBatch.dominantTokenBudget).toBe(0);
    });

    it("batchHash is non-empty string", () => {
      expect(typeof emptyBatch.batchHash).toBe("string");
      expect(emptyBatch.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId is non-empty string", () => {
      expect(typeof emptyBatch.batchId).toBe("string");
      expect(emptyBatch.batchId.length).toBeGreaterThan(0);
    });

    it("batchId != batchHash", () => {
      expect(emptyBatch.batchId).not.toBe(emptyBatch.batchHash);
    });

    it("createdAt = FIXED_NOW", () => {
      expect(emptyBatch.createdAt).toBe(FIXED_NOW);
    });
  });

  describe("criticalDriftCount", () => {
    it("single CRITICAL_DRIFT result → criticalDriftCount = 1", () => {
      const b = batchContract.batch([criticalResult]);
      expect(b.criticalDriftCount).toBe(1);
    });

    it("two CRITICAL_DRIFT results → criticalDriftCount = 2", () => {
      const b = batchContract.batch([criticalResult, criticalResult2]);
      expect(b.criticalDriftCount).toBe(2);
    });

    it("DRIFTING result → criticalDriftCount = 0", () => {
      const b = batchContract.batch([driftingResult]);
      expect(b.criticalDriftCount).toBe(0);
    });

    it("STABLE result → criticalDriftCount = 0", () => {
      const b = batchContract.batch([stableResult]);
      expect(b.criticalDriftCount).toBe(0);
    });

    it("mixed batch → criticalDriftCount counts only CRITICAL_DRIFT", () => {
      const b = batchContract.batch([stableResult, driftingResult, criticalResult]);
      expect(b.criticalDriftCount).toBe(1);
    });
  });

  describe("driftingCount", () => {
    it("single DRIFTING result → driftingCount = 1", () => {
      const b = batchContract.batch([driftingResult]);
      expect(b.driftingCount).toBe(1);
    });

    it("CRITICAL_DRIFT result → driftingCount = 0", () => {
      const b = batchContract.batch([criticalResult]);
      expect(b.driftingCount).toBe(0);
    });

    it("STABLE result → driftingCount = 0", () => {
      const b = batchContract.batch([stableResult]);
      expect(b.driftingCount).toBe(0);
    });

    it("mixed batch → driftingCount counts only DRIFTING", () => {
      const b = batchContract.batch([stableResult, driftingResult, criticalResult]);
      expect(b.driftingCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("single result → dominantTokenBudget = its estimatedTokens", () => {
      const b = batchContract.batch([stableResult]);
      expect(b.dominantTokenBudget).toBe(
        stableResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
    });

    it("multiple results → dominantTokenBudget = max estimatedTokens", () => {
      const b = batchContract.batch([stableResult, driftingResult, criticalResult]);
      const expected = Math.max(
        stableResult.consumerPackage.typedContextPackage.estimatedTokens,
        driftingResult.consumerPackage.typedContextPackage.estimatedTokens,
        criticalResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(b.dominantTokenBudget).toBe(expected);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same inputs", () => {
      const b1 = batchContract.batch([stableResult, driftingResult]);
      const b2 = batchContract.batch([stableResult, driftingResult]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const b1 = batchContract.batch([stableResult]);
      const b2 = batchContract.batch([stableResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([stableResult]);
      const b2 = batchContract.batch([criticalResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });
  });

  describe("general fields", () => {
    it("totalResults reflects batch size", () => {
      const b = batchContract.batch([stableResult, driftingResult, criticalResult]);
      expect(b.totalResults).toBe(3);
    });

    it("createdAt = FIXED_NOW for all batches", () => {
      const b = batchContract.batch([stableResult]);
      expect(b.createdAt).toBe(FIXED_NOW);
    });
  });
});
