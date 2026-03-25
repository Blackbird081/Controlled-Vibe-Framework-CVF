import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogPulseConsumerPipelineResult } from "./watchdog.pulse.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogPulseConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: WatchdogPulseConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  criticalPulseCount: number;
  batchHash: string;
}

export interface WatchdogPulseConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogPulseConsumerPipelineBatchContract (W3-T18 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------
 * Aggregates WatchdogPulseConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   criticalPulseCount = count of results where pulse.watchdogStatus === "CRITICAL"
 */
export class WatchdogPulseConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogPulseConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WatchdogPulseConsumerPipelineResult[],
  ): WatchdogPulseConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const criticalPulseCount = results.filter(
      (r) => r.pulse.watchdogStatus === "CRITICAL",
    ).length;

    const batchHash = computeDeterministicHash(
      "w3-t18-cp2-watchdog-pulse-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t18-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      criticalPulseCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogPulseConsumerPipelineBatchContract(
  dependencies?: WatchdogPulseConsumerPipelineBatchContractDependencies,
): WatchdogPulseConsumerPipelineBatchContract {
  return new WatchdogPulseConsumerPipelineBatchContract(dependencies);
}
