import { describe, it, expect } from "vitest";
import {
  StreamingExecutionSummaryConsumerPipelineBatchContract,
  createStreamingExecutionSummaryConsumerPipelineBatchContract,
} from "../src/execution.streaming.summary.consumer.pipeline.batch.contract";
import {
  createStreamingExecutionSummaryConsumerPipelineContract,
} from "../src/execution.streaming.summary.consumer.pipeline.contract";
import type { StreamingExecutionSummaryConsumerPipelineResult } from "../src/execution.streaming.summary.consumer.pipeline.contract";
import type { StreamingExecutionChunk } from "../src/execution.streaming.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T12:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeChunk(
  chunkStatus: "STREAMED" | "SKIPPED" | "FAILED",
  id: string,
): StreamingExecutionChunk {
  return {
    chunkId: id,
    issuedAt: FIXED_NOW,
    sourceRuntimeId: "runtime-001",
    sequenceNumber: 0,
    assignmentId: "assign-001",
    taskId: "task-001",
    chunkStatus,
    recordStatus: chunkStatus === "STREAMED" ? "EXECUTED" : chunkStatus === "FAILED" ? "EXECUTION_FAILED" : "SKIPPED_DENIED",
    payload: "payload",
    chunkHash: `hash-${id}`,
  };
}

function makePipelineResult(
  chunks: StreamingExecutionChunk[],
): StreamingExecutionSummaryConsumerPipelineResult {
  const contract = createStreamingExecutionSummaryConsumerPipelineContract({ now: fixedNow });
  return contract.execute({ chunks });
}

const FAILED_RESULT = makePipelineResult([makeChunk("FAILED", "f1"), makeChunk("STREAMED", "s1")]);
const SKIPPED_RESULT = makePipelineResult([makeChunk("SKIPPED", "sk1"), makeChunk("STREAMED", "s2")]);
const STREAMED_RESULT_A = makePipelineResult([makeChunk("STREAMED", "s3"), makeChunk("STREAMED", "s4")]);
const STREAMED_RESULT_B = makePipelineResult([makeChunk("STREAMED", "s5")]);

function makeBatch(): StreamingExecutionSummaryConsumerPipelineBatchContract {
  return createStreamingExecutionSummaryConsumerPipelineBatchContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("StreamingExecutionSummaryConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createStreamingExecutionSummaryConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(StreamingExecutionSummaryConsumerPipelineBatchContract);
  });

  it("empty batch — totalResults is 0", () => {
    const batch = makeBatch().batch([]);
    expect(batch.totalResults).toBe(0);
  });

  it("empty batch — failedResultCount is 0", () => {
    const batch = makeBatch().batch([]);
    expect(batch.failedResultCount).toBe(0);
  });

  it("empty batch — skippedResultCount is 0", () => {
    const batch = makeBatch().batch([]);
    expect(batch.skippedResultCount).toBe(0);
  });

  it("empty batch — dominantTokenBudget is 0", () => {
    const batch = makeBatch().batch([]);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const batch = makeBatch().batch([STREAMED_RESULT_A]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("totalResults matches input length", () => {
    const batch = makeBatch().batch([FAILED_RESULT, SKIPPED_RESULT, STREAMED_RESULT_A]);
    expect(batch.totalResults).toBe(3);
  });

  it("failedResultCount counts FAILED dominant status correctly", () => {
    const batch = makeBatch().batch([FAILED_RESULT, SKIPPED_RESULT, STREAMED_RESULT_A]);
    expect(batch.failedResultCount).toBe(1);
  });

  it("skippedResultCount counts SKIPPED dominant status correctly", () => {
    const batch = makeBatch().batch([FAILED_RESULT, SKIPPED_RESULT, STREAMED_RESULT_A]);
    expect(batch.skippedResultCount).toBe(1);
  });

  it("all-STREAMED batch — failedResultCount is 0", () => {
    const batch = makeBatch().batch([STREAMED_RESULT_A, STREAMED_RESULT_B]);
    expect(batch.failedResultCount).toBe(0);
  });

  it("all-STREAMED batch — skippedResultCount is 0", () => {
    const batch = makeBatch().batch([STREAMED_RESULT_A, STREAMED_RESULT_B]);
    expect(batch.skippedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max of typedContextPackage.estimatedTokens", () => {
    const batch = makeBatch().batch([STREAMED_RESULT_A, STREAMED_RESULT_B]);
    const expected = Math.max(
      STREAMED_RESULT_A.consumerPackage.typedContextPackage.estimatedTokens,
      STREAMED_RESULT_B.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same inputs produce same hashes", () => {
    const b1 = makeBatch().batch([STREAMED_RESULT_A, STREAMED_RESULT_B]);
    const b2 = makeBatch().batch([STREAMED_RESULT_A, STREAMED_RESULT_B]);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different inputs produce different batchHash", () => {
    const b1 = makeBatch().batch([STREAMED_RESULT_A]);
    const b2 = makeBatch().batch([FAILED_RESULT]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("results array is preserved in batch", () => {
    const inputs = [FAILED_RESULT, STREAMED_RESULT_A];
    const batch = makeBatch().batch(inputs);
    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(FAILED_RESULT.resultId);
  });

  it("createdAt matches injected now", () => {
    const batch = makeBatch().batch([STREAMED_RESULT_A]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
