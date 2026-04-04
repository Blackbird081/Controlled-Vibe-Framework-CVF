import {
  EvaluationEngineConsumerPipelineContract,
  createEvaluationEngineConsumerPipelineContract,
} from "../src/evaluation.engine.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T14:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildModel(
  overrides: Partial<TruthModel> = {},
): TruthModel {
  return {
    modelId: "model-test-1",
    createdAt: FIXED_NOW,
    version: 1,
    totalInsightsProcessed: 10,
    dominantPattern: "PROCEED",
    currentHealthSignal: "HEALTHY",
    healthTrajectory: "STABLE",
    confidenceLevel: 0.8,
    patternHistory: [],
    modelHash: "hash-fixture",
    ...overrides,
  } as TruthModel;
}

const passModel = buildModel();
const warnModel = buildModel({ currentHealthSignal: "DEGRADED", modelId: "model-warn" });
const failModel = buildModel({ currentHealthSignal: "CRITICAL", modelId: "model-fail" });
const inconclusiveModel = buildModel({ confidenceLevel: 0.1, healthTrajectory: "UNKNOWN", modelId: "model-inconclusive" });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EvaluationEngineConsumerPipelineContract", () => {
  const contract = new EvaluationEngineConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new EvaluationEngineConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createEvaluationEngineConsumerPipelineContract({ now: fixedNow });
      const result = c.execute({ model: passModel });
      expect(result.resultId.length).toBeGreaterThan(0);
    });
  });

  describe("output shape", () => {
    it("returns resultId as non-empty string", () => {
      expect(contract.execute({ model: passModel }).resultId.length).toBeGreaterThan(0);
    });

    it("returns createdAt equal to injected now()", () => {
      expect(contract.execute({ model: passModel }).createdAt).toBe(FIXED_NOW);
    });

    it("returns evaluationResult with verdict", () => {
      const result = contract.execute({ model: passModel });
      expect(result.evaluationResult.verdict).toBeDefined();
    });

    it("returns consumerPackage", () => {
      const result = contract.execute({ model: passModel });
      expect(result.consumerPackage).toBeDefined();
    });

    it("returns pipelineHash as non-empty string", () => {
      expect(contract.execute({ model: passModel }).pipelineHash.length).toBeGreaterThan(0);
    });

    it("returns warnings as an array", () => {
      expect(Array.isArray(contract.execute({ model: passModel }).warnings)).toBe(true);
    });

    it("resultId is distinct from pipelineHash", () => {
      const result = contract.execute({ model: passModel });
      expect(result.resultId).not.toBe(result.pipelineHash);
    });

    it("evaluationResult is the full EvaluationResult object", () => {
      const result = contract.execute({ model: passModel });
      expect(result.evaluationResult.severity).toBeDefined();
      expect(result.evaluationResult.rationale.length).toBeGreaterThan(0);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ model: passModel, consumerId: "consumer-abc" });
      expect(result.consumerId).toBe("consumer-abc");
    });

    it("consumerId is undefined when not provided", () => {
      expect(contract.execute({ model: passModel }).consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const r1 = contract.execute({ model: passModel });
      const r2 = contract.execute({ model: passModel });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("pipelineHash differs for different models", () => {
      const r1 = contract.execute({ model: passModel });
      const r2 = contract.execute({ model: failModel });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const r1 = contract.execute({ model: passModel });
      const r2 = contract.execute({ model: passModel });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different modelId", () => {
      const m1 = buildModel({ modelId: "m-hash-a" });
      const m2 = buildModel({ modelId: "m-hash-b" });
      expect(contract.execute({ model: m1 }).pipelineHash).not.toBe(contract.execute({ model: m2 }).pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("query contains verdict", () => {
      const result = contract.execute({ model: passModel });
      expect(result.consumerPackage.query).toContain("verdict:PASS");
    });

    it("query contains severity", () => {
      const result = contract.execute({ model: passModel });
      expect(result.consumerPackage.query).toContain("severity:");
    });

    it("query contains confidence with 2 decimal places", () => {
      const result = contract.execute({ model: passModel });
      expect(result.consumerPackage.query).toContain("confidence:0.80");
    });

    it("query length is at most 120 chars", () => {
      expect(contract.execute({ model: passModel }).consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query starts with evaluation-engine:", () => {
      expect(contract.execute({ model: passModel }).consumerPackage.query).toMatch(/^evaluation-engine:/);
    });
  });

  describe("contextId", () => {
    it("contextId equals sourceTruthModelId", () => {
      const result = contract.execute({ model: passModel });
      expect(result.consumerPackage.contextId).toBe(passModel.modelId);
    });

    it("contextId follows sourceTruthModelId when model changes", () => {
      const m = buildModel({ modelId: "model-ctx-check" });
      expect(contract.execute({ model: m }).consumerPackage.contextId).toBe("model-ctx-check");
    });
  });

  describe("warning messages", () => {
    it("PASS verdict → no warnings", () => {
      expect(contract.execute({ model: passModel }).warnings).toHaveLength(0);
    });

    it("WARN verdict → no warnings", () => {
      expect(contract.execute({ model: warnModel }).warnings).toHaveLength(0);
    });

    it("FAIL verdict → fail warning", () => {
      const result = contract.execute({ model: failModel });
      expect(result.warnings).toContain("[evaluation-engine] evaluation failed — governed intervention required");
    });

    it("INCONCLUSIVE verdict → inconclusive warning", () => {
      const result = contract.execute({ model: inconclusiveModel });
      expect(result.warnings).toContain("[evaluation-engine] evaluation inconclusive — insufficient learning data");
    });

    it("FAIL warning appears only once", () => {
      const warnings = contract.execute({ model: failModel }).warnings;
      const count = warnings.filter(w => w.includes("evaluation failed")).length;
      expect(count).toBe(1);
    });
  });

  describe("evaluationResult propagation", () => {
    it("PASS model → verdict PASS", () => {
      expect(contract.execute({ model: passModel }).evaluationResult.verdict).toBe("PASS");
    });

    it("WARN model → verdict WARN", () => {
      expect(contract.execute({ model: warnModel }).evaluationResult.verdict).toBe("WARN");
    });

    it("FAIL model → verdict FAIL", () => {
      expect(contract.execute({ model: failModel }).evaluationResult.verdict).toBe("FAIL");
    });

    it("INCONCLUSIVE model → verdict INCONCLUSIVE", () => {
      expect(contract.execute({ model: inconclusiveModel }).evaluationResult.verdict).toBe("INCONCLUSIVE");
    });

    it("confidenceLevel is propagated from model", () => {
      const result = contract.execute({ model: passModel });
      expect(result.evaluationResult.confidenceLevel).toBe(0.8);
    });
  });
});
