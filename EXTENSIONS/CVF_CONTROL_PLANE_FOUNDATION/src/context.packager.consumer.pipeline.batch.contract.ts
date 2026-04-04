import type { ContextPackagerConsumerPipelineResult } from "./context.packager.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextPackagerConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalPackages: number;
  totalSegments: number;
  totalTokens: number;
  dominantTokenBudget: number;
  results: ContextPackagerConsumerPipelineResult[];
}

export interface ContextPackagerConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextPackagerConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ContextPackagerConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ContextPackagerConsumerPipelineResult[],
  ): ContextPackagerConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalPackages = results.length;
    const totalSegments = results.reduce(
      (sum, r) => sum + r.typedContextPackage.totalSegments,
      0,
    );
    const totalTokens = results.reduce(
      (sum, r) => sum + r.typedContextPackage.estimatedTokens,
      0,
    );
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.typedContextPackage.estimatedTokens));

    const batchHash = computeDeterministicHash(
      "w2-t35-cp2-context-packager-consumer-batch",
      `totalPackages=${totalPackages}`,
      `totalSegments=${totalSegments}`,
      `totalTokens=${totalTokens}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t35-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalPackages,
      totalSegments,
      totalTokens,
      dominantTokenBudget,
      results,
    };
  }
}

export function createContextPackagerConsumerPipelineBatchContract(
  dependencies?: ContextPackagerConsumerPipelineBatchContractDependencies,
): ContextPackagerConsumerPipelineBatchContract {
  return new ContextPackagerConsumerPipelineBatchContract(dependencies);
}
