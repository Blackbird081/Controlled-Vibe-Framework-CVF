import { describe, it, expect } from "vitest";
import {
  ExecutionReintakeBatchContract,
  createExecutionReintakeBatchContract,
} from "../src/execution.reintake.batch.contract";
import type { FeedbackResolutionSummary } from "../src/feedback.resolution.contract";

// --- Helpers ---

let _counter = 0;

function makeSummary(
  urgencyLevel: FeedbackResolutionSummary["urgencyLevel"],
  overrides: Partial<FeedbackResolutionSummary> = {},
): FeedbackResolutionSummary {
  const id = `summary-${++_counter}`;
  return {
    summaryId: id,
    resolvedAt: "2026-04-05T00:00:00.000Z",
    totalDecisions: 3,
    acceptCount: urgencyLevel === "NORMAL" ? 3 : 0,
    retryCount: urgencyLevel === "HIGH" ? 2 : 0,
    escalateCount: urgencyLevel === "CRITICAL" ? 1 : 0,
    rejectCount: urgencyLevel === "CRITICAL" ? 1 : 0,
    urgencyLevel,
    summary: `Summary for ${urgencyLevel}`,
    summaryHash: `hash-${id}`,
    ...overrides,
  };
}

// --- Tests ---

describe("W54-T1 CP1 — ExecutionReintakeBatchContract", () => {
  describe("empty batch", () => {
    it("returns dominantAction NONE for empty input", () => {
      const contract = new ExecutionReintakeBatchContract();
      const result = contract.batch([]);
      expect(result.dominantAction).toBe("NONE");
    });

    it("returns zero counts for empty input", () => {
      const contract = new ExecutionReintakeBatchContract();
      const result = contract.batch([]);
      expect(result.totalRequests).toBe(0);
      expect(result.replanCount).toBe(0);
      expect(result.retryCount).toBe(0);
      expect(result.acceptCount).toBe(0);
      expect(result.warnedCount).toBe(0);
    });

    it("returns empty requests array for empty input", () => {
      const contract = new ExecutionReintakeBatchContract();
      const result = contract.batch([]);
      expect(result.requests).toEqual([]);
    });

    it("returns valid batchId and batchHash for empty input", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([]);
      expect(result.batchId).toBeTruthy();
      expect(result.batchHash).toBeTruthy();
      expect(result.batchId).not.toBe(result.batchHash);
    });
  });

  describe("ACCEPT action (NORMAL urgency)", () => {
    it("returns ACCEPT when all summaries are NORMAL urgency", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("NORMAL") },
      ]);
      expect(result.dominantAction).toBe("ACCEPT");
    });

    it("returns acceptCount = totalRequests when all NORMAL", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("NORMAL") },
      ]);
      expect(result.acceptCount).toBe(2);
      expect(result.warnedCount).toBe(0);
    });
  });

  describe("RETRY action (HIGH urgency)", () => {
    it("returns RETRY when all summaries are HIGH urgency", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("HIGH") },
      ]);
      expect(result.dominantAction).toBe("RETRY");
    });

    it("returns RETRY when mix of HIGH and NORMAL (no CRITICAL)", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("NORMAL") },
      ]);
      expect(result.dominantAction).toBe("RETRY");
    });
  });

  describe("REPLAN action (CRITICAL urgency — dominant)", () => {
    it("returns REPLAN when any summary is CRITICAL urgency", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.dominantAction).toBe("REPLAN");
    });

    it("REPLAN dominates RETRY when mix of CRITICAL and HIGH", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.dominantAction).toBe("REPLAN");
    });

    it("REPLAN dominates across all types", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.dominantAction).toBe("REPLAN");
    });
  });

  describe("aggregate counts (multi-input)", () => {
    it("totalRequests = inputs.length", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.totalRequests).toBe(3);
    });

    it("aggregates replanCount, retryCount, acceptCount separately", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.acceptCount).toBe(1);
      expect(result.retryCount).toBe(1);
      expect(result.replanCount).toBe(1);
    });

    it("warnedCount = replanCount + retryCount", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("HIGH") },
        { summary: makeSummary("CRITICAL") },
      ]);
      expect(result.warnedCount).toBe(2);
    });

    it("warnedCount = 0 when all ACCEPT", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("NORMAL") },
      ]);
      expect(result.warnedCount).toBe(0);
    });

    it("produces one request per input", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
        { summary: makeSummary("HIGH") },
      ]);
      expect(result.requests).toHaveLength(2);
    });

    it("each request has a non-empty reintakeId and reintakeHash", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { summary: makeSummary("NORMAL") },
      ]);
      expect(result.requests[0].reintakeId).toBeTruthy();
      expect(result.requests[0].reintakeHash).toBeTruthy();
    });

    it("reintakeAction maps correctly from urgency (CRITICAL → REPLAN)", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([{ summary: makeSummary("CRITICAL") }]);
      expect(result.requests[0].reintakeAction).toBe("REPLAN");
    });

    it("reintakeAction maps correctly from urgency (HIGH → RETRY)", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([{ summary: makeSummary("HIGH") }]);
      expect(result.requests[0].reintakeAction).toBe("RETRY");
    });

    it("reintakeAction maps correctly from urgency (NORMAL → ACCEPT)", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([{ summary: makeSummary("NORMAL") }]);
      expect(result.requests[0].reintakeAction).toBe("ACCEPT");
    });
  });

  describe("determinism", () => {
    it("produces identical batchHash for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new ExecutionReintakeBatchContract({ now: () => ts });
      const summary = makeSummary("NORMAL");
      const r1 = contract.batch([{ summary }]);
      const r2 = contract.batch([{ summary }]);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces identical batchId for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new ExecutionReintakeBatchContract({ now: () => ts });
      const summary = makeSummary("NORMAL");
      const r1 = contract.batch([{ summary }]);
      const r2 = contract.batch([{ summary }]);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("batchId !== batchHash", () => {
      const contract = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([{ summary: makeSummary("NORMAL") }]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("different timestamps produce different batchHash", () => {
      const c1 = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const c2 = new ExecutionReintakeBatchContract({ now: () => "2026-04-05T01:00:00.000Z" });
      const summary = makeSummary("HIGH");
      expect(c1.batch([{ summary }]).batchHash).not.toBe(c2.batch([{ summary }]).batchHash);
    });
  });

  describe("factory", () => {
    it("creates ExecutionReintakeBatchContract via factory function", () => {
      const contract = createExecutionReintakeBatchContract();
      expect(contract).toBeInstanceOf(ExecutionReintakeBatchContract);
    });

    it("factory-created contract produces valid batch result", () => {
      const contract = createExecutionReintakeBatchContract();
      const result = contract.batch([{ summary: makeSummary("NORMAL") }]);
      expect(result.dominantAction).toBe("ACCEPT");
      expect(result.totalRequests).toBe(1);
    });
  });
});
