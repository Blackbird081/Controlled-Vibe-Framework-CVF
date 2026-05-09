import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogAlertLog, WatchdogStatus } from "./watchdog.alert.log.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Escalation action produced by WatchdogEscalationContract.
 *
 *   ESCALATE — alert is active and severity warrants immediate governance checkpoint
 *   MONITOR  — alert is active but does not yet require escalation (e.g. WARNING only)
 *   CLEAR    — alert is not active; no escalation needed
 */
export type WatchdogEscalationAction = "ESCALATE" | "MONITOR" | "CLEAR";

export interface WatchdogEscalationPolicy {
  /**
   * Minimum number of CRITICAL pulses in the log to trigger ESCALATE.
   * Default: 1
   */
  criticalThreshold?: number;
  /**
   * Minimum number of WARNING pulses to trigger MONITOR escalation.
   * Default: 1
   */
  warningThreshold?: number;
  /**
   * If true, any active alert escalates to ESCALATE regardless of dominant status.
   * Default: false
   */
  strictMode?: boolean;
}

export interface WatchdogEscalationDecision {
  decisionId: string;
  decidedAt: string;
  sourceLogId: string;
  action: WatchdogEscalationAction;
  rationale: string;
  dominantStatus: WatchdogStatus;
  criticalCount: number;
  warningCount: number;
  alertWasActive: boolean;
  decisionHash: string;
}

export interface WatchdogEscalationContractDependencies {
  now?: () => string;
  policy?: WatchdogEscalationPolicy;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_POLICY: Required<WatchdogEscalationPolicy> = {
  criticalThreshold: 1,
  warningThreshold: 1,
  strictMode: false,
};

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationContract (W6-T7)
 * ------------------------------------
 * Bridges watchdog alert monitoring to governance checkpoint escalation.
 *
 * Decision logic (in priority order):
 *   1. If alert is not active → CLEAR
 *   2. If strictMode → ESCALATE
 *   3. If dominantStatus is CRITICAL AND criticalCount >= criticalThreshold → ESCALATE
 *   4. If dominantStatus is WARNING AND warningCount >= warningThreshold → MONITOR
 *   5. Default → MONITOR (alert active but thresholds not met)
 */
export class WatchdogEscalationContract {
  private readonly now: () => string;
  private readonly policy: Required<WatchdogEscalationPolicy>;

  constructor(dependencies: WatchdogEscalationContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.policy = { ...DEFAULT_POLICY, ...(dependencies.policy ?? {}) };
  }

  evaluate(alertLog: WatchdogAlertLog): WatchdogEscalationDecision {
    const decidedAt = this.now();
    const { action, rationale } = this.decide(alertLog);

    const decisionHash = computeDeterministicHash(
      "w6-t7-cp1-escalation-decision",
      `${decidedAt}:logId=${alertLog.logId}`,
      `action=${action}`,
      `dominant=${alertLog.dominantStatus}:critical=${alertLog.criticalCount}:warning=${alertLog.warningCount}`,
    );

    const decisionId = computeDeterministicHash(
      "w6-t7-cp1-decision-id",
      decisionHash,
      decidedAt,
    );

    return {
      decisionId,
      decidedAt,
      sourceLogId: alertLog.logId,
      action,
      rationale,
      dominantStatus: alertLog.dominantStatus,
      criticalCount: alertLog.criticalCount,
      warningCount: alertLog.warningCount,
      alertWasActive: alertLog.alertActive,
      decisionHash,
    };
  }

  private decide(log: WatchdogAlertLog): { action: WatchdogEscalationAction; rationale: string } {
    const { criticalThreshold, warningThreshold, strictMode } = this.policy;

    if (!log.alertActive) {
      return {
        action: "CLEAR",
        rationale: `Alert is not active (dominantStatus=${log.dominantStatus}). No escalation required.`,
      };
    }

    if (strictMode) {
      return {
        action: "ESCALATE",
        rationale: `Strict mode active — any alert triggers immediate escalation (dominantStatus=${log.dominantStatus}).`,
      };
    }

    if (log.dominantStatus === "CRITICAL" && log.criticalCount >= criticalThreshold) {
      return {
        action: "ESCALATE",
        rationale: `CRITICAL dominantStatus with ${log.criticalCount} critical pulse(s) meets escalation threshold (>=${criticalThreshold}).`,
      };
    }

    if (
      (log.dominantStatus === "WARNING" || log.dominantStatus === "CRITICAL") &&
      log.warningCount >= warningThreshold
    ) {
      return {
        action: "MONITOR",
        rationale: `Alert active with ${log.warningCount} warning pulse(s). Monitoring — escalation threshold not reached.`,
      };
    }

    return {
      action: "MONITOR",
      rationale: `Alert active (dominantStatus=${log.dominantStatus}). Thresholds not met — continuing to monitor.`,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationContract(
  dependencies?: WatchdogEscalationContractDependencies,
): WatchdogEscalationContract {
  return new WatchdogEscalationContract(dependencies);
}
