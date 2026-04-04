import type { RetrievalConsumerPipelineResult } from "./retrieval.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface RetrievalConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  totalChunks: number;
  totalCandidates: number;
  dominantTokenBudget: number;
  results: RetrievalConsumerPipelineResult[];
}

export interface RetrievalConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class RetrievalConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: RetrievalConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: RetrievalConsumerPipelineResult[],
  ): RetrievalConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalResults = results.length;
    const totalChunks = results.reduce(
      (sum, r) => sum + r.retrievalResult.chunkCount,
      0,
    );
    const totalCandidates = results.reduce(
      (sum, r) => sum + r.retrievalResult.totalCandidates,
      0,
    );
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens));

    const batchHash = computeDeterministicHash(
      "w2-t38-cp2-retrieval-consumer-pipeline-batch",
      `totalResults=${totalResults}`,
      `totalChunks=${totalChunks}`,
      `totalCandidates=${totalCandidates}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t38-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults,
      totalChunks,
      totalCandidates,
      dominantTokenBudget,
      results,
    };
  }
}

export function createRetrievalConsumerPipelineBatchContract(
  dependencies?: RetrievalConsumerPipelineBatchContractDependencies,
): RetrievalConsumerPipelineBatchContract {
  return new RetrievalConsumerPipelineBatchContract(dependencies);
}
