import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GovernanceSignalConsumerPipelineResult } from "./governance.signal.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceSignalConsumerPipelineBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  escalateCount: number;
  reviewCount: number;
  dominantTokenBudget: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceSignalConsumerPipelineBatchContract (W4-T11 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------
 * Aggregates GovernanceSignalConsumerPipelineResult[] into a governed batch.
 *
 * - escalateCount        = results where signalResult.signalType === "ESCALATE"
 * - reviewCount          = results where signalResult.signalType === "TRIGGER_REVIEW"
 * - dominantTokenBudget  = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class GovernanceSignalConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: { now?: () => string } = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceSignalConsumerPipelineResult[],
  ): GovernanceSignalConsumerPipelineBatch {
    const createdAt = this.now();

    const escalateCount = results.filter(
      (r) => r.signalResult.signalType === "ESCALATE",
    ).length;

    const reviewCount = results.filter(
      (r) => r.signalResult.signalType === "TRIGGER_REVIEW",
    ).length;

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w4-t11-cp2-governance-signal-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t11-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      escalateCount,
      reviewCount,
      dominantTokenBudget,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceSignalConsumerPipelineBatchContract(
  dependencies?: { now?: () => string },
): GovernanceSignalConsumerPipelineBatchContract {
  return new GovernanceSignalConsumerPipelineBatchContract(dependencies);
}
