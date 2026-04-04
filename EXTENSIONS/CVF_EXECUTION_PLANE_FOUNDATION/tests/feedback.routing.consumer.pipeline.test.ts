import { describe, it, expect } from "vitest";
import {
  FeedbackRoutingConsumerPipelineContract,
  createFeedbackRoutingConsumerPipelineContract,
} from "../src/feedback.routing.consumer.pipeline.contract";
import type { FeedbackRoutingConsumerPipelineRequest } from "../src/feedback.routing.consumer.pipeline.contract";
import type { ExecutionFeedbackSignal } from "../src/execution.feedback.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-25T10:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeFeedbackSignal(
  feedbackClass: ExecutionFeedbackSignal["feedbackClass"],
  id = "feedback-001",
  confidenceBoost = 0,
): ExecutionFeedbackSignal {
  return {
    feedbackId: id,
    createdAt: FIXED_TS,
    sourceObservationId: `obs-${id}`,
    sourcePipelineId: `pipeline-${id}`,
    feedbackClass,
    priority: feedbackClass === "ESCALATE" ? "high" : feedbackClass === "REJECT" ? "critical" : "low",
    rationale: `test rationale for ${feedbackClass}`,
    confidenceBoost,
    feedbackHash: `hash-${id}`,
  };
}

function makeRequest(
  feedbackClass: ExecutionFeedbackSignal["feedbackClass"],
  id = "feedback-001",
  confidenceBoost = 0,
): FeedbackRoutingConsumerPipelineRequest {
  return { feedbackSignal: makeFeedbackSignal(feedbackClass, id, confidenceBoost) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FeedbackRoutingConsumerPipelineContract", () => {
  it("execute returns a result with resultId, pipelineHash, and routingDecision", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.resultId).toBeTruthy();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.routingDecision).toBeDefined();
    expect(result.routingDecision.routingAction).toBe("ACCEPT");
  });

  it("query contains [feedback-routing] prefix with action and priority", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toMatch(/^\[feedback-routing\] action:ACCEPT priority:low/);
  });

  it("query for REJECT action contains priority:critical", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("REJECT"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("action:REJECT");
    expect(query).toContain("priority:critical");
  });

  it("query for ESCALATE action contains priority:high", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    const query = result.consumerPackage.typedContextPackage.query;
    expect(query).toContain("action:ESCALATE");
    expect(query).toContain("priority:high");
  });

  it("query is sliced to max 120 characters", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("RETRY"));

    expect(result.consumerPackage.typedContextPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId is routingDecision.decisionId", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.consumerPackage.typedContextPackage.contextId).toBe(
      result.routingDecision.decisionId,
    );
  });

  it("REJECT signal produces rejection warning", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("REJECT"));

    expect(result.warnings).toContain(
      "[feedback] rejection decision — immediate intervention required",
    );
  });

  it("ESCALATE signal produces escalation warning", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.warnings).toContain(
      "[feedback] escalation decision — human review required",
    );
  });

  it("ACCEPT signal produces no warnings", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.warnings).toHaveLength(0);
  });

  it("RETRY signal produces no warnings", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("RETRY"));

    expect(result.warnings).toHaveLength(0);
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("estimatedTokens is present and positive", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ESCALATE"));

    expect(result.consumerPackage.typedContextPackage.estimatedTokens).toBeGreaterThan(0);
  });

  it("consumerId is propagated when set", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute({
      ...makeRequest("ACCEPT"),
      consumerId: "consumer-xyz",
    });

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not set", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.consumerId).toBeUndefined();
  });

  it("createdAt is set from injected now()", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest("ACCEPT"));

    expect(result.createdAt).toBe(FIXED_TS);
  });

  it("is deterministic — same inputs produce identical pipelineHash", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest("ACCEPT"));
    const r2 = contract.execute(makeRequest("ACCEPT"));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different routingAction inputs produce different pipelineHash", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest("ACCEPT"));
    const r2 = contract.execute(makeRequest("REJECT"));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory creates a working contract", () => {
    const contract = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(FeedbackRoutingConsumerPipelineContract);
    expect(contract.execute(makeRequest("ACCEPT")).pipelineHash).toBeTruthy();
  });

  it("direct instantiation and factory produce equivalent results", () => {
    const signal = makeFeedbackSignal("ESCALATE");
    const direct = new FeedbackRoutingConsumerPipelineContract({ now: fixedNow() });
    const factory = createFeedbackRoutingConsumerPipelineContract({ now: fixedNow() });

    expect(direct.execute({ feedbackSignal: signal }).pipelineHash).toBe(
      factory.execute({ feedbackSignal: signal }).pipelineHash,
    );
  });
});
