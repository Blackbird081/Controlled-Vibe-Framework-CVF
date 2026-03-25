import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogEscalationConsumerPipelineResult } from "./watchdog.escalation.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: WatchdogEscalationConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalationActiveCount: number;
  batchHash: string;
}

export interface WatchdogEscalationConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationConsumerPipelineBatchContract (W3-T17 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------------
 * Aggregates WatchdogEscalationConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalationActiveCount = count of results where escalationDecision.action === "ESCALATE"
 */
export class WatchdogEscalationConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogEscalationConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WatchdogEscalationConsumerPipelineResult[],
  ): WatchdogEscalationConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const escalationActiveCount = results.filter(
      (r) => r.escalationDecision.action === "ESCALATE",
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t17-cp2-watchdog-escalation-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t17-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      escalationActiveCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationConsumerPipelineBatchContract(
  dependencies?: WatchdogEscalationConsumerPipelineBatchContractDependencies,
): WatchdogEscalationConsumerPipelineBatchContract {
  return new WatchdogEscalationConsumerPipelineBatchContract(dependencies);
}
