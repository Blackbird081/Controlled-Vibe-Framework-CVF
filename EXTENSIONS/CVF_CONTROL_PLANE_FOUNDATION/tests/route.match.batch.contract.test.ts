import { describe, it, expect } from "vitest";
import {
  RouteMatchBatchContract,
  createRouteMatchBatchContract,
} from "../src/route.match.batch.contract";
import { RouteMatchContract } from "../src/route.match.contract";
import type { RouteDefinition } from "../src/route.match.contract";
import type { GatewayProcessedRequest } from "../src/ai.gateway.contract";
import {
  FIXED_BATCH_NOW,
  MIXED_ROUTE_DEFINITIONS,
  makeGatewayProcessedRequest,
} from "./helpers/cpf.batch.contract.fixtures";

// --- Helpers ---

const FIXED_TS = FIXED_BATCH_NOW;

function makeContract(): RouteMatchContract {
  return new RouteMatchContract({ now: () => FIXED_TS });
}

function makeBatch(): RouteMatchBatchContract {
  return new RouteMatchBatchContract({ now: () => FIXED_TS });
}

function makeRequest(id: string, signal: string): GatewayProcessedRequest {
  return makeGatewayProcessedRequest(id, signal);
}

const MIXED_ROUTES: RouteDefinition[] = MIXED_ROUTE_DEFINITIONS;

function forwardRequest(id = "f1"): GatewayProcessedRequest {
  return makeRequest(id, "forward-signal");
}

function rejectRequest(id = "r1"): GatewayProcessedRequest {
  return makeRequest(id, "reject-signal");
}

function rerouteRequest(id = "rr1"): GatewayProcessedRequest {
  return makeRequest(id, "reroute-signal");
}

function passthroughRequest(id = "p1"): GatewayProcessedRequest {
  return makeRequest(id, "pass-signal");
}

function unmatchedRequest(id = "u1"): GatewayProcessedRequest {
  return makeRequest(id, "unknown-signal");
}

// --- Tests ---

describe("RouteMatchBatchContract — empty batch", () => {
  it("returns totalRequests 0 for empty batch", () => {
    const result = makeBatch().batch([], [], makeContract());
    expect(result.totalRequests).toBe(0);
  });

  it("returns dominantGatewayAction NONE for empty batch", () => {
    const result = makeBatch().batch([], [], makeContract());
    expect(result.dominantGatewayAction).toBe("NONE");
  });

  it("returns all counts 0 for empty batch", () => {
    const result = makeBatch().batch([], [], makeContract());
    expect(result.forwardCount).toBe(0);
    expect(result.rejectCount).toBe(0);
    expect(result.rerouteCount).toBe(0);
    expect(result.passthroughCount).toBe(0);
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(0);
  });
});

describe("RouteMatchBatchContract — single signal routing", () => {
  it("increments forwardCount for a FORWARD-matched request", () => {
    const result = makeBatch().batch([forwardRequest()], MIXED_ROUTES, makeContract());
    expect(result.forwardCount).toBe(1);
    expect(result.rejectCount).toBe(0);
    expect(result.rerouteCount).toBe(0);
  });

  it("increments rejectCount for a REJECT-matched request", () => {
    const result = makeBatch().batch([rejectRequest()], MIXED_ROUTES, makeContract());
    expect(result.rejectCount).toBe(1);
    expect(result.forwardCount).toBe(0);
    expect(result.rerouteCount).toBe(0);
  });

  it("increments rerouteCount for a REROUTE-matched request", () => {
    const result = makeBatch().batch([rerouteRequest()], MIXED_ROUTES, makeContract());
    expect(result.rerouteCount).toBe(1);
    expect(result.forwardCount).toBe(0);
    expect(result.rejectCount).toBe(0);
  });

  it("increments passthroughCount for a PASSTHROUGH-matched request", () => {
    const result = makeBatch().batch([passthroughRequest()], MIXED_ROUTES, makeContract());
    expect(result.passthroughCount).toBe(1);
    expect(result.forwardCount).toBe(0);
    expect(result.rejectCount).toBe(0);
  });
});

