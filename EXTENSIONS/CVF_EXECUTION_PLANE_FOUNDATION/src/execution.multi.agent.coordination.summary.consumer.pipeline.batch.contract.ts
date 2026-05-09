import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CoordinationStatus } from "./execution.multi.agent.coordination.contract";
import type { MultiAgentCoordinationSummaryConsumerPipelineResult } from "./execution.multi.agent.coordination.summary.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiAgentCoordinationSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: MultiAgentCoordinationSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  failedResultCount: number;
  partialResultCount: number;
  batchHash: string;
}

export interface MultiAgentCoordinationSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByStatus(
  results: MultiAgentCoordinationSummaryConsumerPipelineResult[],
  status: CoordinationStatus,
): number {
  return results.filter((r) => r.coordinationSummary.dominantStatus === status).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MultiAgentCoordinationSummaryConsumerPipelineBatchContract (W2-T18 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------------------------
 * Aggregates MultiAgentCoordinationSummaryConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   failedResultCount  = count of results where dominantStatus === "FAILED"
 *   partialResultCount = count of results where dominantStatus === "PARTIAL"
 */
export class MultiAgentCoordinationSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: MultiAgentCoordinationSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: MultiAgentCoordinationSummaryConsumerPipelineResult[],
  ): MultiAgentCoordinationSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const failedResultCount = countByStatus(results, "FAILED");
    const partialResultCount = countByStatus(results, "PARTIAL");

    const batchHash = computeDeterministicHash(
      "w2-t18-cp2-multiagent-coordination-summary-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t18-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      failedResultCount,
      partialResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMultiAgentCoordinationSummaryConsumerPipelineBatchContract(
  dependencies?: MultiAgentCoordinationSummaryConsumerPipelineBatchContractDependencies,
): MultiAgentCoordinationSummaryConsumerPipelineBatchContract {
  return new MultiAgentCoordinationSummaryConsumerPipelineBatchContract(dependencies);
}
