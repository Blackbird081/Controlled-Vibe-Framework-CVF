import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AuditTrigger, GovernanceAuditSignal } from "./governance.audit.signal.contract";

// --- Types ---

export interface GovernanceAuditLog {
  logId: string;
  createdAt: string;
  totalSignals: number;
  criticalThresholdCount: number;
  alertActiveCount: number;
  routineCount: number;
  noActionCount: number;
  dominantTrigger: AuditTrigger;
  auditRequired: boolean;
  summary: string;
  logHash: string;
}

export interface GovernanceAuditLogContractDependencies {
  now?: () => string;
}

// --- Dominant trigger logic ---
// CRITICAL_THRESHOLD > ALERT_ACTIVE > ROUTINE > NO_ACTION

const TRIGGER_PRIORITY: AuditTrigger[] = [
  "CRITICAL_THRESHOLD",
  "ALERT_ACTIVE",
  "ROUTINE",
  "NO_ACTION",
];

function computeDominantTrigger(signals: GovernanceAuditSignal[]): AuditTrigger {
  if (signals.length === 0) return "NO_ACTION";

  const counts = new Map<AuditTrigger, number>();
  for (const s of signals) {
    counts.set(s.auditTrigger, (counts.get(s.auditTrigger) ?? 0) + 1);
  }

  let maxCount = 0;
  let dominant: AuditTrigger = "NO_ACTION";

  for (const t of TRIGGER_PRIORITY) {
    const count = counts.get(t) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = t;
    }
  }

  return dominant;
}

// --- Contract ---

export class GovernanceAuditLogContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceAuditLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(signals: GovernanceAuditSignal[]): GovernanceAuditLog {
    const createdAt = this.now();
    const totalSignals = signals.length;

    let criticalThresholdCount = 0;
    let alertActiveCount = 0;
    let routineCount = 0;
    let noActionCount = 0;

    for (const s of signals) {
      switch (s.auditTrigger) {
        case "CRITICAL_THRESHOLD": criticalThresholdCount++; break;
        case "ALERT_ACTIVE": alertActiveCount++; break;
        case "ROUTINE": routineCount++; break;
        case "NO_ACTION": noActionCount++; break;
      }
    }

    const dominantTrigger = computeDominantTrigger(signals);
    const auditRequired =
      dominantTrigger === "CRITICAL_THRESHOLD" || dominantTrigger === "ALERT_ACTIVE";

    const summary =
      totalSignals === 0
        ? "No audit signals in log."
        : `${totalSignals} signal(s). Dominant trigger: ${dominantTrigger}. Audit required: ${auditRequired}.`;

    const logHash = computeDeterministicHash(
      "w3-t3-cp2-audit-log",
      `${createdAt}:total=${totalSignals}`,
      `critical=${criticalThresholdCount}:alert=${alertActiveCount}:routine=${routineCount}:noAction=${noActionCount}`,
      `dominant:${dominantTrigger}:required:${auditRequired}`,
    );

    const logId = computeDeterministicHash(
      "w3-t3-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalSignals,
      criticalThresholdCount,
      alertActiveCount,
      routineCount,
      noActionCount,
      dominantTrigger,
      auditRequired,
      summary,
      logHash,
    };
  }
}

export function createGovernanceAuditLogContract(
  dependencies?: GovernanceAuditLogContractDependencies,
): GovernanceAuditLogContract {
  return new GovernanceAuditLogContract(dependencies);
}
