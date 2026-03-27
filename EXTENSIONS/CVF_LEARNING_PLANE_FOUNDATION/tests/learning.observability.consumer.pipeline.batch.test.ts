import { describe, it, expect } from "vitest";
import {
  LearningObservabilityConsumerPipelineBatchContract,
  createLearningObservabilityConsumerPipelineBatchContract,
} from "../src/learning.observability.consumer.pipeline.batch.contract";
import type { LearningObservabilityConsumerPipelineResult } from "../src/learning.observability.consumer.pipeline.contract";
import { LearningObservabilityConsumerPipelineContract } from "../src/learning.observability.consumer.pipeline.contract";
import type { LearningStorageLog } from "../src/learning.storage.log.contract";
import type { LearningLoopSummary } from "../src/learning.loop.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-27T18:00:00.000Z";

function makeStorageLog(overrides: Partial<LearningStorageLog> = {}): LearningStorageLog {
  return {
    logId: "test-storage-log-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    totalRecords: 5,
    dominantRecordType: "FEEDBACK_LEDGER",
    summary: "5 record(s) stored. Dominant type: FEEDBACK_LEDGER.",
    logHash: "test-storage-log-hash",
    ...overrides,
  };
}

function makeLoopSummary(overrides: Partial<LearningLoopSummary> = {}): LearningLoopSummary {
  return {
    summaryId: "test-loop-summary-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    totalSignals: 3,
    rejectCount: 1,
    escalateCount: 0,
    retryCount: 0,
    acceptCount: 2,
    dominantFeedbackClass: "REJECT",
    summary: "Learning loop summary: dominant feedback=REJECT.",
    summaryHash: "test-loop-summary-hash",
    ...overrides,
  };
}

function makePipelineResult(
  storageLogOverrides: Partial<LearningStorageLog> = {},
  loopSummaryOverrides: Partial<LearningLoopSummary> = {},
): LearningObservabilityConsumerPipelineResult {
  const contract = new LearningObservabilityConsumerPipelineContract({
    now: () => FIXED_TS,
  });
  return contract.execute({
    storageLog: makeStorageLog(storageLogOverrides),
    loopSummary: makeLoopSummary(loopSummaryOverrides),
  });
}

function makeCriticalResult(): LearningObservabilityConsumerPipelineResult {
  return makePipelineResult({}, { dominantFeedbackClass: "REJECT" });
}

function makeDegradedResult(): LearningObservabilityConsumerPipelineResult {
  return makePipelineResult(
    {},
    { dominantFeedbackClass: "RETRY", rejectCount: 0, retryCount: 1 },
  );
}

function makeHealthyResult(): LearningObservabilityConsumerPipelineResult {
  return makePipelineResult(
    {},
    { dominantFeedbackClass: "ACCEPT", rejectCount: 0, retryCount: 0, acceptCount: 3 },
  );
}

function makeBatchContract() {
  return new LearningObservabilityConsumerPipelineBatchContract({
    now: () => FIXED_TS,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LearningObservabilityConsumerPipelineBatchContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningObservabilityConsumerPipelineBatchContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningObservabilityConsumerPipelineBatchContract({
        now: () => FIXED_TS,
      });
      expect(contract).toBeDefined();
    });
  });

  // ── Empty batch ────────────────────────────────────────────────────────────

  describe("empty batch", () => {
    it("should handle empty results array", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch).toBeDefined();
    });

    it("should have resultCount 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.resultCount).toBe(0);
    });

    it("should have criticalCount 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.criticalCount).toBe(0);
    });

    it("should have degradedCount 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.degradedCount).toBe(0);
    });

    it("should have dominantTokenBudget 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.dominantTokenBudget).toBe(0);
    });
  });

  // ── criticalCount ──────────────────────────────────────────────────────────

  describe("criticalCount", () => {
    it("should count CRITICAL results correctly", () => {
      const batch = makeBatchContract().batch([
        makeCriticalResult(),
        makeCriticalResult(),
        makeHealthyResult(),
      ]);
      expect(batch.criticalCount).toBe(2);
    });

    it("should count 0 CRITICAL results when none are CRITICAL", () => {
      const batch = makeBatchContract().batch([makeHealthyResult()]);
      expect(batch.criticalCount).toBe(0);
    });

    it("should count all as CRITICAL when all are CRITICAL", () => {
      const batch = makeBatchContract().batch([
        makeCriticalResult(),
        makeCriticalResult(),
      ]);
      expect(batch.criticalCount).toBe(2);
    });
  });

  // ── degradedCount ──────────────────────────────────────────────────────────

  describe("degradedCount", () => {
    it("should count DEGRADED results correctly", () => {
      const batch = makeBatchContract().batch([
        makeDegradedResult(),
        makeHealthyResult(),
        makeDegradedResult(),
      ]);
      expect(batch.degradedCount).toBe(2);
    });

    it("should count 0 DEGRADED results when none are DEGRADED", () => {
      const batch = makeBatchContract().batch([makeCriticalResult()]);
      expect(batch.degradedCount).toBe(0);
    });

    it("should count CRITICAL and DEGRADED independently", () => {
      const batch = makeBatchContract().batch([
        makeCriticalResult(),
        makeDegradedResult(),
        makeHealthyResult(),
      ]);
      expect(batch.criticalCount).toBe(1);
      expect(batch.degradedCount).toBe(1);
    });
  });

  // ── dominantTokenBudget ────────────────────────────────────────────────────

  describe("dominantTokenBudget", () => {
    it("should return 0 for empty batch", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.dominantTokenBudget).toBe(0);
    });

    it("should return a non-negative value for non-empty batch", () => {
      const batch = makeBatchContract().batch([makeCriticalResult()]);
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce same batchHash for identical inputs", () => {
      const results = [makeCriticalResult(), makeHealthyResult()];
      const b1 = makeBatchContract().batch(results);
      const b2 = makeBatchContract().batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("should produce same batchId for identical inputs", () => {
      const results = [makeCriticalResult()];
      const b1 = makeBatchContract().batch(results);
      const b2 = makeBatchContract().batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchId should differ from batchHash", () => {
      const batch = makeBatchContract().batch([makeCriticalResult()]);
      expect(batch.batchId).not.toBe(batch.batchHash);
    });

    it("should produce different batchHash for different result sets", () => {
      const b1 = makeBatchContract().batch([makeCriticalResult()]);
      const b2 = makeBatchContract().batch([makeHealthyResult()]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("empty batch should have a non-empty batchHash", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchHash).toBeTruthy();
    });

    it("empty batch should have a non-empty batchId", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.batchId).toBeTruthy();
    });
  });

  // ── General fields ─────────────────────────────────────────────────────────

  describe("general fields", () => {
    it("should have createdAt matching fixed timestamp", () => {
      const batch = makeBatchContract().batch([]);
      expect(batch.createdAt).toBe(FIXED_TS);
    });

    it("should have correct resultCount for single result", () => {
      const batch = makeBatchContract().batch([makeCriticalResult()]);
      expect(batch.resultCount).toBe(1);
    });

    it("should have correct resultCount for multiple results", () => {
      const batch = makeBatchContract().batch([
        makeCriticalResult(),
        makeDegradedResult(),
        makeHealthyResult(),
      ]);
      expect(batch.resultCount).toBe(3);
    });
  });
});
