import { describe, it, expect } from "vitest";
import {
  LearningObservabilityConsumerPipelineContract,
  createLearningObservabilityConsumerPipelineContract,
} from "../src/learning.observability.consumer.pipeline.contract";
import type {
  LearningObservabilityConsumerPipelineRequest,
  LearningObservabilityConsumerPipelineResult,
} from "../src/learning.observability.consumer.pipeline.contract";
import type { LearningStorageLog } from "../src/learning.storage.log.contract";
import type { LearningLoopSummary } from "../src/learning.loop.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-27T17:00:00.000Z";

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
    summary: "Learning loop summary: dominant feedback=REJECT. (reject=1, escalate=0, retry=0, accept=2, total=3)",
    summaryHash: "test-loop-summary-hash",
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<LearningObservabilityConsumerPipelineRequest> = {},
): LearningObservabilityConsumerPipelineRequest {
  return {
    storageLog: makeStorageLog(),
    loopSummary: makeLoopSummary(),
    ...overrides,
  };
}

function makeContract() {
  return new LearningObservabilityConsumerPipelineContract({
    now: () => FIXED_TS,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LearningObservabilityConsumerPipelineContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningObservabilityConsumerPipelineContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningObservabilityConsumerPipelineContract({
        now: () => FIXED_TS,
      });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new LearningObservabilityConsumerPipelineContract({
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

    it("should have a reportResult", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.reportResult).toBeDefined();
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

    it("should produce different resultId for different storageLog", () => {
      const r1 = makeContract().execute(makeRequest());
      const r2 = makeContract().execute(
        makeRequest({ storageLog: makeStorageLog({ logId: "other-log-id", logHash: "other-hash" }) }),
      );
      expect(r1.resultId).not.toBe(r2.resultId);
    });

    it("should produce different resultId for different loopSummary", () => {
      const r1 = makeContract().execute(makeRequest());
      const r2 = makeContract().execute(
        makeRequest({ loopSummary: makeLoopSummary({ summaryId: "other-summary-id", summaryHash: "other-hash" }) }),
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
    it("should contain observabilityHealth in the query", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toContain("CRITICAL");
    });

    it("should contain sourceStorageLogId in the query", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toContain("storage:");
    });

    it("should contain sourceLoopSummaryId in the query", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toContain("loop:");
    });

    it("should have query prefixed with learning-observability", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toMatch(/^learning-observability:/);
    });

    it("should cap query at 120 characters", () => {
      const result = makeContract().execute(
        makeRequest({
          storageLog: makeStorageLog({ logId: "a".repeat(100), logHash: "x".repeat(100) }),
          loopSummary: makeLoopSummary({ summaryId: "b".repeat(100), summaryHash: "y".repeat(100) }),
        }),
      );
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });
  });

  // ── Warning messages ───────────────────────────────────────────────────────

  describe("warning messages", () => {
    it("should add CRITICAL warning for REJECT dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({ loopSummary: makeLoopSummary({ dominantFeedbackClass: "REJECT" }) }),
      );
      expect(result.warnings).toContain(
        "[learning-observability] critical observability health — governed intervention required",
      );
    });

    it("should add CRITICAL warning for ESCALATE dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "ESCALATE",
            rejectCount: 0,
            escalateCount: 1,
          }),
        }),
      );
      expect(result.warnings).toContain(
        "[learning-observability] critical observability health — governed intervention required",
      );
    });

    it("should add DEGRADED warning for RETRY dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "RETRY",
            rejectCount: 0,
            retryCount: 1,
          }),
        }),
      );
      expect(result.warnings).toContain(
        "[learning-observability] degraded observability health — learning loop at risk",
      );
    });

    it("should produce no warnings for ACCEPT dominant feedback (HEALTHY)", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "ACCEPT",
            rejectCount: 0,
            retryCount: 0,
            acceptCount: 3,
          }),
        }),
      );
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for UNKNOWN health (empty storage+loop)", () => {
      const result = makeContract().execute(
        makeRequest({
          storageLog: makeStorageLog({ totalRecords: 0 }),
          loopSummary: makeLoopSummary({ totalSignals: 0, dominantFeedbackClass: "ACCEPT" }),
        }),
      );
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce exactly one warning for CRITICAL health", () => {
      const result = makeContract().execute(
        makeRequest({ loopSummary: makeLoopSummary({ dominantFeedbackClass: "REJECT" }) }),
      );
      expect(result.warnings).toHaveLength(1);
    });

    it("should produce exactly one warning for DEGRADED health", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "RETRY",
            rejectCount: 0,
            retryCount: 1,
          }),
        }),
      );
      expect(result.warnings).toHaveLength(1);
    });
  });

  // ── reportResult propagation ───────────────────────────────────────────────

  describe("reportResult propagation", () => {
    it("should have CRITICAL observabilityHealth for REJECT dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({ loopSummary: makeLoopSummary({ dominantFeedbackClass: "REJECT" }) }),
      );
      expect(result.reportResult.observabilityHealth).toBe("CRITICAL");
    });

    it("should have DEGRADED observabilityHealth for RETRY dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "RETRY",
            rejectCount: 0,
            retryCount: 1,
          }),
        }),
      );
      expect(result.reportResult.observabilityHealth).toBe("DEGRADED");
    });

    it("should have HEALTHY observabilityHealth for ACCEPT dominant feedback", () => {
      const result = makeContract().execute(
        makeRequest({
          loopSummary: makeLoopSummary({
            dominantFeedbackClass: "ACCEPT",
            rejectCount: 0,
            retryCount: 0,
            acceptCount: 3,
          }),
        }),
      );
      expect(result.reportResult.observabilityHealth).toBe("HEALTHY");
    });

    it("should have UNKNOWN observabilityHealth for empty storage and loop", () => {
      const result = makeContract().execute(
        makeRequest({
          storageLog: makeStorageLog({ totalRecords: 0 }),
          loopSummary: makeLoopSummary({ totalSignals: 0, dominantFeedbackClass: "ACCEPT" }),
        }),
      );
      expect(result.reportResult.observabilityHealth).toBe("UNKNOWN");
    });

    it("should have a non-empty reportId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.reportResult.reportId).toBeTruthy();
    });

    it("should have a non-empty reportHash", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.reportResult.reportHash).toBeTruthy();
    });

    it("should have sourceStorageLogId matching the input storageLog logId", () => {
      const storageLog = makeStorageLog({ logId: "my-storage-log-id" });
      const result = makeContract().execute(makeRequest({ storageLog }));
      expect(result.reportResult.sourceStorageLogId).toBe("my-storage-log-id");
    });

    it("should have sourceLoopSummaryId matching the input loopSummary summaryId", () => {
      const loopSummary = makeLoopSummary({ summaryId: "my-loop-summary-id" });
      const result = makeContract().execute(makeRequest({ loopSummary }));
      expect(result.reportResult.sourceLoopSummaryId).toBe("my-loop-summary-id");
    });
  });

  // ── consumerPackage shape ──────────────────────────────────────────────────

  describe("consumerPackage shape", () => {
    it("should have a packageId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.packageId).toBeTruthy();
    });

    it("should have contextId set to reportResult.reportId", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.contextId).toBe(result.reportResult.reportId);
    });

    it("should have a non-empty pipelineHash in the consumerPackage", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.pipelineHash).toBeTruthy();
    });

    it("should have a query matching the learning-observability format", () => {
      const result = makeContract().execute(makeRequest());
      expect(result.consumerPackage.query).toMatch(/^learning-observability:health:/);
    });
  });
});
