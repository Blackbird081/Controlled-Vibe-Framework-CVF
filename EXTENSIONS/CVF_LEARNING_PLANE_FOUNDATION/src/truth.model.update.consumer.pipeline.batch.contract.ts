import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { TruthModelUpdateConsumerPipelineResult } from "./truth.model.update.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthModelUpdateConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  totalModelUpdates: number;
  latestModelVersion: number;
  healthTrajectoryDistribution: {
    improving: number;
    stable: number;
    degrading: number;
  };
  batchHash: string;
}

export interface TruthModelUpdateConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthModelUpdateConsumerPipelineBatchContract (W4-T18 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------------
 * Aggregates multiple TruthModelUpdateConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   totalModelUpdates = count of results
 *   latestModelVersion = max(result.updatedModel.version)
 *   healthTrajectoryDistribution = count by trajectory type
 *
 * Empty batch: dominantTokenBudget = 0, latestModelVersion = 0, valid hash
 */
export class TruthModelUpdateConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: TruthModelUpdateConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: TruthModelUpdateConsumerPipelineResult[],
  ): TruthModelUpdateConsumerPipelineBatchResult {
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

    const totalModelUpdates = totalResults;

    const latestModelVersion =
      totalResults === 0
        ? 0
        : Math.max(...results.map((r) => r.updatedModel.version));

    const healthTrajectoryDistribution = {
      improving: results.filter((r) => r.updatedModel.healthTrajectory === "IMPROVING").length,
      stable: results.filter((r) => r.updatedModel.healthTrajectory === "STABLE").length,
      degrading: results.filter((r) => r.updatedModel.healthTrajectory === "DEGRADING").length,
    };

    const batchHash = computeDeterministicHash(
      "w4-t18-cp2-truth-model-update-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `updates:${totalModelUpdates}:latestVersion:${latestModelVersion}`,
      `improving:${healthTrajectoryDistribution.improving}:stable:${healthTrajectoryDistribution.stable}:degrading:${healthTrajectoryDistribution.degrading}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t18-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      totalModelUpdates,
      latestModelVersion,
      healthTrajectoryDistribution,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthModelUpdateConsumerPipelineBatchContract(
  dependencies?: TruthModelUpdateConsumerPipelineBatchContractDependencies,
): TruthModelUpdateConsumerPipelineBatchContract {
  return new TruthModelUpdateConsumerPipelineBatchContract(dependencies);
}
