import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CoordinationStatus } from "./execution.multi.agent.coordination.contract";
import type { MultiAgentCoordinationConsumerPipelineResult } from "./execution.multi.agent.coordination.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiAgentCoordinationConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: MultiAgentCoordinationConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  coordinatedCount: number;
  failedCount: number;
  partialCount: number;
  batchHash: string;
}

export interface MultiAgentCoordinationConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByCoordinationStatus(
  results: MultiAgentCoordinationConsumerPipelineResult[],
  status: CoordinationStatus,
): number {
  return results.filter(
    (r) => r.coordinationResult.coordinationStatus === status,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MultiAgentCoordinationConsumerPipelineBatchContract (W2-T14 CP2 — Fast Lane)
 * -----------------------------------------------------------------------------
 * Aggregates MultiAgentCoordinationConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   coordinatedCount = count of COORDINATED results
 *   failedCount      = count of FAILED results
 *   partialCount     = count of PARTIAL results
 */
export class MultiAgentCoordinationConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: MultiAgentCoordinationConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: MultiAgentCoordinationConsumerPipelineResult[],
  ): MultiAgentCoordinationConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const coordinatedCount = countByCoordinationStatus(results, "COORDINATED");
    const failedCount = countByCoordinationStatus(results, "FAILED");
    const partialCount = countByCoordinationStatus(results, "PARTIAL");

    const batchHash = computeDeterministicHash(
      "w2-t14-cp2-multi-agent-coordination-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t14-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      coordinatedCount,
      failedCount,
      partialCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMultiAgentCoordinationConsumerPipelineBatchContract(
  dependencies?: MultiAgentCoordinationConsumerPipelineBatchContractDependencies,
): MultiAgentCoordinationConsumerPipelineBatchContract {
  return new MultiAgentCoordinationConsumerPipelineBatchContract(dependencies);
}
