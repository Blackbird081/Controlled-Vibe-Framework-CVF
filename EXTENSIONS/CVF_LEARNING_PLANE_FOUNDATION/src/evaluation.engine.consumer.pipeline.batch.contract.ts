import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { EvaluationEngineConsumerPipelineResult } from "./evaluation.engine.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationEngineConsumerPipelineBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  failCount: number;
  inconclusiveCount: number;
  dominantTokenBudget: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * EvaluationEngineConsumerPipelineBatchContract (W4-T8 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------------
 * Aggregates EvaluationEngineConsumerPipelineResult[] into a governed batch.
 *
 * - failCount       = results where evaluationResult.verdict === "FAIL"
 * - inconclusiveCount = results where evaluationResult.verdict === "INCONCLUSIVE"
 * - dominantTokenBudget = Math.max(estimatedTokens); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class EvaluationEngineConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: { now?: () => string } = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: EvaluationEngineConsumerPipelineResult[],
  ): EvaluationEngineConsumerPipelineBatch {
    const createdAt = this.now();

    const failCount = results.filter(
      (r) => r.evaluationResult.verdict === "FAIL",
    ).length;

    const inconclusiveCount = results.filter(
      (r) => r.evaluationResult.verdict === "INCONCLUSIVE",
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
      "w4-t8-cp2-evaluation-engine-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w4-t8-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      failCount,
      inconclusiveCount,
      dominantTokenBudget,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEvaluationEngineConsumerPipelineBatchContract(
  dependencies?: { now?: () => string },
): EvaluationEngineConsumerPipelineBatchContract {
  return new EvaluationEngineConsumerPipelineBatchContract(dependencies);
}
