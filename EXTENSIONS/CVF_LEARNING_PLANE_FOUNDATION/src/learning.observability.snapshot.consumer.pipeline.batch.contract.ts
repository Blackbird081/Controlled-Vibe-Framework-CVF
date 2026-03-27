import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  LearningObservabilitySnapshotConsumerPipelineResult,
} from "./learning.observability.snapshot.consumer.pipeline.contract";
import type { ObservabilityHealth, SnapshotTrend } from "./learning.observability.snapshot.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningObservabilitySnapshotConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalSnapshots: number;
  totalReports: number;
  overallDominantHealth: ObservabilityHealth;
  overallDominantTrend: SnapshotTrend;
  dominantTokenBudget: number;
  results: LearningObservabilitySnapshotConsumerPipelineResult[];
  batchHash: string;
}

export interface LearningObservabilitySnapshotConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Health Logic ────────────────────────────────────────────────────

// Severity-first: CRITICAL > DEGRADED > UNKNOWN > HEALTHY
const HEALTH_PRIORITY: Record<ObservabilityHealth, number> = {
  CRITICAL: 4,
  DEGRADED: 3,
  UNKNOWN: 2,
  HEALTHY: 1,
};

function computeOverallDominantHealth(
  results: LearningObservabilitySnapshotConsumerPipelineResult[],
): ObservabilityHealth {
  if (results.length === 0) return "UNKNOWN";
  return results.reduce((dominant, r) =>
    HEALTH_PRIORITY[r.dominantHealth] > HEALTH_PRIORITY[dominant]
      ? r.dominantHealth
      : dominant,
    results[0].dominantHealth,
  );
}

// ─── Dominant Trend Logic ─────────────────────────────────────────────────────

// Most concerning: DEGRADING > INSUFFICIENT_DATA > STABLE > IMPROVING
const TREND_PRIORITY: Record<SnapshotTrend, number> = {
  DEGRADING: 4,
  INSUFFICIENT_DATA: 3,
  STABLE: 2,
  IMPROVING: 1,
};

function computeOverallDominantTrend(
  results: LearningObservabilitySnapshotConsumerPipelineResult[],
): SnapshotTrend {
  if (results.length === 0) return "INSUFFICIENT_DATA";
  return results.reduce((dominant, r) =>
    TREND_PRIORITY[r.dominantTrend] > TREND_PRIORITY[dominant]
      ? r.dominantTrend
      : dominant,
    results[0].dominantTrend,
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningObservabilitySnapshotConsumerPipelineBatchContract (W4-T23 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------------------
 * Aggregates multiple LearningObservabilitySnapshotConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalSnapshots = count of results
 *   totalReports = sum(result.snapshot.totalReports)
 *   overallDominantHealth = most severe health (CRITICAL > DEGRADED > UNKNOWN > HEALTHY)
 *   overallDominantTrend = most concerning trend (DEGRADING > INSUFFICIENT_DATA > STABLE > IMPROVING)
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class LearningObservabilitySnapshotConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningObservabilitySnapshotConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: LearningObservabilitySnapshotConsumerPipelineResult[],
  ): LearningObservabilitySnapshotConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalSnapshots = results.length;

    const totalReports = results.reduce(
      (sum, r) => sum + r.snapshot.totalReports,
      0,
    );

    const overallDominantHealth = computeOverallDominantHealth(results);
    const overallDominantTrend = computeOverallDominantTrend(results);

    const dominantTokenBudget =
      totalSnapshots === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t23-cp2-learning-observability-snapshot-consumer-pipeline-batch",
      `totalSnapshots=${totalSnapshots}:totalReports=${totalReports}`,
      `overallHealth=${overallDominantHealth}:overallTrend=${overallDominantTrend}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t23-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalSnapshots,
      totalReports,
      overallDominantHealth,
      overallDominantTrend,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningObservabilitySnapshotConsumerPipelineBatchContract(
  dependencies?: LearningObservabilitySnapshotConsumerPipelineBatchContractDependencies,
): LearningObservabilitySnapshotConsumerPipelineBatchContract {
  return new LearningObservabilitySnapshotConsumerPipelineBatchContract(dependencies);
}
