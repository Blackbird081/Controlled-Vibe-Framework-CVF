import { describe, it, expect } from "vitest";
import {
  PatternDriftLogConsumerPipelineContract,
  createPatternDriftLogConsumerPipelineContract,
} from "../src/pattern.drift.log.consumer.pipeline.contract";
import type { PatternDriftSignal } from "../src/pattern.drift.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test signal
function makeSignal(overrides: Partial<PatternDriftSignal> = {}): PatternDriftSignal {
  return {
    signalId: overrides.signalId ?? "sig-1",
    detectedAt: overrides.detectedAt ?? FIXED_NOW,
    driftClass: overrides.driftClass ?? "STABLE",
    driftMagnitude: overrides.driftMagnitude ?? 0.1,
    affectedPatterns: overrides.affectedPatterns ?? [],
    signalHash: overrides.signalHash ?? "hash-1",
  };
}

const stableSignal = makeSignal({ signalId: "sig-stable", driftClass: "STABLE" });
const driftingSignal = makeSignal({ signalId: "sig-drifting", driftClass: "DRIFTING" });
const criticalSignal = makeSignal({ signalId: "sig-critical", driftClass: "CRITICAL_DRIFT" });

describe("PatternDriftLogConsumerPipelineContract", () => {
  const contract = new PatternDriftLogConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDriftLogConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDriftLogConsumerPipelineContract();
      expect(c.execute({ signals: [stableSignal] })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ signals: [stableSignal] });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has log", () => {
      expect(result.log).toBeDefined();
      expect(result.log.totalSignals).toBeGreaterThanOrEqual(0);
    });

    it("has dominantDriftClass", () => {
      expect(result.dominantDriftClass).toBeDefined();
      expect(["STABLE", "DRIFTING", "CRITICAL_DRIFT"]).toContain(result.dominantDriftClass);
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
      const result = contract.execute({ signals: [stableSignal], consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ signals: [stableSignal] });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ signals: [stableSignal] });
      const r2 = contract.execute({ signals: [stableSignal] });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ signals: [stableSignal] });
      const r2 = contract.execute({ signals: [stableSignal] });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different signals", () => {
      const r1 = contract.execute({ signals: [stableSignal] });
      const r2 = contract.execute({ signals: [driftingSignal] });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new PatternDriftLogConsumerPipelineContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new PatternDriftLogConsumerPipelineContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.execute({ signals: [stableSignal] }).pipelineHash).not.toBe(
        c2.execute({ signals: [stableSignal] }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains totalSignals", () => {
      const result = contract.execute({ signals: [stableSignal, driftingSignal] });
      expect(result.consumerPackage.query).toContain("2 signals");
    });

    it("query contains dominantDriftClass", () => {
      const result = contract.execute({ signals: [stableSignal] });
      expect(result.consumerPackage.query).toContain("drift=STABLE");
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ signals: [stableSignal] });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different drift class", () => {
      const r1 = contract.execute({ signals: [stableSignal] });
      const r2 = contract.execute({ signals: [criticalSignal] });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals log.logId", () => {
      const result = contract.execute({ signals: [stableSignal] });
      expect(result.consumerPackage.contextId).toBe(result.log.logId);
    });

    it("contextId differs for different signals", () => {
      const r1 = contract.execute({ signals: [stableSignal] });
      const r2 = contract.execute({ signals: [driftingSignal] });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for non-empty signals", () => {
      expect(contract.execute({ signals: [stableSignal] }).warnings).toHaveLength(0);
    });

    it("WARNING_NO_SIGNALS for empty signals array", () => {
      const result = contract.execute({ signals: [] });
      expect(result.warnings).toContain(
        "[pattern-drift-log] no signals — log contains zero drift signals",
      );
    });
  });

  describe("dominantDriftClass propagation", () => {
    it("dominantDriftClass is STABLE for all stable signals", () => {
      const result = contract.execute({ signals: [stableSignal, stableSignal] });
      expect(result.dominantDriftClass).toBe("STABLE");
    });

    it("dominantDriftClass is DRIFTING when drifting signals present", () => {
      const result = contract.execute({ signals: [stableSignal, driftingSignal] });
      expect(result.dominantDriftClass).toBe("DRIFTING");
    });

    it("dominantDriftClass is CRITICAL_DRIFT when critical signals present", () => {
      const result = contract.execute({ signals: [stableSignal, driftingSignal, criticalSignal] });
      expect(result.dominantDriftClass).toBe("CRITICAL_DRIFT");
    });

    it("dominantDriftClass matches log.dominantDriftClass", () => {
      const result = contract.execute({ signals: [driftingSignal] });
      expect(result.dominantDriftClass).toBe(result.log.dominantDriftClass);
    });
  });

  describe("log propagation", () => {
    it("log.totalSignals matches signals length", () => {
      const result = contract.execute({ signals: [stableSignal, driftingSignal, criticalSignal] });
      expect(result.log.totalSignals).toBe(3);
    });

    it("log.stableCount is correct", () => {
      const result = contract.execute({ signals: [stableSignal, stableSignal, driftingSignal] });
      expect(result.log.stableCount).toBe(2);
    });

    it("log.driftingCount is correct", () => {
      const result = contract.execute({ signals: [stableSignal, driftingSignal, driftingSignal] });
      expect(result.log.driftingCount).toBe(2);
    });

    it("log.criticalDriftCount is correct", () => {
      const result = contract.execute({ signals: [criticalSignal, criticalSignal] });
      expect(result.log.criticalDriftCount).toBe(2);
    });
  });
});

