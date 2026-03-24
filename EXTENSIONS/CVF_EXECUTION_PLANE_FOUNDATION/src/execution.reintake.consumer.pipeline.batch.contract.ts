import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReintakeAction } from "./execution.reintake.contract";
import type { ExecutionReintakeConsumerPipelineResult } from "./execution.reintake.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionReintakeConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ExecutionReintakeConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  replanCount: number;
  retryCount: number;
  batchHash: string;
}

export interface ExecutionReintakeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countAction(
  results: ExecutionReintakeConsumerPipelineResult[],
  action: ReintakeAction,
): number {
  return results.filter((r) => r.reintakeRequest.reintakeAction === action).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionReintakeConsumerPipelineBatchContract (W2-T12 CP2 — Fast Lane)
 * -----------------------------------------------------------------------
 * Aggregates ExecutionReintakeConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   replanCount = count of REPLAN actions
 *   retryCount = count of RETRY actions
 */
export class ExecutionReintakeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionReintakeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionReintakeConsumerPipelineResult[],
  ): ExecutionReintakeConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const replanCount = countAction(results, "REPLAN");
    const retryCount = countAction(results, "RETRY");

    const batchHash = computeDeterministicHash(
      "w2-t12-cp2-reintake-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t12-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      replanCount,
      retryCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionReintakeConsumerPipelineBatchContract(
  dependencies?: ExecutionReintakeConsumerPipelineBatchContractDependencies,
): ExecutionReintakeConsumerPipelineBatchContract {
  return new ExecutionReintakeConsumerPipelineBatchContract(dependencies);
}
