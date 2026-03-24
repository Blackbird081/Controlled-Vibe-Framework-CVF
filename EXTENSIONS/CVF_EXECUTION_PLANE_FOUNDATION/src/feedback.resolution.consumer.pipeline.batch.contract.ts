import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { UrgencyLevel } from "./feedback.resolution.contract";
import type { FeedbackResolutionConsumerPipelineResult } from "./feedback.resolution.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackResolutionConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: FeedbackResolutionConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  criticalUrgencyResultCount: number;
  highUrgencyResultCount: number;
  batchHash: string;
}

export interface FeedbackResolutionConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByUrgency(
  results: FeedbackResolutionConsumerPipelineResult[],
  urgency: UrgencyLevel,
): number {
  return results.filter((r) => r.resolutionSummary.urgencyLevel === urgency).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackResolutionConsumerPipelineBatchContract (W2-T16 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------------
 * Aggregates FeedbackResolutionConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   criticalUrgencyResultCount = count of results where urgencyLevel === "CRITICAL"
 *   highUrgencyResultCount     = count of results where urgencyLevel === "HIGH"
 */
export class FeedbackResolutionConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: FeedbackResolutionConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: FeedbackResolutionConsumerPipelineResult[],
  ): FeedbackResolutionConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const criticalUrgencyResultCount = countByUrgency(results, "CRITICAL");
    const highUrgencyResultCount = countByUrgency(results, "HIGH");

    const batchHash = computeDeterministicHash(
      "w2-t16-cp2-feedback-resolution-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t16-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      criticalUrgencyResultCount,
      highUrgencyResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackResolutionConsumerPipelineBatchContract(
  dependencies?: FeedbackResolutionConsumerPipelineBatchContractDependencies,
): FeedbackResolutionConsumerPipelineBatchContract {
  return new FeedbackResolutionConsumerPipelineBatchContract(dependencies);
}
