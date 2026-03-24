import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointConsumerPipelineContract,
  createGovernanceCheckpointConsumerPipelineContract,
} from "../src/governance.checkpoint.consumer.pipeline.contract";
import type {
  GovernanceCheckpointConsumerPipelineRequest,
  GovernanceCheckpointConsumerPipelineResult,
} from "../src/governance.checkpoint.consumer.pipeline.contract";
import type { GovernanceConsensusSummary } from "../src/governance.consensus.summary.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSummary(
  dominantVerdict: GovernanceConsensusSummary["dominantVerdict"],
  opts: Partial<GovernanceConsensusSummary> = {},
): GovernanceConsensusSummary {
  return {
    summaryId: `summary-${dominantVerdict}`,
    createdAt: FIXED_NOW,
    totalDecisions: 3,
    proceedCount: dominantVerdict === "PROCEED" ? 3 : 0,
    pauseCount: dominantVerdict === "PAUSE" ? 3 : 0,
    escalateCount: dominantVerdict === "ESCALATE" ? 3 : 0,
    dominantVerdict,
    summaryHash: `hash-summary-${dominantVerdict}`,
    ...opts,
  };
}

function makeContract(): GovernanceCheckpointConsumerPipelineContract {
  return createGovernanceCheckpointConsumerPipelineContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceCheckpointConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("checkpointDecision");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("PROCEED action — no warnings", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.checkpointDecision.checkpointAction).toBe("PROCEED");
    expect(result.warnings).toHaveLength(0);
  });

  it("HALT action (from PAUSE verdict) — warnings contain halt message", () => {
    const result = makeContract().execute({ summary: makeSummary("PAUSE") });
    expect(result.checkpointDecision.checkpointAction).toBe("HALT");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[checkpoint]");
    expect(result.warnings[0]).toContain("halt");
  });

  it("ESCALATE action (from ESCALATE verdict) — warnings contain escalate message", () => {
    const result = makeContract().execute({ summary: makeSummary("ESCALATE") });
    expect(result.checkpointDecision.checkpointAction).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[checkpoint]");
    expect(result.warnings[0]).toContain("escalat");
  });

  it("ESCALATE warning references immediate escalation", () => {
    const result = makeContract().execute({ summary: makeSummary("ESCALATE") });
    expect(result.warnings[0]).toContain("immediate escalation");
  });

  it("HALT warning references halt pending review", () => {
    const result = makeContract().execute({ summary: makeSummary("PAUSE") });
    expect(result.warnings[0]).toContain("pending review");
  });

  it("query is derived from checkpointRationale and is at most 120 chars", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.consumerPackage.query).toBe(
      result.checkpointDecision.checkpointRationale.slice(0, 120),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches checkpointDecision.checkpointId", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.consumerPackage.contextId).toBe(
      result.checkpointDecision.checkpointId,
    );
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req: GovernanceCheckpointConsumerPipelineRequest = {
      summary: makeSummary("PROCEED"),
    };
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different verdicts produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({ summary: makeSummary("PROCEED") });
    const r2 = contract.execute({ summary: makeSummary("ESCALATE") });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      summary: makeSummary("PROCEED"),
      candidateItems: [
        { itemId: "item-1", content: "checkpoint item", relevanceScore: 0.9 },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      summary: makeSummary("PROCEED"),
      consumerId: "consumer-xyz",
    });
    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute({ summary: makeSummary("PROCEED") });
    expect(result.consumerId).toBeUndefined();
  });

  it("checkpointDecision carries dominantVerdictRef from summary", () => {
    const result = makeContract().execute({ summary: makeSummary("ESCALATE") });
    expect(result.checkpointDecision.dominantVerdictRef).toBe("ESCALATE");
  });
});
