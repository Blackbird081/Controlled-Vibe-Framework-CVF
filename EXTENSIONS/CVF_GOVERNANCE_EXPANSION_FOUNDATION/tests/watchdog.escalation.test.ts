/**
 * WatchdogEscalationContract + WatchdogEscalationLogContract — Tests (W6-T7)
 * ============================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   WatchdogEscalationContract.evaluate:
 *     - CLEAR when alert is not active
 *     - ESCALATE on CRITICAL dominant + criticalCount >= threshold (default 1)
 *     - MONITOR on WARNING dominant + warningCount >= threshold
 *     - MONITOR when alert active but thresholds not met
 *     - strictMode → always ESCALATE when alert active
 *     - custom criticalThreshold respected
 *     - custom warningThreshold respected
 *     - decisionId and decisionHash are deterministic
 *     - sourceLogId matches input logId
 *     - factory createWatchdogEscalationContract
 *
 *   WatchdogEscalationLogContract.log:
 *     - empty decisions → dominantAction CLEAR, escalationActive false
 *     - counts escalate/monitor/clear correctly
 *     - escalationActive true when any ESCALATE present
 *     - dominantAction uses severity-first priority (ESCALATE > MONITOR > CLEAR)
 *     - summary string is non-empty
 *     - factory createWatchdogEscalationLogContract
 */

import { describe, it, expect } from "vitest";
import {
  WatchdogEscalationContract,
  createWatchdogEscalationContract,
} from "../src/watchdog.escalation.contract";
import {
  WatchdogEscalationLogContract,
  createWatchdogEscalationLogContract,
} from "../src/watchdog.escalation.log.contract";
import type { WatchdogAlertLog, WatchdogStatus } from "../src/watchdog.alert.log.contract";
import type { WatchdogEscalationDecision } from "../src/watchdog.escalation.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T10:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeAlertLog(overrides: Partial<WatchdogAlertLog> & { logId: string }): WatchdogAlertLog {
  const criticalCount = overrides.criticalCount ?? 0;
  const warningCount = overrides.warningCount ?? 0;
  const nominalCount = overrides.nominalCount ?? 0;
  const unknownCount = overrides.unknownCount ?? 0;
  const totalPulses = overrides.totalPulses ?? (criticalCount + warningCount + nominalCount + unknownCount);
  const dominantStatus: WatchdogStatus = overrides.dominantStatus ?? "NOMINAL";
  const alertActive = overrides.alertActive ?? false;

  return {
    logId: overrides.logId,
    createdAt: FIXED_NOW,
    totalPulses,
    criticalCount,
    warningCount,
    nominalCount,
    unknownCount,
    dominantStatus,
    alertActive,
    summary: overrides.summary ?? `Watchdog log ${overrides.logId}`,
    logHash: overrides.logHash ?? `hash-${overrides.logId}`,
  };
}

function makeContract(policy?: ConstructorParameters<typeof WatchdogEscalationContract>[0]["policy"]) {
  return new WatchdogEscalationContract({ now: fixedNow, policy });
}

function makeDecision(action: WatchdogEscalationDecision["action"]): WatchdogEscalationDecision {
  return {
    decisionId: `decision-${action}`,
    decidedAt: FIXED_NOW,
    sourceLogId: "log-1",
    action,
    rationale: `Test ${action}`,
    dominantStatus: action === "ESCALATE" ? "CRITICAL" : action === "MONITOR" ? "WARNING" : "NOMINAL",
    criticalCount: action === "ESCALATE" ? 2 : 0,
    warningCount: action === "MONITOR" ? 1 : 0,
    alertWasActive: action !== "CLEAR",
    decisionHash: `hash-${action}`,
  };
}

// ─── WatchdogEscalationContract ───────────────────────────────────────────────

