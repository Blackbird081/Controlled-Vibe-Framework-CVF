import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GovernanceConsensusSummaryConsumerPipelineResult } from "./governance.consensus.summary.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceConsensusSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceConsensusSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalateResultCount: number;
  pauseResultCount: number;
  batchHash: string;
}

export interface GovernanceConsensusSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceConsensusSummaryConsumerPipelineBatchContract (W3-T13 CP2 — Fast Lane GC-021)
 * -----------------------------------------------------------------------------------------
 * Aggregates GovernanceConsensusSummaryConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalateResultCount = count of results where consensusSummary.dominantVerdict === "ESCALATE"
 *   pauseResultCount   = count of results where consensusSummary.dominantVerdict === "PAUSE"
 */
export class GovernanceConsensusSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceConsensusSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceConsensusSummaryConsumerPipelineResult[],
  ): GovernanceConsensusSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const escalateResultCount = results.filter(
      (r) => r.consensusSummary.dominantVerdict === "ESCALATE",
    ).length;

    const pauseResultCount = results.filter(
      (r) => r.consensusSummary.dominantVerdict === "PAUSE",
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t13-cp2-governance-consensus-summary-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t13-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      escalateResultCount,
      pauseResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceConsensusSummaryConsumerPipelineBatchContract(
  dependencies?: GovernanceConsensusSummaryConsumerPipelineBatchContractDependencies,
): GovernanceConsensusSummaryConsumerPipelineBatchContract {
  return new GovernanceConsensusSummaryConsumerPipelineBatchContract(dependencies);
}
