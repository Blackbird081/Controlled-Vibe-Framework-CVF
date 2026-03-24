import { describe, it, expect } from "vitest";
import {
  GovernanceCheckpointReintakeConsumerPipelineContract,
  createGovernanceCheckpointReintakeConsumerPipelineContract,
} from "../src/governance.checkpoint.reintake.consumer.pipeline.contract";
import type {
  GovernanceCheckpointReintakeConsumerPipelineRequest,
} from "../src/governance.checkpoint.reintake.consumer.pipeline.contract";
import type { GovernanceCheckpointDecision, CheckpointAction } from "../src/governance.checkpoint.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeDecision(action: CheckpointAction): GovernanceCheckpointDecision {
  return {
    checkpointId: `checkpoint-${action}`,
    generatedAt: FIXED_NOW,
    sourceConsensusSummaryId: `summary-${action}`,
    checkpointAction: action,
    checkpointRationale: `CheckpointAction=${action}. Governance consensus resolved for testing.`,
    dominantVerdictRef: action === "ESCALATE" ? "ESCALATE" : action === "HALT" ? "PAUSE" : "PROCEED",
    totalDecisionsRef: 3,
    checkpointHash: `hash-checkpoint-${action}`,
  };
}

function makeContract(): GovernanceCheckpointReintakeConsumerPipelineContract {
  return createGovernanceCheckpointReintakeConsumerPipelineContract({ now: fixedNow });
}

function makeRequest(action: CheckpointAction): GovernanceCheckpointReintakeConsumerPipelineRequest {
  return { decision: makeDecision(action) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceCheckpointReintakeConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceCheckpointReintakeConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceCheckpointReintakeConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("reintakeRequest");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("PROCEED action — reintakeTrigger is NO_REINTAKE, reintakeScope is NONE", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.reintakeRequest.reintakeTrigger).toBe("NO_REINTAKE");
    expect(result.reintakeRequest.reintakeScope).toBe("NONE");
  });

  it("PROCEED action — no warnings", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.warnings).toHaveLength(0);
  });

  it("HALT action — reintakeTrigger is HALT_REVIEW_PENDING, reintakeScope is DEFERRED", () => {
    const result = makeContract().execute(makeRequest("HALT"));
    expect(result.reintakeRequest.reintakeTrigger).toBe("HALT_REVIEW_PENDING");
    expect(result.reintakeRequest.reintakeScope).toBe("DEFERRED");
  });

  it("HALT action — warning contains [reintake] halt message", () => {
    const result = makeContract().execute(makeRequest("HALT"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[reintake]");
    expect(result.warnings[0]).toContain("halt");
  });

  it("HALT warning references deferred re-intake pending review", () => {
    const result = makeContract().execute(makeRequest("HALT"));
    expect(result.warnings[0]).toContain("deferred");
    expect(result.warnings[0]).toContain("pending review");
  });

  it("ESCALATE action — reintakeTrigger is ESCALATION_REQUIRED, reintakeScope is IMMEDIATE", () => {
    const result = makeContract().execute(makeRequest("ESCALATE"));
    expect(result.reintakeRequest.reintakeTrigger).toBe("ESCALATION_REQUIRED");
    expect(result.reintakeRequest.reintakeScope).toBe("IMMEDIATE");
  });

  it("ESCALATE action — warning contains [reintake] escalation message", () => {
    const result = makeContract().execute(makeRequest("ESCALATE"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[reintake]");
    expect(result.warnings[0]).toContain("escalation");
  });

  it("ESCALATE warning references immediate re-intake triggered", () => {
    const result = makeContract().execute(makeRequest("ESCALATE"));
    expect(result.warnings[0]).toContain("immediate");
    expect(result.warnings[0]).toContain("re-intake");
  });

  it("query contains reintakeTrigger and reintakeScope", () => {
    const result = makeContract().execute(makeRequest("ESCALATE"));
    const q = result.consumerPackage.query;
    expect(q).toContain("ESCALATION_REQUIRED");
    expect(q).toContain("IMMEDIATE");
  });

  it("query is at most 120 chars", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches reintakeRequest.reintakeId", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.consumerPackage.contextId).toBe(result.reintakeRequest.reintakeId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req = makeRequest("ESCALATE");
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different actions produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest("PROCEED"));
    const r2 = contract.execute(makeRequest("ESCALATE"));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      decision: makeDecision("PROCEED"),
      candidateItems: [
        { itemId: "item-1", title: "Reintake Item", content: "reintake item", source: "test", relevanceScore: 0.9 },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      decision: makeDecision("PROCEED"),
      consumerId: "consumer-reintake-test",
    });
    expect(result.consumerId).toBe("consumer-reintake-test");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(makeRequest("PROCEED"));
    expect(result.consumerId).toBeUndefined();
  });

  it("reintakeRequest.sourceCheckpointId matches decision.checkpointId", () => {
    const decision = makeDecision("ESCALATE");
    const result = makeContract().execute({ decision });
    expect(result.reintakeRequest.sourceCheckpointId).toBe(decision.checkpointId);
  });

  it("reintakeRequest.checkpointActionRef matches decision.checkpointAction", () => {
    const result = makeContract().execute(makeRequest("HALT"));
    expect(result.reintakeRequest.checkpointActionRef).toBe("HALT");
  });
});
