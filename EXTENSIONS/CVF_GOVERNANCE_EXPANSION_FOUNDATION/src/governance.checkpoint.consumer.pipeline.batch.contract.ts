import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CheckpointAction } from "./governance.checkpoint.contract";
import type { GovernanceCheckpointConsumerPipelineResult } from "./governance.checkpoint.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceCheckpointConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceCheckpointConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  haltCount: number;
  escalateCount: number;
  batchHash: string;
}

export interface GovernanceCheckpointConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countAction(
  results: GovernanceCheckpointConsumerPipelineResult[],
  action: CheckpointAction,
): number {
  return results.filter(
    (r) => r.checkpointDecision.checkpointAction === action,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointConsumerPipelineBatchContract (W3-T7 CP2 — Fast Lane)
 * --------------------------------------------------------------------------
 * Aggregates GovernanceCheckpointConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   haltCount = count of HALT actions
 *   escalateCount = count of ESCALATE actions
 */
export class GovernanceCheckpointConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceCheckpointConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceCheckpointConsumerPipelineResult[],
  ): GovernanceCheckpointConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const haltCount = countAction(results, "HALT");
    const escalateCount = countAction(results, "ESCALATE");

    const batchHash = computeDeterministicHash(
      "w3-t7-cp2-checkpoint-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t7-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      haltCount,
      escalateCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointConsumerPipelineBatchContract(
  dependencies?: GovernanceCheckpointConsumerPipelineBatchContractDependencies,
): GovernanceCheckpointConsumerPipelineBatchContract {
  return new GovernanceCheckpointConsumerPipelineBatchContract(dependencies);
}
