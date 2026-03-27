import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningReinjectionConsumerPipelineResult } from "./learning.reinjection.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningReinjectionConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  rejectCount: number;
  escalateCount: number;
  retryCount: number;
  acceptCount: number;
  batchHash: string;
}

export interface LearningReinjectionConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningReinjectionConsumerPipelineBatchContract (W4-T15 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------------
 * Aggregates multiple LearningReinjectionConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   rejectCount = count(feedbackInput.feedbackClass === "REJECT")
 *   escalateCount = count(feedbackInput.feedbackClass === "ESCALATE")
 *   retryCount = count(feedbackInput.feedbackClass === "RETRY")
 *   acceptCount = count(feedbackInput.feedbackClass === "ACCEPT")
 *
 * Empty batch: dominantTokenBudget = 0, valid hash
 */
export class LearningReinjectionConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningReinjectionConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: LearningReinjectionConsumerPipelineResult[],
  ): LearningReinjectionConsumerPipelineBatchResult {
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

    const rejectCount = results.filter(
      (r) => r.reinjectionResult.feedbackInput.feedbackClass === "REJECT",
    ).length;
    const escalateCount = results.filter(
      (r) => r.reinjectionResult.feedbackInput.feedbackClass === "ESCALATE",
    ).length;
    const retryCount = results.filter(
      (r) => r.reinjectionResult.feedbackInput.feedbackClass === "RETRY",
    ).length;
    const acceptCount = results.filter(
      (r) => r.reinjectionResult.feedbackInput.feedbackClass === "ACCEPT",
    ).length;

    const batchHash = computeDeterministicHash(
      "w4-t15-cp2-learning-reinjection-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `reject:${rejectCount}:escalate:${escalateCount}:retry:${retryCount}:accept:${acceptCount}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t15-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      rejectCount,
      escalateCount,
      retryCount,
      acceptCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningReinjectionConsumerPipelineBatchContract(
  dependencies?: LearningReinjectionConsumerPipelineBatchContractDependencies,
): LearningReinjectionConsumerPipelineBatchContract {
  return new LearningReinjectionConsumerPipelineBatchContract(dependencies);
}
