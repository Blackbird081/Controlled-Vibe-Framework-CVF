import { describe, it, expect } from "vitest";
import {
  GovernanceAuditLogConsumerPipelineBatchContract,
  createGovernanceAuditLogConsumerPipelineBatchContract,
} from "../src/governance.audit.log.consumer.pipeline.batch.contract";
import { createGovernanceAuditLogConsumerPipelineContract } from "../src/governance.audit.log.consumer.pipeline.contract";
import type { GovernanceAuditLogConsumerPipelineResult } from "../src/governance.audit.log.consumer.pipeline.contract";
import type { GovernanceAuditSignal, AuditTrigger } from "../src/governance.audit.signal.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeSignal(trigger: AuditTrigger, idx = 0): GovernanceAuditSignal {
  return {
    signalId: `signal-${trigger}-${idx}`,
    issuedAt: FIXED_NOW,
    sourceAlertLogId: `alert-log-${trigger}-${idx}`,
    auditTrigger: trigger,
    triggerRationale: `Trigger=${trigger}. Batch test signal index=${idx}.`,
    signalHash: `hash-signal-${trigger}-${idx}`,
  };
}

function makeResult(trigger: AuditTrigger): GovernanceAuditLogConsumerPipelineResult {
  const cp1 = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
  return cp1.execute({ signals: [makeSignal(trigger)] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceAuditLogConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceAuditLogConsumerPipelineBatchContract);
  });

  it("empty batch returns totalResults = 0", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
  });

  it("empty batch returns dominantTokenBudget = 0", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch returns valid batchHash and batchId", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("ROUTINE")]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("criticalThresholdResultCount counts CRITICAL_THRESHOLD results", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("CRITICAL_THRESHOLD"),
      makeResult("CRITICAL_THRESHOLD"),
      makeResult("ALERT_ACTIVE"),
    ]);
    expect(batch.criticalThresholdResultCount).toBe(2);
  });

  it("alertActiveResultCount counts ALERT_ACTIVE results", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("ALERT_ACTIVE"),
      makeResult("ROUTINE"),
    ]);
    expect(batch.alertActiveResultCount).toBe(1);
  });

  it("ROUTINE and NO_ACTION results do not increment either counter", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("ROUTINE"),
      makeResult("NO_ACTION"),
    ]);
    expect(batch.criticalThresholdResultCount).toBe(0);
    expect(batch.alertActiveResultCount).toBe(0);
  });

  it("dominantTokenBudget equals max of estimatedTokens across results", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult("CRITICAL_THRESHOLD");
    const r2 = makeResult("ROUTINE");
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("totalResults matches input array length", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult("CRITICAL_THRESHOLD"),
      makeResult("ALERT_ACTIVE"),
      makeResult("ROUTINE"),
    ]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const results = [makeResult("ALERT_ACTIVE"), makeResult("NO_ACTION")];
    const batch = contract.batch(results);
    expect(batch.results).toHaveLength(2);
  });

  it("createdAt matches injected now", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult("ROUTINE")]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("identical inputs produce the same batchHash (determinism)", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const r = makeResult("CRITICAL_THRESHOLD");
    const b1 = contract.batch([r]);
    const b2 = contract.batch([r]);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different trigger sets produce different batchHashes", () => {
    const contract = createGovernanceAuditLogConsumerPipelineBatchContract({ now: fixedNow });
    const b1 = contract.batch([makeResult("CRITICAL_THRESHOLD")]);
    const b2 = contract.batch([makeResult("ROUTINE")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});
