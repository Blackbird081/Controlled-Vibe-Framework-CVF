import { describe, it, expect } from "vitest";
import {
  FeedbackResolutionConsumerPipelineContract,
  createFeedbackResolutionConsumerPipelineContract,
} from "../src/feedback.resolution.consumer.pipeline.contract";
import type { FeedbackResolutionConsumerPipelineRequest } from "../src/feedback.resolution.consumer.pipeline.contract";
import type { FeedbackRoutingDecision } from "../src/feedback.routing.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  routingAction: FeedbackRoutingDecision["routingAction"] = "ACCEPT",
  overrides: Partial<FeedbackRoutingDecision> = {},
): FeedbackRoutingDecision {
  return {
    decisionId: "decision-001",
    createdAt: "2026-03-24T10:00:00.000Z",
    sourceFeedbackId: "feedback-001",
    sourcePipelineId: "pipeline-001",
    routingAction,
    routingPriority: "low",
    rationale: "test rationale",
    decisionHash: "hash-decision-001",
    ...overrides,
  };
}

function makeRequest(
  decisions: FeedbackRoutingDecision[] = [makeDecision()],
  overrides: Partial<FeedbackResolutionConsumerPipelineRequest> = {},
): FeedbackResolutionConsumerPipelineRequest {
  return { decisions, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FeedbackResolutionConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(FeedbackResolutionConsumerPipelineContract);
  });

  it("returns all required fields for ACCEPT-only decisions (NORMAL urgency)", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.resolutionSummary).toBeDefined();
    expect(result.resolutionSummary.urgencyLevel).toBe("NORMAL");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("ESCALATE decision produces CRITICAL urgency and warning", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ESCALATE", { routingPriority: "critical" }),
    ]));

    expect(result.resolutionSummary.urgencyLevel).toBe("CRITICAL");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[feedback-resolution] critical urgency");
    expect(result.warnings[0]).toContain("escalated or rejected decisions require immediate attention");
  });

  it("REJECT decision produces CRITICAL urgency and warning", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("REJECT", { routingPriority: "high" }),
    ]));

    expect(result.resolutionSummary.urgencyLevel).toBe("CRITICAL");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[feedback-resolution] critical urgency");
  });

  it("RETRY-only decision produces HIGH urgency and warning", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("RETRY", { routingPriority: "medium" }),
    ]));

    expect(result.resolutionSummary.urgencyLevel).toBe("HIGH");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[feedback-resolution] high urgency");
    expect(result.warnings[0]).toContain("retry decisions require attention");
  });

  it("mixed ESCALATE + ACCEPT produces CRITICAL urgency", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ACCEPT"),
      makeDecision("ESCALATE", { routingPriority: "critical", decisionId: "d-2" }),
    ]));

    expect(result.resolutionSummary.urgencyLevel).toBe("CRITICAL");
    expect(result.warnings[0]).toContain("[feedback-resolution] critical urgency");
  });

  it("query is derived from resolutionSummary.summary (sliced to 120)", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision("ACCEPT")]));

    expect(result.consumerPackage.query).toBe(
      result.resolutionSummary.summary.slice(0, 120),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals resolutionSummary.summaryId", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.resolutionSummary.summaryId);
  });

  it("empty decisions produce NORMAL urgency and no warnings", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.resolutionSummary.totalDecisions).toBe(0);
    expect(result.resolutionSummary.urgencyLevel).toBe("NORMAL");
    expect(result.warnings).toEqual([]);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeDecision()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.resolutionSummary.summaryHash).toBe(r2.resolutionSummary.summaryHash);
  });

  it("different routingAction produces different pipelineHash", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeDecision("ACCEPT")]));
    const r2 = contract.execute(makeRequest([makeDecision("RETRY", { routingPriority: "medium" })]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("resolutionSummary.totalDecisions matches input length", () => {
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeDecision("ACCEPT"),
      makeDecision("RETRY", { decisionId: "d-2", routingPriority: "medium" }),
      makeDecision("ACCEPT", { decisionId: "d-3" }),
    ]));

    expect(result.resolutionSummary.totalDecisions).toBe(3);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new FeedbackResolutionConsumerPipelineContract({ now });
    const via = createFeedbackResolutionConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createFeedbackResolutionConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeRequest());

    expect(result.createdAt).toBe(ts);
  });
});
