import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GovernanceCheckpointReintakeSummaryConsumerPipelineResult } from "./governance.checkpoint.reintake.summary.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceCheckpointReintakeSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceCheckpointReintakeSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  immediateResultCount: number;
  deferredResultCount: number;
  batchHash: string;
}

export interface GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract (W3-T15 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------------------------
 * Aggregates GovernanceCheckpointReintakeSummaryConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   immediateResultCount = count of results where reintakeSummary.dominantScope === "IMMEDIATE"
 *   deferredResultCount  = count of results where reintakeSummary.dominantScope === "DEFERRED"
 */
export class GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceCheckpointReintakeSummaryConsumerPipelineResult[],
  ): GovernanceCheckpointReintakeSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const immediateResultCount = results.filter(
      (r) => r.reintakeSummary.dominantScope === "IMMEDIATE",
    ).length;

    const deferredResultCount = results.filter(
      (r) => r.reintakeSummary.dominantScope === "DEFERRED",
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t15-cp2-governance-checkpoint-reintake-summary-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t15-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      immediateResultCount,
      deferredResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract(
  dependencies?: GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContractDependencies,
): GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract {
  return new GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract(dependencies);
}
