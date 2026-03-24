import { describe, it, expect } from "vitest";
import {
  ExecutionReintakeConsumerPipelineBatchContract,
  createExecutionReintakeConsumerPipelineBatchContract,
} from "../src/execution.reintake.consumer.pipeline.batch.contract";
import {
  createExecutionReintakeConsumerPipelineContract,
} from "../src/execution.reintake.consumer.pipeline.contract";
import type { FeedbackResolutionSummary } from "../src/feedback.resolution.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSummary(
  urgency: FeedbackResolutionSummary["urgencyLevel"],
  idx = 0,
): FeedbackResolutionSummary {
  const escalateCount = urgency === "CRITICAL" ? 1 : 0;
  const retryCount = urgency === "HIGH" ? 1 : 0;
  return {
    summaryId: `summary-${urgency}-${idx}`,
    resolvedAt: FIXED_NOW,
    totalDecisions: escalateCount + retryCount + 1,
    acceptCount: 1,
    retryCount,
    escalateCount,
    rejectCount: 0,
    urgencyLevel: urgency,
    summary: `Resolution for urgency=${urgency} idx=${idx}`,
    summaryHash: `hash-summary-${urgency}-${idx}`,
  };
}

function makePipelineResult(urgency: FeedbackResolutionSummary["urgencyLevel"], idx = 0) {
  const pipeline = createExecutionReintakeConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({
    resolutionSummary: makeSummary(urgency, idx),
    candidateItems: [
      {
        itemId: `item-${idx}`,
        content: `content-${idx}`,
        relevanceScore: 0.5 + idx * 0.1,
      },
    ],
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionReintakeConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(ExecutionReintakeConsumerPipelineBatchContract);
  });

  it("empty batch — valid result with dominantTokenBudget = 0", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
  });

  it("single result batch — totalResults = 1", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makePipelineResult("NORMAL", 0)]);
    expect(batch.totalResults).toBe(1);
    expect(batch.results).toHaveLength(1);
  });

  it("multi-result batch — totalResults matches input", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("NORMAL", 0),
      makePipelineResult("HIGH", 1),
      makePipelineResult("CRITICAL", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("NORMAL", 0),
      makePipelineResult("CRITICAL", 1),
    ];
    const expected = Math.max(
      ...results.map(
        (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
      ),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("replanCount counts REPLAN actions", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("CRITICAL", 0),
      makePipelineResult("CRITICAL", 1),
      makePipelineResult("NORMAL", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.replanCount).toBe(2);
  });

  it("retryCount counts RETRY actions", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("HIGH", 0),
      makePipelineResult("NORMAL", 1),
    ];
    const batch = contract.batch(results);
    expect(batch.retryCount).toBe(1);
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makePipelineResult("NORMAL", 0)]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makePipelineResult("NORMAL", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("createdAt matches injected now", () => {
    const contract = createExecutionReintakeConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
