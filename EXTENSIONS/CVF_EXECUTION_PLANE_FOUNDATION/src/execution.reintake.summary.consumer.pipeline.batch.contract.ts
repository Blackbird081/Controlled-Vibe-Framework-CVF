import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReintakeAction } from "./execution.reintake.contract";
import type { ExecutionReintakeSummaryConsumerPipelineResult } from "./execution.reintake.summary.consumer.pipeline.contract";

export interface ExecutionReintakeSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ExecutionReintakeSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  replanResultCount: number;
  retryResultCount: number;
  batchHash: string;
}

export interface ExecutionReintakeSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

function countByAction(
  results: ExecutionReintakeSummaryConsumerPipelineResult[],
  action: ReintakeAction,
): number {
  return results.filter(
    (result) => result.reintakeSummary.dominantReintakeAction === action,
  ).length;
}

/**
 * ExecutionReintakeSummaryConsumerPipelineBatchContract (W2-T17 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------------------
 * Aggregates ExecutionReintakeSummaryConsumerPipelineResult[] into a governed batch.
 */
export class ExecutionReintakeSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionReintakeSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionReintakeSummaryConsumerPipelineResult[],
  ): ExecutionReintakeSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (result) => result.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const replanResultCount = countByAction(results, "REPLAN");
    const retryResultCount = countByAction(results, "RETRY");

    const batchHash = computeDeterministicHash(
      "w2-t17-cp2-execution-reintake-summary-consumer-pipeline-batch",
      ...results.map((result) => result.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t17-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      replanResultCount,
      retryResultCount,
      batchHash,
    };
  }
}

export function createExecutionReintakeSummaryConsumerPipelineBatchContract(
  dependencies?: ExecutionReintakeSummaryConsumerPipelineBatchContractDependencies,
): ExecutionReintakeSummaryConsumerPipelineBatchContract {
  return new ExecutionReintakeSummaryConsumerPipelineBatchContract(dependencies);
}
