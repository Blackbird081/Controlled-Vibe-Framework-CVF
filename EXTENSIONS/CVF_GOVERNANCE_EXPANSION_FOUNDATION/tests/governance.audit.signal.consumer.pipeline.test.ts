import { describe, it, expect } from "vitest";
import {
  GovernanceAuditSignalConsumerPipelineContract,
  createGovernanceAuditSignalConsumerPipelineContract,
} from "../src/governance.audit.signal.consumer.pipeline.contract";
import type {
  GovernanceAuditSignalConsumerPipelineRequest,
} from "../src/governance.audit.signal.consumer.pipeline.contract";
import type { WatchdogAlertLog } from "../src/watchdog.alert.log.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T12:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeAlertLog(opts: {
  criticalCount?: number;
  warningCount?: number;
  nominalCount?: number;
  unknownCount?: number;
  dominantStatus?: "CRITICAL" | "WARNING" | "NOMINAL" | "UNKNOWN";
  alertActive?: boolean;
  totalPulses?: number;
  logId?: string;
} = {}): WatchdogAlertLog {
  const totalPulses =
    opts.totalPulses ??
    (opts.criticalCount ?? 0) +
      (opts.warningCount ?? 0) +
      (opts.nominalCount ?? 0) +
      (opts.unknownCount ?? 0);
  return {
    logId: opts.logId ?? "log-001",
    createdAt: FIXED_NOW,
    totalPulses,
    criticalCount: opts.criticalCount ?? 0,
    warningCount: opts.warningCount ?? 0,
    nominalCount: opts.nominalCount ?? 0,
    unknownCount: opts.unknownCount ?? 0,
    dominantStatus: opts.dominantStatus ?? "NOMINAL",
    alertActive: opts.alertActive ?? false,
    summary: "alert log summary",
    logHash: "log-hash-001",
  };
}

function makeRequest(
  alertLog: WatchdogAlertLog,
  consumerId?: string,
): GovernanceAuditSignalConsumerPipelineRequest {
  return { alertLog, consumerId };
}

function makeContract(): GovernanceAuditSignalConsumerPipelineContract {
  return createGovernanceAuditSignalConsumerPipelineContract({ now: fixedNow });
}

const CRITICAL_LOG = makeAlertLog({ dominantStatus: "CRITICAL", criticalCount: 2, alertActive: false, totalPulses: 2 });
const ALERT_LOG = makeAlertLog({ dominantStatus: "WARNING", warningCount: 1, alertActive: true, totalPulses: 1 });
const ROUTINE_LOG = makeAlertLog({ dominantStatus: "NOMINAL", nominalCount: 3, alertActive: false, totalPulses: 3 });
const NO_ACTION_LOG = makeAlertLog({ totalPulses: 0 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceAuditSignalConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceAuditSignalConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GovernanceAuditSignalConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("auditSignal");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("CRITICAL_THRESHOLD — warning contains [audit-signal] prefix", () => {
    const result = makeContract().execute(makeRequest(CRITICAL_LOG));
    expect(result.auditSignal.auditTrigger).toBe("CRITICAL_THRESHOLD");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[audit-signal]");
  });

  it("CRITICAL_THRESHOLD — warning references 'critical threshold breached'", () => {
    const result = makeContract().execute(makeRequest(CRITICAL_LOG));
    expect(result.warnings[0]).toContain("critical threshold breached");
  });

  it("CRITICAL_THRESHOLD — warning references 'immediate governance audit required'", () => {
    const result = makeContract().execute(makeRequest(CRITICAL_LOG));
    expect(result.warnings[0]).toContain("immediate governance audit required");
  });

  it("ALERT_ACTIVE — warning contains [audit-signal] prefix", () => {
    const result = makeContract().execute(makeRequest(ALERT_LOG));
    expect(result.auditSignal.auditTrigger).toBe("ALERT_ACTIVE");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[audit-signal]");
  });

  it("ALERT_ACTIVE — warning references 'alert active'", () => {
    const result = makeContract().execute(makeRequest(ALERT_LOG));
    expect(result.warnings[0]).toContain("alert active");
  });

  it("ALERT_ACTIVE — warning references 'governance audit recommended'", () => {
    const result = makeContract().execute(makeRequest(ALERT_LOG));
    expect(result.warnings[0]).toContain("governance audit recommended");
  });

  it("ROUTINE — no warnings", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.auditSignal.auditTrigger).toBe("ROUTINE");
    expect(result.warnings).toHaveLength(0);
  });

  it("NO_ACTION — no warnings", () => {
    const result = makeContract().execute(makeRequest(NO_ACTION_LOG));
    expect(result.auditSignal.auditTrigger).toBe("NO_ACTION");
    expect(result.warnings).toHaveLength(0);
  });

  it("query contains auditTrigger", () => {
    const result = makeContract().execute(makeRequest(CRITICAL_LOG));
    expect(result.consumerPackage.query).toContain("CRITICAL_THRESHOLD");
  });

  it("query contains 'alert'", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.consumerPackage.query).toContain("alert");
  });

  it("query contains sourceAlertLogId", () => {
    const result = makeContract().execute(makeRequest(makeAlertLog({ logId: "log-xyz" })));
    expect(result.consumerPackage.query).toContain("log-xyz");
  });

  it("query length is at most 120 chars", () => {
    const longLog = makeAlertLog({ logId: "x".repeat(200) });
    const result = makeContract().execute(makeRequest(longLog));
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches auditSignal.signalId", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.consumerPackage.contextId).toBe(result.auditSignal.signalId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(ROUTINE_LOG));
    const r2 = contract.execute(makeRequest(ROUTINE_LOG));
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different inputs produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest(CRITICAL_LOG));
    const r2 = contract.execute(makeRequest(ROUTINE_LOG));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("auditSignal.sourceAlertLogId matches input alertLog.logId", () => {
    const log = makeAlertLog({ logId: "log-abc" });
    const result = makeContract().execute(makeRequest(log));
    expect(result.auditSignal.sourceAlertLogId).toBe("log-abc");
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG, "consumer-gef"));
    expect(result.consumerId).toBe("consumer-gef");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(makeRequest(ROUTINE_LOG));
    expect(result.consumerId).toBeUndefined();
  });
});
