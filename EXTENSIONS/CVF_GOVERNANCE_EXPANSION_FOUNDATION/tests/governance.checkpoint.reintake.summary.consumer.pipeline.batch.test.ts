import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract,
  createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract,
} from "../src/governance.checkpoint.reintake.summary.consumer.pipeline.batch.contract";
import { createGovernanceCheckpointReintakeSummaryConsumerPipelineContract } from "../src/governance.checkpoint.reintake.summary.consumer.pipeline.contract";
import type { GovernanceCheckpointReintakeSummaryConsumerPipelineResult } from "../src/governance.checkpoint.reintake.summary.consumer.pipeline.contract";
import type { CheckpointReintakeRequest } from "../src/governance.checkpoint.reintake.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReintakeRequest(
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

function makeResult(
  scope: CheckpointReintakeRequest["reintakeScope"] = "NONE",
  index = 0,
): GovernanceCheckpointReintakeSummaryConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineContract({ now: () => ts });
  return contract.execute({ requests: [makeReintakeRequest(scope, `r-${index}`)] });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0, counts are 0", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.immediateResultCount).toBe(0);
    expect(batch.deferredResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("immediateResultCount counts IMMEDIATE dominant scope results", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("IMMEDIATE", 0),
      makeResult("NONE", 1),
      makeResult("IMMEDIATE", 2),
    ]);

    expect(batch.immediateResultCount).toBe(2);
    expect(batch.deferredResultCount).toBe(0);
  });

  it("deferredResultCount counts DEFERRED dominant scope results", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("DEFERRED", 0),
      makeResult("NONE", 1),
      makeResult("DEFERRED", 2),
    ]);

    expect(batch.deferredResultCount).toBe(2);
    expect(batch.immediateResultCount).toBe(0);
  });

  it("mixed scopes — immediateResultCount and deferredResultCount are independent", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("IMMEDIATE", 0),
      makeResult("DEFERRED", 1),
      makeResult("NONE", 2),
    ]);

    expect(batch.immediateResultCount).toBe(1);
    expect(batch.deferredResultCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("both counts are 0 for all NONE results", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("NONE", 0),
      makeResult("NONE", 1),
    ]);

    expect(batch.immediateResultCount).toBe(0);
    expect(batch.deferredResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("NONE", 0), makeResult("IMMEDIATE", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("NONE", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("NONE", 0),
      makeResult("IMMEDIATE", 1),
      makeResult("DEFERRED", 2),
    ]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("NONE", 0), makeResult("IMMEDIATE", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].reintakeSummary.dominantScope).toBe("NONE");
    expect(batch.results[1].reintakeSummary.dominantScope).toBe("IMMEDIATE");
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now });
    const via = createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract({ now });

    const results = [makeResult("NONE", 0)];
    const b1 = direct.batch(results);
    const b2 = via.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
  });
});
