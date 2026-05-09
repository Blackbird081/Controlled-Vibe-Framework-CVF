import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  RouteMatchLogConsumerPipelineResult,
} from "./route.match.log.consumer.pipeline.contract";
import type { GatewayAction } from "./route.match.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteMatchLogConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalLogs: number;
  totalMatches: number;
  overallDominantAction: GatewayAction;
  dominantTokenBudget: number;
  results: RouteMatchLogConsumerPipelineResult[];
  batchHash: string;
}

export interface RouteMatchLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Dominant Action Logic ────────────────────────────────────────────────────

// Frequency-based: most common action wins; ties broken by REJECT > REROUTE > FORWARD > PASSTHROUGH
const ACTION_ORDER: GatewayAction[] = [
  "REJECT",
  "REROUTE",
  "FORWARD",
  "PASSTHROUGH",
];

function computeOverallDominantAction(
  results: RouteMatchLogConsumerPipelineResult[],
): GatewayAction {
  if (results.length === 0) return "REJECT";

  const actionCounts: Record<string, number> = {};

  for (const result of results) {
    const action = result.dominantAction;
    actionCounts[action] = (actionCounts[action] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantAction: GatewayAction = "REJECT";

  for (const action of ACTION_ORDER) {
    const count = actionCounts[action] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantAction = action;
    }
  }

  return dominantAction;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * RouteMatchLogConsumerPipelineBatchContract (W1-T25 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------
 * Aggregates multiple RouteMatchLogConsumerPipelineResult records into a batch.
 *
 * Aggregation:
 *   totalLogs = count of results
 *   totalMatches = sum(result.log.matchedCount)
 *   overallDominantAction = most frequent action across all logs
 *   dominantTokenBudget = max(result.consumerPackage.typedContextPackage.estimatedTokens)
 */
export class RouteMatchLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: RouteMatchLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: RouteMatchLogConsumerPipelineResult[],
  ): RouteMatchLogConsumerPipelineBatchResult {
    const createdAt = this.now();
    const totalLogs = results.length;

    const totalMatches = results.reduce(
      (sum, r) => sum + r.log.matchedCount,
      0,
    );

    const overallDominantAction = computeOverallDominantAction(results);

    const dominantTokenBudget =
      totalLogs === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t25-cp2-route-match-log-consumer-pipeline-batch",
      `totalLogs=${totalLogs}:totalMatches=${totalMatches}`,
      `overallAction=${overallDominantAction}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t25-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalLogs,
      totalMatches,
      overallDominantAction,
      dominantTokenBudget,
      results,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRouteMatchLogConsumerPipelineBatchContract(
  dependencies?: RouteMatchLogConsumerPipelineBatchContractDependencies,
): RouteMatchLogConsumerPipelineBatchContract {
  return new RouteMatchLogConsumerPipelineBatchContract(dependencies);
}
