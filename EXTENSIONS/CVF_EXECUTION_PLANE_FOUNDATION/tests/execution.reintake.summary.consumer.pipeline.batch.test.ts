import { describe, expect, it } from "vitest";
import {
  ExecutionReintakeSummaryConsumerPipelineBatchContract,
  createExecutionReintakeSummaryConsumerPipelineBatchContract,
} from "../src/execution.reintake.summary.consumer.pipeline.batch.contract";
import {
  createExecutionReintakeSummaryConsumerPipelineContract,
} from "../src/execution.reintake.summary.consumer.pipeline.contract";
import type { FeedbackResolutionSummary } from "../src/feedback.resolution.contract";

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeResolutionSummary(
  urgency: FeedbackResolutionSummary["urgencyLevel"],
  idx = 0,
): FeedbackResolutionSummary {
  const escalateCount = urgency === "CRITICAL" ? 1 : 0;
  const retryCount = urgency === "HIGH" ? 1 : 0;
  return {
    summaryId: `res-summary-${urgency}-${idx}`,
    resolvedAt: FIXED_NOW,
    totalDecisions: escalateCount + retryCount + 1,
    acceptCount: 1,
    retryCount,
    escalateCount,
    rejectCount: 0,
    urgencyLevel: urgency,
    summary: `Resolution summary urgency=${urgency} idx=${idx}`,
    summaryHash: `hash-resolution-${urgency}-${idx}`,
  };
}

function makeResult(urgency: FeedbackResolutionSummary["urgencyLevel"], idx = 0) {
  const pipeline = createExecutionReintakeSummaryConsumerPipelineContract({
    now: fixedNow,
  });
  return pipeline.execute({
    resolutionSummaries: [makeResolutionSummary(urgency, idx)],
    candidateItems: [
      {
        itemId: `item-${idx}`,
        title: `Item ${idx}`,
        source: "epf-test",
        content: `content-${idx}`,
        relevanceScore: 0.5 + idx * 0.1,
      },
    ],
  });
}

describe("ExecutionReintakeSummaryConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(ExecutionReintakeSummaryConsumerPipelineBatchContract);
  });

  it("empty batch returns dominantTokenBudget = 0 with valid hash", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.batchHash.length).toBeGreaterThan(0);
  });

  it("single-result batch reports totalResults = 1", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makeResult("NORMAL", 0)]);
    expect(batch.totalResults).toBe(1);
    expect(batch.results).toHaveLength(1);
  });

  it("multi-result batch reports totalResults matching input", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makeResult("NORMAL", 0), makeResult("HIGH", 1), makeResult("CRITICAL", 2)];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makeResult("NORMAL", 0), makeResult("CRITICAL", 1)];
    const expected = Math.max(
      ...results.map((result) => result.consumerPackage.typedContextPackage.estimatedTokens),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("replanResultCount counts REPLAN actions", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([
      makeResult("CRITICAL", 0),
      makeResult("CRITICAL", 1),
      makeResult("NORMAL", 2),
    ]);
    expect(batch.replanResultCount).toBe(2);
  });

  it("retryResultCount counts RETRY actions", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([
      makeResult("HIGH", 0),
      makeResult("NORMAL", 1),
      makeResult("HIGH", 2),
    ]);
    expect(batch.retryResultCount).toBe(2);
  });

  it("ACCEPT results do not increment replan or retry counts", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makeResult("NORMAL", 0), makeResult("NORMAL", 1)]);
    expect(batch.replanResultCount).toBe(0);
    expect(batch.retryResultCount).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makeResult("NORMAL", 0)]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("createdAt matches injected now", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("is deterministic for identical results", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makeResult("NORMAL", 0), makeResult("HIGH", 1)];
    const first = contract.batch(results);
    const second = contract.batch(results);
    expect(first.batchHash).toBe(second.batchHash);
    expect(first.batchId).toBe(second.batchId);
  });

  it("different result sets produce different batchHash values", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const first = contract.batch([makeResult("NORMAL", 0)]);
    const second = contract.batch([makeResult("CRITICAL", 0)]);
    expect(first.batchHash).not.toBe(second.batchHash);
  });
});
