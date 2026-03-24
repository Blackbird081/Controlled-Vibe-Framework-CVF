import { describe, it, expect } from "vitest";
import {
  ExecutionReintakeSummaryConsumerPipelineContract,
  createExecutionReintakeSummaryConsumerPipelineContract,
} from "../src/execution.reintake.summary.consumer.pipeline.contract";
import type { ExecutionReintakeSummaryConsumerPipelineRequest } from "../src/execution.reintake.summary.consumer.pipeline.contract";
import type { FeedbackResolutionSummary } from "../src/feedback.resolution.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResolutionSummary(
  urgencyLevel: FeedbackResolutionSummary["urgencyLevel"] = "NORMAL",
  overrides: Partial<FeedbackResolutionSummary> = {},
): FeedbackResolutionSummary {
  const escalateCount = urgencyLevel === "CRITICAL" ? 1 : 0;
  const retryCount = urgencyLevel === "HIGH" ? 1 : 0;
  const acceptCount = urgencyLevel === "NORMAL" ? 1 : 0;
  return {
    summaryId: "res-sum-001",
    resolvedAt: "2026-03-24T10:00:00.000Z",
    totalDecisions: 1,
    acceptCount,
    retryCount,
    escalateCount,
    rejectCount: 0,
    urgencyLevel,
    summary: `Resolution summary urgency=${urgencyLevel}`,
    summaryHash: `hash-res-${urgencyLevel}`,
    ...overrides,
  };
}

function makeRequest(
  resolutionSummaries: FeedbackResolutionSummary[] = [makeResolutionSummary()],
  overrides: Partial<ExecutionReintakeSummaryConsumerPipelineRequest> = {},
): ExecutionReintakeSummaryConsumerPipelineRequest {
  return { resolutionSummaries, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExecutionReintakeSummaryConsumerPipelineContract", () => {
  it("returns a result with all required fields for ACCEPT (NORMAL urgency)", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.reintakeSummary).toBeDefined();
    expect(result.reintakeSummary.dominantReintakeAction).toBe("ACCEPT");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query: [reintake-summary] dominantAction — N request(s)", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeResolutionSummary("NORMAL")]));

    expect(result.consumerPackage.query).toBe("[reintake-summary] ACCEPT — 1 request(s)");
  });

  it("query is bounded at 120 chars", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const manyItems = Array.from({ length: 999 }, () => makeResolutionSummary("NORMAL"));
    const result = contract.execute(makeRequest(manyItems));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals reintakeSummary.summaryId", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.reintakeSummary.summaryId);
  });

  it("CRITICAL urgency produces REPLAN dominant action and warning", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeResolutionSummary("CRITICAL")]));

    expect(result.reintakeSummary.dominantReintakeAction).toBe("REPLAN");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[execution-reintake-summary] dominant action REPLAN");
    expect(result.warnings[0]).toContain("full replanning required");
  });

  it("HIGH urgency produces RETRY dominant action and warning", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeResolutionSummary("HIGH")]));

    expect(result.reintakeSummary.dominantReintakeAction).toBe("RETRY");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[execution-reintake-summary] dominant action RETRY");
    expect(result.warnings[0]).toContain("retry queued");
  });

  it("NORMAL urgency produces ACCEPT dominant action and no warnings", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([makeResolutionSummary("NORMAL")]));

    expect(result.reintakeSummary.dominantReintakeAction).toBe("ACCEPT");
    expect(result.warnings).toEqual([]);
  });

  it("CRITICAL dominates NORMAL (REPLAN > ACCEPT)", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeResolutionSummary("CRITICAL"),
      makeResolutionSummary("NORMAL"),
    ]));

    expect(result.reintakeSummary.dominantReintakeAction).toBe("REPLAN");
  });

  it("CRITICAL dominates HIGH (REPLAN > RETRY)", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([
      makeResolutionSummary("HIGH"),
      makeResolutionSummary("CRITICAL"),
    ]));

    expect(result.reintakeSummary.dominantReintakeAction).toBe("REPLAN");
  });

  it("empty resolutionSummaries produce ACCEPT dominant action and no warnings", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest([]));

    expect(result.reintakeSummary.totalRequests).toBe(0);
    expect(result.reintakeSummary.dominantReintakeAction).toBe("ACCEPT");
    expect(result.warnings).toEqual([]);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("consumerId is preserved when provided", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(
      makeRequest([makeResolutionSummary()], { consumerId: "consumer-abc" }),
    );

    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.reintakeSummary.summaryHash).toBe(r2.reintakeSummary.summaryHash);
  });

  it("different urgency produces different hashes", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest([makeResolutionSummary("NORMAL")]));
    const r2 = contract.execute(makeRequest([makeResolutionSummary("CRITICAL")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(ExecutionReintakeSummaryConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new ExecutionReintakeSummaryConsumerPipelineContract({ now });
    const via = createExecutionReintakeSummaryConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("passes typed candidate items through to the consumer pipeline", () => {
    const contract = createExecutionReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(
      makeRequest([makeResolutionSummary("NORMAL")], {
        candidateItems: [
          {
            itemId: "item-typed-1",
            title: "Typed Item",
            source: "epf-test",
            content: "typed candidate",
            relevanceScore: 0.9,
          },
        ],
      }),
    );

    expect(result.consumerPackage.rankedKnowledgeResult.items[0]?.itemId).toBe("item-typed-1");
  });
});
