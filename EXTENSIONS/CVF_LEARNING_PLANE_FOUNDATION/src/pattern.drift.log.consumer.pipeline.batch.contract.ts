import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  PatternDriftLogConsumerPipelineResult,
} from "./pattern.drift.log.consumer.pipeline.contract";
import type { DriftClass } from "./pattern.drift.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDriftLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalSignals: number;
  overallDominantDriftClass: DriftClass;
  dominantTokenBudget: number;
  results: PatternDriftLogConsumerPipelineResult[];
  batchHash: string;
}

export interface PatternDriftLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Drift Class Logic ───────────────────────────────────────────────

// Severity-based: most severe class wins
// CRITICAL_DRIFT > DRIFTING > STABLE

const DRIFT_CLASS_SEVERITY: Record<DriftClass, number> = {
  CRITICAL_DRIFT: 3,
  DRIFTING: 2,
  STABLE: 1,
};

function computeOverallDominantDriftClass(
  results: PatternDriftLogConsumerPipelineResult[],
): DriftClass {
  if (results.length === 0) return "STABLE";

  let maxSeverity = 0;
  let dominantClass: DriftClass = "STABLE";

  for (const result of results) {
    const severity = DRIFT_CLASS_SEVERITY[result.dominantDriftClass];
    if (severity > maxSeverity) {
      maxSeverity = severity;
      dominantClass = result.dominantDriftClass;
    }
  }

  return dominantClass;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDriftLogConsumerPipelineBatchContract (W4-T25 CP2 — Fast Lane GC-021)
 * -----------------------------------------------------------------------------
 * Aggregates multiple PatternDriftLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalSignals = sum(result.log.totalSignals)
 *   overallDominantDriftClass = most severe class (CRITICAL_DRIFT > DRIFTING > STABLE)
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class PatternDriftLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: PatternDriftLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: PatternDriftLogConsumerPipelineResult[],
  ): PatternDriftLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalSignals = results.reduce(
      (sum, r) => sum + r.log.totalSignals,
      0,
    );

    const overallDominantDriftClass = computeOverallDominantDriftClass(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t25-cp2-pattern-drift-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalSignals=${totalSignals}`,
      `overallDrift=${overallDominantDriftClass}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t25-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalSignals,
      overallDominantDriftClass,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDriftLogConsumerPipelineBatchContract(
  dependencies?: PatternDriftLogConsumerPipelineBatchContractDependencies,
): PatternDriftLogConsumerPipelineBatchContract {
  return new PatternDriftLogConsumerPipelineBatchContract(dependencies);
}
