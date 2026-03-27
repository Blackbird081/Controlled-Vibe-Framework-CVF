import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CommandRuntimeConsumerPipelineResult } from "./command.runtime.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandRuntimeConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  executedCount: number;
  sandboxedCount: number;
  skippedCount: number;
  failedCount: number;
  batchHash: string;
}

export interface CommandRuntimeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * CommandRuntimeConsumerPipelineBatchContract (W2-T25 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------
 * Aggregates multiple CommandRuntimeConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   executedCount = sum(result.runtimeResult.executedCount)
 *   sandboxedCount = sum(result.runtimeResult.sandboxedCount)
 *   skippedCount = sum(result.runtimeResult.skippedCount)
 *   failedCount = sum(result.runtimeResult.failedCount)
 *
 * Empty batch: dominantTokenBudget = 0, valid hash
 */
export class CommandRuntimeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: CommandRuntimeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: CommandRuntimeConsumerPipelineResult[],
  ): CommandRuntimeConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalResults = results.length;

    const dominantTokenBudget =
      totalResults === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const executedCount = results.reduce(
      (sum, r) => sum + r.runtimeResult.executedCount,
      0,
    );
    const sandboxedCount = results.reduce(
      (sum, r) => sum + r.runtimeResult.sandboxedCount,
      0,
    );
    const skippedCount = results.reduce(
      (sum, r) => sum + r.runtimeResult.skippedCount,
      0,
    );
    const failedCount = results.reduce(
      (sum, r) => sum + r.runtimeResult.failedCount,
      0,
    );

    const batchHash = computeDeterministicHash(
      "w2-t25-cp2-command-runtime-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `executed:${executedCount}:sandboxed:${sandboxedCount}:skipped:${skippedCount}:failed:${failedCount}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t25-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      executedCount,
      sandboxedCount,
      skippedCount,
      failedCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createCommandRuntimeConsumerPipelineBatchContract(
  dependencies?: CommandRuntimeConsumerPipelineBatchContractDependencies,
): CommandRuntimeConsumerPipelineBatchContract {
  return new CommandRuntimeConsumerPipelineBatchContract(dependencies);
}
