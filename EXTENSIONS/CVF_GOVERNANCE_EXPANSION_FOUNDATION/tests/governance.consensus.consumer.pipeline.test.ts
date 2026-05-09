import { describe, it, expect } from "vitest";
import {
  GovernanceConsensusConsumerPipelineContract,
  createGovernanceConsensusConsumerPipelineContract,
} from "../src/governance.consensus.consumer.pipeline.contract";
import type {
  GovernanceConsensusConsumerPipelineRequest,
  GovernanceConsensusConsumerPipelineResult,
} from "../src/governance.consensus.consumer.pipeline.contract";
import type { GovernanceAuditSignal } from "../src/governance.audit.signal.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSignal(
  trigger: GovernanceAuditSignal["auditTrigger"],
  idx = 0,
): GovernanceAuditSignal {
  return {
    signalId: `signal-${idx}`,
    issuedAt: FIXED_NOW,
    sourceAlertLogId: `log-${idx}`,
    auditTrigger: trigger,
    triggerRationale: `trigger=${trigger} idx=${idx}`,
    signalHash: `hash-signal-${idx}`,
  };
}

function makeContract(): GovernanceConsensusConsumerPipelineContract {
  return createGovernanceConsensusConsumerPipelineContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceConsensusConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceConsensusConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceConsensusConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const contract = makeContract();
    const result = contract.execute({ signals: [] });
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("consensusDecision");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute({ signals: [] });
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("PROCEED verdict — no signals — valid result and empty warnings", () => {
    const result = makeContract().execute({ signals: [] });
    expect(result.consensusDecision.verdict).toBe("PROCEED");
    expect(result.warnings).toHaveLength(0);
  });

  it("PROCEED verdict from ROUTINE signals — empty warnings", () => {
    const result = makeContract().execute({
      signals: [makeSignal("ROUTINE", 0), makeSignal("ROUTINE", 1)],
    });
    expect(result.consensusDecision.verdict).toBe("PROCEED");
    expect(result.warnings).toHaveLength(0);
  });

  it("PAUSE verdict — warnings contain pause message", () => {
    const result = makeContract().execute({
      signals: [makeSignal("ALERT_ACTIVE", 0)],
    });
    expect(result.consensusDecision.verdict).toBe("PAUSE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[consensus]");
    expect(result.warnings[0]).toContain("pause");
  });

  it("ESCALATE verdict — warnings contain escalation message", () => {
    const result = makeContract().execute({
      signals: [makeSignal("CRITICAL_THRESHOLD", 0)],
    });
    expect(result.consensusDecision.verdict).toBe("ESCALATE");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[consensus]");
    expect(result.warnings[0]).toContain("escalation");
  });

  it("ESCALATE takes precedence over PAUSE when mixed signals", () => {
    const result = makeContract().execute({
      signals: [
        makeSignal("CRITICAL_THRESHOLD", 0),
        makeSignal("ALERT_ACTIVE", 1),
      ],
    });
    expect(result.consensusDecision.verdict).toBe("ESCALATE");
    expect(result.warnings[0]).toContain("escalation");
  });

  it("consensusDecision has correct criticalCount and totalSignals", () => {
    const result = makeContract().execute({
      signals: [
        makeSignal("CRITICAL_THRESHOLD", 0),
        makeSignal("ROUTINE", 1),
        makeSignal("ALERT_ACTIVE", 2),
      ],
    });
    expect(result.consensusDecision.criticalCount).toBe(1);
    expect(result.consensusDecision.totalSignals).toBe(3);
  });

  it("consumerPackage contextId matches consensusDecision.decisionId", () => {
    const result = makeContract().execute({ signals: [] });
    expect(result.consumerPackage.contextId).toBe(
      result.consensusDecision.decisionId,
    );
  });

  it("consumerPackage query derived from verdict and score", () => {
    const result = makeContract().execute({
      signals: [makeSignal("CRITICAL_THRESHOLD", 0)],
    });
    expect(result.consumerPackage.query).toContain("ESCALATE");
    expect(result.consumerPackage.query).toContain("consensus");
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute({ signals: [] });
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute({ signals: [] });
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const req: GovernanceConsensusConsumerPipelineRequest = {
      signals: [makeSignal("ROUTINE", 0)],
    };
    const r1 = contract.execute(req);
    const r2 = contract.execute(req);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different signals produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({ signals: [makeSignal("ROUTINE", 0)] });
    const r2 = contract.execute({ signals: [makeSignal("CRITICAL_THRESHOLD", 0)] });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems accepted and reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      signals: [makeSignal("ROUTINE", 0)],
      candidateItems: [
        { itemId: "item-1", title: "Consensus Item", content: "consensus item", relevanceScore: 0.9, source: "test" },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      signals: [],
      consumerId: "consumer-abc",
    });
    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute({ signals: [] });
    expect(result.consumerId).toBeUndefined();
  });
});
