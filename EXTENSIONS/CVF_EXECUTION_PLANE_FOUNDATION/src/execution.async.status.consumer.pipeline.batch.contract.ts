import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AsyncExecutionStatus } from "./execution.async.runtime.contract";
import type { AsyncExecutionStatusConsumerPipelineResult } from "./execution.async.status.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AsyncExecutionStatusConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: AsyncExecutionStatusConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  failedResultCount: number;
  runningResultCount: number;
  batchHash: string;
}

export interface AsyncExecutionStatusConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByStatus(
  results: AsyncExecutionStatusConsumerPipelineResult[],
  status: AsyncExecutionStatus,
): number {
  return results.filter((r) => r.statusSummary.dominantStatus === status).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AsyncExecutionStatusConsumerPipelineBatchContract (W2-T21 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------------------
 * Aggregates AsyncExecutionStatusConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   failedResultCount  = count of results where dominantStatus === "FAILED"
 *   runningResultCount = count of results where dominantStatus === "RUNNING"
 */
export class AsyncExecutionStatusConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AsyncExecutionStatusConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: AsyncExecutionStatusConsumerPipelineResult[],
  ): AsyncExecutionStatusConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const failedResultCount = countByStatus(results, "FAILED");
    const runningResultCount = countByStatus(results, "RUNNING");

    const batchHash = computeDeterministicHash(
      "w2-t21-cp2-async-execution-status-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t21-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      failedResultCount,
      runningResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAsyncExecutionStatusConsumerPipelineBatchContract(
  dependencies?: AsyncExecutionStatusConsumerPipelineBatchContractDependencies,
): AsyncExecutionStatusConsumerPipelineBatchContract {
  return new AsyncExecutionStatusConsumerPipelineBatchContract(dependencies);
}
