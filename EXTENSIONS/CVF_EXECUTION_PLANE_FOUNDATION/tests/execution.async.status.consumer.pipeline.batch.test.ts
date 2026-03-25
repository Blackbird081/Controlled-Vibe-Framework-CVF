import { describe, it, expect } from "vitest";
import {
  AsyncExecutionStatusConsumerPipelineBatchContract,
  createAsyncExecutionStatusConsumerPipelineBatchContract,
} from "../src/execution.async.status.consumer.pipeline.batch.contract";
import { createAsyncExecutionStatusConsumerPipelineContract } from "../src/execution.async.status.consumer.pipeline.contract";
import type { AsyncExecutionStatusConsumerPipelineResult } from "../src/execution.async.status.consumer.pipeline.contract";
import type { AsyncCommandRuntimeTicket } from "../src/execution.async.runtime.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-25T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeTicket(
  asyncStatus: AsyncCommandRuntimeTicket["asyncStatus"] = "COMPLETED",
): AsyncCommandRuntimeTicket {
  return {
    ticketId: "ticket-001",
    issuedAt: "2026-03-25T10:00:00.000Z",
    sourceRuntimeId: "runtime-001",
    sourceGateId: "gate-001",
    asyncStatus,
    recordCount: 5,
    executedCount: 5,
    failedCount: asyncStatus === "FAILED" ? 1 : 0,
    estimatedTimeoutMs: 5000,
    ticketHash: `hash-ticket-${asyncStatus}`,
  };
}

function makeResult(
  asyncStatus: AsyncCommandRuntimeTicket["asyncStatus"] = "COMPLETED",
): AsyncExecutionStatusConsumerPipelineResult {
  const contract = createAsyncExecutionStatusConsumerPipelineContract({ now: fixedNow() });
  return contract.execute({ tickets: [makeTicket(asyncStatus)] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AsyncExecutionStatusConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.failedResultCount).toBe(0);
    expect(batch.runningResultCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts failedResultCount from FAILED-dominant results", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("FAILED");
    const r2 = makeResult("FAILED");
    const r3 = makeResult("COMPLETED");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.failedResultCount).toBe(2);
    expect(batch.runningResultCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts runningResultCount from RUNNING-dominant results", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("RUNNING");
    const r2 = makeResult("RUNNING");
    const r3 = makeResult("PENDING");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.runningResultCount).toBe(2);
    expect(batch.failedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("COMPLETED");
    const r2 = makeResult("FAILED");
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("COMPLETED")]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("COMPLETED");
    const r2 = makeResult("FAILED");
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("COMPLETED");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult("COMPLETED")]);
    const b2 = contract.batch([makeResult("FAILED")]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(AsyncExecutionStatusConsumerPipelineBatchContract);
    const batch = contract.batch([makeResult()]);
    expect(batch.batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.createdAt).toBe("2026-03-25T10:00:00.000Z");
  });

  it("COMPLETED and PENDING results do not increment failedResult or runningResult counts", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const rCompleted = makeResult("COMPLETED");
    const rPending = makeResult("PENDING");
    const batch = contract.batch([rCompleted, rPending]);

    expect(batch.failedResultCount).toBe(0);
    expect(batch.runningResultCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });

  it("mixed FAILED and RUNNING results are counted independently", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("FAILED"),
      makeResult("RUNNING"),
      makeResult("COMPLETED"),
    ]);

    expect(batch.failedResultCount).toBe(1);
    expect(batch.runningResultCount).toBe(1);
  });

  it("single-result batch has correct totalResults and counts", () => {
    const contract = createAsyncExecutionStatusConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("RUNNING")]);

    expect(batch.totalResults).toBe(1);
    expect(batch.runningResultCount).toBe(1);
    expect(batch.failedResultCount).toBe(0);
  });
});
