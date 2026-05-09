import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogEscalationPipelineResult } from "./watchdog.escalation.pipeline.contract";
import type { WatchdogEscalationAction } from "./watchdog.escalation.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchdogEscalationPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: WatchdogEscalationPipelineResult[];
  dominantAction: WatchdogEscalationAction;
  escalationActiveCount: number;
  batchHash: string;
}

export interface WatchdogEscalationPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant action logic ─────────────────────────────────────────────────────
// Severity-first: ESCALATE > MONITOR > CLEAR.
// If any result has ESCALATE, dominant is ESCALATE.

const ACTION_PRIORITY: WatchdogEscalationAction[] = ["ESCALATE", "MONITOR", "CLEAR"];

function computeDominantAction(
  results: WatchdogEscalationPipelineResult[],
): WatchdogEscalationAction {
  if (results.length === 0) return "CLEAR";
  const actionSet = new Set(results.map((r) => r.dominantAction));
  for (const action of ACTION_PRIORITY) {
    if (actionSet.has(action)) return action;
  }
  return "CLEAR";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationPipelineBatchContract (W3-T5 / CP2)
 * -------------------------------------------------------
 * Aggregates a batch of WatchdogEscalationPipelineResult records into a single
 * governed batch summary.
 *
 * dominantAction = severity-first across all results (ESCALATE > MONITOR > CLEAR)
 * escalationActiveCount = count of results where escalationActive is true
 */
export class WatchdogEscalationPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WatchdogEscalationPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  aggregate(
    results: WatchdogEscalationPipelineResult[],
  ): WatchdogEscalationPipelineBatch {
    const createdAt = this.now();
    const totalResults = results.length;
    const dominantAction = computeDominantAction(results);
    const escalationActiveCount = results.filter((r) => r.escalationActive).length;

    const batchHash = computeDeterministicHash(
      "w3-t5-cp2-escalation-pipeline-batch",
      `${createdAt}:total=${totalResults}`,
      `dominant=${dominantAction}:escalationActive=${escalationActiveCount}`,
    );

    const batchId = computeDeterministicHash(
      "w3-t5-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults,
      results,
      dominantAction,
      escalationActiveCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationPipelineBatchContract(
  dependencies?: WatchdogEscalationPipelineBatchContractDependencies,
): WatchdogEscalationPipelineBatchContract {
  return new WatchdogEscalationPipelineBatchContract(dependencies);
}
