import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  GatewayAction,
  RouteDefinition,
  RouteMatchResult,
} from "./route.match.contract";
import { RouteMatchContract } from "./route.match.contract";
import type { GatewayProcessedRequest } from "./ai.gateway.contract";

// --- Types ---

export type DominantGatewayAction = GatewayAction | "NONE";

export interface RouteMatchBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  matchedCount: number;
  unmatchedCount: number;
  forwardCount: number;
  rejectCount: number;
  rerouteCount: number;
  passthroughCount: number;
  dominantGatewayAction: DominantGatewayAction;
  results: RouteMatchResult[];
}

export interface RouteMatchBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Gateway Action Resolution ---

/*
 * Resolves the dominant GatewayAction by highest result count.
 * Tie-breaking precedence: REJECT > REROUTE > FORWARD > PASSTHROUGH
 * Returns "NONE" when batch is empty (no requests).
 *
 * Precedence reflects operational risk weight:
 *   REJECT      — highest security governance weight
 *   REROUTE     — active redirection; higher weight than passive forward
 *   FORWARD     — standard routing action
 *   PASSTHROUGH — default/neutral; lowest governance weight
 */
function resolveDominantGatewayAction(
  forwardCount: number,
  rejectCount: number,
  rerouteCount: number,
  passthroughCount: number,
): DominantGatewayAction {
  const total = forwardCount + rejectCount + rerouteCount + passthroughCount;
  if (total === 0) return "NONE";

  const maxCount = Math.max(forwardCount, rejectCount, rerouteCount, passthroughCount);

  // Tie-breaking: REJECT > REROUTE > FORWARD > PASSTHROUGH
  if (rejectCount === maxCount) return "REJECT";
  if (rerouteCount === maxCount) return "REROUTE";
  if (forwardCount === maxCount) return "FORWARD";
  return "PASSTHROUGH";
}

// --- Contract ---

export class RouteMatchBatchContract {
  private readonly now: () => string;

  constructor(dependencies: RouteMatchBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: GatewayProcessedRequest[],
    routes: RouteDefinition[],
    contract: RouteMatchContract,
  ): RouteMatchBatch {
    const createdAt = this.now();
    const results: RouteMatchResult[] = [];

    for (const request of requests) {
      results.push(contract.match(request, routes));
    }

    const matchedCount = results.filter((r) => r.matched).length;
    const unmatchedCount = results.filter((r) => !r.matched).length;
    const forwardCount = results.filter((r) => r.gatewayAction === "FORWARD").length;
    const rejectCount = results.filter((r) => r.gatewayAction === "REJECT").length;
    const rerouteCount = results.filter((r) => r.gatewayAction === "REROUTE").length;
    const passthroughCount = results.filter((r) => r.gatewayAction === "PASSTHROUGH").length;

    const dominantGatewayAction = resolveDominantGatewayAction(
      forwardCount,
      rejectCount,
      rerouteCount,
      passthroughCount,
    );

    const batchHash = computeDeterministicHash(
      "w25-t1-cp1-route-match-batch",
      ...results.map((r) => r.matchHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w25-t1-cp1-route-match-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: results.length,
      matchedCount,
      unmatchedCount,
      forwardCount,
      rejectCount,
      rerouteCount,
      passthroughCount,
      dominantGatewayAction,
      results,
    };
  }
}

export function createRouteMatchBatchContract(
  dependencies?: RouteMatchBatchContractDependencies,
): RouteMatchBatchContract {
  return new RouteMatchBatchContract(dependencies);
}
