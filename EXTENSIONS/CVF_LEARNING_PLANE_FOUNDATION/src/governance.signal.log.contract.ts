import type { GovernanceSignal, GovernanceSignalType } from "./governance.signal.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface GovernanceSignalLog {
  logId: string;
  createdAt: string;
  totalSignals: number;
  escalateCount: number;
  reviewCount: number;
  monitorCount: number;
  noActionCount: number;
  dominantSignalType: GovernanceSignalType;
  summary: string;
  logHash: string;
}

export interface GovernanceSignalLogContractDependencies {
  now?: () => string;
}

// --- Dominant Signal Derivation ---

// Priority order: ESCALATE > TRIGGER_REVIEW > MONITOR > NO_ACTION
const SIGNAL_PRIORITY: Record<GovernanceSignalType, number> = {
  ESCALATE: 4,
  TRIGGER_REVIEW: 3,
  MONITOR: 2,
  NO_ACTION: 1,
};

function deriveDominantSignalType(
  signals: GovernanceSignal[],
): GovernanceSignalType {
  if (signals.length === 0) return "NO_ACTION";
  return signals.reduce((dominant, s) =>
    SIGNAL_PRIORITY[s.signalType] > SIGNAL_PRIORITY[dominant.signalType]
      ? s
      : dominant,
  ).signalType;
}

// --- Summary Building ---

function buildSummary(
  dominant: GovernanceSignalType,
  escalateCount: number,
  reviewCount: number,
  monitorCount: number,
  noActionCount: number,
  total: number,
): string {
  const breakdown = `escalate=${escalateCount}, review=${reviewCount}, monitor=${monitorCount}, no_action=${noActionCount}, total=${total}`;
  if (total === 0) {
    return `Governance signal log: no signals recorded.`;
  }
  return (
    `Governance signal log: dominant=${dominant}. ` +
    `(${breakdown})`
  );
}

// --- Contract ---

export class GovernanceSignalLogContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceSignalLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(signals: GovernanceSignal[]): GovernanceSignalLog {
    const createdAt = this.now();

    const escalateCount = signals.filter(
      (s) => s.signalType === "ESCALATE",
    ).length;
    const reviewCount = signals.filter(
      (s) => s.signalType === "TRIGGER_REVIEW",
    ).length;
    const monitorCount = signals.filter(
      (s) => s.signalType === "MONITOR",
    ).length;
    const noActionCount = signals.filter(
      (s) => s.signalType === "NO_ACTION",
    ).length;
    const totalSignals = signals.length;

    const dominantSignalType = deriveDominantSignalType(signals);

    const summary = buildSummary(
      dominantSignalType,
      escalateCount,
      reviewCount,
      monitorCount,
      noActionCount,
      totalSignals,
    );

    const logHash = computeDeterministicHash(
      "w4-t4-cp2-governance-signal-log",
      `${createdAt}:total=${totalSignals}`,
      `escalate=${escalateCount}:review=${reviewCount}:monitor=${monitorCount}:no_action=${noActionCount}`,
      `dominant:${dominantSignalType}`,
    );

    const logId = computeDeterministicHash(
      "w4-t4-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalSignals,
      escalateCount,
      reviewCount,
      monitorCount,
      noActionCount,
      dominantSignalType,
      summary,
      logHash,
    };
  }
}

export function createGovernanceSignalLogContract(
  dependencies?: GovernanceSignalLogContractDependencies,
): GovernanceSignalLogContract {
  return new GovernanceSignalLogContract(dependencies);
}
