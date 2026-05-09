import type { PatternDriftSignal, DriftClass } from "./pattern.drift.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface PatternDriftLog {
  logId: string;
  generatedAt: string;
  totalSignals: number;
  stableCount: number;
  driftingCount: number;
  criticalDriftCount: number;
  dominantDriftClass: DriftClass;
  logHash: string;
}

export interface PatternDriftLogContractDependencies {
  now?: () => string;
}

// --- Dominant Drift Class ---
// Severity-first: CRITICAL_DRIFT > DRIFTING > STABLE

function deriveDominantDriftClass(signals: PatternDriftSignal[]): DriftClass {
  const classes = signals.map((s) => s.driftClass);
  if (classes.includes("CRITICAL_DRIFT")) return "CRITICAL_DRIFT";
  if (classes.includes("DRIFTING")) return "DRIFTING";
  return "STABLE";
}

// --- Contract ---

export class PatternDriftLogContract {
  private readonly now: () => string;

  constructor(dependencies: PatternDriftLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(signals: PatternDriftSignal[]): PatternDriftLog {
    const generatedAt = this.now();
    const totalSignals = signals.length;
    const stableCount = signals.filter((s) => s.driftClass === "STABLE").length;
    const driftingCount = signals.filter((s) => s.driftClass === "DRIFTING").length;
    const criticalDriftCount = signals.filter((s) => s.driftClass === "CRITICAL_DRIFT").length;
    const dominantDriftClass = deriveDominantDriftClass(signals);

    const logHash = computeDeterministicHash(
      "w6-t6-cp2-drift-log",
      `${generatedAt}:signals:${totalSignals}`,
      `stable:${stableCount}:drifting:${driftingCount}:critical:${criticalDriftCount}`,
    );

    const logId = computeDeterministicHash(
      "w6-t6-cp2-log-id",
      logHash,
      generatedAt,
    );

    return {
      logId,
      generatedAt,
      totalSignals,
      stableCount,
      driftingCount,
      criticalDriftCount,
      dominantDriftClass,
      logHash,
    };
  }
}

export function createPatternDriftLogContract(
  dependencies?: PatternDriftLogContractDependencies,
): PatternDriftLogContract {
  return new PatternDriftLogContract(dependencies);
}
