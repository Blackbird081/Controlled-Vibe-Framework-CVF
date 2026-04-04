import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReversePromptingConsumerPipelineResult } from "./reverse.prompting.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReversePromptingConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ReversePromptingConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  highPriorityResultCount: number;
  totalQuestionsCount: number;
  batchHash: string;
}

export interface ReversePromptingConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ReversePromptingConsumerPipelineBatchContract (W1-T17 CP2 — Fast Lane)
 * -----------------------------------------------------------------------
 * Aggregates ReversePromptingConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   highPriorityResultCount = results where reversePromptPacket.highPriorityCount > 0
 *   totalQuestionsCount = sum of reversePromptPacket.totalQuestions across all results
 */
export class ReversePromptingConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ReversePromptingConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ReversePromptingConsumerPipelineResult[],
  ): ReversePromptingConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const highPriorityResultCount = results.filter(
      (r) => r.reversePromptPacket.highPriorityCount > 0,
    ).length;

    const totalQuestionsCount = results.reduce(
      (sum, r) => sum + r.reversePromptPacket.totalQuestions,
      0,
    );

    const batchHash = computeDeterministicHash(
      "w1-t17-cp2-reverse-prompting-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t17-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      highPriorityResultCount,
      totalQuestionsCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createReversePromptingConsumerPipelineBatchContract(
  dependencies?: ReversePromptingConsumerPipelineBatchContractDependencies,
): ReversePromptingConsumerPipelineBatchContract {
  return new ReversePromptingConsumerPipelineBatchContract(dependencies);
}
