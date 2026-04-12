import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ProvisionalEvaluationSignalConsumerPipelineResult } from "./provisional.evaluation.signal.consumer.pipeline.contract";

export interface ProvisionalEvaluationSignalConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  capturedSignalCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  dominantTokenBudget: number;
  results: ProvisionalEvaluationSignalConsumerPipelineResult[];
}

export interface ProvisionalEvaluationSignalConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

export class ProvisionalEvaluationSignalConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ProvisionalEvaluationSignalConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ProvisionalEvaluationSignalConsumerPipelineResult[],
  ): ProvisionalEvaluationSignalConsumerPipelineBatchResult {
    const createdAt = this.now();
    const capturedSignalCount = results.filter(
      (result) => result.signalResult !== null,
    ).length;
    const highSeverityCount = results.filter(
      (result) => result.signalResult?.severity === "high",
    ).length;
    const mediumSeverityCount = results.filter(
      (result) => result.signalResult?.severity === "medium",
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
      "stage1-provisional-eval-signal-consumer-pipeline-batch",
      ...results.map((result) => result.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "stage1-provisional-eval-signal-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      capturedSignalCount,
      highSeverityCount,
      mediumSeverityCount,
      dominantTokenBudget,
      results,
    };
  }
}

export function createProvisionalEvaluationSignalConsumerPipelineBatchContract(
  dependencies?: ProvisionalEvaluationSignalConsumerPipelineBatchContractDependencies,
): ProvisionalEvaluationSignalConsumerPipelineBatchContract {
  return new ProvisionalEvaluationSignalConsumerPipelineBatchContract(dependencies);
}
