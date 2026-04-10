import { describe, it, expect } from "vitest";
import {
  GovernanceConsensusConsumerPipelineBatchContract,
  createGovernanceConsensusConsumerPipelineBatchContract,
} from "../src/governance.consensus.consumer.pipeline.batch.contract";
import {
  createGovernanceConsensusConsumerPipelineContract,
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

function makePipelineResult(
  trigger: GovernanceAuditSignal["auditTrigger"],
  idx = 0,
) {
  const pipeline = createGovernanceConsensusConsumerPipelineContract({
    now: fixedNow,
  });
  return pipeline.execute({
    signals: [makeSignal(trigger, idx)],
    candidateItems: [
      {
        itemId: `item-${idx}`,
        title: `Item ${idx}`,
        content: `content-${idx}`,
        relevanceScore: 0.5 + idx * 0.1,
        source: "test",
      },
    ],
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceConsensusConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(
      GovernanceConsensusConsumerPipelineBatchContract,
    );
  });

  it("empty batch — valid result with dominantTokenBudget = 0", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
  });

  it("single result batch — totalResults = 1", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const result = makePipelineResult("ROUTINE", 0);
    const batch = contract.batch([result]);
    expect(batch.totalResults).toBe(1);
    expect(batch.results).toHaveLength(1);
  });

  it("multi-result batch — totalResults matches input", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("ROUTINE", 0),
      makePipelineResult("ALERT_ACTIVE", 1),
      makePipelineResult("CRITICAL_THRESHOLD", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("ROUTINE", 0),
      makePipelineResult("CRITICAL_THRESHOLD", 1),
    ];
    const expected = Math.max(
      ...results.map(
        (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
      ),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("escalationCount counts ESCALATE verdicts", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("CRITICAL_THRESHOLD", 0),
      makePipelineResult("CRITICAL_THRESHOLD", 1),
      makePipelineResult("ROUTINE", 2),
    ];
    const batch = contract.batch(results);
    expect(batch.escalationCount).toBe(2);
  });

  it("pauseCount counts PAUSE verdicts", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [
      makePipelineResult("ALERT_ACTIVE", 0),
      makePipelineResult("ROUTINE", 1),
    ];
    const batch = contract.batch(results);
    expect(batch.pauseCount).toBe(1);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([makePipelineResult("ROUTINE", 0)]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("is deterministic — same results yield same batchHash", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const results = [makePipelineResult("ROUTINE", 0)];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("createdAt matches injected now", () => {
    const contract = createGovernanceConsensusConsumerPipelineBatchContract({
      now: fixedNow,
    });
    const batch = contract.batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
