import {
  PatternDriftConsumerPipelineContract,
  createPatternDriftConsumerPipelineContract,
} from "../src/pattern.drift.consumer.pipeline.contract";
import type { TruthModel } from "../src/truth.model.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-27T17:00:00.000Z";
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

const contract = new PatternDriftConsumerPipelineContract({ now: fixedNow });

// STABLE: identical models
const baselineStable = buildModel({ modelId: "m-baseline-stable" });
const currentStable = buildModel({ modelId: "m-current-stable" });
const stableResult = contract.execute({ baseline: baselineStable, current: currentStable });

// DRIFTING: dominant pattern changed
const baselineDrift = buildModel({ modelId: "m-baseline-drift", dominantPattern: "ACCEPT" });
const currentDrift = buildModel({ modelId: "m-current-drift", dominantPattern: "ESCALATE" });
const driftingResult = contract.execute({ baseline: baselineDrift, current: currentDrift });

// CRITICAL_DRIFT: health turned CRITICAL
const baselineCritical = buildModel({ modelId: "m-baseline-crit", currentHealthSignal: "HEALTHY" });
const currentCritical = buildModel({ modelId: "m-current-crit", currentHealthSignal: "CRITICAL" });
const criticalResult = contract.execute({ baseline: baselineCritical, current: currentCritical });

// CRITICAL_DRIFT: confidence dropped > 0.3
const baselineConfDrop = buildModel({ modelId: "m-baseline-conf", confidenceLevel: 0.9 });
const currentConfDrop = buildModel({ modelId: "m-current-conf", confidenceLevel: 0.5 });
const criticalResult2 = contract.execute({ baseline: baselineConfDrop, current: currentConfDrop });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PatternDriftConsumerPipelineContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDriftConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDriftConsumerPipelineContract({ now: fixedNow });
      const r = c.execute({ baseline: baselineStable, current: currentStable });
      expect(r).toBeDefined();
    });
  });

  describe("output shape", () => {
    it("returns resultId string", () => {
      expect(typeof stableResult.resultId).toBe("string");
      expect(stableResult.resultId.length).toBeGreaterThan(0);
    });

    it("returns createdAt = FIXED_NOW", () => {
      expect(stableResult.createdAt).toBe(FIXED_NOW);
    });

    it("returns driftResult object", () => {
      expect(stableResult.driftResult).toBeDefined();
    });

    it("returns consumerPackage object", () => {
      expect(stableResult.consumerPackage).toBeDefined();
    });

    it("returns pipelineHash string", () => {
      expect(typeof stableResult.pipelineHash).toBe("string");
      expect(stableResult.pipelineHash.length).toBeGreaterThan(0);
    });

    it("returns warnings array", () => {
      expect(Array.isArray(stableResult.warnings)).toBe(true);
    });

    it("consumerPackage has pipelineHash", () => {
      expect(typeof stableResult.consumerPackage.pipelineHash).toBe("string");
    });
  });

  describe("consumerId propagation", () => {
    it("consumerId is propagated when provided", () => {
      const r = contract.execute({
        baseline: baselineStable,
        current: currentStable,
        consumerId: "consumer-xyz",
      });
      expect(r.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      expect(stableResult.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const c = new PatternDriftConsumerPipelineContract({ now: fixedNow });
      const r1 = c.execute({ baseline: baselineStable, current: currentStable });
      const r2 = c.execute({ baseline: baselineStable, current: currentStable });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const c = new PatternDriftConsumerPipelineContract({ now: fixedNow });
      const r1 = c.execute({ baseline: baselineDrift, current: currentDrift });
      const r2 = c.execute({ baseline: baselineDrift, current: currentDrift });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("resultId differs from pipelineHash", () => {
      expect(stableResult.resultId).not.toBe(stableResult.pipelineHash);
    });

    it("pipelineHash differs for different drift inputs", () => {
      expect(stableResult.pipelineHash).not.toBe(driftingResult.pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("STABLE: query contains class:STABLE", () => {
      expect(stableResult.consumerPackage.query).toContain("class:STABLE");
    });

    it("DRIFTING: query contains class:DRIFTING", () => {
      expect(driftingResult.consumerPackage.query).toContain("class:DRIFTING");
    });

    it("CRITICAL_DRIFT: query contains class:CRITICAL_DRIFT", () => {
      expect(criticalResult.consumerPackage.query).toContain("class:CRITICAL_DRIFT");
    });

    it("query contains baseline modelId", () => {
      expect(stableResult.consumerPackage.query).toContain("m-baseline-stable");
    });

    it("query contains current modelId", () => {
      expect(stableResult.consumerPackage.query).toContain("m-current-stable");
    });

    it("query contains pattern-drift prefix", () => {
      expect(stableResult.consumerPackage.query).toMatch(/^pattern-drift:/);
    });

    it("query length <= 120 characters", () => {
      expect(stableResult.consumerPackage.query.length).toBeLessThanOrEqual(120);
      expect(driftingResult.consumerPackage.query.length).toBeLessThanOrEqual(120);
      expect(criticalResult.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("contextId = driftResult.driftId", () => {
      expect(stableResult.consumerPackage.contextId).toBe(stableResult.driftResult.driftId);
    });
  });

  describe("warning messages", () => {
    it("STABLE produces no warnings", () => {
      expect(stableResult.warnings).toHaveLength(0);
    });

    it("DRIFTING produces 1 warning", () => {
      expect(driftingResult.warnings).toHaveLength(1);
    });

    it("DRIFTING warning contains [pattern-drift]", () => {
      expect(driftingResult.warnings[0]).toContain("[pattern-drift]");
    });

    it("DRIFTING warning text is correct", () => {
      expect(driftingResult.warnings[0]).toBe(
        "[pattern-drift] drift detected — model change requires monitoring",
      );
    });

    it("CRITICAL_DRIFT produces 1 warning", () => {
      expect(criticalResult.warnings).toHaveLength(1);
    });

    it("CRITICAL_DRIFT warning text is correct", () => {
      expect(criticalResult.warnings[0]).toBe(
        "[pattern-drift] critical drift detected — immediate re-evaluation required",
      );
    });
  });

  describe("driftResult propagation", () => {
    it("driftResult.driftClass = STABLE for identical models", () => {
      expect(stableResult.driftResult.driftClass).toBe("STABLE");
    });

    it("driftResult.driftClass = DRIFTING for pattern change", () => {
      expect(driftingResult.driftResult.driftClass).toBe("DRIFTING");
    });

    it("driftResult.driftClass = CRITICAL_DRIFT for health turned CRITICAL", () => {
      expect(criticalResult.driftResult.driftClass).toBe("CRITICAL_DRIFT");
    });

    it("driftResult.driftClass = CRITICAL_DRIFT for confidence drop > 0.3", () => {
      expect(criticalResult2.driftResult.driftClass).toBe("CRITICAL_DRIFT");
    });

    it("driftResult.baselineModelId matches baseline", () => {
      expect(stableResult.driftResult.baselineModelId).toBe("m-baseline-stable");
    });

    it("driftResult.currentModelId matches current", () => {
      expect(stableResult.driftResult.currentModelId).toBe("m-current-stable");
    });

    it("driftResult.patternChanged = true for DRIFTING", () => {
      expect(driftingResult.driftResult.patternChanged).toBe(true);
    });

    it("driftResult.healthSignalChanged = true for health transition", () => {
      expect(criticalResult.driftResult.healthSignalChanged).toBe(true);
    });
  });
});
