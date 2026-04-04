import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExecutionFeedbackConsumerPipelineResult } from "./execution.feedback.consumer.pipeline.contract";

// --- Types ---

export interface ExecutionFeedbackConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: ExecutionFeedbackConsumerPipelineResult[];
  dominantTokenBudget: number;
  batchHash: string;
}

export interface ExecutionFeedbackConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function computeDominantTokenBudget(
  results: ExecutionFeedbackConsumerPipelineResult[],
): number {
  if (results.length === 0) return 0;
  return Math.max(
    ...results.map(
      (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
    ),
  );
}

// --- Contract ---

export class ExecutionFeedbackConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionFeedbackConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionFeedbackConsumerPipelineResult[],
  ): ExecutionFeedbackConsumerPipelineBatch {
    const createdAt = this.now();
    const dominantTokenBudget = computeDominantTokenBudget(results);

    const batchHash = computeDeterministicHash(
      "w2-t11-cp2-feedback-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t11-cp2-feedback-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      results,
      dominantTokenBudget,
      batchHash,
    };
  }
}

export function createExecutionFeedbackConsumerPipelineBatchContract(
  dependencies?: ExecutionFeedbackConsumerPipelineBatchContractDependencies,
): ExecutionFeedbackConsumerPipelineBatchContract {
  return new ExecutionFeedbackConsumerPipelineBatchContract(dependencies);
}
