import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { TruthModelConsumerPipelineResult } from "./truth.model.consumer.pipeline.contract";
import type { DominantPattern } from "./pattern.detection.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthModelConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  totalModels: number;
  averageConfidence: number;
  dominantPattern: DominantPattern;
  trajectoryDistribution: {
    improving: number;
    stable: number;
    degrading: number;
    unknown: number;
  };
  batchHash: string;
}

export interface TruthModelConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Pattern Logic ───────────────────────────────────────────────────

function computeDominantPattern(results: TruthModelConsumerPipelineResult[]): DominantPattern {
  if (results.length === 0) return "EMPTY";
  
  const counts: Record<string, number> = {};
  for (const result of results) {
    const pattern = result.model.dominantPattern;
    if (pattern === "MIXED" || pattern === "EMPTY") continue;
    counts[pattern] = (counts[pattern] ?? 0) + 1;
  }
  
  const keys = Object.keys(counts);
  if (keys.length === 0) return "MIXED";
  
  const max = Math.max(...Object.values(counts));
  const winners = keys.filter((k) => counts[k] === max);
  
  return winners.length === 1 ? (winners[0] as DominantPattern) : "MIXED";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthModelConsumerPipelineBatchContract (W4-T19 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------
 * Aggregates multiple TruthModelConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   totalModels = count of results
 *   averageConfidence = avg(result.model.confidenceLevel)
 *   dominantPattern = most frequent pattern across all models
 *   trajectoryDistribution = count by trajectory type
 *
 * Empty batch: dominantTokenBudget = 0, averageConfidence = 0, dominantPattern = "EMPTY", valid hash
 */
export class TruthModelConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: TruthModelConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: TruthModelConsumerPipelineResult[],
  ): TruthModelConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalResults = results.length;

    const dominantTokenBudget =
      totalResults === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const totalModels = totalResults;

    const averageConfidence =
      totalResults === 0
        ? 0
        : Math.round(
            (results.reduce((sum, r) => sum + r.model.confidenceLevel, 0) / totalResults) * 100,
          ) / 100;

    const dominantPattern = computeDominantPattern(results);

    const trajectoryDistribution = {
      improving: results.filter((r) => r.model.healthTrajectory === "IMPROVING").length,
      stable: results.filter((r) => r.model.healthTrajectory === "STABLE").length,
      degrading: results.filter((r) => r.model.healthTrajectory === "DEGRADING").length,
      unknown: results.filter((r) => r.model.healthTrajectory === "UNKNOWN").length,
    };

    const batchHash = computeDeterministicHash(
      "w4-t19-cp2-truth-model-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `models:${totalModels}:avgConf:${averageConfidence}:pattern:${dominantPattern}`,
      `improving:${trajectoryDistribution.improving}:stable:${trajectoryDistribution.stable}:degrading:${trajectoryDistribution.degrading}:unknown:${trajectoryDistribution.unknown}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t19-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      totalModels,
      averageConfidence,
      dominantPattern,
      trajectoryDistribution,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthModelConsumerPipelineBatchContract(
  dependencies?: TruthModelConsumerPipelineBatchContractDependencies,
): TruthModelConsumerPipelineBatchContract {
  return new TruthModelConsumerPipelineBatchContract(dependencies);
}
