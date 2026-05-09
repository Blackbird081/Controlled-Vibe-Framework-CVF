import type { AsyncRuntimeConsumerPipelineResult } from "./async.runtime.consumer.pipeline.contract";
import type { AsyncExecutionStatus } from "./execution.async.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface AsyncRuntimeConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalTickets: number;
  dominantStatus: AsyncExecutionStatus;
  totalExecutedCount: number;
  totalFailedCount: number;
  dominantTokenBudget: number;
  results: AsyncRuntimeConsumerPipelineResult[];
}

export interface AsyncRuntimeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Status Priority ---

const STATUS_PRIORITY: Record<AsyncExecutionStatus, number> = {
  COMPLETED: 4,
  RUNNING: 3,
  PENDING: 2,
  FAILED: 1,
};

function computeDominantStatus(
  results: AsyncRuntimeConsumerPipelineResult[],
): AsyncExecutionStatus {
  if (results.length === 0) return "PENDING";

  const statusCounts = new Map<AsyncExecutionStatus, number>();
  for (const r of results) {
    const status = r.asyncTicket.asyncStatus;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  let dominantStatus: AsyncExecutionStatus = "PENDING";
  let maxCount = 0;
  let maxPriority = 0;

  for (const [status, count] of statusCounts.entries()) {
    const priority = STATUS_PRIORITY[status];
    if (count > maxCount || (count === maxCount && priority > maxPriority)) {
      dominantStatus = status;
      maxCount = count;
      maxPriority = priority;
    }
  }

  return dominantStatus;
}

// --- Contract ---

export class AsyncRuntimeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AsyncRuntimeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: AsyncRuntimeConsumerPipelineResult[],
  ): AsyncRuntimeConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalTickets = results.length;
    const dominantStatus = computeDominantStatus(results);
    const totalExecutedCount = results.reduce(
      (sum, r) => sum + r.asyncTicket.executedCount,
      0,
    );
    const totalFailedCount = results.reduce(
      (sum, r) => sum + r.asyncTicket.failedCount,
      0,
    );

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t28-cp2-async-runtime-consumer-batch",
      `totalTickets=${totalTickets}`,
      `dominantStatus=${dominantStatus}`,
      `totalExecuted=${totalExecutedCount}`,
      `totalFailed=${totalFailedCount}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t28-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalTickets,
      dominantStatus,
      totalExecutedCount,
      totalFailedCount,
      dominantTokenBudget,
      results,
    };
  }
}

export function createAsyncRuntimeConsumerPipelineBatchContract(
  dependencies?: AsyncRuntimeConsumerPipelineBatchContractDependencies,
): AsyncRuntimeConsumerPipelineBatchContract {
  return new AsyncRuntimeConsumerPipelineBatchContract(dependencies);
}
