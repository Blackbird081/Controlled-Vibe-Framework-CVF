import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReintakeTrigger } from "./governance.checkpoint.reintake.contract";
import type { GovernanceCheckpointReintakeConsumerPipelineResult } from "./governance.checkpoint.reintake.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceCheckpointReintakeConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceCheckpointReintakeConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  immediateCount: number;
  deferredCount: number;
  noReintakeCount: number;
  batchHash: string;
}

export interface GovernanceCheckpointReintakeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countTrigger(
  results: GovernanceCheckpointReintakeConsumerPipelineResult[],
  trigger: ReintakeTrigger,
): number {
  return results.filter(
    (r) => r.reintakeRequest.reintakeTrigger === trigger,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointReintakeConsumerPipelineBatchContract (W3-T8 CP2 — Fast Lane)
 * ----------------------------------------------------------------------------------
 * Aggregates GovernanceCheckpointReintakeConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   immediateCount = ESCALATION_REQUIRED triggers
 *   deferredCount  = HALT_REVIEW_PENDING triggers
 *   noReintakeCount = NO_REINTAKE triggers
 */
export class GovernanceCheckpointReintakeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceCheckpointReintakeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceCheckpointReintakeConsumerPipelineResult[],
  ): GovernanceCheckpointReintakeConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const immediateCount = countTrigger(results, "ESCALATION_REQUIRED");
    const deferredCount = countTrigger(results, "HALT_REVIEW_PENDING");
    const noReintakeCount = countTrigger(results, "NO_REINTAKE");

    const batchHash = computeDeterministicHash(
      "w3-t8-cp2-reintake-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t8-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      immediateCount,
      deferredCount,
      noReintakeCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointReintakeConsumerPipelineBatchContract(
  dependencies?: GovernanceCheckpointReintakeConsumerPipelineBatchContractDependencies,
): GovernanceCheckpointReintakeConsumerPipelineBatchContract {
  return new GovernanceCheckpointReintakeConsumerPipelineBatchContract(dependencies);
}
