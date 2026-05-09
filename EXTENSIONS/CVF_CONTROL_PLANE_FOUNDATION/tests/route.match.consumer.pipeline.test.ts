import { describe, it, expect } from "vitest";
import {
  RouteMatchConsumerPipelineContract,
  createRouteMatchConsumerPipelineContract,
} from "../src/route.match.consumer.pipeline.contract";
import {
  RouteMatchConsumerPipelineBatchContract,
  createRouteMatchConsumerPipelineBatchContract,
} from "../src/route.match.consumer.pipeline.batch.contract";
import type { RouteMatchResult, GatewayAction } from "../src/route.match.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test route match result
function makeRouteMatchResult(options: {
  action?: GatewayAction;
  matched?: boolean;
  pattern?: string | null;
  matchId?: string;
} = {}): RouteMatchResult {
  const {
    action = "FORWARD",
    matched = true,
    pattern = "/test/*",
    matchId = "match-123",
  } = options;

  return {
    matchId,
    resolvedAt: FIXED_NOW,
    sourceGatewayId: "gateway-456",
    matched,
    routeId: matched ? "route-789" : null,
    matchedPattern: pattern,
    gatewayAction: action,
    matchHash: "match-hash-123",
  };
}

const forwardMatch = makeRouteMatchResult({ action: "FORWARD" });
const rerouteMatch = makeRouteMatchResult({ action: "REROUTE" });
const passthroughMatch = makeRouteMatchResult({ action: "PASSTHROUGH" });
const rejectMatch = makeRouteMatchResult({ action: "REJECT" });
const noMatch = makeRouteMatchResult({ matched: false, pattern: null });

describe("RouteMatchConsumerPipelineContract", () => {
  const contract = new RouteMatchConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RouteMatchConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createRouteMatchConsumerPipelineContract();
      expect(c.execute({ routeMatchResult: forwardMatch })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ routeMatchResult: forwardMatch });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has routeMatchResult", () => {
      expect(result.routeMatchResult).toBeDefined();
      expect(result.routeMatchResult).toBe(forwardMatch);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("RouteMatch:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(forwardMatch.matchId);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with FORWARD action", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch });
      expect(result.query).toBe("RouteMatch: action=FORWARD, matched=yes, pattern=/test/*");
    });

    it("derives query with REROUTE action", () => {
      const result = contract.execute({ routeMatchResult: rerouteMatch });
      expect(result.query).toBe("RouteMatch: action=REROUTE, matched=yes, pattern=/test/*");
    });

    it("derives query with PASSTHROUGH action", () => {
      const result = contract.execute({ routeMatchResult: passthroughMatch });
      expect(result.query).toBe("RouteMatch: action=PASSTHROUGH, matched=yes, pattern=/test/*");
    });

    it("derives query with REJECT action", () => {
      const result = contract.execute({ routeMatchResult: rejectMatch });
      expect(result.query).toBe("RouteMatch: action=REJECT, matched=yes, pattern=/test/*");
    });

    it("derives query with no match", () => {
      const result = contract.execute({ routeMatchResult: noMatch });
      expect(result.query).toBe("RouteMatch: action=FORWARD, matched=no, pattern=none");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from matchId", () => {
      const match = makeRouteMatchResult({ matchId: "match-xyz-789" });
      const result = contract.execute({ routeMatchResult: match });
      expect(result.contextId).toBe("match-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_NO_MATCH when not matched", () => {
      const result = contract.execute({ routeMatchResult: noMatch });
      expect(result.warnings).toContain("WARNING_NO_MATCH");
    });

    it("does not emit WARNING_NO_MATCH when matched", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch });
      expect(result.warnings).not.toContain("WARNING_NO_MATCH");
    });

    it("emits WARNING_REJECTED when action is REJECT", () => {
      const result = contract.execute({ routeMatchResult: rejectMatch });
      expect(result.warnings).toContain("WARNING_REJECTED");
    });

    it("does not emit WARNING_REJECTED for other actions", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch });
      expect(result.warnings).not.toContain("WARNING_REJECTED");
    });

    it("emits no warnings for normal match", () => {
      const result = contract.execute({ routeMatchResult: forwardMatch });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ routeMatchResult: forwardMatch });
      const r2 = contract.execute({ routeMatchResult: forwardMatch });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ routeMatchResult: forwardMatch });
      const r2 = contract.execute({ routeMatchResult: forwardMatch });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("RouteMatchConsumerPipelineBatchContract", () => {
  const pipelineContract = new RouteMatchConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new RouteMatchConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(action: GatewayAction, matched = true) {
    const match = makeRouteMatchResult({ action, matched });
    return pipelineContract.execute({ routeMatchResult: match });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new RouteMatchConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createRouteMatchConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult("FORWARD")];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalMatches", () => {
      expect(typeof batch.totalMatches).toBe("number");
      expect(batch.totalMatches).toBe(1);
    });

    it("has overallDominantAction", () => {
      expect(typeof batch.overallDominantAction).toBe("string");
      expect(["FORWARD", "REROUTE", "PASSTHROUGH", "REJECT"]).toContain(batch.overallDominantAction);
    });

    it("has totalSuccessfulMatches", () => {
      expect(typeof batch.totalSuccessfulMatches).toBe("number");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalMatches correctly", () => {
      const results = [makeResult("FORWARD"), makeResult("REROUTE"), makeResult("PASSTHROUGH")];
      const batch = batchContract.batch(results);
      expect(batch.totalMatches).toBe(3);
    });

    it("calculates totalSuccessfulMatches correctly", () => {
      const results = [makeResult("FORWARD", true), makeResult("REROUTE", false), makeResult("PASSTHROUGH", true)];
      const batch = batchContract.batch(results);
      expect(batch.totalSuccessfulMatches).toBe(2);
    });

    it("selects dominant action based on frequency (FORWARD)", () => {
      const results = [makeResult("FORWARD"), makeResult("FORWARD"), makeResult("REROUTE")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantAction).toBe("FORWARD");
    });

    it("selects dominant action based on frequency (REROUTE)", () => {
      const results = [makeResult("REROUTE"), makeResult("REROUTE"), makeResult("FORWARD")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantAction).toBe("REROUTE");
    });

    it("breaks ties using priority order (FORWARD > REROUTE)", () => {
      const results = [makeResult("FORWARD"), makeResult("REROUTE")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantAction).toBe("FORWARD");
    });

    it("breaks ties using priority order (REROUTE > PASSTHROUGH)", () => {
      const results = [makeResult("REROUTE"), makeResult("PASSTHROUGH")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantAction).toBe("REROUTE");
    });

    it("breaks ties using priority order (PASSTHROUGH > REJECT)", () => {
      const results = [makeResult("PASSTHROUGH"), makeResult("REJECT")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantAction).toBe("PASSTHROUGH");
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult("FORWARD"), makeResult("REROUTE"), makeResult("PASSTHROUGH")];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalMatches).toBe(0);
      expect(batch.totalSuccessfulMatches).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.overallDominantAction).toBe("PASSTHROUGH");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult("FORWARD")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult("FORWARD")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
