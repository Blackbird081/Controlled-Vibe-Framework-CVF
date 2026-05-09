import { describe, it, expect } from "vitest";
import {
  RouteMatchLogConsumerPipelineContract,
  createRouteMatchLogConsumerPipelineContract,
} from "../src/route.match.log.consumer.pipeline.contract";
import type { RouteMatchResult } from "../src/route.match.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test route match result
function makeRouteResult(overrides: Partial<RouteMatchResult> = {}): RouteMatchResult {
  return {
    matchId: overrides.matchId ?? "match-1",
    resolvedAt: overrides.resolvedAt ?? FIXED_NOW,
    sourceGatewayId: overrides.sourceGatewayId ?? "gateway-1",
    matched: overrides.matched ?? true,
    routeId: overrides.routeId ?? "route-1",
    matchedPattern: overrides.matchedPattern ?? "/api/*",
    gatewayAction: overrides.gatewayAction ?? "FORWARD",
    matchHash: overrides.matchHash ?? "hash-1",
  };
}

const forwardResult = makeRouteResult({ matchId: "forward-1", matched: true, gatewayAction: "FORWARD", routeId: "route-forward", matchedPattern: "/forward/*" });
const rejectResult = makeRouteResult({ matchId: "reject-1", matched: false, gatewayAction: "REJECT", routeId: null, matchedPattern: null });
const rerouteResult = makeRouteResult({ matchId: "reroute-1", matched: true, gatewayAction: "REROUTE", routeId: "route-reroute", matchedPattern: "/reroute/*" });
const passthroughResult = makeRouteResult({ matchId: "passthrough-1", matched: true, gatewayAction: "PASSTHROUGH", routeId: "route-default", matchedPattern: "*" });

describe("RouteMatchLogConsumerPipelineContract", () => {
  const contract = new RouteMatchLogConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RouteMatchLogConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createRouteMatchLogConsumerPipelineContract();
      expect(c.execute({ results: [forwardResult] })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ results: [forwardResult] });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has log", () => {
      expect(result.log).toBeDefined();
      expect(result.log.totalRequests).toBeGreaterThanOrEqual(0);
    });

    it("has dominantAction", () => {
      expect(result.dominantAction).toBeDefined();
      expect(["FORWARD", "REJECT", "REROUTE", "PASSTHROUGH"]).toContain(result.dominantAction);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ results: [forwardResult], consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ results: [forwardResult] });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ results: [forwardResult] });
      const r2 = contract.execute({ results: [forwardResult] });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ results: [forwardResult] });
      const r2 = contract.execute({ results: [forwardResult] });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different results", () => {
      const r1 = contract.execute({ results: [forwardResult] });
      const r2 = contract.execute({ results: [rejectResult] });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new RouteMatchLogConsumerPipelineContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new RouteMatchLogConsumerPipelineContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.execute({ results: [forwardResult] }).pipelineHash).not.toBe(
        c2.execute({ results: [forwardResult] }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains matchedCount", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult] });
      expect(result.consumerPackage.query).toContain("1 matches");
    });

    it("query contains dominantAction", () => {
      const result = contract.execute({ results: [forwardResult] });
      expect(result.consumerPackage.query).toContain("action=FORWARD");
    });

    it("query contains unmatchedCount", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult] });
      expect(result.consumerPackage.query).toContain("mismatches=1");
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ results: [forwardResult] });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different action", () => {
      const r1 = contract.execute({ results: [forwardResult] });
      const r2 = contract.execute({ results: [rejectResult] });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals log.logId", () => {
      const result = contract.execute({ results: [forwardResult] });
      expect(result.consumerPackage.contextId).toBe(result.log.logId);
    });

    it("contextId differs for different results", () => {
      const r1 = contract.execute({ results: [forwardResult] });
      const r2 = contract.execute({ results: [rejectResult] });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for non-empty results with low mismatch rate", () => {
      expect(contract.execute({ results: [forwardResult, forwardResult, forwardResult, rejectResult] }).warnings).toHaveLength(0);
    });

    it("WARNING_NO_MATCHES for empty results array", () => {
      const result = contract.execute({ results: [] });
      expect(result.warnings).toContain(
        "[route-match-log] no matches — log contains zero route matches",
      );
    });

    it("WARNING_HIGH_MISMATCH_RATE when mismatches exceed 30%", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult, rejectResult] });
      expect(result.warnings).toContain(
        "[route-match-log] high mismatch rate — unmatched requests exceed 30% of total",
      );
    });

    it("no high mismatch warning at exactly 30%", () => {
      const results = [
        forwardResult,
        forwardResult,
        forwardResult,
        forwardResult,
        forwardResult,
        forwardResult,
        forwardResult,
        rejectResult,
        rejectResult,
        rejectResult,
      ];
      const result = contract.execute({ results });
      expect(result.warnings).not.toContain(
        "[route-match-log] high mismatch rate — unmatched requests exceed 30% of total",
      );
    });
  });

  describe("dominantAction propagation", () => {
    it("dominantAction is FORWARD for all forward results", () => {
      const result = contract.execute({ results: [forwardResult, forwardResult] });
      expect(result.dominantAction).toBe("FORWARD");
    });

    it("dominantAction is REJECT when reject results are most frequent", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult, rejectResult] });
      expect(result.dominantAction).toBe("REJECT");
    });

    it("dominantAction is REROUTE when reroute results are most frequent", () => {
      const result = contract.execute({ results: [forwardResult, rerouteResult, rerouteResult] });
      expect(result.dominantAction).toBe("REROUTE");
    });

    it("dominantAction is PASSTHROUGH when passthrough results are most frequent", () => {
      const result = contract.execute({ results: [forwardResult, passthroughResult, passthroughResult] });
      expect(result.dominantAction).toBe("PASSTHROUGH");
    });

    it("dominantAction matches log.dominantAction", () => {
      const result = contract.execute({ results: [rejectResult] });
      expect(result.dominantAction).toBe(result.log.dominantAction);
    });
  });

  describe("log propagation", () => {
    it("log.totalRequests matches results length", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult, rerouteResult] });
      expect(result.log.totalRequests).toBe(3);
    });

    it("log.matchedCount is correct", () => {
      const result = contract.execute({ results: [forwardResult, forwardResult, rejectResult] });
      expect(result.log.matchedCount).toBe(2);
    });

    it("log.unmatchedCount is correct", () => {
      const result = contract.execute({ results: [forwardResult, rejectResult, rejectResult] });
      expect(result.log.unmatchedCount).toBe(2);
    });

    it("log.forwardCount is correct", () => {
      const result = contract.execute({ results: [forwardResult, forwardResult] });
      expect(result.log.forwardCount).toBe(2);
    });

    it("log.rejectCount is correct", () => {
      const result = contract.execute({ results: [rejectResult] });
      expect(result.log.rejectCount).toBe(1);
    });
  });
});


