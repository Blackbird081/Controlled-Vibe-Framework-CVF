import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { KnowledgeQueryConsumerPipelineResult } from "./knowledge.query.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeQueryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: KnowledgeQueryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  emptyResultCount: number;
  batchHash: string;
}

export interface KnowledgeQueryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * KnowledgeQueryConsumerPipelineBatchContract (W1-T22 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates KnowledgeQueryConsumerPipelineResult[] into a governed batch.
 *
 * Fields:
 *   emptyResultCount    = results where queryResult.totalFound === 0
 *   dominantTokenBudget = Math.max(typedContextPackage.estimatedTokens); 0 for empty
 *   batchHash           = hash of all pipelineHashes + createdAt
 *   batchId             = hash(batchHash) — distinct from batchHash
 */
export class KnowledgeQueryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: KnowledgeQueryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: KnowledgeQueryConsumerPipelineResult[],
  ): KnowledgeQueryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const emptyResultCount = results.filter(
      (r) => r.queryResult.totalFound === 0,
    ).length;

    const batchHash = computeDeterministicHash(
      "w1-t22-cp2-knowledge-query-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t22-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      emptyResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeQueryConsumerPipelineBatchContract(
  dependencies?: KnowledgeQueryConsumerPipelineBatchContractDependencies,
): KnowledgeQueryConsumerPipelineBatchContract {
  return new KnowledgeQueryConsumerPipelineBatchContract(dependencies);
}