describe("RouteMatchBatchContract — count accuracy", () => {
  it("matchedCount=1 and unmatchedCount=0 for matched request", () => {
    const result = makeBatch().batch([forwardRequest()], MIXED_ROUTES, makeContract());
    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedCount).toBe(0);
  });

  it("matchedCount=0 and unmatchedCount=1 for unmatched request", () => {
    const result = makeBatch().batch([unmatchedRequest()], MIXED_ROUTES, makeContract());
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(1);
    expect(result.passthroughCount).toBe(1);
  });

  it("correctly counts multiple FORWARD requests", () => {
    const result = makeBatch().batch(
      [forwardRequest("f1"), forwardRequest("f2"), rejectRequest("r1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.forwardCount).toBe(2);
    expect(result.rejectCount).toBe(1);
  });

  it("correctly counts all action types in mixed batch", () => {
    const result = makeBatch().batch(
      [forwardRequest(), rejectRequest(), rerouteRequest(), passthroughRequest()],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.forwardCount).toBe(1);
    expect(result.rejectCount).toBe(1);
    expect(result.rerouteCount).toBe(1);
    expect(result.passthroughCount).toBe(1);
    expect(result.matchedCount).toBe(4);
  });

  it("matchedCount + unmatchedCount equals totalRequests", () => {
    const result = makeBatch().batch(
      [forwardRequest(), unmatchedRequest(), rejectRequest()],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.matchedCount + result.unmatchedCount).toBe(result.totalRequests);
    expect(result.totalRequests).toBe(3);
  });
});

describe("RouteMatchBatchContract — dominant GatewayAction resolution", () => {
  it("resolves REJECT as dominant when rejectCount is highest", () => {
    const result = makeBatch().batch(
      [rejectRequest("r1"), rejectRequest("r2"), forwardRequest("f1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.dominantGatewayAction).toBe("REJECT");
  });

  it("resolves REROUTE as dominant when rerouteCount is highest", () => {
    const result = makeBatch().batch(
      [rerouteRequest("rr1"), rerouteRequest("rr2"), forwardRequest("f1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.dominantGatewayAction).toBe("REROUTE");
  });

  it("resolves FORWARD as dominant when forwardCount is highest", () => {
    const result = makeBatch().batch(
      [forwardRequest("f1"), forwardRequest("f2"), passthroughRequest("p1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.dominantGatewayAction).toBe("FORWARD");
  });

  it("resolves PASSTHROUGH as dominant when passthroughCount is highest", () => {
    const result = makeBatch().batch(
      [passthroughRequest("p1"), passthroughRequest("p2"), forwardRequest("f1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.dominantGatewayAction).toBe("PASSTHROUGH");
  });

  it("REJECT wins tie-break over REROUTE", () => {
    const result = makeBatch().batch(
      [rejectRequest("r1"), rerouteRequest("rr1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.rejectCount).toBe(1);
    expect(result.rerouteCount).toBe(1);
    expect(result.dominantGatewayAction).toBe("REJECT");
  });

  it("REJECT wins tie-break over FORWARD", () => {
    const result = makeBatch().batch(
      [rejectRequest("r1"), forwardRequest("f1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.rejectCount).toBe(1);
    expect(result.forwardCount).toBe(1);
    expect(result.dominantGatewayAction).toBe("REJECT");
  });

  it("REROUTE wins tie-break over FORWARD", () => {
    const result = makeBatch().batch(
      [rerouteRequest("rr1"), forwardRequest("f1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.rerouteCount).toBe(1);
    expect(result.forwardCount).toBe(1);
    expect(result.dominantGatewayAction).toBe("REROUTE");
  });

  it("FORWARD wins tie-break over PASSTHROUGH", () => {
    const result = makeBatch().batch(
      [forwardRequest("f1"), passthroughRequest("p1")],
      MIXED_ROUTES,
      makeContract(),
    );
    expect(result.forwardCount).toBe(1);
    expect(result.passthroughCount).toBe(1);
    expect(result.dominantGatewayAction).toBe("FORWARD");
  });
});

describe("RouteMatchBatchContract — determinism", () => {
  it("produces identical batchHash for same requests and timestamp", () => {
    const requests = [forwardRequest(), rejectRequest()];
    const r1 = makeBatch().batch(requests, MIXED_ROUTES, makeContract());
    const r2 = makeBatch().batch(requests, MIXED_ROUTES, makeContract());
    expect(r1.batchHash).toBe(r2.batchHash);
  });

  it("produces identical batchId for same requests and timestamp", () => {
    const requests = [rerouteRequest(), passthroughRequest()];
    const r1 = makeBatch().batch(requests, MIXED_ROUTES, makeContract());
    const r2 = makeBatch().batch(requests, MIXED_ROUTES, makeContract());
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("produces different batchHash when createdAt differs", () => {
    const requests = [forwardRequest()];
    const b1 = new RouteMatchBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
    const b2 = new RouteMatchBatchContract({ now: () => "2026-04-01T01:00:00.000Z" });
    const r1 = b1.batch(requests, MIXED_ROUTES, makeContract());
    const r2 = b2.batch(requests, MIXED_ROUTES, makeContract());
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });
});

describe("RouteMatchBatchContract — output shape", () => {
  it("batchId and batchHash are distinct strings", () => {
    const result = makeBatch().batch([forwardRequest()], MIXED_ROUTES, makeContract());
    expect(typeof result.batchId).toBe("string");
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("results array length matches number of requests", () => {
    const requests = [forwardRequest(), rejectRequest(), unmatchedRequest()];
    const result = makeBatch().batch(requests, MIXED_ROUTES, makeContract());
    expect(result.results).toHaveLength(3);
  });

  it("createdAt matches injected timestamp", () => {
    const result = makeBatch().batch([forwardRequest()], MIXED_ROUTES, makeContract());
    expect(result.createdAt).toBe(FIXED_TS);
  });
});

describe("RouteMatchBatchContract — factory", () => {
  it("factory creates a RouteMatchBatchContract instance", () => {
    const contract = createRouteMatchBatchContract({ now: () => FIXED_TS });
    expect(contract).toBeInstanceOf(RouteMatchBatchContract);
    const result = contract.batch([forwardRequest()], MIXED_ROUTES, makeContract());
    expect(result.forwardCount).toBe(1);
  });
});
