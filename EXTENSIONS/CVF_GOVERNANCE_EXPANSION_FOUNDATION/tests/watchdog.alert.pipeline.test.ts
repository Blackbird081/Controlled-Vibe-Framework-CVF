/**
 * Watchdog Alert Pipeline — Dedicated Tests (W6-T10)
 * =====================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   WatchdogPulseContract.pulse:
 *     - CRITICAL when observability dominantHealth === "CRITICAL"
 *     - CRITICAL when execution dominantStatus === "FAILED"
 *     - WARNING when observability dominantHealth === "DEGRADED"
 *     - WARNING when execution dominantStatus === "RUNNING"
 *     - UNKNOWN when both inputs carry no real signals
 *     - NOMINAL otherwise (HEALTHY obs + PENDING exec)
 *     - statusRationale contains key fields
 *     - pulseHash and pulseId are deterministic
 *     - createdAt is set
 *     - factory createWatchdogPulseContract returns working instance
 *
 *   WatchdogAlertLogContract.log:
 *     - empty input → UNKNOWN dominant, alertActive false, zero counts
 *     - counts each WatchdogStatus correctly
 *     - dominantStatus count-wins (higher count wins; priority tiebreaks ties)
 *     - alertActive true when CRITICAL or WARNING dominant
 *     - alertActive false when NOMINAL or UNKNOWN dominant
 *     - summary non-empty and contains key fields
 *     - summary for empty indicates no pulses
 *     - logHash and logId are deterministic
 *     - createdAt is set
 *     - factory createWatchdogAlertLogContract returns working instance
 *
 *   GovernanceAuditSignalContract.signal:
 *     - CRITICAL_THRESHOLD when dominantStatus CRITICAL and criticalCount >= 1
 *     - ALERT_ACTIVE when alertActive true (non-critical dominant)
 *     - ROUTINE when totalPulses > 0 and no alert active
 *     - NO_ACTION when totalPulses === 0
 *     - triggerRationale contains the trigger name
 *     - signalHash and signalId are deterministic
 *     - createdAt is set
 *     - factory createGovernanceAuditSignalContract returns working instance
 *
 *   GovernanceAuditLogContract.log:
 *     - empty input → NO_ACTION dominant, auditRequired false
 *     - counts each AuditTrigger correctly
 *     - dominantTrigger count-wins (priority tiebreaks ties)
 *     - auditRequired true for CRITICAL_THRESHOLD or ALERT_ACTIVE dominant
 *     - auditRequired false for ROUTINE or NO_ACTION dominant
 *     - summary non-empty and contains key fields
 *     - summary for empty indicates no signals
 *     - logHash and logId are deterministic
 *     - createdAt is set
 *     - factory createGovernanceAuditLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  WatchdogPulseContract,
  createWatchdogPulseContract,
} from "../src/watchdog.pulse.contract";
import type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
  WatchdogPulse,
} from "../src/watchdog.pulse.contract";

import {
  WatchdogAlertLogContract,
  createWatchdogAlertLogContract,
} from "../src/watchdog.alert.log.contract";

import {
  GovernanceAuditSignalContract,
  createGovernanceAuditSignalContract,
} from "../src/governance.audit.signal.contract";
import type { WatchdogAlertLog } from "../src/watchdog.alert.log.contract";

import {
  GovernanceAuditLogContract,
  createGovernanceAuditLogContract,
} from "../src/governance.audit.log.contract";
import type { GovernanceAuditSignal } from "../src/governance.audit.signal.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T15:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeObs(
  dominantHealth: WatchdogObservabilityInput["dominantHealth"],
  overrides: Partial<WatchdogObservabilityInput> = {},
): WatchdogObservabilityInput {
  return {
    snapshotId: "snap-1",
    dominantHealth,
    criticalCount: overrides.criticalCount ?? 0,
    degradedCount: overrides.degradedCount ?? 0,
    ...overrides,
  };
}

function makeExec(
  dominantStatus: WatchdogExecutionInput["dominantStatus"],
  overrides: Partial<WatchdogExecutionInput> = {},
): WatchdogExecutionInput {
  return {
    summaryId: "sum-1",
    dominantStatus,
    failedCount: overrides.failedCount ?? 0,
    runningCount: overrides.runningCount ?? 0,
    ...overrides,
  };
}

let _pulseSeq = 0;
function makePulse(
  status: WatchdogPulse["watchdogStatus"],
): WatchdogPulse {
  const n = ++_pulseSeq;
  const hash = `hash-pulse-${n}`;
  return {
    pulseId: `pulse-${n}`,
    issuedAt: FIXED_NOW,
    sourceObservabilitySnapshotId: `snap-${n}`,
    sourceExecutionSummaryId: `sum-${n}`,
    watchdogStatus: status,
    statusRationale: `status=${status}`,
    pulseHash: hash,
  };
}

let _sigSeq = 0;
function makeSignal(
  trigger: GovernanceAuditSignal["auditTrigger"],
): GovernanceAuditSignal {
  const n = ++_sigSeq;
  const hash = `hash-sig-${n}`;
  return {
    signalId: `sig-${n}`,
    issuedAt: FIXED_NOW,
    sourceAlertLogId: `log-${n}`,
    auditTrigger: trigger,
    triggerRationale: `trigger=${trigger}`,
    signalHash: hash,
  };
}

function makeAlertLog(overrides: Partial<WatchdogAlertLog> = {}): WatchdogAlertLog {
  return {
    logId: "alert-log-1",
    createdAt: FIXED_NOW,
    totalPulses: overrides.totalPulses ?? 0,
    criticalCount: overrides.criticalCount ?? 0,
    warningCount: overrides.warningCount ?? 0,
    nominalCount: overrides.nominalCount ?? 0,
    unknownCount: overrides.unknownCount ?? 0,
    dominantStatus: overrides.dominantStatus ?? "UNKNOWN",
    alertActive: overrides.alertActive ?? false,
    summary: overrides.summary ?? "summary",
    logHash: overrides.logHash ?? "log-hash-1",
    ...overrides,
  };
}

// ─── WatchdogPulseContract ────────────────────────────────────────────────────

describe("WatchdogPulseContract.pulse", () => {
  const contract = new WatchdogPulseContract({ now: fixedNow });

  it("CRITICAL when observability dominantHealth is CRITICAL", () => {
    const result = contract.pulse(
      makeObs("CRITICAL", { criticalCount: 2 }),
      makeExec("COMPLETED"),
    );
    expect(result.watchdogStatus).toBe("CRITICAL");
  });

  it("CRITICAL when execution dominantStatus is FAILED", () => {
    const result = contract.pulse(
      makeObs("HEALTHY"),
      makeExec("FAILED", { failedCount: 1 }),
    );
    expect(result.watchdogStatus).toBe("CRITICAL");
  });

  it("WARNING when observability dominantHealth is DEGRADED (not CRITICAL)", () => {
    const result = contract.pulse(
      makeObs("DEGRADED", { degradedCount: 1 }),
      makeExec("COMPLETED"),
    );
    expect(result.watchdogStatus).toBe("WARNING");
  });

  it("WARNING when execution dominantStatus is RUNNING (not CRITICAL)", () => {
    const result = contract.pulse(
      makeObs("HEALTHY"),
      makeExec("RUNNING", { runningCount: 1 }),
    );
    expect(result.watchdogStatus).toBe("WARNING");
  });

  it("UNKNOWN when both inputs carry no actionable signals", () => {
    // isObsEmpty: criticalCount=0, degradedCount=0, dominantHealth=UNKNOWN
    // isExecEmpty: failedCount=0, runningCount=0, dominantStatus=COMPLETED
    const result = contract.pulse(
      makeObs("UNKNOWN"),
      makeExec("COMPLETED"),
    );
    expect(result.watchdogStatus).toBe("UNKNOWN");
  });

  it("NOMINAL when observability is HEALTHY and execution is PENDING", () => {
    const result = contract.pulse(
      makeObs("HEALTHY"),
      makeExec("PENDING"),
    );
    expect(result.watchdogStatus).toBe("NOMINAL");
  });

  it("statusRationale contains watchdogStatus and source fields", () => {
    const result = contract.pulse(makeObs("HEALTHY"), makeExec("PENDING"));
    expect(result.statusRationale).toContain("NOMINAL");
    expect(result.statusRationale).toContain("dominantHealth=HEALTHY");
    expect(result.statusRationale).toContain("dominantStatus=PENDING");
  });

  it("pulseHash and pulseId are deterministic for same inputs and timestamp", () => {
    const obs = makeObs("HEALTHY");
    const exec = makeExec("PENDING");
    const r1 = contract.pulse(obs, exec);
    const r2 = contract.pulse(obs, exec);
    expect(r1.pulseHash).toBe(r2.pulseHash);
    expect(r1.pulseId).toBe(r2.pulseId);
  });

  it("createdAt is set to injected now()", () => {
    const result = contract.pulse(makeObs("HEALTHY"), makeExec("PENDING"));
    expect(result.issuedAt).toBe(FIXED_NOW);
  });

  it("sourceIds are propagated from inputs", () => {
    const obs = { ...makeObs("HEALTHY"), snapshotId: "snap-xyz" };
    const exec = { ...makeExec("PENDING"), summaryId: "sum-xyz" };
    const result = contract.pulse(obs, exec);
    expect(result.sourceObservabilitySnapshotId).toBe("snap-xyz");
    expect(result.sourceExecutionSummaryId).toBe("sum-xyz");
  });

  it("factory createWatchdogPulseContract returns working instance", () => {
    const c = createWatchdogPulseContract({ now: fixedNow });
    const result = c.pulse(makeObs("HEALTHY"), makeExec("PENDING"));
    expect(result.watchdogStatus).toBe("NOMINAL");
    expect(result.issuedAt).toBe(FIXED_NOW);
  });
});

// ─── WatchdogAlertLogContract ─────────────────────────────────────────────────

describe("WatchdogAlertLogContract.log", () => {
  const contract = new WatchdogAlertLogContract({ now: fixedNow });

  it("empty input → UNKNOWN dominant, alertActive false, zero counts", () => {
    const result = contract.log([]);
    expect(result.totalPulses).toBe(0);
    expect(result.dominantStatus).toBe("UNKNOWN");
    expect(result.alertActive).toBe(false);
    expect(result.criticalCount).toBe(0);
    expect(result.warningCount).toBe(0);
    expect(result.nominalCount).toBe(0);
    expect(result.unknownCount).toBe(0);
  });

  it("counts each WatchdogStatus correctly", () => {
    const pulses = [
      makePulse("CRITICAL"),
      makePulse("WARNING"),
      makePulse("WARNING"),
      makePulse("NOMINAL"),
      makePulse("UNKNOWN"),
    ];
    const result = contract.log(pulses);
    expect(result.totalPulses).toBe(5);
    expect(result.criticalCount).toBe(1);
    expect(result.warningCount).toBe(2);
    expect(result.nominalCount).toBe(1);
    expect(result.unknownCount).toBe(1);
  });

  it("dominantStatus is the status with the highest count (WARNING wins over CRITICAL when outnumbered)", () => {
    // WARNING: 3, CRITICAL: 1 → WARNING wins by count
    const pulses = [
      makePulse("WARNING"),
      makePulse("WARNING"),
      makePulse("WARNING"),
      makePulse("CRITICAL"),
    ];
    expect(contract.log(pulses).dominantStatus).toBe("WARNING");
  });

  it("dominantStatus priority tiebreaks ties (CRITICAL before WARNING on equal counts)", () => {
    // CRITICAL: 1, WARNING: 1 → CRITICAL wins by priority (iterated first)
    const pulses = [makePulse("CRITICAL"), makePulse("WARNING")];
    expect(contract.log(pulses).dominantStatus).toBe("CRITICAL");
  });

  it("alertActive true when CRITICAL dominant", () => {
    const pulses = [makePulse("CRITICAL"), makePulse("CRITICAL"), makePulse("NOMINAL")];
    expect(contract.log(pulses).alertActive).toBe(true);
  });

  it("alertActive true when WARNING dominant", () => {
    const pulses = [makePulse("WARNING"), makePulse("WARNING"), makePulse("NOMINAL")];
    expect(contract.log(pulses).alertActive).toBe(true);
  });

  it("alertActive false when NOMINAL dominant", () => {
    const pulses = [makePulse("NOMINAL"), makePulse("NOMINAL"), makePulse("WARNING")];
    expect(contract.log(pulses).alertActive).toBe(false);
  });

  it("alertActive false when UNKNOWN dominant", () => {
    const pulses = [makePulse("UNKNOWN"), makePulse("UNKNOWN")];
    expect(contract.log(pulses).alertActive).toBe(false);
  });

  it("summary for empty indicates no pulses", () => {
    expect(contract.log([]).summary).toContain("No");
  });

  it("summary for non-empty contains dominant status and alertActive", () => {
    const result = contract.log([makePulse("CRITICAL"), makePulse("CRITICAL")]);
    expect(result.summary).toContain("CRITICAL");
    expect(result.summary).toContain("true");
  });

  it("logHash and logId are deterministic for same inputs and timestamp", () => {
    const pulses = [makePulse("NOMINAL"), makePulse("NOMINAL")];
    const r1 = contract.log(pulses);
    const r2 = contract.log(pulses);
    expect(r1.logHash).toBe(r2.logHash);
    expect(r1.logId).toBe(r2.logId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.log([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createWatchdogAlertLogContract returns working instance", () => {
    const c = createWatchdogAlertLogContract({ now: fixedNow });
    const result = c.log([]);
    expect(result.totalPulses).toBe(0);
    expect(result.dominantStatus).toBe("UNKNOWN");
  });
});

// ─── GovernanceAuditSignalContract ───────────────────────────────────────────

describe("GovernanceAuditSignalContract.signal", () => {
  const contract = new GovernanceAuditSignalContract({ now: fixedNow });

  it("CRITICAL_THRESHOLD when dominantStatus CRITICAL and criticalCount >= 1", () => {
    const log = makeAlertLog({ dominantStatus: "CRITICAL", criticalCount: 2, alertActive: true, totalPulses: 3 });
    expect(contract.signal(log).auditTrigger).toBe("CRITICAL_THRESHOLD");
  });

  it("ALERT_ACTIVE when alertActive true and dominantStatus is WARNING", () => {
    const log = makeAlertLog({ dominantStatus: "WARNING", alertActive: true, totalPulses: 2 });
    expect(contract.signal(log).auditTrigger).toBe("ALERT_ACTIVE");
  });

  it("ROUTINE when totalPulses > 0 and alertActive false", () => {
    const log = makeAlertLog({ dominantStatus: "NOMINAL", alertActive: false, totalPulses: 3 });
    expect(contract.signal(log).auditTrigger).toBe("ROUTINE");
  });

  it("NO_ACTION when totalPulses === 0", () => {
    const log = makeAlertLog({ totalPulses: 0, alertActive: false, dominantStatus: "UNKNOWN" });
    expect(contract.signal(log).auditTrigger).toBe("NO_ACTION");
  });

  it("triggerRationale contains the auditTrigger name", () => {
    const log = makeAlertLog({ dominantStatus: "CRITICAL", criticalCount: 1, alertActive: true, totalPulses: 1 });
    const result = contract.signal(log);
    expect(result.triggerRationale).toContain("CRITICAL_THRESHOLD");
  });

  it("triggerRationale for ROUTINE mentions pulse count", () => {
    const log = makeAlertLog({ dominantStatus: "NOMINAL", alertActive: false, totalPulses: 5 });
    expect(contract.signal(log).triggerRationale).toContain("5");
  });

  it("sourceAlertLogId is propagated from alert log", () => {
    const log = makeAlertLog({ logId: "log-special", totalPulses: 0 });
    expect(contract.signal(log).sourceAlertLogId).toBe("log-special");
  });

  it("signalHash and signalId are deterministic for same inputs and timestamp", () => {
    const log = makeAlertLog({ dominantStatus: "NOMINAL", totalPulses: 1, alertActive: false });
    const r1 = contract.signal(log);
    const r2 = contract.signal(log);
    expect(r1.signalHash).toBe(r2.signalHash);
    expect(r1.signalId).toBe(r2.signalId);
  });

  it("issuedAt is set to injected now()", () => {
    const log = makeAlertLog();
    expect(contract.signal(log).issuedAt).toBe(FIXED_NOW);
  });

  it("factory createGovernanceAuditSignalContract returns working instance", () => {
    const c = createGovernanceAuditSignalContract({ now: fixedNow });
    const log = makeAlertLog({ totalPulses: 0 });
    expect(c.signal(log).auditTrigger).toBe("NO_ACTION");
  });
});

// ─── GovernanceAuditLogContract ───────────────────────────────────────────────

describe("GovernanceAuditLogContract.log", () => {
  const contract = new GovernanceAuditLogContract({ now: fixedNow });

  it("empty input → NO_ACTION dominant, auditRequired false", () => {
    const result = contract.log([]);
    expect(result.totalSignals).toBe(0);
    expect(result.dominantTrigger).toBe("NO_ACTION");
    expect(result.auditRequired).toBe(false);
    expect(result.criticalThresholdCount).toBe(0);
    expect(result.alertActiveCount).toBe(0);
    expect(result.routineCount).toBe(0);
    expect(result.noActionCount).toBe(0);
  });

  it("counts each AuditTrigger correctly", () => {
    const signals = [
      makeSignal("CRITICAL_THRESHOLD"),
      makeSignal("ALERT_ACTIVE"),
      makeSignal("ALERT_ACTIVE"),
      makeSignal("ROUTINE"),
      makeSignal("NO_ACTION"),
    ];
    const result = contract.log(signals);
    expect(result.totalSignals).toBe(5);
    expect(result.criticalThresholdCount).toBe(1);
    expect(result.alertActiveCount).toBe(2);
    expect(result.routineCount).toBe(1);
    expect(result.noActionCount).toBe(1);
  });

  it("dominantTrigger is the trigger with the highest count (ALERT_ACTIVE wins when outnumbered)", () => {
    // ALERT_ACTIVE: 3, CRITICAL_THRESHOLD: 1 → ALERT_ACTIVE wins by count
    const signals = [
      makeSignal("ALERT_ACTIVE"),
      makeSignal("ALERT_ACTIVE"),
      makeSignal("ALERT_ACTIVE"),
      makeSignal("CRITICAL_THRESHOLD"),
    ];
    expect(contract.log(signals).dominantTrigger).toBe("ALERT_ACTIVE");
  });

  it("priority tiebreaks on equal counts (CRITICAL_THRESHOLD before ALERT_ACTIVE)", () => {
    const signals = [makeSignal("CRITICAL_THRESHOLD"), makeSignal("ALERT_ACTIVE")];
    expect(contract.log(signals).dominantTrigger).toBe("CRITICAL_THRESHOLD");
  });

  it("auditRequired true when CRITICAL_THRESHOLD dominant", () => {
    const signals = [makeSignal("CRITICAL_THRESHOLD"), makeSignal("CRITICAL_THRESHOLD"), makeSignal("ROUTINE")];
    expect(contract.log(signals).auditRequired).toBe(true);
  });

  it("auditRequired true when ALERT_ACTIVE dominant", () => {
    const signals = [makeSignal("ALERT_ACTIVE"), makeSignal("ALERT_ACTIVE"), makeSignal("NO_ACTION")];
    expect(contract.log(signals).auditRequired).toBe(true);
  });

  it("auditRequired false when ROUTINE dominant", () => {
    const signals = [makeSignal("ROUTINE"), makeSignal("ROUTINE"), makeSignal("ALERT_ACTIVE")];
    expect(contract.log(signals).auditRequired).toBe(false);
  });

  it("auditRequired false when NO_ACTION dominant", () => {
    const signals = [makeSignal("NO_ACTION"), makeSignal("NO_ACTION")];
    expect(contract.log(signals).auditRequired).toBe(false);
  });

  it("summary for empty indicates no signals", () => {
    expect(contract.log([]).summary).toContain("No");
  });

  it("summary for non-empty contains dominant trigger and auditRequired", () => {
    const signals = [makeSignal("CRITICAL_THRESHOLD")];
    const result = contract.log(signals);
    expect(result.summary).toContain("CRITICAL_THRESHOLD");
    expect(result.summary).toContain("true");
  });

  it("logHash and logId are deterministic for same inputs and timestamp", () => {
    const signals = [makeSignal("ROUTINE"), makeSignal("NO_ACTION")];
    const r1 = contract.log(signals);
    const r2 = contract.log(signals);
    expect(r1.logHash).toBe(r2.logHash);
    expect(r1.logId).toBe(r2.logId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.log([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createGovernanceAuditLogContract returns working instance", () => {
    const c = createGovernanceAuditLogContract({ now: fixedNow });
    const result = c.log([]);
    expect(result.dominantTrigger).toBe("NO_ACTION");
    expect(result.auditRequired).toBe(false);
  });
});
