import { describe, it, expect } from "vitest";
import {
  ExecutionReintakeConsumerPipelineContract,
  createExecutionReintakeConsumerPipelineContract,
} from "../src/execution.reintake.consumer.pipeline.contract";
import type {
  ExecutionReintakeConsumerPipelineRequest,
} from "../src/execution.reintake.consumer.pipeline.contract";
import type { FeedbackResolutionSummary } from "../src/feedback.resolution.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSummary(
  urgency: FeedbackResolutionSummary["urgencyLevel"],
  overrides: Partial<FeedbackResolutionSummary> = {},
): FeedbackResolutionSummary {
  const escalateCount = urgency === "CRITICAL" ? 1 : 0;
  const retryCount = urgency === "HIGH" ? 1 : 0;
  return {
    summaryId: `summary-${urgency}`,
    resolvedAt: FIXED_NOW,
    totalDecisions: escalateCount + retryCount + 1,
    acceptCount: 1,
    retryCount,
    escalateCount,
    rejectCount: 0,
    urgencyLevel: urgency,
    summary: `Resolution summary for urgency=${urgency}`,
    summaryHash: `hash-summary-${urgency}`,
    ...overrides,
  };
}

function makeContract(): ExecutionReintakeConsumerPipelineContract {
  return createExecutionReintakeConsumerPipelineContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionReintakeConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createExecutionReintakeConsumerPipelineContract();
    expect(contract).toBeInstanceOf(ExecutionReintakeConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("reintakeRequest");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("NORMAL urgency — ACCEPT action — empty warnings", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result.reintakeRequest.reintakeAction).toBe("ACCEPT");
    expect(result.warnings).toHaveLength(0);
  });

  it("HIGH urgency — RETRY action — warnings contain retry message", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("HIGH") });
    expect(result.reintakeRequest.reintakeAction).toBe("RETRY");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[reintake]");
    expect(result.warnings[0]).toContain("retry");
  });

  it("CRITICAL urgency — REPLAN action — warnings contain replan message", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("CRITICAL") });
    expect(result.reintakeRequest.reintakeAction).toBe("REPLAN");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[reintake]");
    expect(result.warnings[0]).toContain("replanning");
  });

  it("consumerPackage contextId matches reintakeRequest.reintakeId", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result.consumerPackage.contextId).toBe(result.reintakeRequest.reintakeId);
  });

  it("consumerPackage query derived from reintakeVibe (max 120 chars)", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("ACCEPT" as FeedbackResolutionSummary["urgencyLevel"]) });
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    expect(result.consumerPackage.query.length).toBeGreaterThan(0);
  });

  it("reintakeRequest.sourceSummaryId matches input summaryId", () => {
    const summary = makeSummary("NORMAL");
    const result = makeContract().execute({ resolutionSummary: summary });
    expect(result.reintakeRequest.sourceSummaryId).toBe(summary.summaryId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req: ExecutionReintakeConsumerPipelineRequest = {
      resolutionSummary: makeSummary("NORMAL"),
    };
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different urgency levels produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({ resolutionSummary: makeSummary("NORMAL") });
    const r2 = contract.execute({ resolutionSummary: makeSummary("CRITICAL") });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      resolutionSummary: makeSummary("NORMAL"),
      candidateItems: [
        { itemId: "item-1", content: "reintake item", relevanceScore: 0.7 },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      resolutionSummary: makeSummary("NORMAL"),
      consumerId: "consumer-reintake",
    });
    expect(result.consumerId).toBe("consumer-reintake");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute({ resolutionSummary: makeSummary("NORMAL") });
    expect(result.consumerId).toBeUndefined();
  });

  it("REPLAN takes highest urgency — rejectCount > 0 triggers CRITICAL", () => {
    const summary = makeSummary("CRITICAL", { rejectCount: 1, escalateCount: 0 });
    const result = makeContract().execute({ resolutionSummary: summary });
    expect(result.reintakeRequest.reintakeAction).toBe("REPLAN");
  });
});
