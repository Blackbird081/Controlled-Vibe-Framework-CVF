import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogEscalationPipelineConsumerPipelineResult } from "./watchdog.escalation.pipeline.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationPipelineConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: WatchdogEscalationPipelineConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalationActiveResultCount: number;
  batchHash: string;
}

export interface WatchdogEscalationPipelineConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationPipelineConsumerPipelineBatchContract (W3-T12 CP2 — Fast Lane GC-021)
 * -----------------------------------------------------------------------------------------
 * Aggregates WatchdogEscalationPipelineConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalationActiveResultCount = count of results where pipelineResult.escalationActive === true
 */
export class WatchdogEscalationPipelineConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogEscalationPipelineConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WatchdogEscalationPipelineConsumerPipelineResult[],
  ): WatchdogEscalationPipelineConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const escalationActiveResultCount = results.filter(
      (r) => r.pipelineResult.escalationActive,
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t12-cp2-watchdog-escalation-pipeline-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t12-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      escalationActiveResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationPipelineConsumerPipelineBatchContract(
  dependencies?: WatchdogEscalationPipelineConsumerPipelineBatchContractDependencies,
): WatchdogEscalationPipelineConsumerPipelineBatchContract {
  return new WatchdogEscalationPipelineConsumerPipelineBatchContract(dependencies);
}
