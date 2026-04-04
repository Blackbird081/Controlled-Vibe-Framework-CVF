import {
  EvaluationEngineConsumerPipelineBatchContract,
  createEvaluationEngineConsumerPipelineBatchContract,
} from "../src/evaluation.engine.consumer.pipeline.batch.contract";
import { EvaluationEngineConsumerPipelineContract } from "../src/evaluation.engine.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T15:00:00.000Z";
const FIXED_NOW_2 = "2026-03-25T16:00:00.000Z";
const fixedNow = () => FIXED_NOW;
const fixedNow2 = () => FIXED_NOW_2;

const pipeline = new EvaluationEngineConsumerPipelineContract({ now: fixedNow });

function buildModel(overrides: Partial<TruthModel> = {}): TruthModel {
  return {
    modelId: "model-batch-1",
    createdAt: FIXED_NOW,
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "PROCEED",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-batch",
    ...overrides,
  } as TruthModel;
}

const passResult = pipeline.execute({ model: buildModel({ modelId: "m-pass" }) });
const warnResult = pipeline.execute({ model: buildModel({ modelId: "m-warn", currentHealthSignal: "DEGRADED" }) });
const failResult = pipeline.execute({ model: buildModel({ modelId: "m-fail", currentHealthSignal: "CRITICAL" }) });
const inconclusiveResult = pipeline.execute({ model: buildModel({ modelId: "m-inc", confidenceLevel: 0.1, healthTrajectory: "UNKNOWN" }) });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EvaluationEngineConsumerPipelineBatchContract", () => {
  const contract = new EvaluationEngineConsumerPipelineBatchContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new EvaluationEngineConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createEvaluationEngineConsumerPipelineBatchContract({ now: fixedNow });
      expect(c.batch([]).totalResults).toBe(0);
    });
  });

  describe("empty batch", () => {
    it("returns totalResults 0 for empty batch", () => {
      expect(contract.batch([]).totalResults).toBe(0);
    });

    it("returns dominantTokenBudget 0 for empty batch", () => {
      expect(contract.batch([]).dominantTokenBudget).toBe(0);
    });

    it("returns failCount 0 for empty batch", () => {
      expect(contract.batch([]).failCount).toBe(0);
    });

    it("returns inconclusiveCount 0 for empty batch", () => {
      expect(contract.batch([]).inconclusiveCount).toBe(0);
    });

    it("returns valid batchHash for empty batch", () => {
      expect(contract.batch([]).batchHash.length).toBeGreaterThan(0);
    });

    it("returns valid batchId for empty batch", () => {
      expect(contract.batch([]).batchId.length).toBeGreaterThan(0);
    });
  });

  describe("batchId vs batchHash", () => {
    it("batchId is distinct from batchHash", () => {
      const b = contract.batch([passResult]);
      expect(b.batchId).not.toBe(b.batchHash);
    });

    it("batchId is deterministic for same inputs", () => {
      const b1 = contract.batch([passResult]);
      const b2 = contract.batch([passResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash is deterministic for same inputs", () => {
      const b1 = contract.batch([passResult]);
      const b2 = contract.batch([passResult]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = contract.batch([passResult]);
      const b2 = contract.batch([failResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new EvaluationEngineConsumerPipelineBatchContract({ now: fixedNow });
      const c2 = new EvaluationEngineConsumerPipelineBatchContract({ now: fixedNow2 });
      expect(c1.batch([passResult]).batchHash).not.toBe(c2.batch([passResult]).batchHash);
    });
  });

  describe("failCount", () => {
    it("failCount is 0 for PASS results", () => {
      expect(contract.batch([passResult]).failCount).toBe(0);
    });

    it("failCount is 0 for WARN results", () => {
      expect(contract.batch([warnResult]).failCount).toBe(0);
    });

    it("failCount is 0 for INCONCLUSIVE results", () => {
      expect(contract.batch([inconclusiveResult]).failCount).toBe(0);
    });

    it("failCount is 1 for single FAIL result", () => {
      expect(contract.batch([failResult]).failCount).toBe(1);
    });

    it("failCount counts multiple FAIL results", () => {
      expect(contract.batch([failResult, failResult, passResult]).failCount).toBe(2);
    });
  });

  describe("inconclusiveCount", () => {
    it("inconclusiveCount is 0 for PASS results", () => {
      expect(contract.batch([passResult]).inconclusiveCount).toBe(0);
    });

    it("inconclusiveCount is 1 for single INCONCLUSIVE result", () => {
      expect(contract.batch([inconclusiveResult]).inconclusiveCount).toBe(1);
    });

    it("inconclusiveCount counts multiple INCONCLUSIVE results", () => {
      expect(contract.batch([inconclusiveResult, inconclusiveResult]).inconclusiveCount).toBe(2);
    });

    it("failCount and inconclusiveCount both non-zero in mixed batch", () => {
      const b = contract.batch([failResult, inconclusiveResult, passResult]);
      expect(b.failCount).toBe(1);
      expect(b.inconclusiveCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("dominantTokenBudget reflects max estimatedTokens", () => {
      const b = contract.batch([passResult, failResult]);
      const max = Math.max(
        passResult.consumerPackage.typedContextPackage.estimatedTokens,
        failResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(b.dominantTokenBudget).toBe(max);
    });

    it("dominantTokenBudget is 0 for empty batch", () => {
      expect(contract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalResults matches input length", () => {
      expect(contract.batch([passResult, failResult, warnResult]).totalResults).toBe(3);
    });

    it("createdAt equals injected now()", () => {
      expect(contract.batch([passResult]).createdAt).toBe(FIXED_NOW);
    });
  });
});
