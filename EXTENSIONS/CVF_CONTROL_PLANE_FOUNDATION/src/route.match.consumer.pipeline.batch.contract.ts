import type { RouteMatchConsumerPipelineResult } from "./route.match.consumer.pipeline.contract";
import type { GatewayAction } from "./route.match.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface RouteMatchConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalMatches: number;
  overallDominantAction: GatewayAction;
  totalSuccessfulMatches: number;
  dominantTokenBudget: number;
  results: RouteMatchConsumerPipelineResult[];
}

export interface RouteMatchConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Action Logic ---

// Frequency-based: most common action wins; ties broken by FORWARD > REROUTE > PASSTHROUGH > REJECT
const ACTION_ORDER: GatewayAction[] = ["FORWARD", "REROUTE", "PASSTHROUGH", "REJECT"];

function computeDominantAction(results: RouteMatchConsumerPipelineResult[]): GatewayAction {
  if (results.length === 0) return "PASSTHROUGH";

  const actionCounts: Record<string, number> = {};

  for (const result of results) {
    const action = result.routeMatchResult.gatewayAction;
    actionCounts[action] = (actionCounts[action] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantAction: GatewayAction = "PASSTHROUGH";

  for (const action of ACTION_ORDER) {
    const count = actionCounts[action] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominantAction = action;
    }
  }

  return dominantAction;
}

// --- Contract ---

export class RouteMatchConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: RouteMatchConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: RouteMatchConsumerPipelineResult[],
  ): RouteMatchConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalMatches = results.length;
    const overallDominantAction = computeDominantAction(results);
    const totalSuccessfulMatches = results.filter(
      (r) => r.routeMatchResult.matched,
    ).length;

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t30-cp2-route-match-consumer-batch",
      `totalMatches=${totalMatches}`,
      `dominantAction=${overallDominantAction}`,
      `successfulMatches=${totalSuccessfulMatches}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t30-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalMatches,
      overallDominantAction,
      totalSuccessfulMatches,
      dominantTokenBudget,
      results,
    };
  }
}

export function createRouteMatchConsumerPipelineBatchContract(
  dependencies?: RouteMatchConsumerPipelineBatchContractDependencies,
): RouteMatchConsumerPipelineBatchContract {
  return new RouteMatchConsumerPipelineBatchContract(dependencies);
}
