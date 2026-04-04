import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  WatchdogEscalationDecision,
  WatchdogEscalationAction,
} from "./watchdog.escalation.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationLog {
  logId: string;
  createdAt: string;
  totalDecisions: number;
  escalateCount: number;
  monitorCount: number;
  clearCount: number;
  dominantAction: WatchdogEscalationAction;
  escalationActive: boolean;
  summary: string;
  logHash: string;
}

export interface WatchdogEscalationLogContractDependencies {
  now?: () => string;
}

// ─── Dominant action logic ────────────────────────────────────────────────────
// Pure severity-first: ESCALATE > MONITOR > CLEAR.
// If any decision is ESCALATE the dominant is ESCALATE, regardless of count.
// This matches escalation semantics: one escalation is enough to escalate.

const ACTION_PRIORITY: WatchdogEscalationAction[] = ["ESCALATE", "MONITOR", "CLEAR"];

function computeDominantAction(decisions: WatchdogEscalationDecision[]): WatchdogEscalationAction {
  if (decisions.length === 0) return "CLEAR";
  const actionSet = new Set(decisions.map((d) => d.action));
  for (const action of ACTION_PRIORITY) {
    if (actionSet.has(action)) return action;
  }
  return "CLEAR";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationLogContract (W6-T7)
 * ---------------------------------------
 * Aggregates a batch of WatchdogEscalationDecision records into a single log.
 * escalationActive is true when any decision has action === "ESCALATE".
 */
export class WatchdogEscalationLogContract {
  private readonly now: () => string;

  constructor(dependencies: WatchdogEscalationLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(decisions: WatchdogEscalationDecision[]): WatchdogEscalationLog {
    const createdAt = this.now();
    const totalDecisions = decisions.length;
    const escalateCount = decisions.filter((d) => d.action === "ESCALATE").length;
    const monitorCount = decisions.filter((d) => d.action === "MONITOR").length;
    const clearCount = decisions.filter((d) => d.action === "CLEAR").length;
    const dominantAction = computeDominantAction(decisions);
    const escalationActive = escalateCount > 0;

    const summary =
      totalDecisions === 0
        ? "No escalation decisions recorded."
        : `${totalDecisions} decision(s): ${escalateCount} ESCALATE, ${monitorCount} MONITOR, ${clearCount} CLEAR. ` +
          `Dominant=${dominantAction}. EscalationActive=${escalationActive}.`;

    const logHash = computeDeterministicHash(
      "w6-t7-cp2-escalation-log",
      `${createdAt}:total=${totalDecisions}`,
      `escalate=${escalateCount}:monitor=${monitorCount}:clear=${clearCount}`,
      `dominant=${dominantAction}`,
    );

    const logId = computeDeterministicHash(
      "w6-t7-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalDecisions,
      escalateCount,
      monitorCount,
      clearCount,
      dominantAction,
      escalationActive,
      summary,
      logHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationLogContract(
  dependencies?: WatchdogEscalationLogContractDependencies,
): WatchdogEscalationLogContract {
  return new WatchdogEscalationLogContract(dependencies);
}
