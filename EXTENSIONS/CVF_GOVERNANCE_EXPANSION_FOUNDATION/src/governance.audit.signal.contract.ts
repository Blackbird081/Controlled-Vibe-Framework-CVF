import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogAlertLog } from "./watchdog.alert.log.contract";

// --- Types ---

export type AuditTrigger =
  | "CRITICAL_THRESHOLD"
  | "ALERT_ACTIVE"
  | "ROUTINE"
  | "NO_ACTION";

export interface GovernanceAuditSignal {
  signalId: string;
  issuedAt: string;
  sourceAlertLogId: string;
  auditTrigger: AuditTrigger;
  triggerRationale: string;
  signalHash: string;
}

export interface GovernanceAuditSignalContractDependencies {
  now?: () => string;
}

// --- Trigger Derivation ---
// CRITICAL_THRESHOLD: dominantStatus === "CRITICAL" AND criticalCount >= 1
// ALERT_ACTIVE: alertActive is true (WARNING dominant)
// ROUTINE: totalPulses > 0 (pulses present but no active alert)
// NO_ACTION: no pulses at all

function deriveTrigger(alertLog: WatchdogAlertLog): AuditTrigger {
  if (alertLog.dominantStatus === "CRITICAL" && alertLog.criticalCount >= 1) {
    return "CRITICAL_THRESHOLD";
  }
  if (alertLog.alertActive) {
    return "ALERT_ACTIVE";
  }
  if (alertLog.totalPulses > 0) {
    return "ROUTINE";
  }
  return "NO_ACTION";
}

function buildRationale(trigger: AuditTrigger, alertLog: WatchdogAlertLog): string {
  switch (trigger) {
    case "CRITICAL_THRESHOLD":
      return `Audit trigger=${trigger}. Critical threshold breached: ${alertLog.criticalCount} critical pulse(s). Immediate audit required.`;
    case "ALERT_ACTIVE":
      return `Audit trigger=${trigger}. Alert active: dominantStatus=${alertLog.dominantStatus}. Audit recommended.`;
    case "ROUTINE":
      return `Audit trigger=${trigger}. ${alertLog.totalPulses} pulse(s) present, no active alert. Routine audit scheduled.`;
    case "NO_ACTION":
      return `Audit trigger=${trigger}. No pulses in alert log. No audit action required.`;
  }
}

// --- Contract ---

export class GovernanceAuditSignalContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceAuditSignalContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  signal(alertLog: WatchdogAlertLog): GovernanceAuditSignal {
    const issuedAt = this.now();
    const auditTrigger = deriveTrigger(alertLog);
    const triggerRationale = buildRationale(auditTrigger, alertLog);

    const signalHash = computeDeterministicHash(
      "w3-t3-cp1-audit-signal",
      `${issuedAt}:trigger=${auditTrigger}`,
      `dominant=${alertLog.dominantStatus}:critical=${alertLog.criticalCount}:alert=${alertLog.alertActive}`,
      `logId:${alertLog.logId}`,
    );

    const signalId = computeDeterministicHash(
      "w3-t3-cp1-signal-id",
      signalHash,
      issuedAt,
    );

    return {
      signalId,
      issuedAt,
      sourceAlertLogId: alertLog.logId,
      auditTrigger,
      triggerRationale,
      signalHash,
    };
  }
}

export function createGovernanceAuditSignalContract(
  dependencies?: GovernanceAuditSignalContractDependencies,
): GovernanceAuditSignalContract {
  return new GovernanceAuditSignalContract(dependencies);
}
