import {
  TruthScoreConsumerPipelineBatchContract,
  createTruthScoreConsumerPipelineBatchContract,
} from "../src/truth.score.consumer.pipeline.batch.contract";
import {
  TruthScoreConsumerPipelineContract,
} from "../src/truth.score.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW_1 = "2026-03-25T17:00:00.000Z";
const NOW_2 = "2026-03-25T18:00:00.000Z";

function buildModel(overrides: Partial<TruthModel> = {}): TruthModel {
  return {
    modelId: "batch-model-1",
    createdAt: NOW_1,
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "ACCEPT",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-batch-fixture",
    ...overrides,
  } as TruthModel;
}

// STRONG: conf=1.0, health=HEALTHY, traj=IMPROVING, pattern=RETRY → 25+25+25+8=83
const strongModel = buildModel({ modelId: "bm-strong", confidenceLevel: 1.0, healthTrajectory: "IMPROVING", dominantPattern: "RETRY" });
// ADEQUATE: conf=0.6, health=HEALTHY, traj=STABLE, pattern=ACCEPT → 15+25+18+0=58
const adequateModel = buildModel({ modelId: "bm-adequate", confidenceLevel: 0.6, dominantPattern: "ACCEPT" });
// WEAK: conf=0.4, health=DEGRADED, traj=DEGRADING, pattern=RETRY → 10+12+5+8=35
const weakModel = buildModel({ modelId: "bm-weak", confidenceLevel: 0.4, currentHealthSignal: "DEGRADED", healthTrajectory: "DEGRADING", dominantPattern: "RETRY" });
// INSUFFICIENT: conf=0.08, health=CRITICAL, traj=UNKNOWN, pattern=REJECT → 2+0+0+0=2
const insufficientModel = buildModel({ modelId: "bm-insufficient", confidenceLevel: 0.08, currentHealthSignal: "CRITICAL", healthTrajectory: "UNKNOWN", dominantPattern: "REJECT" });

const cp1 = new TruthScoreConsumerPipelineContract({ now: () => NOW_1 });

const strongResult = cp1.execute({ model: strongModel });
const adequateResult = cp1.execute({ model: adequateModel });
const weakResult = cp1.execute({ model: weakModel });
const insufficientResult = cp1.execute({ model: insufficientModel });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TruthScoreConsumerPipelineBatchContract", () => {
  const batchContract = new TruthScoreConsumerPipelineBatchContract({ now: () => NOW_2 });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new TruthScoreConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createTruthScoreConsumerPipelineBatchContract({ now: () => NOW_2 });
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("empty batch", () => {
    const empty = batchContract.batch([]);

    it("totalResults is 0", () => {
      expect(empty.totalResults).toBe(0);
    });

    it("insufficientCount is 0", () => {
      expect(empty.insufficientCount).toBe(0);
    });

    it("weakCount is 0", () => {
      expect(empty.weakCount).toBe(0);
    });

    it("dominantTokenBudget is 0", () => {
      expect(empty.dominantTokenBudget).toBe(0);
    });

    it("batchId and batchHash are non-empty strings", () => {
      expect(empty.batchId.length).toBeGreaterThan(0);
      expect(empty.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId differs from batchHash", () => {
      expect(empty.batchId).not.toBe(empty.batchHash);
    });

    it("createdAt is set", () => {
      expect(empty.createdAt).toBe(NOW_2);
    });
  });

  describe("batchId vs batchHash invariant", () => {
    it("batchId !== batchHash for single result", () => {
      const b = batchContract.batch([strongResult]);
      expect(b.batchId).not.toBe(b.batchHash);
    });

    it("batchId !== batchHash for multiple results", () => {
      const b = batchContract.batch([strongResult, weakResult, insufficientResult]);
      expect(b.batchId).not.toBe(b.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same inputs", () => {
      const b1 = batchContract.batch([strongResult, weakResult]);
      const b2 = batchContract.batch([strongResult, weakResult]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const b1 = batchContract.batch([strongResult]);
      const b2 = batchContract.batch([strongResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([strongResult]);
      const b2 = batchContract.batch([weakResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new TruthScoreConsumerPipelineBatchContract({ now: () => NOW_1 });
      const c2 = new TruthScoreConsumerPipelineBatchContract({ now: () => NOW_2 });
      expect(c1.batch([strongResult]).batchHash).not.toBe(c2.batch([strongResult]).batchHash);
    });
  });

  describe("insufficientCount", () => {
    it("is 0 for all STRONG/ADEQUATE results", () => {
      expect(batchContract.batch([strongResult, adequateResult]).insufficientCount).toBe(0);
    });

    it("counts one INSUFFICIENT result", () => {
      expect(batchContract.batch([insufficientResult]).insufficientCount).toBe(1);
    });

    it("counts multiple INSUFFICIENT results", () => {
      expect(batchContract.batch([insufficientResult, insufficientResult]).insufficientCount).toBe(2);
    });

    it("does not count WEAK as insufficient", () => {
      expect(batchContract.batch([weakResult]).insufficientCount).toBe(0);
    });
  });

  describe("weakCount", () => {
    it("is 0 for all STRONG/ADEQUATE results", () => {
      expect(batchContract.batch([strongResult, adequateResult]).weakCount).toBe(0);
    });

    it("counts one WEAK result", () => {
      expect(batchContract.batch([weakResult]).weakCount).toBe(1);
    });

    it("counts multiple WEAK results", () => {
      expect(batchContract.batch([weakResult, weakResult]).weakCount).toBe(2);
    });

    it("does not count INSUFFICIENT as weak", () => {
      expect(batchContract.batch([insufficientResult]).weakCount).toBe(0);
    });

    it("counts WEAK and INSUFFICIENT independently", () => {
      const b = batchContract.batch([weakResult, insufficientResult, strongResult]);
      expect(b.weakCount).toBe(1);
      expect(b.insufficientCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const b = batchContract.batch([strongResult, weakResult, insufficientResult]);
      const expected = Math.max(
        strongResult.consumerPackage.typedContextPackage.estimatedTokens,
        weakResult.consumerPackage.typedContextPackage.estimatedTokens,
        insufficientResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(b.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const b = batchContract.batch([adequateResult]);
      expect(b.dominantTokenBudget).toBe(adequateResult.consumerPackage.typedContextPackage.estimatedTokens);
    });
  });

  describe("general fields", () => {
    it("totalResults equals results length", () => {
      expect(batchContract.batch([strongResult, weakResult, insufficientResult]).totalResults).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([strongResult]).createdAt).toBe(NOW_2);
    });
  });
});
