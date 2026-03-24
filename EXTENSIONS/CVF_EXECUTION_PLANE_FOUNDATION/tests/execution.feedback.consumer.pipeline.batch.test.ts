import { describe, it, expect } from "vitest";
import {
  ExecutionFeedbackConsumerPipelineBatchContract,
  createExecutionFeedbackConsumerPipelineBatchContract,
} from "../src/execution.feedback.consumer.pipeline.batch.contract";
import {
  createExecutionFeedbackConsumerPipelineContract,
} from "../src/execution.feedback.consumer.pipeline.contract";
import type { ExecutionObservation } from "../src/execution.observer.contract";

// ─── W2-T11 CP2: ExecutionFeedbackConsumerPipelineBatchContract ───────────────

const FIXED_NOW = () => "2026-03-24T09:00:00.000Z";

const OBS_A: ExecutionObservation = {
  observationId: "obs-batch-a",
  createdAt: "2026-03-24T08:00:00.000Z",
  sourcePipelineId: "pipeline-batch-a",
  outcomeClass: "SUCCESS",
  confidenceSignal: 0.9,
  totalEntries: 3,
  executedCount: 3,
  failedCount: 0,
  sandboxedCount: 0,
  skippedCount: 0,
  notes: [],
  observationHash: "obs-hash-batch-a",
};

const OBS_B: ExecutionObservation = {
  observationId: "obs-batch-b",
  createdAt: "2026-03-24T08:00:00.000Z",
  sourcePipelineId: "pipeline-batch-b",
  outcomeClass: "FAILED",
  confidenceSignal: 0.1,
  totalEntries: 3,
  executedCount: 1,
  failedCount: 2,
  sandboxedCount: 0,
  skippedCount: 0,
  notes: [],
  observationHash: "obs-hash-batch-b",
};

function buildResults() {
  const pipeline = createExecutionFeedbackConsumerPipelineContract({
    now: FIXED_NOW,
  });
  return [
    pipeline.execute({ observation: OBS_A }),
    pipeline.execute({ observation: OBS_B }),
  ];
}

describe("W2-T11 CP2: ExecutionFeedbackConsumerPipelineBatchContract", () => {
  it("createExecutionFeedbackConsumerPipelineBatchContract returns an instance", () => {
    expect(
      createExecutionFeedbackConsumerPipelineBatchContract(),
    ).toBeInstanceOf(ExecutionFeedbackConsumerPipelineBatchContract);
  });

  it("batch returns a result with all required fields", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);

    expect(batch.batchId).toBeDefined();
    expect(batch.createdAt).toBe("2026-03-24T09:00:00.000Z");
    expect(batch.totalResults).toBe(2);
    expect(Array.isArray(batch.results)).toBe(true);
    expect(typeof batch.dominantTokenBudget).toBe("number");
    expect(batch.batchHash).toBeDefined();
  });

  it("totalResults reflects the number of input results", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(results.length);
    expect(batch.results).toHaveLength(results.length);
  });

  it("dominantTokenBudget is the max estimatedTokens across all consumer packages", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const expected = Math.max(
      ...results.map(
        (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
      ),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("empty batch produces totalResults 0 and dominantTokenBudget 0", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.results).toHaveLength(0);
    expect(batch.batchHash).toBeDefined();
    expect(batch.batchId).toBeDefined();
  });

  it("batchHash is deterministic for the same inputs", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("batchHash changes when results change", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const b1 = contract.batch([results[0]]);
    const b2 = contract.batch([results[1]]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results array in batch contains all input results in order", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.results[0].feedbackSignal.feedbackClass).toBe("ACCEPT");
    expect(batch.results[1].feedbackSignal.feedbackClass).toBe("ESCALATE");
  });

  it("single result batch has dominantTokenBudget equal to that result's estimatedTokens", () => {
    const contract = createExecutionFeedbackConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const [singleResult] = buildResults();
    const batch = contract.batch([singleResult]);
    expect(batch.dominantTokenBudget).toBe(
      singleResult.consumerPackage.typedContextPackage.estimatedTokens,
    );
  });
});
