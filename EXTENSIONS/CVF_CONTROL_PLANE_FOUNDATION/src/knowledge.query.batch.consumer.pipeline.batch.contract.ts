import type { KnowledgeQueryBatchConsumerPipelineResult } from "./knowledge.query.batch.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface KnowledgeQueryBatchConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  totalQueries: number;
  totalItemsFound: number;
  dominantTokenBudget: number;
  results: KnowledgeQueryBatchConsumerPipelineResult[];
}

export interface KnowledgeQueryBatchConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class KnowledgeQueryBatchConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeQueryBatchConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: KnowledgeQueryBatchConsumerPipelineResult[],
  ): KnowledgeQueryBatchConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalResults = results.length;
    const totalQueries = results.reduce(
      (sum, r) => sum + r.knowledgeQueryBatch.totalQueries,
      0,
    );
    const totalItemsFound = results.reduce(
      (sum, r) => sum + r.knowledgeQueryBatch.totalItemsFound,
      0,
    );
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens));

    const batchHash = computeDeterministicHash(
      "w2-t37-cp2-knowledge-query-batch-consumer-pipeline-batch",
      `totalResults=${totalResults}`,
      `totalQueries=${totalQueries}`,
      `totalItemsFound=${totalItemsFound}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t37-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults,
      totalQueries,
      totalItemsFound,
      dominantTokenBudget,
      results,
    };
  }
}

export function createKnowledgeQueryBatchConsumerPipelineBatchContract(
  dependencies?: KnowledgeQueryBatchConsumerPipelineBatchContractDependencies,
): KnowledgeQueryBatchConsumerPipelineBatchContract {
  return new KnowledgeQueryBatchConsumerPipelineBatchContract(dependencies);
}
