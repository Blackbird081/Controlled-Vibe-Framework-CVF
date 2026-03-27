import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningObservabilityConsumerPipelineResult } from "./learning.observability.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningObservabilityConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  resultCount: number;
  criticalCount: number;
  degradedCount: number;
  dominantTokenBudget: number;
  batchHash: string;
}

export interface LearningObservabilityConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningObservabilityConsumerPipelineBatchContract (W4-T13 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates multiple LearningObservabilityConsumerPipelineResult entries
 * into a governed batch summary.
 *
 * Batch fields:
 *   criticalCount       — results where reportResult.observabilityHealth === "CRITICAL"
 *   degradedCount       — results where reportResult.observabilityHealth === "DEGRADED"
 *   dominantTokenBudget — Math.max(estimatedTokens) across batch; 0 for empty
 *
 * Seeds:
 *   batchHash: w4-t13-cp2-learning-observability-consumer-pipeline-batch
 *   batchId:   w4-t13-cp2-batch-id
 */
export class LearningObservabilityConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: LearningObservabilityConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: LearningObservabilityConsumerPipelineResult[],
  ): LearningObservabilityConsumerPipelineBatch {
    const createdAt = this.now();
    const resultCount = results.length;

    let criticalCount = 0;
    let degradedCount = 0;
    const tokenBudgets: number[] = [];

    for (const result of results) {
      if (result.reportResult.observabilityHealth === "CRITICAL") {
        criticalCount++;
      }
      if (result.reportResult.observabilityHealth === "DEGRADED") {
        degradedCount++;
      }
      const estimatedTokens =
        result.consumerPackage.rankedKnowledgeResult?.estimatedTokens ?? 0;
      tokenBudgets.push(estimatedTokens);
    }

    const dominantTokenBudget =
      tokenBudgets.length > 0 ? Math.max(...tokenBudgets) : 0;

    const batchHash = computeDeterministicHash(
      "w4-t13-cp2-learning-observability-consumer-pipeline-batch",
      `${createdAt}:count=${resultCount}`,
      `critical=${criticalCount}:degraded=${degradedCount}`,
      ...results.map((r) => r.pipelineHash),
    );

    const batchId = computeDeterministicHash(
      "w4-t13-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      resultCount,
      criticalCount,
      degradedCount,
      dominantTokenBudget,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningObservabilityConsumerPipelineBatchContract(
  dependencies?: LearningObservabilityConsumerPipelineBatchContractDependencies,
): LearningObservabilityConsumerPipelineBatchContract {
  return new LearningObservabilityConsumerPipelineBatchContract(dependencies);
}
