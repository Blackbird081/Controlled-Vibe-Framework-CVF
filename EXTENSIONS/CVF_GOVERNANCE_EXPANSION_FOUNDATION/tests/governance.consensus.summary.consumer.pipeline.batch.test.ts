import { describe, it, expect } from "vitest";
import {
  GovernanceConsensusSummaryConsumerPipelineBatchContract,
  createGovernanceConsensusSummaryConsumerPipelineBatchContract,
} from "../src/governance.consensus.summary.consumer.pipeline.batch.contract";
import { createGovernanceConsensusSummaryConsumerPipelineContract } from "../src/governance.consensus.summary.consumer.pipeline.contract";
import type { GovernanceConsensusSummaryConsumerPipelineResult } from "../src/governance.consensus.summary.consumer.pipeline.contract";
import type { ConsensusDecision } from "../src/governance.consensus.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(
  verdict: ConsensusDecision["verdict"] = "PROCEED",
  id = "decision-001",
): ConsensusDecision {
  return {
    decisionId: id,
    issuedAt: "2026-03-24T10:00:00.000Z",
    verdict,
    criticalCount: verdict === "ESCALATE" ? 2 : verdict === "PAUSE" ? 1 : 0,
    alertActiveCount: verdict !== "PROCEED" ? 1 : 0,
    totalSignals: 3,
    consensusScore: verdict === "ESCALATE" ? 66.67 : verdict === "PAUSE" ? 33.33 : 0,
    decisionHash: `hash-${id}`,
  };
}

function makeResult(
  verdict: ConsensusDecision["verdict"] = "PROCEED",
  index = 0,
): GovernanceConsensusSummaryConsumerPipelineResult {
  const ts = `2026-03-24T10:0${index}:00.000Z`;
  const contract = createGovernanceConsensusSummaryConsumerPipelineContract({ now: () => ts });
  return contract.execute({ decisions: [makeDecision(verdict, `d-${index}`)] });
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceConsensusSummaryConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(GovernanceConsensusSummaryConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.totalResults).toBe(0);
    expect(batch.escalateResultCount).toBe(0);
    expect(batch.pauseResultCount).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult()]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("escalateResultCount counts ESCALATE dominant verdict results", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("PROCEED", 1),
      makeResult("ESCALATE", 2),
    ]);

    expect(batch.escalateResultCount).toBe(2);
    expect(batch.pauseResultCount).toBe(0);
  });

  it("pauseResultCount counts PAUSE dominant verdict results", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("PAUSE", 0),
      makeResult("PROCEED", 1),
      makeResult("PAUSE", 2),
    ]);

    expect(batch.pauseResultCount).toBe(2);
    expect(batch.escalateResultCount).toBe(0);
  });

  it("mixed verdicts — escalateResultCount and pauseResultCount are independent", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("ESCALATE", 0),
      makeResult("PAUSE", 1),
      makeResult("PROCEED", 2),
    ]);

    expect(batch.escalateResultCount).toBe(1);
    expect(batch.pauseResultCount).toBe(1);
    expect(batch.totalResults).toBe(3);
  });

  it("escalateResultCount and pauseResultCount are 0 for all PROCEED results", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("PROCEED", 0),
      makeResult("PROCEED", 1),
    ]);

    expect(batch.escalateResultCount).toBe(0);
    expect(batch.pauseResultCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    const expected = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("totalResults matches input length", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([
      makeResult("PROCEED", 0),
      makeResult("ESCALATE", 1),
      makeResult("PAUSE", 2),
    ]);

    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("PROCEED", 0), makeResult("ESCALATE", 1)];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].consensusSummary.dominantVerdict).toBe("PROCEED");
    expect(batch.results[1].consensusSummary.dominantVerdict).toBe("ESCALATE");
  });

  it("createdAt matches injected now", () => {
    const ts = "2026-03-24T12:00:00.000Z";
    const contract = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now: fixedNow(ts) });
    const batch = contract.batch([]);

    expect(batch.createdAt).toBe(ts);
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new GovernanceConsensusSummaryConsumerPipelineBatchContract({ now });
    const via = createGovernanceConsensusSummaryConsumerPipelineBatchContract({ now });

    const results = [makeResult("PROCEED", 0)];
    const b1 = direct.batch(results);
    const b2 = via.batch(results);

    expect(b1.batchHash).toBe(b2.batchHash);
  });
});
