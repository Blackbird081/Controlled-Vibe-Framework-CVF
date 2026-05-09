import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { FeedbackRoutingConsumerPipelineResult } from "./feedback.routing.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackRoutingConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: FeedbackRoutingConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  rejectedResultCount: number;
  escalatedResultCount: number;
  batchHash: string;
}

export interface FeedbackRoutingConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackRoutingConsumerPipelineBatchContract (W2-T24 CP2 — Fast Lane GC-021)
 * ----------------------------------------------------------------------------------
 * Aggregates FeedbackRoutingConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   rejectedResultCount  = count of results where routingDecision.routingAction === "REJECT"
 *   escalatedResultCount = count of results where routingDecision.routingAction === "ESCALATE"
 */
export class FeedbackRoutingConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: FeedbackRoutingConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: FeedbackRoutingConsumerPipelineResult[],
  ): FeedbackRoutingConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const rejectedResultCount = results.filter(
      (r) => r.routingDecision.routingAction === "REJECT",
    ).length;

    const escalatedResultCount = results.filter(
      (r) => r.routingDecision.routingAction === "ESCALATE",
    ).length;

    const batchHash = computeDeterministicHash(
      "w2-t24-cp2-feedback-routing-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t24-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      rejectedResultCount,
      escalatedResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackRoutingConsumerPipelineBatchContract(
  dependencies?: FeedbackRoutingConsumerPipelineBatchContractDependencies,
): FeedbackRoutingConsumerPipelineBatchContract {
  return new FeedbackRoutingConsumerPipelineBatchContract(dependencies);
}
