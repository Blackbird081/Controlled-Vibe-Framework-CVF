import type { ContextBuildBatchConsumerPipelineResult } from "./context.build.batch.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextBuildBatchConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  totalPackages: number;
  totalSegments: number;
  dominantTokenBudget: number;
  results: ContextBuildBatchConsumerPipelineResult[];
}

export interface ContextBuildBatchConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextBuildBatchConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ContextBuildBatchConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ContextBuildBatchConsumerPipelineResult[],
  ): ContextBuildBatchConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalResults = results.length;
    const totalPackages = results.reduce(
      (sum, r) => sum + r.contextBuildBatch.totalPackages,
      0,
    );
    const totalSegments = results.reduce(
      (sum, r) => sum + r.contextBuildBatch.totalSegments,
      0,
    );
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens));

    const batchHash = computeDeterministicHash(
      "w2-t36-cp2-context-build-batch-consumer-pipeline-batch",
      `totalResults=${totalResults}`,
      `totalPackages=${totalPackages}`,
      `totalSegments=${totalSegments}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t36-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults,
      totalPackages,
      totalSegments,
      dominantTokenBudget,
      results,
    };
  }
}

export function createContextBuildBatchConsumerPipelineBatchContract(
  dependencies?: ContextBuildBatchConsumerPipelineBatchContractDependencies,
): ContextBuildBatchConsumerPipelineBatchContract {
  return new ContextBuildBatchConsumerPipelineBatchContract(dependencies);
}
