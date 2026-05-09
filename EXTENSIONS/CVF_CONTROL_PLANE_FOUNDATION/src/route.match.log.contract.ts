import type { RouteMatchResult, GatewayAction } from "./route.match.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Priority ---

// Dominant: frequency-first; ties broken by REJECT > REROUTE > FORWARD > PASSTHROUGH
const ACTION_PRIORITY: GatewayAction[] = [
  "REJECT",
  "REROUTE",
  "FORWARD",
  "PASSTHROUGH",
];

// --- Types ---

export interface RouteMatchLog {
  logId: string;
  createdAt: string;
  totalRequests: number;
  matchedCount: number;
  unmatchedCount: number;
  forwardCount: number;
  rejectCount: number;
  rerouteCount: number;
  passthroughCount: number;
  dominantAction: GatewayAction;
  logHash: string;
}

export interface RouteMatchLogContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class RouteMatchLogContract {
  private readonly now: () => string;

  constructor(dependencies: RouteMatchLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(results: RouteMatchResult[]): RouteMatchLog {
    const createdAt = this.now();

    const matchedCount = results.filter((r) => r.matched).length;
    const unmatchedCount = results.length - matchedCount;
    const forwardCount = results.filter(
      (r) => r.gatewayAction === "FORWARD",
    ).length;
    const rejectCount = results.filter(
      (r) => r.gatewayAction === "REJECT",
    ).length;
    const rerouteCount = results.filter(
      (r) => r.gatewayAction === "REROUTE",
    ).length;
    const passthroughCount = results.filter(
      (r) => r.gatewayAction === "PASSTHROUGH",
    ).length;

    const counts: Record<GatewayAction, number> = {
      FORWARD: forwardCount,
      REJECT: rejectCount,
      REROUTE: rerouteCount,
      PASSTHROUGH: passthroughCount,
    };

    let dominantAction: GatewayAction = "REJECT";
    let maxCount = -1;
    for (const a of ACTION_PRIORITY) {
      if (counts[a] > maxCount) {
        maxCount = counts[a];
        dominantAction = a;
      }
    }

    const logHash = computeDeterministicHash(
      "w1-t7-cp2-route-log",
      `${createdAt}:total:${results.length}`,
      `matched:${matchedCount}:unmatched:${unmatchedCount}`,
      `forward:${forwardCount}:reject:${rejectCount}:reroute:${rerouteCount}:passthrough:${passthroughCount}`,
      `dominant:${dominantAction}`,
    );

    const logId = computeDeterministicHash(
      "w1-t7-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalRequests: results.length,
      matchedCount,
      unmatchedCount,
      forwardCount,
      rejectCount,
      rerouteCount,
      passthroughCount,
      dominantAction,
      logHash,
    };
  }
}

export function createRouteMatchLogContract(
  dependencies?: RouteMatchLogContractDependencies,
): RouteMatchLogContract {
  return new RouteMatchLogContract(dependencies);
}
