import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { PatternDriftConsumerPipelineResult } from "./pattern.drift.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDriftConsumerPipelineBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  criticalDriftCount: number;
  driftingCount: number;
  dominantTokenBudget: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDriftConsumerPipelineBatchContract (W4-T12 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------
 * Aggregates PatternDriftConsumerPipelineResult[] into a governed batch.
 *
 * - criticalDriftCount  = results where driftResult.driftClass === "CRITICAL_DRIFT"
 * - driftingCount       = results where driftResult.driftClass === "DRIFTING"
 * - dominantTokenBudget = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class PatternDriftConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: { now?: () => string } = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: PatternDriftConsumerPipelineResult[],
  ): PatternDriftConsumerPipelineBatch {
    const createdAt = this.now();

    const criticalDriftCount = results.filter(
      (r) => r.driftResult.driftClass === "CRITICAL_DRIFT",
    ).length;

    const driftingCount = results.filter(
      (r) => r.driftResult.driftClass === "DRIFTING",
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
      "w4-t12-cp2-pattern-drift-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t12-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      criticalDriftCount,
      driftingCount,
      dominantTokenBudget,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDriftConsumerPipelineBatchContract(
  dependencies?: { now?: () => string },
): PatternDriftConsumerPipelineBatchContract {
  return new PatternDriftConsumerPipelineBatchContract(dependencies);
}
