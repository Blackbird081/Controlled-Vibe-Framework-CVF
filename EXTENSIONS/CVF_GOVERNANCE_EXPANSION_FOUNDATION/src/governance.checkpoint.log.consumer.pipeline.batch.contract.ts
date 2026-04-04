import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GovernanceCheckpointLogConsumerPipelineResult } from "./governance.checkpoint.log.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceCheckpointLogConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceCheckpointLogConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalateResultCount: number;
  haltResultCount: number;
  batchHash: string;
}

export interface GovernanceCheckpointLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointLogConsumerPipelineBatchContract (W3-T14 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------------------
 * Aggregates GovernanceCheckpointLogConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalateResultCount = count of results where checkpointLog.dominantCheckpointAction === "ESCALATE"
 *   haltResultCount     = count of results where checkpointLog.dominantCheckpointAction === "HALT"
 */
export class GovernanceCheckpointLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceCheckpointLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceCheckpointLogConsumerPipelineResult[],
  ): GovernanceCheckpointLogConsumerPipelineBatch {
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
      (r) => r.checkpointLog.dominantCheckpointAction === "ESCALATE",
    ).length;

    const haltResultCount = results.filter(
      (r) => r.checkpointLog.dominantCheckpointAction === "HALT",
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t14-cp2-governance-checkpoint-log-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t14-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      escalateResultCount,
      haltResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointLogConsumerPipelineBatchContract(
  dependencies?: GovernanceCheckpointLogConsumerPipelineBatchContractDependencies,
): GovernanceCheckpointLogConsumerPipelineBatchContract {
  return new GovernanceCheckpointLogConsumerPipelineBatchContract(dependencies);
}
