import { describe, it, expect } from "vitest";
import {
  ExecutionObservationConsumerPipelineBatchContract,
  createExecutionObservationConsumerPipelineBatchContract,
} from "../src/execution.observation.consumer.pipeline.batch.contract";
import {
  createExecutionObservationConsumerPipelineContract,
} from "../src/execution.observation.consumer.pipeline.contract";
import type { ExecutionObservationConsumerPipelineResult } from "../src/execution.observation.consumer.pipeline.contract";
import type { ExecutionPipelineReceipt } from "../src/execution.pipeline.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T13:30:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeReceipt(
  executedCount: number,
  failedCount: number,
  sandboxedCount: number,
  skippedCount: number,
  id: string,
): ExecutionPipelineReceipt {
  const totalEntries = executedCount + failedCount + sandboxedCount + skippedCount;
  return {
    pipelineReceiptId: id,
    createdAt: FIXED_NOW,
    bridgeReceiptId: "bridge-001",
    orchestrationId: "orch-001",
    gateId: "gate-001",
    runtimeId: "runtime-001",
    commandRuntimeResult: {
      runtimeId: "runtime-001",
      gateId: "gate-001",
      executedAt: FIXED_NOW,
      records: [],
      executedCount,
      sandboxedCount,
      skippedCount,
      failedCount,
      runtimeHash: `rhash-${id}`,
      summary: "test summary",
    },
    totalEntries,
    executedCount,
    sandboxedCount,
    skippedCount,
    failedCount,
    pipelineStages: [],
    pipelineHash: `phash-${id}`,
    warnings: [],
  };
}

function makePipelineResult(receipt: ExecutionPipelineReceipt): ExecutionObservationConsumerPipelineResult {
  const contract = createExecutionObservationConsumerPipelineContract({ now: fixedNow });
  return contract.execute({ receipt });
}

const FAILED_RESULT = makePipelineResult(makeReceipt(0, 2, 0, 0, "r-fail"));
const GATED_RESULT = makePipelineResult(makeReceipt(0, 0, 0, 3, "r-gate"));
const SANDBOXED_RESULT = makePipelineResult(makeReceipt(0, 0, 2, 0, "r-sandbox"));
const SUCCESS_RESULT_A = makePipelineResult(makeReceipt(3, 0, 0, 0, "r-success-a"));
const SUCCESS_RESULT_B = makePipelineResult(makeReceipt(5, 0, 0, 0, "r-success-b"));

function makeBatch(): ExecutionObservationConsumerPipelineBatchContract {
  return createExecutionObservationConsumerPipelineBatchContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionObservationConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createExecutionObservationConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(ExecutionObservationConsumerPipelineBatchContract);
  });

  it("empty batch — totalResults is 0", () => {
    expect(makeBatch().batch([]).totalResults).toBe(0);
  });

  it("empty batch — failedResultCount is 0", () => {
    expect(makeBatch().batch([]).failedResultCount).toBe(0);
  });

  it("empty batch — gatedResultCount is 0", () => {
    expect(makeBatch().batch([]).gatedResultCount).toBe(0);
  });

  it("empty batch — dominantTokenBudget is 0", () => {
    expect(makeBatch().batch([]).dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const batch = makeBatch().batch([SUCCESS_RESULT_A]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("totalResults matches input length", () => {
    const batch = makeBatch().batch([FAILED_RESULT, GATED_RESULT, SUCCESS_RESULT_A]);
    expect(batch.totalResults).toBe(3);
  });

  it("failedResultCount counts FAILED outcomeClass correctly", () => {
    const batch = makeBatch().batch([FAILED_RESULT, GATED_RESULT, SUCCESS_RESULT_A]);
    expect(batch.failedResultCount).toBe(1);
  });

  it("gatedResultCount counts GATED outcomeClass correctly", () => {
    const batch = makeBatch().batch([FAILED_RESULT, GATED_RESULT, SUCCESS_RESULT_A]);
    expect(batch.gatedResultCount).toBe(1);
  });

  it("all-SUCCESS batch — failedResultCount is 0", () => {
    const batch = makeBatch().batch([SUCCESS_RESULT_A, SUCCESS_RESULT_B]);
    expect(batch.failedResultCount).toBe(0);
  });

  it("all-SUCCESS batch — gatedResultCount is 0", () => {
    const batch = makeBatch().batch([SUCCESS_RESULT_A, SUCCESS_RESULT_B]);
    expect(batch.gatedResultCount).toBe(0);
  });

  it("SANDBOXED result — does not increment failedResultCount", () => {
    const batch = makeBatch().batch([SANDBOXED_RESULT]);
    expect(batch.failedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max of typedContextPackage.estimatedTokens", () => {
    const batch = makeBatch().batch([SUCCESS_RESULT_A, SUCCESS_RESULT_B]);
    const expected = Math.max(
      SUCCESS_RESULT_A.consumerPackage.typedContextPackage.estimatedTokens,
      SUCCESS_RESULT_B.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same inputs produce same hashes", () => {
    const b1 = makeBatch().batch([SUCCESS_RESULT_A, SUCCESS_RESULT_B]);
    const b2 = makeBatch().batch([SUCCESS_RESULT_A, SUCCESS_RESULT_B]);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different inputs produce different batchHash", () => {
    const b1 = makeBatch().batch([SUCCESS_RESULT_A]);
    const b2 = makeBatch().batch([FAILED_RESULT]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("results array is preserved in batch", () => {
    const inputs = [FAILED_RESULT, SUCCESS_RESULT_A];
    const batch = makeBatch().batch(inputs);
    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(FAILED_RESULT.resultId);
  });

  it("createdAt matches injected now", () => {
    const batch = makeBatch().batch([SUCCESS_RESULT_A]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
