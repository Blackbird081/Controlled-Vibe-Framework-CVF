import { describe, it, expect } from "vitest";
import {
  LearningLoopConsumerPipelineContract,
  createLearningLoopConsumerPipelineContract,
} from "../src/learning.loop.consumer.pipeline.contract";
import type {
  LearningLoopConsumerPipelineRequest,
  LearningLoopConsumerPipelineResult,
} from "../src/learning.loop.consumer.pipeline.contract";
import type { GovernanceSignal } from "../src/governance.signal.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-27T18:00:00.000Z";

function makeGovernanceSignal(overrides: Partial<GovernanceSignal> = {}): GovernanceSignal {
  return {
    signalId: "test-signal-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    sourceAssessmentId: "test-assessment-id",
    signalType: "ESCALATE",
    urgency: "critical",
    summary: "Test governance signal",
    signalHash: "test-signal-hash",
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<LearningLoopConsumerPipelineRequest> = {},
): LearningLoopConsumerPipelineRequest {
  return {
    signals: [makeGovernanceSignal()],
    ...overrides,
  };
}

function makeContract() {
  return new LearningLoopConsumerPipelineContract({
    now: () => FIXED_TS,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LearningLoopConsumerPipelineContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningLoopConsumerPipelineContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningLoopConsumerPipelineContract({
        now: () => FIXED_TS,
      });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new LearningLoopConsumerPipelineContract({
        now: () => FIXED_TS,
      });
      const result = contract.execute(makeRequest());
      expect(result.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined result", () => {
      const result = makeContract().execute(makeRequest());
      expect(result).toBeDefined();
    });

    it("should have a non-empty resultId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.resultId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.createdAt).toBe(FIXED_TS);
    });

    it("should have a loopSummary", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.loopSummary).toBeDefined();
    });

    it("should have a consumerPackage", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage).toBeDefined();
    });

    it("should have a non-empty pipelineHash", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.pipelineHash).toBeTruthy();
    });

    it("should have a warnings array", () => {
      const result = makeContract().execute(makeRequest());
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ── consumerId propagation ─────────────────────────────────────────────────

  describe("consumerId propagation", () => {
    it("should propagate consumerId when provided", () => {
      const result = makeContract().execute(makeRequest({ consumerId: "consumer-abc" }));
      expect(result.consumerId).toBe("consumer-abc");
    });

    it("should have undefined consumerId when not provided", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerId).toBeUndefined();
    });

    it("should propagate empty string consumerId", () => {
      const result = makeContract().execute(makeRequest({ consumerId: "" }));
      expect(result.consumerId).toBe("");
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same resultId for identical inputs", () => {
      const r1 = makeContract().execute(makeRequest());
      const r2 = makeContract().execute(makeRequest());
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("should produce different resultId for different signal types", () => {
      const r1 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }));
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "MONITOR" })] }),
      );
      expect(r1.resultId).not.toBe(r2.resultId);
    });

    it("should produce different resultId for different signal count", () => {
      const r1 = makeContract().execute(makeRequest());
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal(), makeGovernanceSignal({ signalId: "signal-2" })] }),
      );
      expect(r1.resultId).not.toBe(r2.resultId);
    });

    it("pipelineHash should differ from resultId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.pipelineHash).not.toBe(result.resultId);
    });

    it("should produce the same pipelineHash for identical inputs", () => {
      const r1 = makeContract().execute(makeRequest());
      const r2 = makeContract().execute(makeRequest());
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
  });

  // ── Query derivation ───────────────────────────────────────────────────────

  describe("query derivation", () => {
    it("should derive query from loopSummary.summary", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toContain("Learning loop summary:");
    });

    it("should contain dominant feedback class in the query", () => {
      const result = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }));
      expect(result.consumerPackage.query).toContain("dominant feedback=REJECT");
    });

    it("should cap query at 120 characters", () => {
      const longSignals = Array.from({ length: 100 }, (_, i) =>
        makeGovernanceSignal({ signalId: `signal-${i}`, signalType: "ESCALATE" }),
      );
      const result = makeContract().execute(makeRequest({ signals: longSignals }));
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("should handle empty signals array", () => {
      const result = makeContract().execute(makeRequest({ signals: [] }));
      expect(result.consumerPackage.query).toContain("no signals re-injected");
    });
  });

  // ── Warning messages ───────────────────────────────────────────────────────

  describe("warning messages", () => {
    it("should add REJECT warning for ESCALATE signal (maps to REJECT)", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }),
      );
      expect(result.warnings).toContain(
        "[learning-loop] dominant feedback class REJECT — critical governance signal re-injection",
      );
    });

    it("should add ESCALATE warning for TRIGGER_REVIEW signal (maps to ESCALATE)", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "TRIGGER_REVIEW" })] }),
      );
      expect(result.warnings).toContain(
        "[learning-loop] dominant feedback class ESCALATE — elevated governance signal re-injection",
      );
    });

    it("should produce no warnings for MONITOR signal (maps to RETRY)", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "MONITOR" })] }),
      );
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for NO_ACTION signal (maps to ACCEPT)", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "NO_ACTION" })] }),
      );
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for empty signals array", () => {
      const result = makeContract().execute(makeRequest({ signals: [] }));
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce exactly one warning for REJECT dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }),
      );
      expect(result.warnings).toHaveLength(1);
    });

    it("should produce exactly one warning for ESCALATE dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "TRIGGER_REVIEW" })] }),
      );
      expect(result.warnings).toHaveLength(1);
    });

    it("should prioritize REJECT warning over ESCALATE when both present", () => {
      const result = makeContract().execute(
        makeRequest({
          signals: [
            makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" }),
            makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" }),
          ],
        }),
      );
      expect(result.warnings).toContain(
        "[learning-loop] dominant feedback class REJECT — critical governance signal re-injection",
      );
      expect(result.warnings).toHaveLength(1);
    });
  });

  // ── loopSummary propagation ────────────────────────────────────────────────

  describe("loopSummary propagation", () => {
    it("should have REJECT dominantFeedbackClass for ESCALATE signal", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }),
      );
      expect(result.loopSummary.dominantFeedbackClass).toBe("REJECT");
    });

    it("should have ESCALATE dominantFeedbackClass for TRIGGER_REVIEW signal", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "TRIGGER_REVIEW" })] }),
      );
      expect(result.loopSummary.dominantFeedbackClass).toBe("ESCALATE");
    });

    it("should have RETRY dominantFeedbackClass for MONITOR signal", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "MONITOR" })] }),
      );
      expect(result.loopSummary.dominantFeedbackClass).toBe("RETRY");
    });

    it("should have ACCEPT dominantFeedbackClass for NO_ACTION signal", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "NO_ACTION" })] }),
      );
      expect(result.loopSummary.dominantFeedbackClass).toBe("ACCEPT");
    });

    it("should have ACCEPT dominantFeedbackClass for empty signals array", () => {
      const result = makeContract().execute(makeRequest({ signals: [] }));
      expect(result.loopSummary.dominantFeedbackClass).toBe("ACCEPT");
    });

    it("should have totalSignals matching input signals length", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1" }),
        makeGovernanceSignal({ signalId: "s2" }),
        makeGovernanceSignal({ signalId: "s3" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.totalSignals).toBe(3);
    });

    it("should have correct rejectCount for ESCALATE signals", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "ESCALATE" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.rejectCount).toBe(2);
    });

    it("should have correct escalateCount for TRIGGER_REVIEW signals", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "TRIGGER_REVIEW" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.escalateCount).toBe(2);
    });

    it("should have correct retryCount for MONITOR signals", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "MONITOR" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "MONITOR" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.retryCount).toBe(2);
    });

    it("should have correct acceptCount for NO_ACTION signals", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "NO_ACTION" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "NO_ACTION" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.acceptCount).toBe(2);
    });

    it("should have a non-empty summaryId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.loopSummary.summaryId).toBeTruthy();
    });

    it("should have a non-empty summaryHash", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.loopSummary.summaryHash).toBeTruthy();
    });

    it("should have a summary string", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.loopSummary.summary).toBeTruthy();
    });
  });

  // ── consumerPackage shape ──────────────────────────────────────────────────

  describe("consumerPackage shape", () => {
    it("should have a packageId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.packageId).toBeTruthy();
    });

    it("should have contextId set to loopSummary.summaryId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.contextId).toBe(result.loopSummary.summaryId);
    });

    it("should have a non-empty pipelineHash in the consumerPackage", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.pipelineHash).toBeTruthy();
    });

    it("should have a query derived from loopSummary.summary", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toContain("Learning loop summary:");
    });
  });

  // ── Mixed signal types ─────────────────────────────────────────────────────

  describe("mixed signal types", () => {
    it("should prioritize REJECT over ESCALATE", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.dominantFeedbackClass).toBe("REJECT");
    });

    it("should prioritize ESCALATE over RETRY", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "TRIGGER_REVIEW" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "MONITOR" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.dominantFeedbackClass).toBe("ESCALATE");
    });

    it("should prioritize RETRY over ACCEPT", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "MONITOR" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "NO_ACTION" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.dominantFeedbackClass).toBe("RETRY");
    });

    it("should have correct counts for mixed signal types", () => {
      const signals = [
        makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" }),
        makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" }),
        makeGovernanceSignal({ signalId: "s3", signalType: "MONITOR" }),
        makeGovernanceSignal({ signalId: "s4", signalType: "NO_ACTION" }),
      ];
      const result = makeContract().execute(makeRequest({ signals }));
      expect(result.loopSummary.rejectCount).toBe(1);
      expect(result.loopSummary.escalateCount).toBe(1);
      expect(result.loopSummary.retryCount).toBe(1);
      expect(result.loopSummary.acceptCount).toBe(1);
      expect(result.loopSummary.totalSignals).toBe(4);
    });
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// BATCH CONTRACT TESTS (W4-T14 CP2 — Fast Lane GC-021)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  LearningLoopConsumerPipelineBatchContract,
  createLearningLoopConsumerPipelineBatchContract,
} from "../src/learning.loop.consumer.pipeline.batch.contract";
import type { LearningLoopConsumerPipelineBatch } from "../src/learning.loop.consumer.pipeline.batch.contract";

