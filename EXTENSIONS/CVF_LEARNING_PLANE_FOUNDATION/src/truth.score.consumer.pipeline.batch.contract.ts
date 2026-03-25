import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { TruthScoreConsumerPipelineResult } from "./truth.score.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthScoreConsumerPipelineBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  insufficientCount: number;
  weakCount: number;
  dominantTokenBudget: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreConsumerPipelineBatchContract (W4-T9 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates TruthScoreConsumerPipelineResult[] into a governed batch.
 *
 * - insufficientCount = results where scoreResult.scoreClass === "INSUFFICIENT"
 * - weakCount         = results where scoreResult.scoreClass === "WEAK"
 * - dominantTokenBudget = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class TruthScoreConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: { now?: () => string } = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: TruthScoreConsumerPipelineResult[],
  ): TruthScoreConsumerPipelineBatch {
    const createdAt = this.now();

    const insufficientCount = results.filter(
      (r) => r.scoreResult.scoreClass === "INSUFFICIENT",
    ).length;

    const weakCount = results.filter(
      (r) => r.scoreResult.scoreClass === "WEAK",
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
      "w4-t9-cp2-truth-score-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t9-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      insufficientCount,
      weakCount,
      dominantTokenBudget,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreConsumerPipelineBatchContract(
  dependencies?: { now?: () => string },
): TruthScoreConsumerPipelineBatchContract {
  return new TruthScoreConsumerPipelineBatchContract(dependencies);
}
