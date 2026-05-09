import type { ContextBuildConsumerPipelineResult } from "./context.build.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextBuildConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalPackages: number;
  totalSegments: number;
  totalTokens: number;
  dominantTokenBudget: number;
  results: ContextBuildConsumerPipelineResult[];
}

export interface ContextBuildConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextBuildConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ContextBuildConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: ContextBuildConsumerPipelineResult[]): ContextBuildConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalPackages = results.length;
    const totalSegments = results.reduce(
      (sum, r) => sum + r.contextPackage.totalSegments,
      0,
    );
    const totalTokens = results.reduce(
      (sum, r) => sum + r.contextPackage.estimatedTokens,
      0,
    );
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
          );

    const batchHash = computeDeterministicHash(
      "w2-t32-cp2-context-build-consumer-batch",
      `totalPackages=${totalPackages}`,
      `totalSegments=${totalSegments}`,
      `totalTokens=${totalTokens}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t32-cp2-batch-id",
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

export function createContextBuildConsumerPipelineBatchContract(
  dependencies?: ContextBuildConsumerPipelineBatchContractDependencies,
): ContextBuildConsumerPipelineBatchContract {
  return new ContextBuildConsumerPipelineBatchContract(dependencies);
}
