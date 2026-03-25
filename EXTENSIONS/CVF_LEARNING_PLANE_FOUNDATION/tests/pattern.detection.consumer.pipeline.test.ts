import {
  PatternDetectionConsumerPipelineContract,
  createPatternDetectionConsumerPipelineContract,
} from "../src/pattern.detection.consumer.pipeline.contract";
import type { FeedbackLedger } from "../src/feedback.ledger.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T17:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildLedger(overrides: Partial<FeedbackLedger> = {}): FeedbackLedger {
  return {
    ledgerId: "ledger-detect-1",
    compiledAt: FIXED_NOW,
    records: [],
    totalRecords: 10,
    acceptCount: 10,
    retryCount: 0,
    escalateCount: 0,
    rejectCount: 0,
    ledgerHash: "hash-ledger-fixture",
    ...overrides,
  };
}

// HEALTHY + ACCEPT: acceptCount=10, no escalate/reject → healthSignal=HEALTHY, dominant=ACCEPT
const healthyLedger = buildLedger({ ledgerId: "l-healthy" });

// DEGRADED + ESCALATE: escalateCount=5, rejectCount=0, badRate=0.5 (>=0.3) → DEGRADED, dominant=ESCALATE
const degradedLedger = buildLedger({
  ledgerId: "l-degraded",
  totalRecords: 10,
  acceptCount: 4,
  retryCount: 1,
  escalateCount: 5,
  rejectCount: 0,
});

// CRITICAL + REJECT: rejectCount=5, rejectRate=0.5 > 0 → CRITICAL, dominant=REJECT
const criticalLedger = buildLedger({
  ledgerId: "l-critical",
  totalRecords: 10,
  acceptCount: 4,
  retryCount: 1,
  escalateCount: 0,
  rejectCount: 5,
});

// EMPTY ledger: totalRecords=0 → dominant=EMPTY, healthSignal=HEALTHY
const emptyLedger = buildLedger({
  ledgerId: "l-empty",
  totalRecords: 0,
  acceptCount: 0,
  retryCount: 0,
  escalateCount: 0,
  rejectCount: 0,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PatternDetectionConsumerPipelineContract", () => {
  const contract = new PatternDetectionConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new PatternDetectionConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createPatternDetectionConsumerPipelineContract({ now: fixedNow });
      expect(c.execute({ ledger: healthyLedger })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ ledger: healthyLedger });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has insightResult", () => {
      expect(result.insightResult).toBeDefined();
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has consumerId field (may be undefined)", () => {
      expect("consumerId" in result).toBe(true);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const r = contract.execute({ ledger: healthyLedger, consumerId: "consumer-abc" });
      expect(r.consumerId).toBe("consumer-abc");
    });

    it("consumerId is undefined when not provided", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const r1 = contract.execute({ ledger: healthyLedger });
      const r2 = contract.execute({ ledger: healthyLedger });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const r1 = contract.execute({ ledger: healthyLedger });
      const r2 = contract.execute({ ledger: healthyLedger });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("resultId differs from pipelineHash", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.resultId).not.toBe(r.pipelineHash);
    });

    it("pipelineHash differs for different ledgers", () => {
      const r1 = contract.execute({ ledger: healthyLedger });
      const r2 = contract.execute({ ledger: criticalLedger });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("query contains dominant pattern for HEALTHY ledger", () => {
      const r = contract.execute({ ledger: healthyLedger });
      const query = r.consumerPackage.query;
      expect(query).toContain("pattern-detection:dominant:ACCEPT");
    });

    it("query contains health signal for HEALTHY ledger", () => {
      const r = contract.execute({ ledger: healthyLedger });
      const query = r.consumerPackage.query;
      expect(query).toContain("health:HEALTHY");
    });

    it("query contains dominant pattern for DEGRADED ledger", () => {
      const r = contract.execute({ ledger: degradedLedger });
      const query = r.consumerPackage.query;
      expect(query).toContain("dominant:ESCALATE");
      expect(query).toContain("health:DEGRADED");
    });

    it("query contains dominant pattern for CRITICAL ledger", () => {
      const r = contract.execute({ ledger: criticalLedger });
      const query = r.consumerPackage.query;
      expect(query).toContain("dominant:REJECT");
      expect(query).toContain("health:CRITICAL");
    });

    it("query is capped at 120 characters", () => {
      const longLedger = buildLedger({ ledgerId: "l-" + "x".repeat(200) });
      const r = contract.execute({ ledger: longLedger });
      const query = r.consumerPackage.query;
      expect(query.length).toBeLessThanOrEqual(120);
    });

    it("contextId equals insightResult.insightId", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.consumerPackage.contextId).toBe(r.insightResult.insightId);
    });
  });

  describe("warning messages", () => {
    it("CRITICAL health signal fires critical warning", () => {
      const r = contract.execute({ ledger: criticalLedger });
      expect(r.warnings).toContain(
        "[pattern-detection] critical health signal — governed intervention required",
      );
    });

    it("DEGRADED health signal fires degraded warning", () => {
      const r = contract.execute({ ledger: degradedLedger });
      expect(r.warnings).toContain(
        "[pattern-detection] degraded health signal — pattern quality at risk",
      );
    });

    it("HEALTHY health signal produces no warnings", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.warnings).toHaveLength(0);
    });

    it("EMPTY ledger (HEALTHY health) produces no warnings", () => {
      const r = contract.execute({ ledger: emptyLedger });
      expect(r.warnings).toHaveLength(0);
    });

    it("CRITICAL does not fire DEGRADED warning", () => {
      const r = contract.execute({ ledger: criticalLedger });
      expect(r.warnings).not.toContain(
        "[pattern-detection] degraded health signal — pattern quality at risk",
      );
    });
  });

  describe("insightResult propagation", () => {
    it("insightResult.healthSignal = HEALTHY for healthy ledger", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.insightResult.healthSignal).toBe("HEALTHY");
    });

    it("insightResult.healthSignal = DEGRADED for degraded ledger", () => {
      const r = contract.execute({ ledger: degradedLedger });
      expect(r.insightResult.healthSignal).toBe("DEGRADED");
    });

    it("insightResult.healthSignal = CRITICAL for critical ledger", () => {
      const r = contract.execute({ ledger: criticalLedger });
      expect(r.insightResult.healthSignal).toBe("CRITICAL");
    });

    it("insightResult.dominantPattern = ACCEPT for healthy ledger", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.insightResult.dominantPattern).toBe("ACCEPT");
    });

    it("insightResult.sourceLedgerId reflects input ledgerId", () => {
      const r = contract.execute({ ledger: healthyLedger });
      expect(r.insightResult.sourceLedgerId).toBe("l-healthy");
    });

    it("insightResult.dominantPattern = EMPTY for empty ledger", () => {
      const r = contract.execute({ ledger: emptyLedger });
      expect(r.insightResult.dominantPattern).toBe("EMPTY");
    });
  });
});
