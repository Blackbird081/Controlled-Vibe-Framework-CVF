import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogStatus } from "./watchdog.pulse.contract";
import type { WatchdogAlertLogConsumerPipelineResult } from "./watchdog.alert.log.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogAlertLogConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: WatchdogAlertLogConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  criticalAlertResultCount: number;
  warningAlertResultCount: number;
  batchHash: string;
}

export interface WatchdogAlertLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDominantStatus(
  results: WatchdogAlertLogConsumerPipelineResult[],
  status: WatchdogStatus,
): number {
  return results.filter(
    (r) => r.alertLog.dominantStatus === status,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogAlertLogConsumerPipelineBatchContract (W3-T10 CP2 — Fast Lane)
 * ------------------------------------------------------------------------
 * Aggregates WatchdogAlertLogConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   criticalAlertResultCount = results with dominantStatus === "CRITICAL"
 *   warningAlertResultCount  = results with dominantStatus === "WARNING"
 */
export class WatchdogAlertLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogAlertLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WatchdogAlertLogConsumerPipelineResult[],
  ): WatchdogAlertLogConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const criticalAlertResultCount = countDominantStatus(results, "CRITICAL");
    const warningAlertResultCount = countDominantStatus(results, "WARNING");

    const batchHash = computeDeterministicHash(
      "w3-t10-cp2-watchdog-alert-log-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t10-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      criticalAlertResultCount,
      warningAlertResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogAlertLogConsumerPipelineBatchContract(
  dependencies?: WatchdogAlertLogConsumerPipelineBatchContractDependencies,
): WatchdogAlertLogConsumerPipelineBatchContract {
  return new WatchdogAlertLogConsumerPipelineBatchContract(dependencies);
}
