import { describe, it, expect } from "vitest";
import {
  FeedbackResolutionConsumerPipelineBatchContract,
  createFeedbackResolutionConsumerPipelineBatchContract,
} from "../src/feedback.resolution.consumer.pipeline.batch.contract";
import { createFeedbackResolutionConsumerPipelineContract } from "../src/feedback.resolution.consumer.pipeline.contract";
import type { FeedbackResolutionConsumerPipelineResult } from "../src/feedback.resolution.consumer.pipeline.contract";
import type { FeedbackRoutingDecision } from "../src/feedback.routing.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  routingAction: FeedbackRoutingDecision["routingAction"] = "ACCEPT",
  id = "decision-001",
): FeedbackRoutingDecision {
  return {
    decisionId: id,
    createdAt: "2026-03-24T10:00:00.000Z",
    sourceFeedbackId: "feedback-001",
    sourcePipelineId: "pipeline-001",
    routingAction,
    routingPriority: routingAction === "ESCALATE" ? "critical" : routingAction === "RETRY" ? "medium" : "low",
    rationale: "test rationale",
    decisionHash: `hash-${id}`,
  };
}

function makeResult(
  routingAction: FeedbackRoutingDecision["routingAction"] = "ACCEPT",
  index = 0,
): FeedbackResolutionConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createFeedbackResolutionConsumerPipelineContract({ now: () => ts });
  return contract.execute({ decisions: [makeDecision(routingAction, `d-${index}`)] });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FeedbackResolutionConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(FeedbackResolutionConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.criticalUrgencyResultCount).toBe(0);
    expect(batch.highUrgencyResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("criticalUrgencyResultCount counts CRITICAL correctly", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("ACCEPT", 1),
      makeResult("REJECT", 2),
    ]);

    expect(batch.criticalUrgencyResultCount).toBe(2);
  });

  it("highUrgencyResultCount counts HIGH correctly", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("RETRY", 0),
      makeResult("ACCEPT", 1),
      makeResult("RETRY", 2),
    ]);

    expect(batch.highUrgencyResultCount).toBe(2);
  });

  it("both counts are 0 for all NORMAL (ACCEPT-only) results", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ACCEPT", 0),
      makeResult("ACCEPT", 1),
    ]);

    expect(batch.criticalUrgencyResultCount).toBe(0);
    expect(batch.highUrgencyResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("ACCEPT", 0), makeResult("RETRY", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("ACCEPT", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("ACCEPT", 0), makeResult("ESCALATE", 1), makeResult("RETRY", 2)]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("ACCEPT", 0), makeResult("REJECT", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resolutionSummary.urgencyLevel).toBe("NORMAL");
    expect(batch.results[1].resolutionSummary.urgencyLevel).toBe("CRITICAL");
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createFeedbackResolutionConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });
});
