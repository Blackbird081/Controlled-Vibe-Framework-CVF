import type { GatewayProcessedRequest, GatewaySignalType } from "./ai.gateway.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type GatewayAction = "FORWARD" | "REJECT" | "REROUTE" | "PASSTHROUGH";

export interface RouteDefinition {
  routeId: string;
  pathPattern: string; // "*" = wildcard; prefix match when ends with "*"; exact otherwise
  signalTypes?: GatewaySignalType[];
  gatewayAction: GatewayAction;
  priority: number; // lower number = higher priority
}

export interface RouteMatchResult {
  matchId: string;
  resolvedAt: string;
  sourceGatewayId: string;
  matched: boolean;
  routeId: string | null;
  matchedPattern: string | null;
  gatewayAction: GatewayAction;
  matchHash: string;
}

export interface RouteMatchContractDependencies {
  now?: () => string;
}

// --- Pattern matching ---

function matchesPattern(signal: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) {
    return signal.startsWith(pattern.slice(0, -1));
  }
  if (pattern.startsWith("*")) {
    return signal.endsWith(pattern.slice(1));
  }
  return signal === pattern;
}

function matchesRoute(
  request: GatewayProcessedRequest,
  route: RouteDefinition,
): boolean {
  if (
    route.signalTypes &&
    route.signalTypes.length > 0 &&
    !route.signalTypes.includes(request.signalType)
  ) {
    return false;
  }
  return matchesPattern(request.normalizedSignal, route.pathPattern);
}

// --- Contract ---

export class RouteMatchContract {
  private readonly now: () => string;

  constructor(dependencies: RouteMatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  match(
    request: GatewayProcessedRequest,
    routes: RouteDefinition[],
  ): RouteMatchResult {
    const resolvedAt = this.now();

    const sorted = [...routes].sort((a, b) => a.priority - b.priority);

    let matched = false;
    let routeId: string | null = null;
    let matchedPattern: string | null = null;
    let gatewayAction: GatewayAction = "PASSTHROUGH";

    for (const route of sorted) {
      if (matchesRoute(request, route)) {
        matched = true;
        routeId = route.routeId;
        matchedPattern = route.pathPattern;
        gatewayAction = route.gatewayAction;
        break;
      }
    }

    const matchHash = computeDeterministicHash(
      "w1-t7-cp1-route-match",
      `${resolvedAt}:${request.gatewayId}`,
      `matched:${matched}:action:${gatewayAction}`,
      `route:${routeId ?? "none"}`,
    );

    const matchId = computeDeterministicHash(
      "w1-t7-cp1-match-id",
      matchHash,
      resolvedAt,
    );

    return {
      matchId,
      resolvedAt,
      sourceGatewayId: request.gatewayId,
      matched,
      routeId,
      matchedPattern,
      gatewayAction,
      matchHash,
    };
  }
}

export function createRouteMatchContract(
  dependencies?: RouteMatchContractDependencies,
): RouteMatchContract {
  return new RouteMatchContract(dependencies);
}
