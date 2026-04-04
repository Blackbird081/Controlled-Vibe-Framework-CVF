import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointReintakeSummaryConsumerPipelineContract,
  createGovernanceCheckpointReintakeSummaryConsumerPipelineContract,
} from "../src/governance.checkpoint.reintake.summary.consumer.pipeline.contract";
import type { GovernanceCheckpointReintakeSummaryConsumerPipelineRequest } from "../src/governance.checkpoint.reintake.summary.consumer.pipeline.contract";
import type { CheckpointReintakeRequest } from "../src/governance.checkpoint.reintake.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  scope: CheckpointReintakeRequest["reintakeScope"] = "NONE",
  id = "reintake-001",
): CheckpointReintakeRequest {
  return {
    reintakeId: id,
    generatedAt: "2026-03-24T10:00:00.000Z",
    sourceCheckpointId: `checkpoint-${id}`,
    reintakeTrigger: scope === "IMMEDIATE" ? "ESCALATION_REQUIRED" : scope === "DEFERRED" ? "HALT_REVIEW_PENDING" : "NO_REINTAKE",
    reintakeScope: scope,
    reintakeRationale: `rationale-${scope}`,
    checkpointActionRef: scope === "IMMEDIATE" ? "ESCALATE" : scope === "DEFERRED" ? "HALT" : "PROCEED",
    reintakeHash: `hash-${id}`,
  };
}

function makeExecuteRequest(
  reintakeRequests: CheckpointReintakeRequest[] = [makeRequest("NONE")],
  overrides: Partial<GovernanceCheckpointReintakeSummaryConsumerPipelineRequest> = {},
): GovernanceCheckpointReintakeSummaryConsumerPipelineRequest {
  return { requests: reintakeRequests, ...overrides };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointReintakeSummaryConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceCheckpointReintakeSummaryConsumerPipelineContract);
  });

  it("returns all required fields for NONE scope (no warnings)", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([makeRequest("NONE")]));

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.reintakeSummary).toBeDefined();
    expect(result.reintakeSummary.dominantScope).toBe("NONE");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("IMMEDIATE dominant scope produces warning — immediate reintake required", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([
      makeRequest("IMMEDIATE", "r-1"),
      makeRequest("IMMEDIATE", "r-2"),
      makeRequest("NONE", "r-3"),
    ]));

    expect(result.reintakeSummary.dominantScope).toBe("IMMEDIATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-reintake-summary] dominant scope IMMEDIATE");
    expect(result.warnings[0]).toContain("immediate reintake required");
  });

  it("DEFERRED dominant scope produces warning — deferred reintake scheduled", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([
      makeRequest("DEFERRED", "r-1"),
      makeRequest("DEFERRED", "r-2"),
      makeRequest("NONE", "r-3"),
    ]));

    expect(result.reintakeSummary.dominantScope).toBe("DEFERRED");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[governance-reintake-summary] dominant scope DEFERRED");
    expect(result.warnings[0]).toContain("deferred reintake scheduled");
  });

  it("NONE-only requests produce no warnings", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([
      makeRequest("NONE", "r-1"),
      makeRequest("NONE", "r-2"),
    ]));

    expect(result.reintakeSummary.dominantScope).toBe("NONE");
    expect(result.warnings).toEqual([]);
  });

  it("IMMEDIATE takes priority over DEFERRED (severity-first)", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([
      makeRequest("DEFERRED", "r-1"),
      makeRequest("IMMEDIATE", "r-2"),
      makeRequest("NONE", "r-3"),
    ]));

    expect(result.reintakeSummary.dominantScope).toBe("IMMEDIATE");
    expect(result.warnings[0]).toContain("IMMEDIATE");
  });

  it("query is derived from dominantScope and totalRequests (sliced to 120)", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([makeRequest("NONE")]));

    expect(result.consumerPackage.query).toContain("[reintake-summary]");
    expect(result.consumerPackage.query).toContain("NONE");
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals reintakeSummary.summaryId", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest());

    expect(result.consumerPackage.contextId).toBe(result.reintakeSummary.summaryId);
  });

  it("reintakeSummary reflects correct counts", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([
      makeRequest("IMMEDIATE", "r-1"),
      makeRequest("DEFERRED", "r-2"),
      makeRequest("NONE", "r-3"),
    ]));

    expect(result.reintakeSummary.totalRequests).toBe(3);
    expect(result.reintakeSummary.immediateCount).toBe(1);
    expect(result.reintakeSummary.deferredCount).toBe(1);
    expect(result.reintakeSummary.noReintakeCount).toBe(1);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest([makeRequest()], { consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("consumerPackage contains estimatedTokens", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeExecuteRequest());

    expect(typeof result.consumerPackage.typedContextPackage.estimatedTokens).toBe("number");
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeExecuteRequest([makeRequest("NONE")]));
    const r2 = contract.execute(makeExecuteRequest([makeRequest("NONE")]));

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.reintakeSummary.summaryHash).toBe(r2.reintakeSummary.summaryHash);
  });

  it("different scope produces different pipelineHash", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeExecuteRequest([makeRequest("NONE", "r-1")]));
    const r2 = contract.execute(makeExecuteRequest([makeRequest("IMMEDIATE", "r-1")]));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now });
    const via = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now });

    const r1 = direct.execute(makeExecuteRequest());
    const r2 = via.execute(makeExecuteRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: fixedNow(ts) });
    const result = contract.execute(makeExecuteRequest());

    expect(result.createdAt).toBe(ts);
  });
});
