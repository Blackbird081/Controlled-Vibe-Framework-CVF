import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WindowsCompatibilityConsumerPipelineResult } from "./windows.compatibility.consumer.pipeline.contract";

export interface WindowsCompatibilityConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  nativeCount: number;
  compatibleCount: number;
  requiresRefactorCount: number;
  rejectedCount: number;
  blockerCount: number;
  dominantTokenBudget: number;
  results: WindowsCompatibilityConsumerPipelineResult[];
}

export interface WindowsCompatibilityConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

export class WindowsCompatibilityConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WindowsCompatibilityConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WindowsCompatibilityConsumerPipelineResult[],
  ): WindowsCompatibilityConsumerPipelineBatchResult {
    const createdAt = this.now();
    const nativeCount = results.filter(
      (result) => result.evaluationResult.classification === "WINDOWS_NATIVE",
    ).length;
    const compatibleCount = results.filter(
      (result) => result.evaluationResult.classification === "COMPATIBLE",
    ).length;
    const requiresRefactorCount = results.filter(
      (result) =>
        result.evaluationResult.classification === "REQUIRES_REFACTOR",
    ).length;
    const rejectedCount = results.filter(
      (result) =>
        result.evaluationResult.classification ===
        "REJECTED_FOR_WINDOWS_TARGET",
    ).length;
    const blockerCount = results.filter(
      (result) => result.evaluationResult.blockers.length > 0,
    ).length;
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (result) => result.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "windows-compatibility-consumer-pipeline-batch",
      ...results.map((result) => result.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "windows-compatibility-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      nativeCount,
      compatibleCount,
      requiresRefactorCount,
      rejectedCount,
      blockerCount,
      dominantTokenBudget,
      results,
    };
  }
}

export function createWindowsCompatibilityConsumerPipelineBatchContract(
  dependencies?: WindowsCompatibilityConsumerPipelineBatchContractDependencies,
): WindowsCompatibilityConsumerPipelineBatchContract {
  return new WindowsCompatibilityConsumerPipelineBatchContract(dependencies);
}
