import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  TruthScoreLogConsumerPipelineResult,
} from "./truth.score.log.consumer.pipeline.contract";
import type { TruthScoreClass } from "./truth.score.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthScoreLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalScores: number;
  overallDominantClass: TruthScoreClass;
  averageComposite: number;
  dominantTokenBudget: number;
  results: TruthScoreLogConsumerPipelineResult[];
  batchHash: string;
}

export interface TruthScoreLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant class logic ─────────────────────────────────────────────────────
// Severity-first: INSUFFICIENT > WEAK > ADEQUATE > STRONG

const CLASS_PRIORITY: TruthScoreClass[] = [
  "INSUFFICIENT",
  "WEAK",
  "ADEQUATE",
  "STRONG",
];

function computeOverallDominantClass(
  results: TruthScoreLogConsumerPipelineResult[],
): TruthScoreClass {
  if (results.length === 0) return "INSUFFICIENT";
  const classSet = new Set(results.map((r) => r.log.dominantClass));
  for (const cls of CLASS_PRIORITY) {
    if (classSet.has(cls)) return cls;
  }
  return "INSUFFICIENT";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreLogConsumerPipelineBatchContract (W4-T21 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------
 * Aggregates multiple TruthScoreLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalScores = sum(result.log.totalScores)
 *   overallDominantClass = most severe class (INSUFFICIENT > WEAK > ADEQUATE > STRONG)
 *   averageComposite = avg(result.log.averageComposite)
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class TruthScoreLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: TruthScoreLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: TruthScoreLogConsumerPipelineResult[],
  ): TruthScoreLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalScores = results.reduce(
      (sum, r) => sum + r.log.totalScores,
      0,
    );

    const overallDominantClass = computeOverallDominantClass(results);

    const averageComposite =
      totalLogs === 0
        ? 0
        : Math.round(
            (results.reduce((sum, r) => sum + r.log.averageComposite, 0) /
              totalLogs) *
              100,
          ) / 100;

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t21-cp2-truth-score-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalScores=${totalScores}`,
      `overallDominant=${overallDominantClass}:avgComposite=${averageComposite}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t21-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalScores,
      overallDominantClass,
      averageComposite,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreLogConsumerPipelineBatchContract(
  dependencies?: TruthScoreLogConsumerPipelineBatchContractDependencies,
): TruthScoreLogConsumerPipelineBatchContract {
  return new TruthScoreLogConsumerPipelineBatchContract(dependencies);
}
