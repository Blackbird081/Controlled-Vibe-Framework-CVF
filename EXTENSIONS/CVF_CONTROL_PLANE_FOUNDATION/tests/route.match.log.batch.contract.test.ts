import { describe, expect, it } from "vitest";
import {
  RouteMatchLogBatchContract,
  createRouteMatchLogBatchContract,
  type RouteMatchLogBatch,
} from "../src/route.match.log.batch.contract";
import { RouteMatchLogContract } from "../src/route.match.log.contract";
import type { RouteMatchResult, GatewayAction } from "../src/route.match.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeLogContract() {
  return new RouteMatchLogContract({ now: fixed });
}

function makeContract() {
  return createRouteMatchLogBatchContract({ now: fixed });
}

let _seq = 0;
function makeResult(
  action: GatewayAction,
  matched: boolean = true,
): RouteMatchResult {
  const seq = ++_seq;
  return {
    matchId: `match-${seq}`,
    resolvedAt: FIXED_NOW,
    sourceGatewayId: `gw-${seq}`,
    matched,
    routeId: matched ? `route-${action}-${seq}` : null,
    matchedPattern: matched ? `/${action.toLowerCase()}*` : null,
    gatewayAction: action,
    matchHash: `hash-${action}-${seq}`,
  };
}

function makeForwardResults(count: number): RouteMatchResult[] {
  return Array.from({ length: count }, () => makeResult("FORWARD"));
}

function makeRejectResults(count: number): RouteMatchResult[] {
  return Array.from({ length: count }, () => makeResult("REJECT"));
}

function makeRerouteResults(count: number): RouteMatchResult[] {
  return Array.from({ length: count }, () => makeResult("REROUTE"));
}

function makePassthroughResults(count: number): RouteMatchResult[] {
  return Array.from({ length: count }, () => makeResult("PASSTHROUGH", false));
}

// --- empty batch ---

describe("RouteMatchLogBatchContract.batch — empty", () => {
  it('returns "EMPTY" overallDominantAction for empty entries array', () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.overallDominantAction).toBe("EMPTY");
  });

  it("all counts are zero for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.totalLogs).toBe(0);
    expect(result.totalRequests).toBe(0);
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(0);
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- counts ---

describe("RouteMatchLogBatchContract.batch — counts", () => {
  it("totalLogs equals number of entries", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(1), makeRejectResults(1)],
      makeLogContract(),
    );
    expect(result.totalLogs).toBe(2);
  });

  it("totalRequests is sum of log.totalRequests across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(3), makeRejectResults(2)],
      makeLogContract(),
    );
    expect(result.totalRequests).toBe(5);
  });

  it("matchedCount is sum of log.matchedCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(2), makeForwardResults(3)],
      makeLogContract(),
    );
    expect(result.matchedCount).toBe(5);
  });

  it("unmatchedCount is sum of log.unmatchedCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makePassthroughResults(2), makePassthroughResults(3)],
      makeLogContract(),
    );
    expect(result.unmatchedCount).toBe(5);
  });

  it("forwardCount is sum of log.forwardCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(2), makeForwardResults(3)],
      makeLogContract(),
    );
    expect(result.forwardCount).toBe(5);
  });

  it("rejectCount is sum of log.rejectCount across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRejectResults(2), makeRejectResults(3)],
      makeLogContract(),
    );
    expect(result.rejectCount).toBe(5);
  });

  it("matchedCount + unmatchedCount equals totalRequests", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(2), makePassthroughResults(3)],
      makeLogContract(),
    );
    expect(result.matchedCount + result.unmatchedCount).toBe(
      result.totalRequests,
    );
  });
});

// --- overallDominantAction ---

describe("RouteMatchLogBatchContract.batch — overallDominantAction", () => {
  it('returns "EMPTY" for empty entries', () => {
    const contract = makeContract();
    expect(contract.batch([], makeLogContract()).overallDominantAction).toBe(
      "EMPTY",
    );
  });

  it("returns REJECT when only REJECT results", () => {
    const contract = makeContract();
    const result = contract.batch([makeRejectResults(2)], makeLogContract());
    expect(result.overallDominantAction).toBe("REJECT");
  });

  it("returns FORWARD when only FORWARD results", () => {
    const contract = makeContract();
    const result = contract.batch([makeForwardResults(2)], makeLogContract());
    expect(result.overallDominantAction).toBe("FORWARD");
  });

  it("returns REROUTE when only REROUTE results", () => {
    const contract = makeContract();
    const result = contract.batch([makeRerouteResults(2)], makeLogContract());
    expect(result.overallDominantAction).toBe("REROUTE");
  });

  it("returns PASSTHROUGH when only PASSTHROUGH results", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makePassthroughResults(2)],
      makeLogContract(),
    );
    expect(result.overallDominantAction).toBe("PASSTHROUGH");
  });

  it("returns REJECT over FORWARD by precedence (REJECT > FORWARD)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRejectResults(1), makeForwardResults(1)],
      makeLogContract(),
    );
    expect(result.overallDominantAction).toBe("REJECT");
  });
});

// --- determinism ---

describe("RouteMatchLogBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical entries", () => {
    const entries = [makeRejectResults(2)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchHash).toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("produces identical batchId for identical entries", () => {
    const entries = [makeForwardResults(1)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchId).toBe(
      c2.batch(entries, makeLogContract()).batchId,
    );
  });

  it("produces different batchHash for different entries", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeForwardResults(1)], makeLogContract());
    const b2 = contract.batch([makeRejectResults(1)], makeLogContract());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const entries = [makeForwardResults(1)];
    const c1 = createRouteMatchLogBatchContract({
      now: () => "2026-04-05T00:00:00.000Z",
    });
    const c2 = createRouteMatchLogBatchContract({
      now: () => "2026-04-05T01:00:00.000Z",
    });
    expect(c1.batch(entries, makeLogContract()).batchHash).not.toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeForwardResults(1)], makeLogContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- factory function ---

describe("createRouteMatchLogBatchContract", () => {
  it("returns a RouteMatchLogBatchContract instance", () => {
    const contract = createRouteMatchLogBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(RouteMatchLogBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createRouteMatchLogBatchContract();
    const result = contract.batch([], makeLogContract());
    expect(result.overallDominantAction).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("RouteMatchLogBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeForwardResults(1)], makeLogContract());
    const keys: Array<keyof RouteMatchLogBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalLogs",
      "totalRequests",
      "matchedCount",
      "unmatchedCount",
      "forwardCount",
      "rejectCount",
      "rerouteCount",
      "passthroughCount",
      "overallDominantAction",
      "logs",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("logs array length equals totalLogs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeForwardResults(1), makeRejectResults(2)],
      makeLogContract(),
    );
    expect(result.logs).toHaveLength(result.totalLogs);
  });

  it("matchedCount + unmatchedCount equals totalRequests for mixed batch", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRejectResults(2), makePassthroughResults(3), makeForwardResults(1)],
      makeLogContract(),
    );
    expect(result.matchedCount + result.unmatchedCount).toBe(
      result.totalRequests,
    );
  });
});
