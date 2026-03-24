import { describe, it, expect } from "vitest";
import {
  GovernanceAuditSignalConsumerPipelineBatchContract,
  createGovernanceAuditSignalConsumerPipelineBatchContract,
} from "../src/governance.audit.signal.consumer.pipeline.batch.contract";
import {
  createGovernanceAuditSignalConsumerPipelineContract,
} from "../src/governance.audit.signal.consumer.pipeline.contract";
import type { GovernanceAuditSignalConsumerPipelineResult } from "../src/governance.audit.signal.consumer.pipeline.contract";
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
  dominantStatus?: "CRITICAL" | "WARNING" | "NOMINAL" | "UNKNOWN";
  alertActive?: boolean;
  totalPulses?: number;
  logId?: string;
} = {}): WatchdogAlertLog {
  const totalPulses =
    opts.totalPulses ??
    (opts.criticalCount ?? 0) + (opts.warningCount ?? 0) + (opts.nominalCount ?? 0);
  return {
    logId: opts.logId ?? "log-001",
    createdAt: FIXED_NOW,
    totalPulses,
    criticalCount: opts.criticalCount ?? 0,
    warningCount: opts.warningCount ?? 0,
    nominalCount: opts.nominalCount ?? 0,
    unknownCount: 0,
    dominantStatus: opts.dominantStatus ?? "NOMINAL",
    alertActive: opts.alertActive ?? false,
    summary: "alert log summary",
    logHash: "log-hash-001",
  };
}

function makePipelineResult(
  logOpts: Parameters<typeof makeAlertLog>[0] = {},
): GovernanceAuditSignalConsumerPipelineResult {
  const pipeline = createGovernanceAuditSignalConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ alertLog: makeAlertLog(logOpts) });
}

function makeBatchContract(): GovernanceAuditSignalConsumerPipelineBatchContract {
  return createGovernanceAuditSignalConsumerPipelineBatchContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceAuditSignalConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGovernanceAuditSignalConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GovernanceAuditSignalConsumerPipelineBatchContract);
  });

  it("empty batch returns valid batch with zero counts", () => {
    const batch = makeBatchContract().batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.criticalResultCount).toBe(0);
    expect(batch.alertActiveResultCount).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch produces valid batchHash and batchId", () => {
    const batch = makeBatchContract().batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const batch = makeBatchContract().batch([makePipelineResult()]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("totalResults matches input length", () => {
    const results = [
      makePipelineResult({ dominantStatus: "CRITICAL", criticalCount: 1, totalPulses: 1 }),
      makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 2, totalPulses: 2 }),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.totalResults).toBe(2);
  });

  it("criticalResultCount counts CRITICAL_THRESHOLD correctly", () => {
    const results = [
      makePipelineResult({ dominantStatus: "CRITICAL", criticalCount: 2, totalPulses: 2 }),
      makePipelineResult({ dominantStatus: "CRITICAL", criticalCount: 1, totalPulses: 1, logId: "log-002" }),
      makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 1, totalPulses: 1, logId: "log-003" }),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.criticalResultCount).toBe(2);
  });

  it("alertActiveResultCount counts ALERT_ACTIVE correctly", () => {
    const results = [
      makePipelineResult({ dominantStatus: "WARNING", warningCount: 1, alertActive: true, totalPulses: 1 }),
      makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 1, totalPulses: 1, logId: "log-002" }),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.alertActiveResultCount).toBe(1);
  });

  it("all routine — criticalResultCount and alertActiveResultCount are 0", () => {
    const results = [
      makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 3, totalPulses: 3 }),
      makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 2, totalPulses: 2, logId: "log-002" }),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.criticalResultCount).toBe(0);
    expect(batch.alertActiveResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const r1 = makePipelineResult({ dominantStatus: "CRITICAL", criticalCount: 1, totalPulses: 1 });
    const r2 = makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 2, totalPulses: 2, logId: "log-002" });
    const batch = makeBatchContract().batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same inputs yield same hashes", () => {
    const results = [makePipelineResult()];
    const b1 = makeBatchContract().batch(results);
    const b2 = makeBatchContract().batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const b1 = makeBatchContract().batch([makePipelineResult({ dominantStatus: "CRITICAL", criticalCount: 1, totalPulses: 1 })]);
    const b2 = makeBatchContract().batch([makePipelineResult({ dominantStatus: "NOMINAL", nominalCount: 1, totalPulses: 1 })]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("results array is preserved in output", () => {
    const r = makePipelineResult({ dominantStatus: "WARNING", warningCount: 1, alertActive: true, totalPulses: 1 });
    const batch = makeBatchContract().batch([r]);
    expect(batch.results).toHaveLength(1);
    expect(batch.results[0].auditSignal.auditTrigger).toBe("ALERT_ACTIVE");
  });

  it("createdAt matches injected now", () => {
    const batch = makeBatchContract().batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
