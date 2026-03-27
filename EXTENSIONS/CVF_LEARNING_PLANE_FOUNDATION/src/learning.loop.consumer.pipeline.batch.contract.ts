import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningLoopConsumerPipelineResult } from "./learning.loop.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningLoopConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  resultCount: number;
  rejectCount: number;
  escalateCount: number;
  retryCount: number;
  acceptCount: number;
  dominantTokenBudget: number;
  batchHash: string;
}

export interface LearningLoopConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningLoopConsumerPipelineBatchContract (W4-T14 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates multiple LearningLoopConsumerPipelineResult entries
 * into a governed batch summary.
 *
 * Batch fields:
 *   rejectCount         — sum of loopSummary.rejectCount across batch
 *   escalateCount       — sum of loopSummary.escalateCount across batch
 *   retryCount          — sum of loopSummary.retryCount across batch
 *   acceptCount         — sum of loopSummary.acceptCount across batch
 *   dominantTokenBudget — Math.max(estimatedTokens) across batch; 0 for empty
 *
 * Seeds:
 *   batchHash: w4-t14-cp2-learning-loop-consumer-pipeline-batch
 *   batchId:   w4-t14-cp2-batch-id
 */
export class LearningLoopConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningLoopConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: LearningLoopConsumerPipelineResult[],
  ): LearningLoopConsumerPipelineBatch {
    const createdAt = this.now();
    const resultCount = results.length;

    let rejectCount = 0;
    let escalateCount = 0;
    let retryCount = 0;
    let acceptCount = 0;
    const tokenBudgets: number[] = [];

    for (const result of results) {
      rejectCount += result.loopSummary.rejectCount;
      escalateCount += result.loopSummary.escalateCount;
      retryCount += result.loopSummary.retryCount;
      acceptCount += result.loopSummary.acceptCount;

      const estimatedTokens =
        result.consumerPackage.typedContextPackage?.estimatedTokens ?? 0;
      tokenBudgets.push(estimatedTokens);
    }

    const dominantTokenBudget =
      tokenBudgets.length > 0 ? Math.max(...tokenBudgets) : 0;

    const batchHash = computeDeterministicHash(
      "w4-t14-cp2-learning-loop-consumer-pipeline-batch",
      `${createdAt}:count=${resultCount}`,
      `reject=${rejectCount}:escalate=${escalateCount}:retry=${retryCount}:accept=${acceptCount}`,
      ...results.map((r) => r.pipelineHash),
    );

    const batchId = computeDeterministicHash(
      "w4-t14-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      resultCount,
      rejectCount,
      escalateCount,
      retryCount,
      acceptCount,
      dominantTokenBudget,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningLoopConsumerPipelineBatchContract(
  dependencies?: LearningLoopConsumerPipelineBatchContractDependencies,
): LearningLoopConsumerPipelineBatchContract {
  return new LearningLoopConsumerPipelineBatchContract(dependencies);
}
