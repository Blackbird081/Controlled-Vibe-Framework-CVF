import { describe, it, expect } from "vitest";
import {
  AsyncExecutionStatusBatchContract,
  createAsyncExecutionStatusBatchContract,
} from "../src/execution.async.status.batch.contract";
import type { AsyncCommandRuntimeTicket } from "../src/execution.async.runtime.contract";

// --- Helpers ---

function makeTicket(
  ticketId: string,
  asyncStatus: AsyncCommandRuntimeTicket["asyncStatus"],
  executedCount = 1,
  failedCount = 0,
): AsyncCommandRuntimeTicket {
  return {
    ticketId,
    issuedAt: "2026-04-05T00:00:00.000Z",
    sourceRuntimeId: `runtime-${ticketId}`,
    sourceGateId: `gate-${ticketId}`,
    asyncStatus,
    recordCount: executedCount + failedCount,
    executedCount,
    failedCount,
    estimatedTimeoutMs: 5000,
    ticketHash: `hash-${ticketId}`,
  };
}

// --- Tests ---

describe("W53-T1 CP1 — AsyncExecutionStatusBatchContract", () => {
  describe("empty batch", () => {
    it("returns dominantStatus NONE for empty input", () => {
      const contract = new AsyncExecutionStatusBatchContract();
      const result = contract.batch([]);
      expect(result.dominantStatus).toBe("NONE");
    });

    it("returns zero counts for empty input", () => {
      const contract = new AsyncExecutionStatusBatchContract();
      const result = contract.batch([]);
      expect(result.totalSummaries).toBe(0);
      expect(result.totalTickets).toBe(0);
      expect(result.totalPending).toBe(0);
      expect(result.totalRunning).toBe(0);
      expect(result.totalCompleted).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.warnedCount).toBe(0);
    });

    it("returns empty summaries array for empty input", () => {
      const contract = new AsyncExecutionStatusBatchContract();
      const result = contract.batch([]);
      expect(result.summaries).toEqual([]);
    });

    it("returns valid batchId and batchHash for empty input", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([]);
      expect(result.batchId).toBeTruthy();
      expect(result.batchHash).toBeTruthy();
      expect(result.batchId).not.toBe(result.batchHash);
    });
  });

  describe("COMPLETED status", () => {
    it("returns COMPLETED when all tickets are COMPLETED", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED"), makeTicket("t2", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("COMPLETED");
    });

    it("returns COMPLETED for multiple inputs all COMPLETED", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED")] },
        { tickets: [makeTicket("t2", "COMPLETED"), makeTicket("t3", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("COMPLETED");
    });
  });

  describe("PENDING status", () => {
    it("returns PENDING when all tickets are PENDING (no failed/running)", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING")] },
      ]);
      expect(result.dominantStatus).toBe("PENDING");
    });

    it("returns PENDING when mix of PENDING and COMPLETED but no FAILED or RUNNING", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING"), makeTicket("t2", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("PENDING");
    });
  });

  describe("RUNNING status", () => {
    it("returns RUNNING when any ticket is RUNNING (no FAILED)", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "RUNNING")] },
      ]);
      expect(result.dominantStatus).toBe("RUNNING");
    });

    it("returns RUNNING when mix of RUNNING, PENDING, COMPLETED but no FAILED", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "RUNNING"), makeTicket("t2", "PENDING"), makeTicket("t3", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("RUNNING");
    });
  });

  describe("FAILED status (dominant)", () => {
    it("returns FAILED when any ticket is FAILED", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "FAILED")] },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });

    it("returns FAILED even when mix with RUNNING, PENDING, COMPLETED", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "RUNNING"), makeTicket("t2", "FAILED"), makeTicket("t3", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });

    it("FAILED dominates RUNNING across multiple inputs", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "RUNNING")] },
        { tickets: [makeTicket("t2", "FAILED")] },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });
  });

  describe("aggregate counts (multi-input)", () => {
    it("aggregates totalSummaries = number of inputs", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING")] },
        { tickets: [makeTicket("t2", "COMPLETED")] },
        { tickets: [makeTicket("t3", "RUNNING")] },
      ]);
      expect(result.totalSummaries).toBe(3);
    });

    it("aggregates totalTickets across all inputs", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING"), makeTicket("t2", "PENDING")] },
        { tickets: [makeTicket("t3", "COMPLETED")] },
      ]);
      expect(result.totalTickets).toBe(3);
    });

    it("aggregates totalPending, totalRunning, totalCompleted, totalFailed", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING"), makeTicket("t2", "RUNNING")] },
        { tickets: [makeTicket("t3", "COMPLETED"), makeTicket("t4", "FAILED")] },
      ]);
      expect(result.totalPending).toBe(1);
      expect(result.totalRunning).toBe(1);
      expect(result.totalCompleted).toBe(1);
      expect(result.totalFailed).toBe(1);
    });

    it("warnedCount = summaries with failedCount > 0", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED")] },
        { tickets: [makeTicket("t2", "FAILED")] },
        { tickets: [makeTicket("t3", "FAILED"), makeTicket("t4", "PENDING")] },
      ]);
      expect(result.warnedCount).toBe(2);
    });

    it("warnedCount = 0 when no summaries have failed tickets", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED")] },
        { tickets: [makeTicket("t2", "PENDING")] },
      ]);
      expect(result.warnedCount).toBe(0);
    });

    it("produces one summary per input", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING")] },
        { tickets: [makeTicket("t2", "COMPLETED")] },
      ]);
      expect(result.summaries).toHaveLength(2);
    });

    it("each summary has a non-empty summaryId and summaryHash", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "PENDING")] },
      ]);
      expect(result.summaries[0].summaryId).toBeTruthy();
      expect(result.summaries[0].summaryHash).toBeTruthy();
    });
  });

  describe("determinism", () => {
    it("produces identical batchHash for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new AsyncExecutionStatusBatchContract({ now: () => ts });
      const input = [{ tickets: [makeTicket("t1", "PENDING")] }];
      const r1 = contract.batch(input);
      const r2 = contract.batch(input);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces identical batchId for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new AsyncExecutionStatusBatchContract({ now: () => ts });
      const input = [{ tickets: [makeTicket("t1", "PENDING")] }];
      const r1 = contract.batch(input);
      const r2 = contract.batch(input);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("batchId !== batchHash", () => {
      const contract = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED")] },
      ]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("different timestamps produce different batchHash", () => {
      const c1 = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const c2 = new AsyncExecutionStatusBatchContract({ now: () => "2026-04-05T01:00:00.000Z" });
      const input = [{ tickets: [makeTicket("t1", "COMPLETED")] }];
      expect(c1.batch(input).batchHash).not.toBe(c2.batch(input).batchHash);
    });
  });

  describe("factory", () => {
    it("creates AsyncExecutionStatusBatchContract via factory function", () => {
      const contract = createAsyncExecutionStatusBatchContract();
      expect(contract).toBeInstanceOf(AsyncExecutionStatusBatchContract);
    });

    it("factory-created contract produces valid batch result", () => {
      const contract = createAsyncExecutionStatusBatchContract();
      const result = contract.batch([
        { tickets: [makeTicket("t1", "COMPLETED")] },
      ]);
      expect(result.dominantStatus).toBe("COMPLETED");
      expect(result.totalSummaries).toBe(1);
    });
  });
});
