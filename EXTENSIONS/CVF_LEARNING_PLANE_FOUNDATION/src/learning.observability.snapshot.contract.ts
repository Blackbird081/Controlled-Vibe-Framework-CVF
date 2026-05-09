import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningObservabilityReport, ObservabilityHealth } from "./learning.observability.contract";
export type { ObservabilityHealth } from "./learning.observability.contract";

// --- Types ---

export type SnapshotTrend = "STABLE" | "DEGRADING" | "IMPROVING" | "INSUFFICIENT_DATA";

export interface LearningObservabilitySnapshot {
  snapshotId: string;
  createdAt: string;
  totalReports: number;
  healthyCount: number;
  degradedCount: number;
  criticalCount: number;
  unknownCount: number;
  dominantHealth: ObservabilityHealth;
  snapshotTrend: SnapshotTrend;
  summary: string;
  snapshotHash: string;
}

export interface LearningObservabilitySnapshotContractDependencies {
  now?: () => string;
}

// --- Dominant health logic ---
// CRITICAL > DEGRADED > UNKNOWN > HEALTHY
// Empty → UNKNOWN

const HEALTH_PRIORITY: ObservabilityHealth[] = ["CRITICAL", "DEGRADED", "UNKNOWN", "HEALTHY"];

function computeDominantHealth(reports: LearningObservabilityReport[]): ObservabilityHealth {
  if (reports.length === 0) return "UNKNOWN";

  const counts = new Map<ObservabilityHealth, number>();
  for (const r of reports) {
    counts.set(r.observabilityHealth, (counts.get(r.observabilityHealth) ?? 0) + 1);
  }

  let maxCount = 0;
  let dominant: ObservabilityHealth = "UNKNOWN";

  for (const h of HEALTH_PRIORITY) {
    const count = counts.get(h) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = h;
    }
  }

  return dominant;
}

// --- Trend logic ---
// Requires >= 2 reports; compare first and last health
// HEALTHY=2, DEGRADED=1, CRITICAL/UNKNOWN=0

const HEALTH_SCORE: Record<ObservabilityHealth, number> = {
  HEALTHY: 2,
  DEGRADED: 1,
  CRITICAL: 0,
  UNKNOWN: 0,
};

function computeTrend(reports: LearningObservabilityReport[]): SnapshotTrend {
  if (reports.length < 2) return "INSUFFICIENT_DATA";

  const firstScore = HEALTH_SCORE[reports[0].observabilityHealth];
  const lastScore = HEALTH_SCORE[reports[reports.length - 1].observabilityHealth];

  if (lastScore > firstScore) return "IMPROVING";
  if (lastScore < firstScore) return "DEGRADING";
  return "STABLE";
}

// --- Contract ---

export class LearningObservabilitySnapshotContract {
  private readonly now: () => string;

  constructor(dependencies: LearningObservabilitySnapshotContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  snapshot(reports: LearningObservabilityReport[]): LearningObservabilitySnapshot {
    const createdAt = this.now();
    const totalReports = reports.length;

    let healthyCount = 0;
    let degradedCount = 0;
    let criticalCount = 0;
    let unknownCount = 0;

    for (const r of reports) {
      switch (r.observabilityHealth) {
        case "HEALTHY": healthyCount++; break;
        case "DEGRADED": degradedCount++; break;
        case "CRITICAL": criticalCount++; break;
        case "UNKNOWN": unknownCount++; break;
      }
    }

    const dominantHealth = computeDominantHealth(reports);
    const snapshotTrend = computeTrend(reports);

    const summary =
      totalReports === 0
        ? "No observability reports in snapshot."
        : `${totalReports} report(s). Dominant health: ${dominantHealth}. Trend: ${snapshotTrend}.`;

    const snapshotHash = computeDeterministicHash(
      "w4-t7-cp2-snapshot",
      `${createdAt}:total=${totalReports}`,
      `healthy=${healthyCount}:degraded=${degradedCount}:critical=${criticalCount}:unknown=${unknownCount}`,
      `dominant:${dominantHealth}:trend:${snapshotTrend}`,
    );

    const snapshotId = computeDeterministicHash(
      "w4-t7-cp2-snapshot-id",
      snapshotHash,
      createdAt,
    );

    return {
      snapshotId,
      createdAt,
      totalReports,
      healthyCount,
      degradedCount,
      criticalCount,
      unknownCount,
      dominantHealth,
      snapshotTrend,
      summary,
      snapshotHash,
    };
  }
}

export function createLearningObservabilitySnapshotContract(
  dependencies?: LearningObservabilitySnapshotContractDependencies,
): LearningObservabilitySnapshotContract {
  return new LearningObservabilitySnapshotContract(dependencies);
}
