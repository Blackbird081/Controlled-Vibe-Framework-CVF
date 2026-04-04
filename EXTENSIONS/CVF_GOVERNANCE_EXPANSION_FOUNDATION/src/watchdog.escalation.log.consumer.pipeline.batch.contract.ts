import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogEscalationLogConsumerPipelineResult } from "./watchdog.escalation.log.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationLogConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: WatchdogEscalationLogConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalationActiveResultCount: number;
  batchHash: string;
}

export interface WatchdogEscalationLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationLogConsumerPipelineBatchContract (W3-T11 CP2 — Fast Lane GC-021)
 * --------------------------------------------------------------------------------------
 * Aggregates WatchdogEscalationLogConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalationActiveResultCount = count of results where escalationLog.escalationActive === true
 */
export class WatchdogEscalationLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogEscalationLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WatchdogEscalationLogConsumerPipelineResult[],
  ): WatchdogEscalationLogConsumerPipelineBatch {
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
      (r) => r.escalationLog.escalationActive,
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t11-cp2-watchdog-escalation-log-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t11-cp2-batch-id",
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

export function createWatchdogEscalationLogConsumerPipelineBatchContract(
  dependencies?: WatchdogEscalationLogConsumerPipelineBatchContractDependencies,
): WatchdogEscalationLogConsumerPipelineBatchContract {
  return new WatchdogEscalationLogConsumerPipelineBatchContract(dependencies);
}
