import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ClarificationRefinementConsumerPipelineResult } from "./clarification.refinement.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClarificationRefinementConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ClarificationRefinementConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  lowConfidenceCount: number;
  batchHash: string;
}

export interface ClarificationRefinementConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ClarificationRefinementConsumerPipelineBatchContract (W1-T21 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates ClarificationRefinementConsumerPipelineResult[] into a governed batch.
 *
 * Fields:
 *   lowConfidenceCount   = results where refinedRequest.confidenceBoost < 0.5
 *   dominantTokenBudget  = Math.max(typedContextPackage.estimatedTokens); 0 for empty
 *   batchHash            = hash of all pipelineHashes + createdAt
 *   batchId              = hash(batchHash) — distinct from batchHash
 */
export class ClarificationRefinementConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ClarificationRefinementConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ClarificationRefinementConsumerPipelineResult[],
  ): ClarificationRefinementConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const lowConfidenceCount = results.filter(
      (r) => r.refinedRequest.confidenceBoost < 0.5,
    ).length;

    const batchHash = computeDeterministicHash(
      "w1-t21-cp2-clarification-refinement-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t21-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      lowConfidenceCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createClarificationRefinementConsumerPipelineBatchContract(
  dependencies?: ClarificationRefinementConsumerPipelineBatchContractDependencies,
): ClarificationRefinementConsumerPipelineBatchContract {
  return new ClarificationRefinementConsumerPipelineBatchContract(dependencies);
}