// ─── Batch Contract Tests ─────────────────────────────────────────────────────

import {
  RouteMatchLogConsumerPipelineBatchContract,
  createRouteMatchLogConsumerPipelineBatchContract,
} from "../src/route.match.log.consumer.pipeline.batch.contract";

const NOW_2 = "2026-03-27T12:00:00.000Z";
const batchContract = new RouteMatchLogConsumerPipelineBatchContract({ now: () => NOW_2 });

// Helper: create test result (using contract from above)
const pipelineContract = new RouteMatchLogConsumerPipelineContract({ now: () => FIXED_NOW });
function makeResult(results: RouteMatchResult[]): any {
  return pipelineContract.execute({ results });
}

const forwardOnlyResult = makeResult([forwardResult]);
const rejectOnlyResult = makeResult([rejectResult]);
const rerouteOnlyResult = makeResult([rerouteResult]);
const passthroughOnlyResult = makeResult([passthroughResult]);

describe("RouteMatchLogConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RouteMatchLogConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createRouteMatchLogConsumerPipelineBatchContract();
      expect(c.batch([forwardOnlyResult])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([forwardOnlyResult, rejectOnlyResult]);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(batch.createdAt).toBe(NOW_2);
    });

    it("has totalLogs", () => {
      expect(batch.totalLogs).toBe(2);
    });

    it("has totalMatches", () => {
      expect(batch.totalMatches).toBeGreaterThanOrEqual(0);
    });

    it("has overallDominantAction", () => {
      expect(batch.overallDominantAction).toBeDefined();
      expect(["FORWARD", "REJECT", "REROUTE", "PASSTHROUGH"]).toContain(batch.overallDominantAction);
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
      expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results.length).toBe(2);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("batchId is distinct from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("deterministic hashing", () => {
    it("batchId is deterministic for same inputs", () => {
      const b1 = batchContract.batch([forwardOnlyResult]);
      const b2 = batchContract.batch([forwardOnlyResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([forwardOnlyResult]);
      const b2 = batchContract.batch([rejectOnlyResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new RouteMatchLogConsumerPipelineBatchContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new RouteMatchLogConsumerPipelineBatchContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.batch([forwardOnlyResult]).batchHash).not.toBe(c2.batch([forwardOnlyResult]).batchHash);
    });
  });

  describe("totalLogs", () => {
    it("equals results length", () => {
      expect(batchContract.batch([forwardOnlyResult, rejectOnlyResult, rerouteOnlyResult]).totalLogs).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalLogs).toBe(0);
    });
  });

  describe("totalMatches", () => {
    it("sums matchedCount across all logs", () => {
      const r1 = makeResult([forwardResult, forwardResult]);
      const r2 = makeResult([rerouteResult]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalMatches).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalMatches).toBe(0);
    });
  });

  describe("overallDominantAction", () => {
    it("is FORWARD for all forward results", () => {
      const batch = batchContract.batch([forwardOnlyResult, forwardOnlyResult]);
      expect(batch.overallDominantAction).toBe("FORWARD");
    });

    it("is REJECT when reject results are most frequent", () => {
      const batch = batchContract.batch([forwardOnlyResult, rejectOnlyResult, rejectOnlyResult]);
      expect(batch.overallDominantAction).toBe("REJECT");
    });

    it("is REROUTE when reroute results are most frequent", () => {
      const batch = batchContract.batch([forwardOnlyResult, rerouteOnlyResult, rerouteOnlyResult]);
      expect(batch.overallDominantAction).toBe("REROUTE");
    });

    it("is PASSTHROUGH when passthrough results are most frequent", () => {
      const batch = batchContract.batch([forwardOnlyResult, passthroughOnlyResult, passthroughOnlyResult]);
      expect(batch.overallDominantAction).toBe("PASSTHROUGH");
    });

    it("prioritizes REJECT in frequency ties", () => {
      const batch = batchContract.batch([forwardOnlyResult, rejectOnlyResult]);
      expect(batch.overallDominantAction).toBe("REJECT");
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const batch = batchContract.batch([forwardOnlyResult, rejectOnlyResult]);
      const expected = Math.max(
        forwardOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
        rejectOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batch.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const batch = batchContract.batch([forwardOnlyResult]);
      expect(batch.dominantTokenBudget).toBe(forwardOnlyResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalLogs equals results length", () => {
      expect(batchContract.batch([forwardOnlyResult, rejectOnlyResult, rerouteOnlyResult]).totalLogs).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([forwardOnlyResult]).createdAt).toBe(NOW_2);
    });
  });
});
