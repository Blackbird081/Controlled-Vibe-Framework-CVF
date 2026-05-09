import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExecutionPipelineConsumerPipelineResult } from "./execution.pipeline.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionPipelineConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ExecutionPipelineConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  failedResultCount: number;
  sandboxedResultCount: number;
  batchHash: string;
}

export interface ExecutionPipelineConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionPipelineConsumerPipelineBatchContract (W2-T22 CP2 — Fast Lane GC-021)
 * ----------------------------------------------------------------------------------
 * Aggregates ExecutionPipelineConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   failedResultCount    = count of results where pipelineReceipt.failedCount > 0
 *   sandboxedResultCount = count of results where pipelineReceipt.sandboxedCount > 0
 */
export class ExecutionPipelineConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionPipelineConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionPipelineConsumerPipelineResult[],
  ): ExecutionPipelineConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const failedResultCount = results.filter(
      (r) => r.pipelineReceipt.failedCount > 0,
    ).length;

    const sandboxedResultCount = results.filter(
      (r) => r.pipelineReceipt.sandboxedCount > 0,
    ).length;

    const batchHash = computeDeterministicHash(
      "w2-t22-cp2-execution-pipeline-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t22-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      failedResultCount,
      sandboxedResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionPipelineConsumerPipelineBatchContract(
  dependencies?: ExecutionPipelineConsumerPipelineBatchContractDependencies,
): ExecutionPipelineConsumerPipelineBatchContract {
  return new ExecutionPipelineConsumerPipelineBatchContract(dependencies);
}
