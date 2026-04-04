import type { PatternInsight } from "./pattern.detection.contract";
import {
  type TruthModel,
  type PatternHistoryEntry,
  type HealthTrajectory,
  type TruthModelContractDependencies,
  deriveHealthTrajectory,
  deriveDominantFromHistory,
} from "./truth.model.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Dependencies (same shape as TruthModelContractDependencies) ---

export type TruthModelUpdateContractDependencies = TruthModelContractDependencies;

// --- Confidence ---

function defaultComputeConfidence(totalInsights: number): number {
  return Math.min(totalInsights / 10, 1.0);
}

// --- Contract ---

export class TruthModelUpdateContract {
  private readonly computeConfidence: (total: number) => number;
  private readonly now: () => string;

  constructor(dependencies: TruthModelUpdateContractDependencies = {}) {
    this.computeConfidence =
      dependencies.computeConfidence ?? defaultComputeConfidence;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  update(model: TruthModel, insight: PatternInsight): TruthModel {
    const updatedAt = this.now();
    const newVersion = model.version + 1;

    const entryId = computeDeterministicHash(
      "w4-t2-cp2-history-entry",
      insight.insightId,
      updatedAt,
      `v${newVersion}`,
    );

    const newEntry: PatternHistoryEntry = {
      entryId,
      recordedAt: updatedAt,
      dominantPattern: insight.dominantPattern,
      healthSignal: insight.healthSignal,
      insightId: insight.insightId,
    };

    const newHistory = [...model.patternHistory, newEntry];
    const newTotal = model.totalInsightsProcessed + 1;

    const dominantPattern = deriveDominantFromHistory(newHistory);
    const currentHealthSignal = newEntry.healthSignal;
    const healthTrajectory = deriveHealthTrajectory(newHistory);
    const confidenceLevel = this.computeConfidence(newTotal);

    const modelHash = computeDeterministicHash(
      "w4-t2-cp2-truth-model-update",
      `${updatedAt}:v${newVersion}:total:${newTotal}`,
      `dominant:${dominantPattern}:health:${currentHealthSignal}`,
      `trajectory:${healthTrajectory}:confidence:${confidenceLevel}`,
      model.modelHash,
    );

    const modelId = computeDeterministicHash(
      "w4-t2-cp2-model-id",
      modelHash,
      updatedAt,
    );

    return {
      ...model,
      modelId,
      version: newVersion,
      totalInsightsProcessed: newTotal,
      dominantPattern,
      currentHealthSignal,
      healthTrajectory,
      confidenceLevel,
      patternHistory: newHistory,
      modelHash,
    };
  }
}

export function createTruthModelUpdateContract(
  dependencies?: TruthModelUpdateContractDependencies,
): TruthModelUpdateContract {
  return new TruthModelUpdateContract(dependencies);
}
