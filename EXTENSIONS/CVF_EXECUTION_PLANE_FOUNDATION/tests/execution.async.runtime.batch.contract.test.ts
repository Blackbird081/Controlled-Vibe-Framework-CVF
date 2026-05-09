import { describe, it, expect } from "vitest";
import {
  AsyncCommandRuntimeBatchContract,
  createAsyncCommandRuntimeBatchContract,
} from "../src/execution.async.runtime.batch.contract";
import type { CommandRuntimeResult } from "../src/command.runtime.contract";

// --- Helpers ---

function makeRuntimeResult(
  runtimeId: string,
  gateId: string,
  executedCount: number,
  failedCount: number,
  recordCount = executedCount + failedCount,
): CommandRuntimeResult {
  return {
    runtimeId,
    gateId,
    executedAt: "2026-04-05T00:00:00.000Z",
    records: Array.from({ length: recordCount }, (_, i) => ({
      assignmentId: `assign-${runtimeId}-${i}`,
      taskId: `task-${runtimeId}-${i}`,
      gateDecision: "allow" as const,
      status: "EXECUTED" as const,
      executionHash: `hash-${runtimeId}-${i}`,
      notes: "",
    })),
    executedCount,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount,
    runtimeHash: `runtime-hash-${runtimeId}`,
    summary: `Runtime ${runtimeId}: executed=${executedCount} failed=${failedCount}`,
  };
}

// --- Tests ---

describe("W52-T1 CP1 — AsyncCommandRuntimeBatchContract", () => {
  describe("empty batch", () => {
    it("returns dominantStatus NONE for empty input", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.dominantStatus).toBe("NONE");
    });

    it("returns zero counts for empty input", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.totalTickets).toBe(0);
      expect(result.totalExecuted).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.totalRecords).toBe(0);
      expect(result.warnedCount).toBe(0);
    });

    it("returns empty tickets array for empty input", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([]);
      expect(result.tickets).toEqual([]);
    });

    it("returns valid batchId and batchHash for empty input", () => {
      const contract = new AsyncCommandRuntimeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([]);
      expect(result.batchId).toBeTruthy();
      expect(result.batchHash).toBeTruthy();
      expect(result.batchId).not.toBe(result.batchHash);
    });
  });

  describe("FULLY_QUEUED status", () => {
    it("returns FULLY_QUEUED when all tickets have executedCount > 0 and failedCount = 0", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 3, 0) },
      ]);
      expect(result.dominantStatus).toBe("FULLY_QUEUED");
    });

    it("returns FULLY_QUEUED for multiple inputs all executed, none failed", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 5, 0) },
        { runtimeResult: makeRuntimeResult("r3", "g3", 1, 0) },
      ]);
      expect(result.dominantStatus).toBe("FULLY_QUEUED");
    });

    it("returns warnedCount = 0 when no tickets have failures", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 4, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 2, 0) },
      ]);
      expect(result.warnedCount).toBe(0);
    });
  });

  describe("PARTIALLY_QUEUED status", () => {
    it("returns PARTIALLY_QUEUED when some tickets have failures", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 3, 1) },
      ]);
      expect(result.dominantStatus).toBe("PARTIALLY_QUEUED");
    });

    it("returns PARTIALLY_QUEUED when mix of clean and failed inputs", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 5, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 2, 3) },
      ]);
      expect(result.dominantStatus).toBe("PARTIALLY_QUEUED");
    });

    it("returns correct warnedCount for inputs with failures", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 3, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 2, 1) },
        { runtimeResult: makeRuntimeResult("r3", "g3", 0, 2) },
      ]);
      expect(result.warnedCount).toBe(2);
    });
  });

  describe("FAILED status", () => {
    it("returns FAILED when single input has executedCount = 0", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 0, 3) },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });

    it("returns FAILED when all inputs have executedCount = 0", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 0, 2) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 0, 4) },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });

    it("returns FAILED when all tickets have executedCount = 0 and failedCount = 0", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 0, 0) },
      ]);
      expect(result.dominantStatus).toBe("FAILED");
    });
  });

  describe("aggregate counts (multi-input)", () => {
    it("aggregates totalTickets = number of inputs", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 3, 1) },
        { runtimeResult: makeRuntimeResult("r3", "g3", 1, 0) },
      ]);
      expect(result.totalTickets).toBe(3);
    });

    it("aggregates totalExecuted across inputs", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 3, 1) },
      ]);
      expect(result.totalExecuted).toBe(5);
    });

    it("aggregates totalFailed across inputs", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 1) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 3, 2) },
      ]);
      expect(result.totalFailed).toBe(3);
    });

    it("aggregates totalRecords = sum of recordCount across tickets", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 1, 3) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 4, 0, 4) },
      ]);
      expect(result.totalRecords).toBe(7);
    });

    it("issues one ticket per input", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 1, 1) },
      ]);
      expect(result.tickets).toHaveLength(2);
    });

    it("each ticket has asyncStatus PENDING", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 3, 0) },
        { runtimeResult: makeRuntimeResult("r2", "g2", 2, 1) },
      ]);
      for (const ticket of result.tickets) {
        expect(ticket.asyncStatus).toBe("PENDING");
      }
    });

    it("tickets carry sourceRuntimeId from input runtimeResult", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("runtime-abc", "g1", 2, 0) },
      ]);
      expect(result.tickets[0].sourceRuntimeId).toBe("runtime-abc");
    });

    it("tickets carry sourceGateId from input runtimeResult", () => {
      const contract = new AsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "gate-xyz", 2, 0) },
      ]);
      expect(result.tickets[0].sourceGateId).toBe("gate-xyz");
    });
  });

  describe("determinism", () => {
    it("produces identical batchHash for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new AsyncCommandRuntimeBatchContract({ now: () => ts });
      const input = [{ runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) }];
      const r1 = contract.batch(input);
      const r2 = contract.batch(input);
      expect(r1.batchHash).toBe(r2.batchHash);
    });

    it("produces identical batchId for identical inputs", () => {
      const ts = "2026-04-05T00:00:00.000Z";
      const contract = new AsyncCommandRuntimeBatchContract({ now: () => ts });
      const input = [{ runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) }];
      const r1 = contract.batch(input);
      const r2 = contract.batch(input);
      expect(r1.batchId).toBe(r2.batchId);
    });

    it("batchId !== batchHash", () => {
      const contract = new AsyncCommandRuntimeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
      ]);
      expect(result.batchId).not.toBe(result.batchHash);
    });

    it("different timestamps produce different batchHash", () => {
      const c1 = new AsyncCommandRuntimeBatchContract({ now: () => "2026-04-05T00:00:00.000Z" });
      const c2 = new AsyncCommandRuntimeBatchContract({ now: () => "2026-04-05T01:00:00.000Z" });
      const input = [{ runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) }];
      expect(c1.batch(input).batchHash).not.toBe(c2.batch(input).batchHash);
    });
  });

  describe("factory", () => {
    it("creates AsyncCommandRuntimeBatchContract via factory function", () => {
      const contract = createAsyncCommandRuntimeBatchContract();
      expect(contract).toBeInstanceOf(AsyncCommandRuntimeBatchContract);
    });

    it("factory-created contract produces valid batch result", () => {
      const contract = createAsyncCommandRuntimeBatchContract();
      const result = contract.batch([
        { runtimeResult: makeRuntimeResult("r1", "g1", 2, 0) },
      ]);
      expect(result.dominantStatus).toBe("FULLY_QUEUED");
      expect(result.totalTickets).toBe(1);
    });
  });
});
