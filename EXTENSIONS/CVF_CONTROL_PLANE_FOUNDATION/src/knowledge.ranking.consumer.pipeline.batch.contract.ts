import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { KnowledgeRankingConsumerPipelineResult } from "./knowledge.ranking.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeRankingConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: KnowledgeRankingConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  emptyRankingCount: number;
  batchHash: string;
}

export interface KnowledgeRankingConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * KnowledgeRankingConsumerPipelineBatchContract (W1-T19 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------
 * Aggregates KnowledgeRankingConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   emptyRankingCount = results where rankedResult.totalRanked === 0
 */
export class KnowledgeRankingConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: KnowledgeRankingConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: KnowledgeRankingConsumerPipelineResult[],
  ): KnowledgeRankingConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const emptyRankingCount = results.filter(
      (r) => r.rankedResult.totalRanked === 0,
    ).length;

    const batchHash = computeDeterministicHash(
      "w1-t19-cp2-knowledge-ranking-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t19-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      emptyRankingCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeRankingConsumerPipelineBatchContract(
  dependencies?: KnowledgeRankingConsumerPipelineBatchContractDependencies,
): KnowledgeRankingConsumerPipelineBatchContract {
  return new KnowledgeRankingConsumerPipelineBatchContract(dependencies);
}
