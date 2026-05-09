import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointReintakeConsumerPipelineBatchContract,
  createGovernanceCheckpointReintakeConsumerPipelineBatchContract,
} from "../src/governance.checkpoint.reintake.consumer.pipeline.batch.contract";
import { createGovernanceCheckpointReintakeConsumerPipelineContract } from "../src/governance.checkpoint.reintake.consumer.pipeline.contract";
import type { GovernanceCheckpointDecision, CheckpointAction } from "../src/governance.checkpoint.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeDecision(action: CheckpointAction, idx = 0): GovernanceCheckpointDecision {
  return {
    checkpointId: `checkpoint-${action}-${idx}`,
    generatedAt: FIXED_NOW,
    sourceConsensusSummaryId: `summary-${action}-${idx}`,
    checkpointAction: action,
    checkpointRationale: `CheckpointAction=${action}. Governance consensus resolved for testing. Index=${idx}.`,
    dominantVerdictRef: action === "ESCALATE" ? "ESCALATE" : action === "HALT" ? "PAUSE" : "PROCEED",
    totalDecisionsRef: 3,
    checkpointHash: `hash-checkpoint-${action}-${idx}`,
  };
}

function makeResult(action: CheckpointAction, idx = 0) {
  const pipeline = createGovernanceCheckpointReintakeConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ decision: makeDecision(action, idx) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointReintakeConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceCheckpointReintakeConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED")]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("immediateCount counts ESCALATION_REQUIRED (ESCALATE action) correctly", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("ESCALATE", 1),
      makeResult("PROCEED", 2),
    ]);
    expect(batch.immediateCount).toBe(2);
  });

  it("deferredCount counts HALT_REVIEW_PENDING (HALT action) correctly", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("HALT", 0),
      makeResult("PROCEED", 1),
    ]);
    expect(batch.deferredCount).toBe(1);
  });

  it("noReintakeCount counts NO_REINTAKE (PROCEED action) correctly", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("PROCEED", 0),
      makeResult("PROCEED", 1),
      makeResult("ESCALATE", 2),
    ]);
    expect(batch.noReintakeCount).toBe(2);
  });

  it("all counts are 0 for empty batch", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.immediateCount).toBe(0);
    expect(batch.deferredCount).toBe(0);
    expect(batch.noReintakeCount).toBe(0);
  });

  it("mixed batch — counts sum to totalResults", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("HALT", 1),
      makeResult("PROCEED", 2),
    ]);
    expect(batch.immediateCount + batch.deferredCount + batch.noReintakeCount).toBe(batch.totalResults);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult("PROCEED", 0);
    const r2 = makeResult("ESCALATE", 1);
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("createdAt matches injected now", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED")]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED", 0), makeResult("HALT", 1), makeResult("ESCALATE", 2)]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineBatchContract({ now: fixedNow });
    const input = [makeResult("PROCEED"), makeResult("HALT", 1)];
    const batch = contract.batch(input);
    expect(batch.results).toHaveLength(2);
  });
});