// ─── Batch Contract Tests ─────────────────────────────────────────────────────

import {
  PatternDriftLogConsumerPipelineBatchContract,
  createPatternDriftLogConsumerPipelineBatchContract,
} from "../src/pattern.drift.log.consumer.pipeline.batch.contract";

const NOW_2 = "2026-03-27T12:00:00.000Z";
const batchContract = new PatternDriftLogConsumerPipelineBatchContract({ now: () => NOW_2 });
const contract = new PatternDriftLogConsumerPipelineContract({ now: () => FIXED_NOW });

// Helper: create test result
function makeResult(signals: PatternDriftSignal[]): any {
  return contract.execute({ signals });
}

const stableResult = makeResult([stableSignal]);
const driftingResult = makeResult([driftingSignal]);
const criticalResult = makeResult([criticalSignal]);

describe("PatternDriftLogConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDriftLogConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDriftLogConsumerPipelineBatchContract();
      expect(c.batch([stableResult])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([stableResult, driftingResult]);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(batch.createdAt).toBe(NOW_2);
    });

    it("has totalLogs", () => {
      expect(batch.totalLogs).toBe(2);
    });

    it("has totalSignals", () => {
      expect(batch.totalSignals).toBeGreaterThanOrEqual(0);
    });

    it("has overallDominantDriftClass", () => {
      expect(batch.overallDominantDriftClass).toBeDefined();
      expect(["STABLE", "DRIFTING", "CRITICAL_DRIFT"]).toContain(batch.overallDominantDriftClass);
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results.length).toBe(2);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId is distinct from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchId is deterministic for same inputs", () => {
      const b1 = batchContract.batch([stableResult]);
      const b2 = batchContract.batch([stableResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([stableResult]);
      const b2 = batchContract.batch([driftingResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new PatternDriftLogConsumerPipelineBatchContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new PatternDriftLogConsumerPipelineBatchContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.batch([stableResult]).batchHash).not.toBe(c2.batch([stableResult]).batchHash);
    });
  });

  describe("totalLogs", () => {
    it("equals results length", () => {
      expect(batchContract.batch([stableResult, driftingResult, criticalResult]).totalLogs).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalLogs).toBe(0);
    });
  });

  describe("totalSignals", () => {
    it("sums totalSignals across all logs", () => {
      const r1 = makeResult([stableSignal, stableSignal]);
      const r2 = makeResult([driftingSignal]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalSignals).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalSignals).toBe(0);
    });
  });

  describe("overallDominantDriftClass", () => {
    it("is STABLE for all stable results", () => {
      const batch = batchContract.batch([stableResult, stableResult]);
      expect(batch.overallDominantDriftClass).toBe("STABLE");
    });

    it("is DRIFTING when drifting results present", () => {
      const batch = batchContract.batch([stableResult, driftingResult]);
      expect(batch.overallDominantDriftClass).toBe("DRIFTING");
    });

    it("is CRITICAL_DRIFT when critical results present", () => {
      const batch = batchContract.batch([stableResult, driftingResult, criticalResult]);
      expect(batch.overallDominantDriftClass).toBe("CRITICAL_DRIFT");
    });

    it("prioritizes CRITICAL_DRIFT over DRIFTING", () => {
      const batch = batchContract.batch([driftingResult, criticalResult]);
      expect(batch.overallDominantDriftClass).toBe("CRITICAL_DRIFT");
    });

    it("prioritizes DRIFTING over STABLE", () => {
      const batch = batchContract.batch([stableResult, driftingResult]);
      expect(batch.overallDominantDriftClass).toBe("DRIFTING");
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const batch = batchContract.batch([stableResult, driftingResult]);
      const expected = Math.max(
        stableResult.consumerPackage.typedContextPackage.estimatedTokens,
        driftingResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batch.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const batch = batchContract.batch([stableResult]);
      expect(batch.dominantTokenBudget).toBe(stableResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalLogs equals results length", () => {
      expect(batchContract.batch([stableResult, driftingResult, criticalResult]).totalLogs).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([stableResult]).createdAt).toBe(NOW_2);
    });
  });
});
