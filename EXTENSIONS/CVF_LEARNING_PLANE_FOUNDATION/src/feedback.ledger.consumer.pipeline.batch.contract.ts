import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { FeedbackLedgerConsumerPipelineResult } from "./feedback.ledger.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackLedgerConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number;
  totalFeedbackCount: number;
  feedbackClassCounts: {
    acceptCount: number;
    retryCount: number;
    escalateCount: number;
    rejectCount: number;
  };
  batchHash: string;
}

export interface FeedbackLedgerConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackLedgerConsumerPipelineBatchContract (W4-T17 CP2 — Fast Lane GC-021)
 * ----------------------------------------------------------------------------
 * Aggregates multiple FeedbackLedgerConsumerPipelineResult instances.
 *
 * Aggregation:
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 *   totalFeedbackCount = sum(result.feedbackLedger.totalRecords)
 *   feedbackClassCounts = aggregate counts by class
 *
 * Empty batch: dominantTokenBudget = 0, totalFeedbackCount = 0, valid hash
 */
export class FeedbackLedgerConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: FeedbackLedgerConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  execute(
    results: FeedbackLedgerConsumerPipelineResult[],
  ): FeedbackLedgerConsumerPipelineBatchResult {
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

    const totalFeedbackCount = results.reduce(
      (sum, r) => sum + r.feedbackLedger.totalRecords,
      0,
    );

    const feedbackClassCounts = {
      acceptCount: results.reduce((sum, r) => sum + r.feedbackLedger.acceptCount, 0),
      retryCount: results.reduce((sum, r) => sum + r.feedbackLedger.retryCount, 0),
      escalateCount: results.reduce((sum, r) => sum + r.feedbackLedger.escalateCount, 0),
      rejectCount: results.reduce((sum, r) => sum + r.feedbackLedger.rejectCount, 0),
    };

    const batchHash = computeDeterministicHash(
      "w4-t17-cp2-feedback-ledger-consumer-pipeline-batch",
      `total:${totalResults}:dominant:${dominantTokenBudget}`,
      `feedbackCount:${totalFeedbackCount}`,
      `accept:${feedbackClassCounts.acceptCount}:retry:${feedbackClassCounts.retryCount}:escalate:${feedbackClassCounts.escalateCount}:reject:${feedbackClassCounts.rejectCount}`,
      results.map((r) => r.pipelineHash).join(":"),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t17-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      dominantTokenBudget,
      totalFeedbackCount,
      feedbackClassCounts,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackLedgerConsumerPipelineBatchContract(
  dependencies?: FeedbackLedgerConsumerPipelineBatchContractDependencies,
): FeedbackLedgerConsumerPipelineBatchContract {
  return new FeedbackLedgerConsumerPipelineBatchContract(dependencies);
}