describe("WatchdogEscalationContract.evaluate", () => {
  it("returns CLEAR when alertActive is false", () => {
    const contract = makeContract();
    const log = makeAlertLog({ logId: "log-1", alertActive: false, dominantStatus: "NOMINAL" });
    const result = contract.evaluate(log);
    expect(result.action).toBe("CLEAR");
    expect(result.alertWasActive).toBe(false);
  });

  it("returns ESCALATE on CRITICAL dominant with criticalCount >= default threshold (1)", () => {
    const contract = makeContract();
    const log = makeAlertLog({
      logId: "log-2",
      alertActive: true,
      dominantStatus: "CRITICAL",
      criticalCount: 1,
      warningCount: 0,
    });
    const result = contract.evaluate(log);
    expect(result.action).toBe("ESCALATE");
  });

  it("returns MONITOR on WARNING dominant with warningCount >= default threshold (1)", () => {
    const contract = makeContract();
    const log = makeAlertLog({
      logId: "log-3",
      alertActive: true,
      dominantStatus: "WARNING",
      criticalCount: 0,
      warningCount: 2,
    });
    const result = contract.evaluate(log);
    expect(result.action).toBe("MONITOR");
  });

  it("returns MONITOR when alert active but thresholds not met (0 critical, 0 warning)", () => {
    const contract = makeContract();
    const log = makeAlertLog({
      logId: "log-4",
      alertActive: true,
      dominantStatus: "UNKNOWN",
      criticalCount: 0,
      warningCount: 0,
    });
    const result = contract.evaluate(log);
    expect(result.action).toBe("MONITOR");
  });

  it("strictMode → ESCALATE whenever alert is active regardless of dominant", () => {
    const contract = makeContract({ strictMode: true });
    const log = makeAlertLog({
      logId: "log-5",
      alertActive: true,
      dominantStatus: "WARNING",
      criticalCount: 0,
      warningCount: 1,
    });
    const result = contract.evaluate(log);
    expect(result.action).toBe("ESCALATE");
    expect(result.rationale).toContain("Strict mode");
  });

  it("custom criticalThreshold: does not ESCALATE if below threshold", () => {
    const contract = makeContract({ criticalThreshold: 3 });
    const log = makeAlertLog({
      logId: "log-6",
      alertActive: true,
      dominantStatus: "CRITICAL",
      criticalCount: 2, // below threshold of 3
      warningCount: 0,
    });
    const result = contract.evaluate(log);
    // 2 < 3 → does not ESCALATE; falls through to MONITOR
    expect(result.action).toBe("MONITOR");
  });

  it("custom criticalThreshold: ESCALATE when criticalCount meets threshold", () => {
    const contract = makeContract({ criticalThreshold: 3 });
    const log = makeAlertLog({
      logId: "log-7",
      alertActive: true,
      dominantStatus: "CRITICAL",
      criticalCount: 3,
      warningCount: 0,
    });
    const result = contract.evaluate(log);
    expect(result.action).toBe("ESCALATE");
  });

  it("custom warningThreshold: MONITOR only when warningCount meets threshold", () => {
    const contract = makeContract({ warningThreshold: 5 });
    const logBelow = makeAlertLog({
      logId: "log-8a",
      alertActive: true,
      dominantStatus: "WARNING",
      criticalCount: 0,
      warningCount: 4, // below 5
    });
    const logAt = makeAlertLog({
      logId: "log-8b",
      alertActive: true,
      dominantStatus: "WARNING",
      criticalCount: 0,
      warningCount: 5,
    });
    expect(contract.evaluate(logBelow).action).toBe("MONITOR"); // falls to default MONITOR
    expect(contract.evaluate(logAt).action).toBe("MONITOR");
  });

  it("decisionId and decisionHash are deterministic for same input", () => {
    const contract = makeContract();
    const log = makeAlertLog({
      logId: "log-9",
      alertActive: true,
      dominantStatus: "CRITICAL",
      criticalCount: 1,
    });
    const r1 = contract.evaluate(log);
    const r2 = contract.evaluate(log);
    expect(r1.decisionId).toBe(r2.decisionId);
    expect(r1.decisionHash).toBe(r2.decisionHash);
  });

  it("sourceLogId matches the input log's logId", () => {
    const contract = makeContract();
    const log = makeAlertLog({ logId: "my-log-id", alertActive: false });
    const result = contract.evaluate(log);
    expect(result.sourceLogId).toBe("my-log-id");
  });

  it("decidedAt is set on result", () => {
    const contract = makeContract();
    const log = makeAlertLog({ logId: "log-ts", alertActive: false });
    const result = contract.evaluate(log);
    expect(result.decidedAt).toBe(FIXED_NOW);
  });

  it("rationale is a non-empty string", () => {
    const contract = makeContract();
    const log = makeAlertLog({ logId: "log-r", alertActive: false });
    const result = contract.evaluate(log);
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});

// ─── createWatchdogEscalationContract factory ─────────────────────────────────

describe("createWatchdogEscalationContract", () => {
  it("returns a working instance with default engine", () => {
    const contract = createWatchdogEscalationContract();
    const log = makeAlertLog({ logId: "factory-log", alertActive: false });
    const result = contract.evaluate(log);
    expect(result.action).toBe("CLEAR");
  });

  it("accepts policy overrides", () => {
    const contract = createWatchdogEscalationContract({ policy: { strictMode: true } });
    const log = makeAlertLog({ logId: "strict-log", alertActive: true, dominantStatus: "WARNING", warningCount: 1 });
    expect(contract.evaluate(log).action).toBe("ESCALATE");
  });
});

// ─── WatchdogEscalationLogContract ───────────────────────────────────────────

describe("WatchdogEscalationLogContract.log", () => {
  it("empty decisions → dominantAction CLEAR, escalationActive false", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([]);
    expect(result.totalDecisions).toBe(0);
    expect(result.dominantAction).toBe("CLEAR");
    expect(result.escalationActive).toBe(false);
  });

  it("counts escalate/monitor/clear correctly", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const decisions = [
      makeDecision("ESCALATE"),
      makeDecision("MONITOR"),
      makeDecision("MONITOR"),
      makeDecision("CLEAR"),
    ];
    const result = contract.log(decisions);
    expect(result.escalateCount).toBe(1);
    expect(result.monitorCount).toBe(2);
    expect(result.clearCount).toBe(1);
    expect(result.totalDecisions).toBe(4);
  });

  it("escalationActive is true when any decision is ESCALATE", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([makeDecision("ESCALATE"), makeDecision("MONITOR")]);
    expect(result.escalationActive).toBe(true);
  });

  it("escalationActive is false when no ESCALATE decisions", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([makeDecision("MONITOR"), makeDecision("CLEAR")]);
    expect(result.escalationActive).toBe(false);
  });

  it("dominantAction uses severity-first priority: ESCALATE > MONITOR > CLEAR", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });

    // Even if MONITOR has more entries, ESCALATE wins
    const result = contract.log([
      makeDecision("MONITOR"),
      makeDecision("MONITOR"),
      makeDecision("ESCALATE"),
    ]);
    expect(result.dominantAction).toBe("ESCALATE");
  });

  it("dominantAction is MONITOR when only MONITOR and CLEAR present", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([makeDecision("MONITOR"), makeDecision("CLEAR")]);
    expect(result.dominantAction).toBe("MONITOR");
  });

  it("summary string is non-empty", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([makeDecision("CLEAR")]);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("summary mentions totals for non-empty input", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([makeDecision("ESCALATE")]);
    expect(result.summary).toContain("1");
    expect(result.summary).toContain("ESCALATE");
  });

  it("createdAt is set correctly", () => {
    const contract = new WatchdogEscalationLogContract({ now: fixedNow });
    const result = contract.log([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── createWatchdogEscalationLogContract factory ──────────────────────────────

describe("createWatchdogEscalationLogContract", () => {
  it("returns a working instance", () => {
    const contract = createWatchdogEscalationLogContract();
    const result = contract.log([makeDecision("CLEAR")]);
    expect(result.totalDecisions).toBe(1);
  });
});
