import { describe, expect, it } from "vitest";
import {
  TrustPropagationBatchContract,
  createTrustPropagationBatchContract,
  type TrustPropagationBatch,
} from "../src/trust.propagation.batch.contract";
import { TrustIsolationBoundaryContract } from "../src/trust.isolation.boundary.contract";
import type { TrustPropagationRequest } from "../src/trust.isolation.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeBoundary() {
  return new TrustIsolationBoundaryContract({ now: fixed });
}

function makeContract() {
  return createTrustPropagationBatchContract({ now: fixed });
}

function makeBlockedRequest(
  overrides: Partial<TrustPropagationRequest> = {},
): TrustPropagationRequest {
  return {
    sourceId: "src-001",
    targetId: "tgt-001",
    propagationContext: "unsupported-context",
    ...overrides,
  };
}

function makeGraphGatedRequest(
  overrides: Partial<TrustPropagationRequest> = {},
): TrustPropagationRequest {
  return {
    sourceId: "src-002",
    targetId: "tgt-002",
    propagationContext: "cross-plane",
    ...overrides,
  };
}

function makeDirectRequest(
  overrides: Partial<TrustPropagationRequest> = {},
): TrustPropagationRequest {
  return {
    sourceId: "src-003",
    targetId: "tgt-003",
    propagationContext: "agent-to-agent",
    ...overrides,
  };
}

// --- empty batch ---

describe("TrustPropagationBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantMode for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.totalDecisions).toBe(0);
    expect(result.blockedCount).toBe(0);
    expect(result.graphGatedCount).toBe(0);
    expect(result.directCount).toBe(0);
    expect(result.dominantMode).toBe("EMPTY");
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeBoundary());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- count accuracy ---

describe("TrustPropagationBatchContract.batch — counts", () => {
  it("counts BLOCKED decisions correctly", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest({ sourceId: "src-A" }),
      makeBlockedRequest({ sourceId: "src-B" }),
      makeDirectRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.blockedCount).toBe(2);
    expect(batch.directCount).toBe(1);
    expect(batch.graphGatedCount).toBe(0);
    expect(batch.totalDecisions).toBe(3);
  });

  it("counts GRAPH_GATED decisions correctly", () => {
    const contract = makeContract();
    const requests = [
      makeGraphGatedRequest({ sourceId: "src-A" }),
      makeGraphGatedRequest({ sourceId: "src-B" }),
      makeBlockedRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.graphGatedCount).toBe(2);
    expect(batch.blockedCount).toBe(1);
    expect(batch.directCount).toBe(0);
    expect(batch.totalDecisions).toBe(3);
  });

  it("counts DIRECT decisions correctly", () => {
    const contract = makeContract();
    const requests = [
      makeDirectRequest({ sourceId: "src-A" }),
      makeDirectRequest({ sourceId: "src-B" }),
      makeDirectRequest({ sourceId: "src-C" }),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.directCount).toBe(3);
    expect(batch.blockedCount).toBe(0);
    expect(batch.graphGatedCount).toBe(0);
    expect(batch.totalDecisions).toBe(3);
  });

  it("counts all three modes correctly in a mixed batch", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest({ sourceId: "src-X" }),
      makeGraphGatedRequest({ sourceId: "src-Y" }),
      makeDirectRequest({ sourceId: "src-Z" }),
      makeBlockedRequest({ sourceId: "src-W" }),
      makeGraphGatedRequest({ sourceId: "src-V" }),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.blockedCount).toBe(2);
    expect(batch.graphGatedCount).toBe(2);
    expect(batch.directCount).toBe(1);
    expect(batch.totalDecisions).toBe(5);
  });
});

// --- dominant mode ---

describe("TrustPropagationBatchContract.batch — dominantMode", () => {
  it("returns BLOCKED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest({ sourceId: "src-A" }),
      makeBlockedRequest({ sourceId: "src-B" }),
      makeGraphGatedRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("BLOCKED");
  });

  it("returns GRAPH_GATED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeGraphGatedRequest({ sourceId: "src-A" }),
      makeGraphGatedRequest({ sourceId: "src-B" }),
      makeDirectRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("GRAPH_GATED");
  });

  it("returns DIRECT when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeDirectRequest({ sourceId: "src-A" }),
      makeDirectRequest({ sourceId: "src-B" }),
      makeGraphGatedRequest(),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("DIRECT");
  });

  it("returns BLOCKED on tie with GRAPH_GATED (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeBlockedRequest(), makeGraphGatedRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("BLOCKED");
  });

  it("returns BLOCKED on tie with DIRECT (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeBlockedRequest(), makeDirectRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("BLOCKED");
  });

  it("returns GRAPH_GATED on tie with DIRECT (precedence rule)", () => {
    const contract = makeContract();
    const requests = [makeGraphGatedRequest(), makeDirectRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("GRAPH_GATED");
  });

  it("returns BLOCKED on three-way tie (highest precedence)", () => {
    const contract = makeContract();
    const requests = [makeBlockedRequest(), makeGraphGatedRequest(), makeDirectRequest()];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("BLOCKED");
  });

  it("returns BLOCKED for batch with only BLOCKED decisions", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest({ sourceId: "src-A" }),
      makeBlockedRequest({ sourceId: "src-B" }),
    ];
    expect(contract.batch(requests, makeBoundary()).dominantMode).toBe("BLOCKED");
  });
});

// --- determinism ---

describe("TrustPropagationBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical requests", () => {
    const req = makeDirectRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    const b1 = c1.batch([req], makeBoundary());
    const b2 = c2.batch([req], makeBoundary());
    expect(b1.batchHash).toBe(b2.batchHash);
  });

  it("produces identical batchId for identical requests", () => {
    const req = makeBlockedRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([req], makeBoundary()).batchId).toBe(c2.batch([req], makeBoundary()).batchId);
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeDirectRequest()], makeBoundary());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different requests", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeBlockedRequest({ sourceId: "src-AAA" })], makeBoundary());
    const b2 = contract.batch([makeDirectRequest({ sourceId: "src-BBB" })], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const req = makeDirectRequest();
    const c1 = createTrustPropagationBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createTrustPropagationBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    const b1 = c1.batch([req], makeBoundary());
    const b2 = c2.batch([req], makeBoundary());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });
});

// --- factory function ---

describe("createTrustPropagationBatchContract", () => {
  it("returns a TrustPropagationBatchContract instance", () => {
    const contract = createTrustPropagationBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(TrustPropagationBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createTrustPropagationBatchContract();
    const result = contract.batch([], makeBoundary());
    expect(result.dominantMode).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("TrustPropagationBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeDirectRequest()], makeBoundary());
    const keys: Array<keyof TrustPropagationBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalDecisions",
      "blockedCount",
      "graphGatedCount",
      "directCount",
      "dominantMode",
      "decisions",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("totalDecisions equals input array length", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest(),
      makeGraphGatedRequest(),
      makeDirectRequest(),
      makeDirectRequest({ sourceId: "src-004" }),
    ];
    expect(contract.batch(requests, makeBoundary()).totalDecisions).toBe(4);
  });

  it("blockedCount + graphGatedCount + directCount === totalDecisions", () => {
    const contract = makeContract();
    const requests = [
      makeBlockedRequest({ sourceId: "src-A" }),
      makeBlockedRequest({ sourceId: "src-B" }),
      makeGraphGatedRequest(),
      makeDirectRequest(),
    ];
    const batch = contract.batch(requests, makeBoundary());
    expect(batch.blockedCount + batch.graphGatedCount + batch.directCount).toBe(
      batch.totalDecisions,
    );
  });
});