function makeBatchContract() {
  return new LearningLoopConsumerPipelineBatchContract({
    now: () => FIXED_TS,
  });
}

describe("LearningLoopConsumerPipelineBatchContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningLoopConsumerPipelineBatchContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningLoopConsumerPipelineBatchContract({
        now: () => FIXED_TS,
      });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new LearningLoopConsumerPipelineBatchContract({
        now: () => FIXED_TS,
      });
      const batch = contract.batch([]);
      expect(batch.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch).toBeDefined();
    });

    it("should have a non-empty batchId", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.createdAt).toBe(FIXED_TS);
    });

    it("should have resultCount", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.resultCount).toBe(0);
    });

    it("should have rejectCount", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.rejectCount).toBe(0);
    });

    it("should have escalateCount", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.escalateCount).toBe(0);
    });

    it("should have retryCount", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.retryCount).toBe(0);
    });

    it("should have acceptCount", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.acceptCount).toBe(0);
    });

    it("should have dominantTokenBudget", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.dominantTokenBudget).toBe(0);
    });

    it("should have a non-empty batchHash", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchHash).toBeTruthy();
    });
  });

  // ── Empty batch ────────────────────────────────────────────────────────────

  describe("empty batch", () => {
    it("should have resultCount 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.resultCount).toBe(0);
    });

    it("should have dominantTokenBudget 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.dominantTokenBudget).toBe(0);
    });

    it("should have all feedback counts 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.rejectCount).toBe(0);
      expect(batch.escalateCount).toBe(0);
      expect(batch.retryCount).toBe(0);
      expect(batch.acceptCount).toBe(0);
    });

    it("should have a valid batchHash for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchHash).toBeTruthy();
    });
  });

  // ── Single result ──────────────────────────────────────────────────────────

  describe("single result", () => {
    it("should have resultCount 1 for single result", () => {
      const result = makeContract().execute(makeRequest());
      const batch = makeBatchContract().batch([result]);
      expect(batch.resultCount).toBe(1);
    });

    it("should aggregate feedback counts from single result", () => {
      const result = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }),
      );
      const batch = makeBatchContract().batch([result]);
      expect(batch.rejectCount).toBe(1);
      expect(batch.escalateCount).toBe(0);
      expect(batch.retryCount).toBe(0);
      expect(batch.acceptCount).toBe(0);
    });

    it("should set dominantTokenBudget from single result", () => {
      const result = makeContract().execute(makeRequest());
      const batch = makeBatchContract().batch([result]);
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Multiple results ───────────────────────────────────────────────────────

  describe("multiple results", () => {
    it("should have correct resultCount for multiple results", () => {
      const r1 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1" })] }));
      const r2 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2" })] }));
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.resultCount).toBe(2);
    });

    it("should aggregate rejectCount across multiple results", () => {
      const r1 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" })] }),
      );
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2", signalType: "ESCALATE" })] }),
      );
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.rejectCount).toBe(2);
    });

    it("should aggregate escalateCount across multiple results", () => {
      const r1 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1", signalType: "TRIGGER_REVIEW" })] }),
      );
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" })] }),
      );
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.escalateCount).toBe(2);
    });

    it("should aggregate retryCount across multiple results", () => {
      const r1 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1", signalType: "MONITOR" })] }),
      );
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2", signalType: "MONITOR" })] }),
      );
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.retryCount).toBe(2);
    });

    it("should aggregate acceptCount across multiple results", () => {
      const r1 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1", signalType: "NO_ACTION" })] }),
      );
      const r2 = makeContract().execute(
        makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2", signalType: "NO_ACTION" })] }),
      );
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.acceptCount).toBe(2);
    });

    it("should aggregate mixed feedback counts correctly", () => {
      const r1 = makeContract().execute(
        makeRequest({
          signals: [
            makeGovernanceSignal({ signalId: "s1", signalType: "ESCALATE" }),
            makeGovernanceSignal({ signalId: "s2", signalType: "TRIGGER_REVIEW" }),
          ],
        }),
      );
      const r2 = makeContract().execute(
        makeRequest({
          signals: [
            makeGovernanceSignal({ signalId: "s3", signalType: "MONITOR" }),
            makeGovernanceSignal({ signalId: "s4", signalType: "NO_ACTION" }),
          ],
        }),
      );
      const batch = makeBatchContract().batch([r1, r2]);
      expect(batch.rejectCount).toBe(1);
      expect(batch.escalateCount).toBe(1);
      expect(batch.retryCount).toBe(1);
      expect(batch.acceptCount).toBe(1);
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same batchId for identical inputs", () => {
      const r1 = makeContract().execute(makeRequest());
      const b1 = makeBatchContract().batch([r1]);
      const b2 = makeBatchContract().batch([r1]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("should produce different batchId for different results", () => {
      const r1 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalType: "ESCALATE" })] }));
      const r2 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalType: "MONITOR" })] }));
      const b1 = makeBatchContract().batch([r1]);
      const b2 = makeBatchContract().batch([r2]);
      expect(b1.batchId).not.toBe(b2.batchId);
    });

    it("batchId should differ from batchHash", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchId).not.toBe(batch.batchHash);
    });

    it("should produce the same batchHash for identical inputs", () => {
      const r1 = makeContract().execute(makeRequest());
      const b1 = makeBatchContract().batch([r1]);
      const b2 = makeBatchContract().batch([r1]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });
  });

  // ── dominantTokenBudget derivation ─────────────────────────────────────────

  describe("dominantTokenBudget derivation", () => {
    it("should be 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.dominantTokenBudget).toBe(0);
    });

    it("should be non-negative for single result", () => {
      const result = makeContract().execute(makeRequest());
      const batch = makeBatchContract().batch([result]);
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });

    it("should be the max estimatedTokens across multiple results", () => {
      const r1 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalId: "s1" })] }));
      const r2 = makeContract().execute(makeRequest({ signals: [makeGovernanceSignal({ signalId: "s2" })] }));
      const batch = makeBatchContract().batch([r1, r2]);
      const tokens1 = r1.consumerPackage.typedContextPackage?.estimatedTokens ?? 0;
      const tokens2 = r2.consumerPackage.typedContextPackage?.estimatedTokens ?? 0;
      expect(batch.dominantTokenBudget).toBe(Math.max(tokens1, tokens2));
    });
  });
});
