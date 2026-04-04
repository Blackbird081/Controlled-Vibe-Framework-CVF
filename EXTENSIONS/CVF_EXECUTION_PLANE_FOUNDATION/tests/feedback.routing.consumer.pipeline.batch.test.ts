import { describe, it, expect } from "vitest";
import {
  FeedbackRoutingConsumerPipelineBatchContract,
  createFeedbackRoutingConsumerPipelineBatchContract,
} from "../src/feedback.routing.consumer.pipeline.batch.contract";
import { createFeedbackRoutingConsumerPipelineContract } from "../src/feedback.routing.consumer.pipeline.contract";
import type { FeedbackRoutingConsumerPipelineResult } from "../src/feedback.routing.consumer.pipeline.contract";
import type { ExecutionFeedbackSignal } from "../src/execution.feedback.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-25T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeFeedbackSignal(
  feedbackClass: ExecutionFeedbackSignal["feedbackClass"],
  id = "feedback-001",
): ExecutionFeedbackSignal {
  return {
    feedbackId: id,
    createdAt: "2026-03-25T10:00:00.000Z",
    sourceObservationId: `obs-${id}`,
    sourcePipelineId: `pipeline-${id}`,
    feedbackClass,
    priority: feedbackClass === "ESCALATE" ? "high" : feedbackClass === "REJECT" ? "critical" : "low",
    rationale: `rationale for ${feedbackClass}`,
    confidenceBoost: 0,
    feedbackHash: `hash-${id}`,
  };
}

function makeResult(
  feedbackClass: ExecutionFeedbackSignal["feedbackClass"],
  id = "feedback-001",
): FeedbackRoutingConsumerPipelineResult {
  const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
  return contract.execute({ feedbackSignal: makeFeedbackSignal(feedbackClass, id) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FeedbackRoutingConsumerPipelineBatchContract", () => {
  it("batches an empty array correctly", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.rejectedResultCount).toBe(0);
    expect(batch.escalatedResultCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("counts rejectedResultCount from results with routingAction REJECT", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("REJECT", "f-001");
    const r2 = makeResult("REJECT", "f-002");
    const r3 = makeResult("ACCEPT", "f-003");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.rejectedResultCount).toBe(2);
    expect(batch.escalatedResultCount).toBe(0);
    expect(batch.totalResults).toBe(3);
  });

  it("counts escalatedResultCount from results with routingAction ESCALATE", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ESCALATE", "f-001");
    const r2 = makeResult("ESCALATE", "f-002");
    const r3 = makeResult("ACCEPT", "f-003");
    const batch = contract.batch([r1, r2, r3]);

    expect(batch.escalatedResultCount).toBe(2);
    expect(batch.rejectedResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ACCEPT", "f-001");
    const r2 = makeResult("REJECT", "f-002");
    const batch = contract.batch([r1, r2]);

    const expectedMax = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("dominantTokenBudget is 0 for empty batch", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([]).dominantTokenBudget).toBe(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("ACCEPT")]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results are preserved in output batch", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ACCEPT", "f-001");
    const r2 = makeResult("ESCALATE", "f-002");
    const batch = contract.batch([r1, r2]);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].resultId).toBe(r1.resultId);
    expect(batch.results[1].resultId).toBe(r2.resultId);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const r1 = makeResult("ACCEPT");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([makeResult("ACCEPT", "f-001")]);
    const b2 = contract.batch([makeResult("REJECT", "f-002")]);

    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("factory creates a working contract", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(FeedbackRoutingConsumerPipelineBatchContract);
    expect(contract.batch([makeResult("ACCEPT")]).batchHash).toBeTruthy();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract.batch([makeResult("ACCEPT")]).createdAt).toBe("2026-03-25T10:00:00.000Z");
  });

  it("ACCEPT and RETRY results do not increment rejected or escalated counts", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ACCEPT", "f-001"),
      makeResult("RETRY", "f-002"),
    ]);

    expect(batch.rejectedResultCount).toBe(0);
    expect(batch.escalatedResultCount).toBe(0);
    expect(batch.totalResults).toBe(2);
  });

  it("mixed rejected and escalated results are counted independently", () => {
    const contract = createFeedbackRoutingConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("REJECT", "f-001"),
      makeResult("ESCALATE", "f-002"),
      makeResult("ACCEPT", "f-003"),
    ]);

    expect(batch.rejectedResultCount).toBe(1);
    expect(batch.escalatedResultCount).toBe(1);
  });
});
