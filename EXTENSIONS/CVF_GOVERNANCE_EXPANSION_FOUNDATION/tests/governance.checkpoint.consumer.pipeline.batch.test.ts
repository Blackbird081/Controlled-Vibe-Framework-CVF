import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointConsumerPipelineBatchContract,
  createGovernanceCheckpointConsumerPipelineBatchContract,
} from "../src/governance.checkpoint.consumer.pipeline.batch.contract";
import { createGovernanceCheckpointConsumerPipelineContract } from "../src/governance.checkpoint.consumer.pipeline.contract";
import type { GovernanceConsensusSummary } from "../src/governance.consensus.summary.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSummary(
  dominantVerdict: GovernanceConsensusSummary["dominantVerdict"],
  idx = 0,
): GovernanceConsensusSummary {
  return {
    summaryId: `summary-${dominantVerdict}-${idx}`,
    createdAt: FIXED_NOW,
    totalDecisions: 3,
    proceedCount: dominantVerdict === "PROCEED" ? 3 : 0,
    pauseCount: dominantVerdict === "PAUSE" ? 3 : 0,
    escalateCount: dominantVerdict === "ESCALATE" ? 3 : 0,
    dominantVerdict,
    summaryHash: `hash-summary-${dominantVerdict}-${idx}`,
  };
}

function makeResult(dominantVerdict: GovernanceConsensusSummary["dominantVerdict"], idx = 0) {
  const pipeline = createGovernanceCheckpointConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ summary: makeSummary(dominantVerdict, idx) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceCheckpointConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED")]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("haltCount counts HALT actions correctly", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("PAUSE", 0),
      makeResult("PAUSE", 1),
      makeResult("PROCEED", 2),
    ]);
    expect(batch.haltCount).toBe(2);
  });

  it("escalateCount counts ESCALATE actions correctly", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("PROCEED", 1),
    ]);
    expect(batch.escalateCount).toBe(1);
  });

  it("haltCount and escalateCount are 0 for all PROCEED results", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED", 0), makeResult("PROCEED", 1)]);
    expect(batch.haltCount).toBe(0);
    expect(batch.escalateCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
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
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED")]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("PROCEED", 0), makeResult("PAUSE", 1), makeResult("ESCALATE", 2)]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceCheckpointConsumerPipelineBatchContract({ now: fixedNow });
    const input = [makeResult("PROCEED"), makeResult("PAUSE", 1)];
    const batch = contract.batch(input);
    expect(batch.results).toHaveLength(2);
  });
});
