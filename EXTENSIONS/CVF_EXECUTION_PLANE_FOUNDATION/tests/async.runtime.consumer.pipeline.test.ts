import { describe, it, expect } from "vitest";
import {
  AsyncRuntimeConsumerPipelineContract,
  createAsyncRuntimeConsumerPipelineContract,
} from "../src/async.runtime.consumer.pipeline.contract";
import {
  AsyncRuntimeConsumerPipelineBatchContract,
  createAsyncRuntimeConsumerPipelineBatchContract,
} from "../src/async.runtime.consumer.pipeline.batch.contract";
import type { AsyncCommandRuntimeTicket, AsyncExecutionStatus } from "../src/execution.async.runtime.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test async ticket
function makeAsyncTicket(options: {
  asyncStatus?: AsyncExecutionStatus;
  executedCount?: number;
  failedCount?: number;
  estimatedTimeoutMs?: number;
  ticketId?: string;
} = {}): AsyncCommandRuntimeTicket {
  const {
    asyncStatus = "PENDING",
    executedCount = 5,
    failedCount = 0,
    estimatedTimeoutMs = 5000,
    ticketId = "ticket-123",
  } = options;

  return {
    ticketId,
    issuedAt: FIXED_NOW,
    sourceRuntimeId: "runtime-456",
    sourceGateId: "gate-789",
    asyncStatus,
    recordCount: executedCount + failedCount,
    executedCount,
    failedCount,
    estimatedTimeoutMs,
    ticketHash: "ticket-hash-123",
  };
}

const pendingTicket = makeAsyncTicket({ asyncStatus: "PENDING", executedCount: 0 });
const runningTicket = makeAsyncTicket({ asyncStatus: "RUNNING", executedCount: 3 });
const completedTicket = makeAsyncTicket({ asyncStatus: "COMPLETED", executedCount: 10 });
const failedTicket = makeAsyncTicket({ asyncStatus: "FAILED", executedCount: 2, failedCount: 3 });
const longTimeoutTicket = makeAsyncTicket({ estimatedTimeoutMs: 45000 });

