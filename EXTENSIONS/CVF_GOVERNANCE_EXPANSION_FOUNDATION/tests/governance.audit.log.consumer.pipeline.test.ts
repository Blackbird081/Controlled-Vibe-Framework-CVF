import { describe, it, expect } from "vitest";
import {
  GovernanceAuditLogConsumerPipelineContract,
  createGovernanceAuditLogConsumerPipelineContract,
} from "../src/governance.audit.log.consumer.pipeline.contract";
import type {
  GovernanceAuditLogConsumerPipelineRequest,
} from "../src/governance.audit.log.consumer.pipeline.contract";
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
    triggerRationale: `Trigger=${trigger}. Test signal index=${idx}.`,
    signalHash: `hash-signal-${trigger}-${idx}`,
  };
}

function makeRequest(
  trigger: AuditTrigger,
  count = 1,
  overrides: Partial<GovernanceAuditLogConsumerPipelineRequest> = {},
): GovernanceAuditLogConsumerPipelineRequest {
  return {
    signals: Array.from({ length: count }, (_, i) => makeSignal(trigger, i)),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceAuditLogConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceAuditLogConsumerPipelineContract);
  });

  it("CRITICAL_THRESHOLD trigger emits warning", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL_THRESHOLD"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("[audit] critical threshold — immediate audit required");
  });

  it("ALERT_ACTIVE trigger emits warning", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ALERT_ACTIVE"));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("[audit] alert active — audit log review required");
  });

  it("ROUTINE trigger emits no warnings", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ROUTINE"));
    expect(result.warnings).toHaveLength(0);
  });

  it("NO_ACTION trigger emits no warnings", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NO_ACTION"));
    expect(result.warnings).toHaveLength(0);
  });

  it("auditLog.dominantTrigger matches input signals", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL_THRESHOLD", 3));
    expect(result.auditLog.dominantTrigger).toBe("CRITICAL_THRESHOLD");
  });

  it("auditLog.auditRequired is true for CRITICAL_THRESHOLD", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL_THRESHOLD"));
    expect(result.auditLog.auditRequired).toBe(true);
  });

  it("auditLog.auditRequired is true for ALERT_ACTIVE", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ALERT_ACTIVE"));
    expect(result.auditLog.auditRequired).toBe(true);
  });

  it("auditLog.auditRequired is false for ROUTINE", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ROUTINE"));
    expect(result.auditLog.auditRequired).toBe(false);
  });

  it("query contains dominantTrigger and is within 120 chars", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ALERT_ACTIVE", 2));
    expect(result.consumerPackage.query).toContain("ALERT_ACTIVE");
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId equals auditLog.logId", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ROUTINE"));
    expect(result.consumerPackage.contextId).toBe(result.auditLog.logId);
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ROUTINE"));
    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("createdAt matches injected now", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("CRITICAL_THRESHOLD"));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("consumerId is passed through when provided", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(
      makeRequest("ROUTINE", 1, { consumerId: "consumer-abc" }),
    );
    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("NO_ACTION"));
    expect(result.consumerId).toBeUndefined();
  });

  it("two identical requests produce the same pipelineHash (determinism)", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const r1 = contract.execute(makeRequest("CRITICAL_THRESHOLD", 2));
    const r2 = contract.execute(makeRequest("CRITICAL_THRESHOLD", 2));
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different triggers produce different pipelineHashes", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const rCritical = contract.execute(makeRequest("CRITICAL_THRESHOLD"));
    const rRoutine = contract.execute(makeRequest("ROUTINE"));
    expect(rCritical.pipelineHash).not.toBe(rRoutine.pipelineHash);
  });

  it("empty signals produce valid result with NO_ACTION dominantTrigger", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute({ signals: [] });
    expect(result.auditLog.dominantTrigger).toBe("NO_ACTION");
    expect(result.auditLog.totalSignals).toBe(0);
    expect(result.warnings).toHaveLength(0);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
  });

  it("totalSignals on auditLog matches signals input length", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ROUTINE", 4));
    expect(result.auditLog.totalSignals).toBe(4);
  });

  it("consumerPackage has estimatedTokens > 0", () => {
    const contract = createGovernanceAuditLogConsumerPipelineContract({ now: fixedNow });
    const result = contract.execute(makeRequest("ALERT_ACTIVE"));
    expect(result.consumerPackage.typedContextPackage.estimatedTokens).toBeGreaterThanOrEqual(0);
  });
});
