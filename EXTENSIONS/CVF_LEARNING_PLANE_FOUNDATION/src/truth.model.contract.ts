import type {
  DominantPattern,
  HealthSignal,
  PatternInsight,
} from "./pattern.detection.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type HealthTrajectory = "IMPROVING" | "STABLE" | "DEGRADING" | "UNKNOWN";

export interface PatternHistoryEntry {
  entryId: string;
  recordedAt: string;
  dominantPattern: DominantPattern;
  healthSignal: HealthSignal;
  insightId: string;
}

export interface TruthModel {
  modelId: string;
  createdAt: string;
  version: number;
  totalInsightsProcessed: number;
  dominantPattern: DominantPattern;
  currentHealthSignal: HealthSignal;
  healthTrajectory: HealthTrajectory;
  confidenceLevel: number;
  patternHistory: PatternHistoryEntry[];
  modelHash: string;
}

export interface TruthModelContractDependencies {
  computeConfidence?: (totalInsights: number) => number;
  now?: () => string;
}

// --- Confidence ---

function defaultComputeConfidence(totalInsights: number): number {
  return Math.min(totalInsights / 10, 1.0);
}

// --- Health Trajectory ---

function healthSeverity(h: HealthSignal): number {
  if (h === "HEALTHY") return 0;
  if (h === "DEGRADED") return 1;
  return 2; // CRITICAL
}

export function deriveHealthTrajectory(
  history: PatternHistoryEntry[],
): HealthTrajectory {
  if (history.length < 2) return "UNKNOWN";
  const first = healthSeverity(history[0].healthSignal);
  const last = healthSeverity(history[history.length - 1].healthSignal);
  if (last < first) return "IMPROVING";
  if (last > first) return "DEGRADING";
  return "STABLE";
}

// --- Dominant Pattern ---

export function deriveDominantFromHistory(
  history: PatternHistoryEntry[],
): DominantPattern {
  if (history.length === 0) return "EMPTY";
  const counts: Record<string, number> = {};
  for (const entry of history) {
    const p = entry.dominantPattern;
    if (p === "MIXED" || p === "EMPTY") continue;
    counts[p] = (counts[p] ?? 0) + 1;
  }
  const keys = Object.keys(counts);
  if (keys.length === 0) return "MIXED";
  const max = Math.max(...Object.values(counts));
  const winners = keys.filter((k) => counts[k] === max);
  return winners.length === 1 ? (winners[0] as DominantPattern) : "MIXED";
}

// --- History Entry ---

export function buildPatternHistoryEntry(
  insight: PatternInsight,
  recordedAt: string,
  version: number,
): PatternHistoryEntry {
  const entryId = computeDeterministicHash(
    "w4-t2-cp1-history-entry",
    insight.insightId,
    recordedAt,
    `v${version}`,
  );
  return {
    entryId,
    recordedAt,
    dominantPattern: insight.dominantPattern,
    healthSignal: insight.healthSignal,
    insightId: insight.insightId,
  };
}

// --- Contract ---

export class TruthModelContract {
  private readonly computeConfidence: (total: number) => number;
  private readonly now: () => string;

  constructor(dependencies: TruthModelContractDependencies = {}) {
    this.computeConfidence =
      dependencies.computeConfidence ?? defaultComputeConfidence;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  build(insights: PatternInsight[]): TruthModel {
    const createdAt = this.now();
    const history = insights.map((insight, i) =>
      buildPatternHistoryEntry(insight, createdAt, i + 1),
    );

    const dominantPattern = deriveDominantFromHistory(history);
    const currentHealthSignal =
      history.length > 0
        ? history[history.length - 1].healthSignal
        : "HEALTHY";
    const healthTrajectory = deriveHealthTrajectory(history);
    const confidenceLevel = this.computeConfidence(insights.length);

    const modelHash = computeDeterministicHash(
      "w4-t2-cp1-truth-model",
      `${createdAt}:v1:total:${insights.length}`,
      `dominant:${dominantPattern}:health:${currentHealthSignal}`,
      `trajectory:${healthTrajectory}:confidence:${confidenceLevel}`,
    );

    const modelId = computeDeterministicHash(
      "w4-t2-cp1-model-id",
      modelHash,
      createdAt,
    );

    return {
      modelId,
      createdAt,
      version: 1,
      totalInsightsProcessed: insights.length,
      dominantPattern,
      currentHealthSignal,
      healthTrajectory,
      confidenceLevel,
      patternHistory: history,
      modelHash,
    };
  }
}

export function createTruthModelContract(
  dependencies?: TruthModelContractDependencies,
): TruthModelContract {
  return new TruthModelContract(dependencies);
}
