/**
 * CPF Route Match & Route Match Log — Dedicated Tests (W6-T31)
 * =============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   RouteMatchContract.match:
 *     - wildcard "*" matches any normalizedSignal
 *     - prefix "prefix*" matches signals starting with prefix
 *     - suffix "*suffix" matches signals ending with suffix
 *     - exact pattern matches only exact signal
 *     - no matching route → matched=false, PASSTHROUGH, routeId=null, matchedPattern=null
 *     - no routes at all → matched=false, PASSTHROUGH
 *     - priority ordering: lower priority number wins (higher priority)
 *     - signalTypes filter: route excluded when request signalType not in list
 *     - signalTypes filter: route included when request signalType in list
 *     - signalTypes absent → no filtering (matches any signalType)
 *     - matchHash deterministic for same request+routes+timestamp
 *     - matchId truthy
 *     - resolvedAt = injected now()
 *     - sourceGatewayId = request.gatewayId
 *     - factory createRouteMatchContract returns working instance
 *   RouteMatchLogContract.log:
 *     - empty results → dominantAction = REJECT (all counts 0, REJECT wins by -1 threshold)
 *     - single FORWARD result → dominantAction = FORWARD
 *     - single REROUTE result → dominantAction = REROUTE
 *     - frequency-first: FORWARD×2 > REJECT×1 → FORWARD wins
 *     - tiebreak: REJECT=1 REROUTE=1 → REJECT wins (higher priority)
 *     - tiebreak: REROUTE=1 FORWARD=1 → REROUTE wins
 *     - matchedCount = count of matched=true results
 *     - unmatchedCount = totalRequests - matchedCount
 *     - all action counts (forward/reject/reroute/passthrough) accurate
 *     - totalRequests = results.length
 *     - logHash deterministic for same inputs and timestamp
 *     - logId truthy
 *     - createdAt = injected now()
 *     - factory createRouteMatchLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  RouteMatchContract,
  createRouteMatchContract,
} from "../src/route.match.contract";
import type {
  RouteDefinition,
  RouteMatchResult,
} from "../src/route.match.contract";
import type { GatewayProcessedRequest } from "../src/ai.gateway.contract";

import {
  RouteMatchLogContract,
  createRouteMatchLogContract,
} from "../src/route.match.log.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T09:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeProcessedRequest(
  overrides: Partial<GatewayProcessedRequest> = {},
): GatewayProcessedRequest {
  return {
    gatewayId: "gw-test-001",
    processedAt: FIXED_NOW,
    rawSignal: "build a feature for the platform",
    normalizedSignal: "build a feature for the platform",
    signalType: "vibe",
    envMetadata: {
      platform: "cvf",
      phase: "INTAKE",
      riskLevel: "R1",
      locale: "en",
      tags: [],
    },
    privacyReport: { filtered: false, maskedTokenCount: 0, appliedPatterns: [] },
    gatewayHash: "fakehash0001",
    warnings: [],
    ...overrides,
  };
}

function makeRoute(overrides: Partial<RouteDefinition> = {}): RouteDefinition {
  return {
    routeId: "route-1",
    pathPattern: "*",
    gatewayAction: "FORWARD",
    priority: 10,
    ...overrides,
  };
}

function makeMatchResult(overrides: Partial<RouteMatchResult> = {}): RouteMatchResult {
  return {
    matchId: "mid-1",
    resolvedAt: FIXED_NOW,
    sourceGatewayId: "gw-1",
    matched: true,
    routeId: "route-1",
    matchedPattern: "*",
    gatewayAction: "FORWARD",
    matchHash: "hash-1",
    ...overrides,
  };
}

// ─── RouteMatchContract.match ─────────────────────────────────────────────────

describe("RouteMatchContract.match", () => {
  const contract = new RouteMatchContract({ now: fixedNow });

  describe("pattern matching — wildcard", () => {
    it("'*' matches any normalizedSignal", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "anything at all" }),
        [makeRoute({ pathPattern: "*", gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
      expect(result.gatewayAction).toBe("FORWARD");
    });

    it("'*' matches empty normalizedSignal", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "" }),
        [makeRoute({ pathPattern: "*", gatewayAction: "REROUTE" })],
      );
      expect(result.matched).toBe(true);
    });
  });

  describe("pattern matching — prefix", () => {
    it("'build*' matches signal starting with 'build'", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build a feature" }),
        [makeRoute({ pathPattern: "build*", gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
      expect(result.matchedPattern).toBe("build*");
    });

    it("'deploy*' does NOT match signal starting with 'build'", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build a feature" }),
        [makeRoute({ pathPattern: "deploy*", gatewayAction: "REJECT" })],
      );
      expect(result.matched).toBe(false);
    });
  });

  describe("pattern matching — suffix", () => {
    it("'*platform' matches signal ending with 'platform'", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build for the platform" }),
        [makeRoute({ pathPattern: "*platform", gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
      expect(result.matchedPattern).toBe("*platform");
    });

    it("'*governance' does NOT match signal ending with 'platform'", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build for the platform" }),
        [makeRoute({ pathPattern: "*governance", gatewayAction: "REJECT" })],
      );
      expect(result.matched).toBe(false);
    });
  });

  describe("pattern matching — exact", () => {
    it("exact pattern matches only exact signal", () => {
      const signal = "build a feature";
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: signal }),
        [makeRoute({ pathPattern: signal, gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
      expect(result.matchedPattern).toBe(signal);
    });

    it("exact pattern does NOT match partial signal", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build a feature for the platform" }),
        [makeRoute({ pathPattern: "build a feature", gatewayAction: "REJECT" })],
      );
      expect(result.matched).toBe(false);
    });
  });

  describe("no match / no routes", () => {
    it("no routes → matched=false, PASSTHROUGH", () => {
      const result = contract.match(makeProcessedRequest(), []);
      expect(result.matched).toBe(false);
      expect(result.gatewayAction).toBe("PASSTHROUGH");
    });

    it("no routes → routeId=null, matchedPattern=null", () => {
      const result = contract.match(makeProcessedRequest(), []);
      expect(result.routeId).toBeNull();
      expect(result.matchedPattern).toBeNull();
    });

    it("no matching route → matched=false, PASSTHROUGH", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build a feature" }),
        [makeRoute({ pathPattern: "deploy*", gatewayAction: "REJECT" })],
      );
      expect(result.matched).toBe(false);
      expect(result.gatewayAction).toBe("PASSTHROUGH");
    });
  });

  describe("priority ordering", () => {
    it("lower priority number wins (priority 1 beats priority 5)", () => {
      const result = contract.match(
        makeProcessedRequest({ normalizedSignal: "build a feature" }),
        [
          makeRoute({ routeId: "low-prio", pathPattern: "*", gatewayAction: "REROUTE", priority: 5 }),
          makeRoute({ routeId: "high-prio", pathPattern: "*", gatewayAction: "FORWARD", priority: 1 }),
        ],
      );
      expect(result.routeId).toBe("high-prio");
      expect(result.gatewayAction).toBe("FORWARD");
    });
  });

  describe("signalTypes filter", () => {
    it("route with signalTypes=['command'] excluded for signalType='vibe'", () => {
      const result = contract.match(
        makeProcessedRequest({ signalType: "vibe" }),
        [makeRoute({ pathPattern: "*", signalTypes: ["command"], gatewayAction: "REJECT" })],
      );
      expect(result.matched).toBe(false);
    });

    it("route with signalTypes=['vibe','command'] matches signalType='vibe'", () => {
      const result = contract.match(
        makeProcessedRequest({ signalType: "vibe" }),
        [makeRoute({ pathPattern: "*", signalTypes: ["vibe", "command"], gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
    });

    it("route with no signalTypes matches any signalType", () => {
      const result = contract.match(
        makeProcessedRequest({ signalType: "event" }),
        [makeRoute({ pathPattern: "*", signalTypes: undefined, gatewayAction: "FORWARD" })],
      );
      expect(result.matched).toBe(true);
    });
  });

  describe("output fields", () => {
    it("resolvedAt = injected now()", () => {
      expect(contract.match(makeProcessedRequest(), []).resolvedAt).toBe(FIXED_NOW);
    });

    it("sourceGatewayId = request.gatewayId", () => {
      const result = contract.match(
        makeProcessedRequest({ gatewayId: "gw-xyz" }),
        [],
      );
      expect(result.sourceGatewayId).toBe("gw-xyz");
    });

    it("matchHash deterministic for same inputs and timestamp", () => {
      const req = makeProcessedRequest({ gatewayId: "gw-det" });
      const routes = [makeRoute({ pathPattern: "*", gatewayAction: "FORWARD" })];
      const r1 = contract.match(req, routes);
      const r2 = contract.match(req, routes);
      expect(r1.matchHash).toBe(r2.matchHash);
    });

    it("matchId is truthy", () => {
      expect(contract.match(makeProcessedRequest(), []).matchId.length).toBeGreaterThan(0);
    });
  });

  it("factory createRouteMatchContract returns working instance", () => {
    const c = createRouteMatchContract({ now: fixedNow });
    const result = c.match(makeProcessedRequest(), [makeRoute({ pathPattern: "*" })]);
    expect(result.matched).toBe(true);
    expect(result.resolvedAt).toBe(FIXED_NOW);
  });
});

// ─── RouteMatchLogContract.log ────────────────────────────────────────────────

describe("RouteMatchLogContract.log", () => {
  const contract = new RouteMatchLogContract({ now: fixedNow });

  describe("empty results", () => {
    it("empty → dominantAction = REJECT (all 0, REJECT threshold is -1)", () => {
      expect(contract.log([]).dominantAction).toBe("REJECT");
    });

    it("empty → totalRequests = 0", () => {
      expect(contract.log([]).totalRequests).toBe(0);
    });

    it("empty → matchedCount = 0, unmatchedCount = 0", () => {
      const log = contract.log([]);
      expect(log.matchedCount).toBe(0);
      expect(log.unmatchedCount).toBe(0);
    });

    it("empty → all action counts = 0", () => {
      const log = contract.log([]);
      expect(log.forwardCount).toBe(0);
      expect(log.rejectCount).toBe(0);
      expect(log.rerouteCount).toBe(0);
      expect(log.passthroughCount).toBe(0);
    });
  });

  describe("dominantAction — frequency-first", () => {
    it("single FORWARD result → dominantAction = FORWARD", () => {
      const log = contract.log([makeMatchResult({ gatewayAction: "FORWARD" })]);
      expect(log.dominantAction).toBe("FORWARD");
    });

    it("single REROUTE result → dominantAction = REROUTE", () => {
      const log = contract.log([makeMatchResult({ gatewayAction: "REROUTE" })]);
      expect(log.dominantAction).toBe("REROUTE");
    });

    it("FORWARD×2 > REJECT×1 → FORWARD wins", () => {
      const results = [
        makeMatchResult({ gatewayAction: "FORWARD" }),
        makeMatchResult({ gatewayAction: "FORWARD" }),
        makeMatchResult({ gatewayAction: "REJECT" }),
      ];
      expect(contract.log(results).dominantAction).toBe("FORWARD");
    });

    it("REJECT=1 REROUTE=1 tie → REJECT wins (higher priority)", () => {
      const results = [
        makeMatchResult({ gatewayAction: "REJECT" }),
        makeMatchResult({ gatewayAction: "REROUTE" }),
      ];
      expect(contract.log(results).dominantAction).toBe("REJECT");
    });

    it("REROUTE=1 FORWARD=1 tie → REROUTE wins (higher priority)", () => {
      const results = [
        makeMatchResult({ gatewayAction: "REROUTE" }),
        makeMatchResult({ gatewayAction: "FORWARD" }),
      ];
      expect(contract.log(results).dominantAction).toBe("REROUTE");
    });
  });

  describe("counts", () => {
    it("matchedCount and unmatchedCount accurate", () => {
      const results = [
        makeMatchResult({ matched: true }),
        makeMatchResult({ matched: true }),
        makeMatchResult({ matched: false, gatewayAction: "PASSTHROUGH" }),
      ];
      const log = contract.log(results);
      expect(log.matchedCount).toBe(2);
      expect(log.unmatchedCount).toBe(1);
    });

    it("all action counts accurate", () => {
      const results = [
        makeMatchResult({ gatewayAction: "FORWARD" }),
        makeMatchResult({ gatewayAction: "REJECT" }),
        makeMatchResult({ gatewayAction: "REJECT" }),
        makeMatchResult({ gatewayAction: "REROUTE" }),
        makeMatchResult({ gatewayAction: "PASSTHROUGH", matched: false }),
      ];
      const log = contract.log(results);
      expect(log.forwardCount).toBe(1);
      expect(log.rejectCount).toBe(2);
      expect(log.rerouteCount).toBe(1);
      expect(log.passthroughCount).toBe(1);
      expect(log.totalRequests).toBe(5);
    });
  });

  describe("output fields", () => {
    it("createdAt = injected now()", () => {
      expect(contract.log([]).createdAt).toBe(FIXED_NOW);
    });

    it("logHash deterministic for same inputs and timestamp", () => {
      const results = [makeMatchResult({ gatewayAction: "FORWARD" })];
      const l1 = contract.log(results);
      const l2 = contract.log(results);
      expect(l1.logHash).toBe(l2.logHash);
    });

    it("logId is truthy", () => {
      expect(contract.log([]).logId.length).toBeGreaterThan(0);
    });
  });

  it("factory createRouteMatchLogContract returns working instance", () => {
    const c = createRouteMatchLogContract({ now: fixedNow });
    const log = c.log([makeMatchResult({ gatewayAction: "REROUTE" })]);
    expect(log.dominantAction).toBe("REROUTE");
    expect(log.createdAt).toBe(FIXED_NOW);
  });
});