describe("AsyncRuntimeConsumerPipelineContract", () => {
  const contract = new AsyncRuntimeConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new AsyncRuntimeConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createAsyncRuntimeConsumerPipelineContract();
      expect(c.execute({ asyncTicket: pendingTicket })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ asyncTicket: pendingTicket });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has asyncTicket", () => {
      expect(result.asyncTicket).toBeDefined();
      expect(result.asyncTicket).toBe(pendingTicket);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("AsyncRuntime:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(pendingTicket.ticketId);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ asyncTicket: pendingTicket, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ asyncTicket: pendingTicket });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with pending status", () => {
      const result = contract.execute({ asyncTicket: pendingTicket });
      expect(result.query).toBe("AsyncRuntime: status=PENDING, executed=0, timeout=5000ms");
    });

    it("derives query with running status", () => {
      const result = contract.execute({ asyncTicket: runningTicket });
      expect(result.query).toBe("AsyncRuntime: status=RUNNING, executed=3, timeout=5000ms");
    });

    it("derives query with completed status", () => {
      const result = contract.execute({ asyncTicket: completedTicket });
      expect(result.query).toBe("AsyncRuntime: status=COMPLETED, executed=10, timeout=5000ms");
    });

    it("derives query with failed status", () => {
      const result = contract.execute({ asyncTicket: failedTicket });
      expect(result.query).toBe("AsyncRuntime: status=FAILED, executed=2, timeout=5000ms");
    });

    it("derives query with long timeout", () => {
      const result = contract.execute({ asyncTicket: longTimeoutTicket });
      expect(result.query).toContain("timeout=45000ms");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from ticketId", () => {
      const ticket = makeAsyncTicket({ ticketId: "ticket-xyz-789" });
      const result = contract.execute({ asyncTicket: ticket });
      expect(result.contextId).toBe("ticket-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_FAILED_STATUS when status is FAILED", () => {
      const result = contract.execute({ asyncTicket: failedTicket });
      expect(result.warnings).toContain("WARNING_FAILED_STATUS");
    });

    it("does not emit WARNING_FAILED_STATUS when status is not FAILED", () => {
      const result = contract.execute({ asyncTicket: completedTicket });
      expect(result.warnings).not.toContain("WARNING_FAILED_STATUS");
    });

    it("emits WARNING_LONG_TIMEOUT when timeout > 30000ms", () => {
      const result = contract.execute({ asyncTicket: longTimeoutTicket });
      expect(result.warnings).toContain("WARNING_LONG_TIMEOUT");
    });

    it("does not emit WARNING_LONG_TIMEOUT when timeout <= 30000ms", () => {
      const result = contract.execute({ asyncTicket: completedTicket });
      expect(result.warnings).not.toContain("WARNING_LONG_TIMEOUT");
    });

    it("emits WARNING_NO_EXECUTION when executedCount is 0", () => {
      const result = contract.execute({ asyncTicket: pendingTicket });
      expect(result.warnings).toContain("WARNING_NO_EXECUTION");
    });

    it("does not emit WARNING_NO_EXECUTION when executedCount > 0", () => {
      const result = contract.execute({ asyncTicket: completedTicket });
      expect(result.warnings).not.toContain("WARNING_NO_EXECUTION");
    });

    it("emits no warnings for normal completed ticket", () => {
      const result = contract.execute({ asyncTicket: completedTicket });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits multiple warnings when applicable", () => {
      const ticket = makeAsyncTicket({ asyncStatus: "FAILED", executedCount: 0, estimatedTimeoutMs: 45000 });
      const result = contract.execute({ asyncTicket: ticket });
      expect(result.warnings).toContain("WARNING_FAILED_STATUS");
      expect(result.warnings).toContain("WARNING_LONG_TIMEOUT");
      expect(result.warnings).toContain("WARNING_NO_EXECUTION");
      expect(result.warnings).toHaveLength(3);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ asyncTicket: pendingTicket });
      const r2 = contract.execute({ asyncTicket: pendingTicket });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ asyncTicket: pendingTicket });
      const r2 = contract.execute({ asyncTicket: pendingTicket });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("AsyncRuntimeConsumerPipelineBatchContract", () => {
  const pipelineContract = new AsyncRuntimeConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new AsyncRuntimeConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(status: AsyncExecutionStatus, executedCount: number, failedCount: number) {
    const ticket = makeAsyncTicket({ asyncStatus: status, executedCount, failedCount });
    return pipelineContract.execute({ asyncTicket: ticket });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new AsyncRuntimeConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createAsyncRuntimeConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult("COMPLETED", 10, 0)];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalTickets", () => {
      expect(typeof batch.totalTickets).toBe("number");
    });

    it("has dominantStatus", () => {
      expect(typeof batch.dominantStatus).toBe("string");
      expect(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).toContain(batch.dominantStatus);
    });

    it("has totalExecutedCount", () => {
      expect(typeof batch.totalExecutedCount).toBe("number");
    });

    it("has totalFailedCount", () => {
      expect(typeof batch.totalFailedCount).toBe("number");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalTickets correctly", () => {
      const results = [makeResult("COMPLETED", 10, 0), makeResult("RUNNING", 5, 0), makeResult("PENDING", 0, 0)];
      const batch = batchContract.batch(results);
      expect(batch.totalTickets).toBe(3);
    });

    it("calculates totalExecutedCount correctly", () => {
      const results = [makeResult("COMPLETED", 10, 0), makeResult("RUNNING", 5, 0), makeResult("PENDING", 0, 0)];
      const batch = batchContract.batch(results);
      expect(batch.totalExecutedCount).toBe(15);
    });

    it("calculates totalFailedCount correctly", () => {
      const results = [makeResult("FAILED", 2, 3), makeResult("COMPLETED", 10, 1), makeResult("RUNNING", 5, 2)];
      const batch = batchContract.batch(results);
      expect(batch.totalFailedCount).toBe(6);
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult("COMPLETED", 10, 0), makeResult("RUNNING", 5, 0)];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalTickets).toBe(0);
      expect(batch.totalExecutedCount).toBe(0);
      expect(batch.totalFailedCount).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.dominantStatus).toBe("PENDING");
    });
  });

  describe("dominant status calculation", () => {
    it("selects COMPLETED as dominant when most frequent", () => {
      const results = [
        makeResult("COMPLETED", 10, 0),
        makeResult("COMPLETED", 8, 0),
        makeResult("RUNNING", 5, 0),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("COMPLETED");
    });

    it("selects RUNNING as dominant when most frequent", () => {
      const results = [
        makeResult("RUNNING", 5, 0),
        makeResult("RUNNING", 3, 0),
        makeResult("PENDING", 0, 0),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("RUNNING");
    });

    it("selects PENDING as dominant when most frequent", () => {
      const results = [
        makeResult("PENDING", 0, 0),
        makeResult("PENDING", 0, 0),
        makeResult("FAILED", 2, 3),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("PENDING");
    });

    it("selects FAILED as dominant when most frequent", () => {
      const results = [
        makeResult("FAILED", 2, 3),
        makeResult("FAILED", 1, 4),
        makeResult("PENDING", 0, 0),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("FAILED");
    });

    it("breaks ties by priority (COMPLETED > RUNNING > PENDING > FAILED)", () => {
      const results = [
        makeResult("COMPLETED", 10, 0),
        makeResult("RUNNING", 5, 0),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("COMPLETED");
    });

    it("breaks ties favoring RUNNING over PENDING", () => {
      const results = [
        makeResult("RUNNING", 5, 0),
        makeResult("PENDING", 0, 0),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("RUNNING");
    });

    it("breaks ties favoring PENDING over FAILED", () => {
      const results = [
        makeResult("PENDING", 0, 0),
        makeResult("FAILED", 2, 3),
      ];
      const batch = batchContract.batch(results);
      expect(batch.dominantStatus).toBe("PENDING");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult("COMPLETED", 10, 0)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult("COMPLETED", 10, 0)];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
