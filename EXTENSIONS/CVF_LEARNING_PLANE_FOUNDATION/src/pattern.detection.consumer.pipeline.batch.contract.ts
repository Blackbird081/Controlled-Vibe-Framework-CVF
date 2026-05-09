import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { PatternDetectionConsumerPipelineResult } from "./pattern.detection.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDetectionConsumerPipelineBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  criticalCount: number;
  degradedCount: number;
  dominantTokenBudget: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDetectionConsumerPipelineBatchContract (W4-T10 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------
 * Aggregates PatternDetectionConsumerPipelineResult[] into a governed batch.
 *
 * - criticalCount        = results where insightResult.healthSignal === "CRITICAL"
 * - degradedCount        = results where insightResult.healthSignal === "DEGRADED"
 * - dominantTokenBudget  = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class PatternDetectionConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: { now?: () => string } = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: PatternDetectionConsumerPipelineResult[],
  ): PatternDetectionConsumerPipelineBatch {
    const createdAt = this.now();

    const criticalCount = results.filter(
      (r) => r.insightResult.healthSignal === "CRITICAL",
    ).length;

    const degradedCount = results.filter(
      (r) => r.insightResult.healthSignal === "DEGRADED",
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
      "w4-t10-cp2-pattern-detection-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t10-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      criticalCount,
      degradedCount,
      dominantTokenBudget,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDetectionConsumerPipelineBatchContract(
  dependencies?: { now?: () => string },
): PatternDetectionConsumerPipelineBatchContract {
  return new PatternDetectionConsumerPipelineBatchContract(dependencies);
}
