import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointLogConsumerPipelineBatchContract,
  createGovernanceCheckpointLogConsumerPipelineBatchContract,
} from "../src/governance.checkpoint.log.consumer.pipeline.batch.contract";
import { createGovernanceCheckpointLogConsumerPipelineContract } from "../src/governance.checkpoint.log.consumer.pipeline.contract";
import type { GovernanceCheckpointLogConsumerPipelineResult } from "../src/governance.checkpoint.log.consumer.pipeline.contract";
import type { GovernanceCheckpointDecision } from "../src/governance.checkpoint.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  action: GovernanceCheckpointDecision["checkpointAction"] = "PROCEED",
  id = "checkpoint-001",
): GovernanceCheckpointDecision {
  return {
    checkpointId: id,
    generatedAt: "2026-03-24T10:00:00.000Z",
    sourceConsensusSummaryId: `summary-${id}`,
    checkpointAction: action,
    checkpointRationale: `rationale-${action}`,
    dominantVerdictRef: action === "ESCALATE" ? "ESCALATE" : action === "HALT" ? "PAUSE" : "PROCEED",
    totalDecisionsRef: 3,
    checkpointHash: `hash-${id}`,
  };
}

function makeResult(
  action: GovernanceCheckpointDecision["checkpointAction"] = "PROCEED",
  index = 0,
): GovernanceCheckpointLogConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createGovernanceCheckpointLogConsumerPipelineContract({ now: () => ts });
  return contract.execute({ decisions: [makeDecision(action, `d-${index}`)] });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointLogConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceCheckpointLogConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0, counts are 0", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.escalateResultCount).toBe(0);
    expect(batch.haltResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("escalateResultCount counts ESCALATE dominant action results", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("PROCEED", 1),
      makeResult("ESCALATE", 2),
    ]);

    expect(batch.escalateResultCount).toBe(2);
    expect(batch.haltResultCount).toBe(0);
  });

  it("haltResultCount counts HALT dominant action results", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("HALT", 0),
      makeResult("PROCEED", 1),
      makeResult("HALT", 2),
    ]);

    expect(batch.haltResultCount).toBe(2);
    expect(batch.escalateResultCount).toBe(0);
  });

  it("mixed actions — escalateResultCount and haltResultCount are independent", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("HALT", 1),
      makeResult("PROCEED", 2),
    ]);

    expect(batch.escalateResultCount).toBe(1);
    expect(batch.haltResultCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("escalateResultCount and haltResultCount are 0 for all PROCEED results", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("PROCEED", 0),
      makeResult("PROCEED", 1),
    ]);

    expect(batch.escalateResultCount).toBe(0);
    expect(batch.haltResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("PROCEED", 0),
      makeResult("ESCALATE", 1),
      makeResult("HALT", 2),
    ]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].checkpointLog.dominantCheckpointAction).toBe("PROCEED");
    expect(batch.results[1].checkpointLog.dominantCheckpointAction).toBe("ESCALATE");
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceCheckpointLogConsumerPipelineBatchContract({ now });
    const via = createGovernanceCheckpointLogConsumerPipelineBatchContract({ now });

    const results = [makeResult("PROCEED", 0)];
    const b1 = direct.batch(results);
    const b2 = via.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
  });
});
