import {
  TruthScoreConsumerPipelineContract,
  createTruthScoreConsumerPipelineContract,
} from "../src/truth.score.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T17:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildModel(overrides: Partial<TruthModel> = {}): TruthModel {
  return {
    modelId: "model-score-1",
    createdAt: FIXED_NOW,
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "ACCEPT",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-score-fixture",
    ...overrides,
  } as TruthModel;
}

// STRONG: confidenceScore=25 (1.0*25), healthScore=25 (HEALTHY), trajectoryScore=25 (IMPROVING), patternScore=8 (RETRY) → 83
const strongModel = buildModel({
  modelId: "m-strong",
  confidenceLevel: 1.0,
  currentHealthSignal: "HEALTHY",
  healthTrajectory: "IMPROVING",
  dominantPattern: "RETRY",
});

// ADEQUATE: confidenceScore=15 (0.6*25), healthScore=25 (HEALTHY), trajectoryScore=18 (STABLE), patternScore=0 (ACCEPT) → 58
const adequateModel = buildModel({
  modelId: "m-adequate",
  confidenceLevel: 0.6,
  currentHealthSignal: "HEALTHY",
  healthTrajectory: "STABLE",
  dominantPattern: "ACCEPT",
});

// WEAK: confidenceScore=10 (0.4*25), healthScore=12 (DEGRADED), trajectoryScore=5 (DEGRADING), patternScore=8 (RETRY) → 35
const weakModel = buildModel({
  modelId: "m-weak",
  confidenceLevel: 0.4,
  currentHealthSignal: "DEGRADED",
  healthTrajectory: "DEGRADING",
  dominantPattern: "RETRY",
});

// INSUFFICIENT: confidenceScore=2 (0.08*25=2), healthScore=0 (CRITICAL), trajectoryScore=0 (UNKNOWN), patternScore=0 (REJECT) → 2
const insufficientModel = buildModel({
  modelId: "m-insufficient",
  confidenceLevel: 0.08,
  currentHealthSignal: "CRITICAL",
  healthTrajectory: "UNKNOWN",
  dominantPattern: "REJECT",
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TruthScoreConsumerPipelineContract", () => {
  const contract = new TruthScoreConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new TruthScoreConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createTruthScoreConsumerPipelineContract({ now: fixedNow });
      expect(c.execute({ model: strongModel })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ model: strongModel });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has scoreResult", () => {
      expect(result.scoreResult).toBeDefined();
      expect(result.scoreResult.compositeScore).toBeGreaterThanOrEqual(0);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ model: strongModel, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ model: strongModel });
      const r2 = contract.execute({ model: strongModel });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ model: strongModel });
      const r2 = contract.execute({ model: strongModel });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different models", () => {
      const r1 = contract.execute({ model: strongModel });
      const r2 = contract.execute({ model: weakModel });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new TruthScoreConsumerPipelineContract({ now: () => "2026-03-25T17:00:00.000Z" });
      const c2 = new TruthScoreConsumerPipelineContract({ now: () => "2026-03-25T18:00:00.000Z" });
      expect(c1.execute({ model: strongModel }).pipelineHash).not.toBe(
        c2.execute({ model: strongModel }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains scoreClass", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.consumerPackage.query).toContain("truth-score:class:STRONG");
    });

    it("query contains compositeScore", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.consumerPackage.query).toContain("score:");
    });

    it("query contains sourceTruthModelId", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.consumerPackage.query).toContain("model:m-strong");
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ model: buildModel({ modelId: "m".repeat(200) }) });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different scoreClass", () => {
      const r1 = contract.execute({ model: strongModel });
      const r2 = contract.execute({ model: insufficientModel });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals scoreResult.scoreId", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.consumerPackage.contextId).toBe(result.scoreResult.scoreId);
    });

    it("contextId differs for different models", () => {
      const r1 = contract.execute({ model: strongModel });
      const r2 = contract.execute({ model: weakModel });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for STRONG", () => {
      expect(contract.execute({ model: strongModel }).warnings).toHaveLength(0);
    });

    it("no warning for ADEQUATE", () => {
      expect(contract.execute({ model: adequateModel }).warnings).toHaveLength(0);
    });

    it("WEAK triggers weak warning", () => {
      const result = contract.execute({ model: weakModel });
      expect(result.warnings).toContain(
        "[truth-score] weak truth signal — model quality degraded",
      );
    });

    it("INSUFFICIENT triggers insufficient warning", () => {
      const result = contract.execute({ model: insufficientModel });
      expect(result.warnings).toContain(
        "[truth-score] insufficient truth data — model not actionable",
      );
    });

    it("INSUFFICIENT does not trigger weak warning", () => {
      const result = contract.execute({ model: insufficientModel });
      expect(result.warnings).not.toContain(
        "[truth-score] weak truth signal — model quality degraded",
      );
    });
  });

  describe("scoreResult propagation", () => {
    it("scoreResult.compositeScore is propagated", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.scoreResult.compositeScore).toBeGreaterThanOrEqual(80);
    });

    it("scoreResult.scoreClass is STRONG for healthy model", () => {
      expect(contract.execute({ model: strongModel }).scoreResult.scoreClass).toBe("STRONG");
    });

    it("scoreResult.scoreClass is WEAK for weak model", () => {
      expect(contract.execute({ model: weakModel }).scoreResult.scoreClass).toBe("WEAK");
    });

    it("scoreResult.scoreClass is INSUFFICIENT for insufficient model", () => {
      expect(contract.execute({ model: insufficientModel }).scoreResult.scoreClass).toBe("INSUFFICIENT");
    });

    it("scoreResult.sourceTruthModelId matches model.modelId", () => {
      const result = contract.execute({ model: strongModel });
      expect(result.scoreResult.sourceTruthModelId).toBe("m-strong");
    });
  });
});
