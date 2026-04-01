import { describe, expect, it } from "vitest";
import {
  GatewayAuthBatchContract,
  createGatewayAuthBatchContract,
  type GatewayAuthBatch,
} from "../src/gateway.auth.batch.contract";
import { GatewayAuthContract } from "../src/gateway.auth.contract";
import type { GatewayAuthRequest } from "../src/gateway.auth.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-01T00:00:00.000Z";
const PAST = "2025-01-01T00:00:00.000Z";
const FUTURE = "2030-01-01T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeAuthContract() {
  return new GatewayAuthContract({ now: fixed });
}

function makeContract() {
  return createGatewayAuthBatchContract({ now: fixed });
}

function makeAuthenticatedRequest(
  overrides: Partial<GatewayAuthRequest> = {},
): GatewayAuthRequest {
  return {
    tenantId: "tenant-auth",
    credentials: { token: "valid-token", expiresAt: FUTURE, revoked: false },
    scope: ["read"],
    ...overrides,
  };
}

function makeDeniedRequest(
  overrides: Partial<GatewayAuthRequest> = {},
): GatewayAuthRequest {
  return {
    tenantId: "tenant-denied",
    credentials: { token: "", expiresAt: FUTURE, revoked: false },
    scope: ["read"],
    ...overrides,
  };
}

function makeExpiredRequest(
  overrides: Partial<GatewayAuthRequest> = {},
): GatewayAuthRequest {
  return {
    tenantId: "tenant-expired",
    credentials: { token: "expired-token", expiresAt: PAST, revoked: false },
    scope: ["read"],
    ...overrides,
  };
}

function makeRevokedRequest(
  overrides: Partial<GatewayAuthRequest> = {},
): GatewayAuthRequest {
  return {
    tenantId: "tenant-revoked",
    credentials: { token: "revoked-token", revoked: true },
    scope: ["read"],
    ...overrides,
  };
}

// --- empty batch ---

describe("GatewayAuthBatchContract.batch — empty", () => {
  it("returns zero counts and EMPTY dominantAuthStatus for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeAuthContract());
    expect(result.totalRequests).toBe(0);
    expect(result.authenticatedCount).toBe(0);
    expect(result.deniedCount).toBe(0);
    expect(result.expiredCount).toBe(0);
    expect(result.revokedCount).toBe(0);
    expect(result.dominantAuthStatus).toBe("EMPTY");
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeAuthContract());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeAuthContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeAuthContract());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- count accuracy ---

describe("GatewayAuthBatchContract.batch — counts", () => {
  it("counts AUTHENTICATED results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeAuthenticatedRequest({ tenantId: "t1" }),
      makeAuthenticatedRequest({ tenantId: "t2" }),
      makeDeniedRequest(),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    expect(batch.authenticatedCount).toBe(2);
    expect(batch.deniedCount).toBe(1);
    expect(batch.expiredCount).toBe(0);
    expect(batch.revokedCount).toBe(0);
    expect(batch.totalRequests).toBe(3);
  });

  it("counts DENIED results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeDeniedRequest({ tenantId: "t1" }),
      makeDeniedRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    expect(batch.deniedCount).toBe(2);
    expect(batch.authenticatedCount).toBe(1);
    expect(batch.expiredCount).toBe(0);
    expect(batch.revokedCount).toBe(0);
    expect(batch.totalRequests).toBe(3);
  });

  it("counts EXPIRED results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeExpiredRequest({ tenantId: "t1" }),
      makeExpiredRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    expect(batch.expiredCount).toBe(2);
    expect(batch.authenticatedCount).toBe(1);
    expect(batch.deniedCount).toBe(0);
    expect(batch.revokedCount).toBe(0);
    expect(batch.totalRequests).toBe(3);
  });

  it("counts REVOKED results correctly", () => {
    const contract = makeContract();
    const requests = [
      makeRevokedRequest({ tenantId: "t1" }),
      makeRevokedRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    expect(batch.revokedCount).toBe(2);
    expect(batch.authenticatedCount).toBe(1);
    expect(batch.deniedCount).toBe(0);
    expect(batch.expiredCount).toBe(0);
    expect(batch.totalRequests).toBe(3);
  });

  it("totalRequests equals input requests array length", () => {
    const contract = makeContract();
    const requests = [
      makeAuthenticatedRequest({ tenantId: "t1" }),
      makeDeniedRequest({ tenantId: "t2" }),
      makeExpiredRequest({ tenantId: "t3" }),
      makeRevokedRequest({ tenantId: "t4" }),
    ];
    expect(contract.batch(requests, makeAuthContract()).totalRequests).toBe(4);
  });
});

// --- dominant auth status ---

describe("GatewayAuthBatchContract.batch — dominantAuthStatus", () => {
  it("returns AUTHENTICATED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeAuthenticatedRequest({ tenantId: "t1" }),
      makeAuthenticatedRequest({ tenantId: "t2" }),
      makeDeniedRequest(),
    ];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("AUTHENTICATED");
  });

  it("returns DENIED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeDeniedRequest({ tenantId: "t1" }),
      makeDeniedRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("DENIED");
  });

  it("returns EXPIRED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeExpiredRequest({ tenantId: "t1" }),
      makeExpiredRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("EXPIRED");
  });

  it("returns REVOKED when it has the highest count", () => {
    const contract = makeContract();
    const requests = [
      makeRevokedRequest({ tenantId: "t1" }),
      makeRevokedRequest({ tenantId: "t2" }),
      makeAuthenticatedRequest(),
    ];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("REVOKED");
  });

  it("returns REVOKED on tie with EXPIRED (precedence: REVOKED > EXPIRED)", () => {
    const contract = makeContract();
    const requests = [makeRevokedRequest(), makeExpiredRequest()];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("REVOKED");
  });

  it("returns REVOKED on tie with DENIED (precedence: REVOKED > DENIED)", () => {
    const contract = makeContract();
    const requests = [makeRevokedRequest(), makeDeniedRequest()];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("REVOKED");
  });

  it("returns REVOKED on tie with AUTHENTICATED (precedence: REVOKED > AUTHENTICATED)", () => {
    const contract = makeContract();
    const requests = [makeRevokedRequest(), makeAuthenticatedRequest()];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("REVOKED");
  });

  it("returns EXPIRED on tie with DENIED (precedence: EXPIRED > DENIED)", () => {
    const contract = makeContract();
    const requests = [makeExpiredRequest(), makeDeniedRequest()];
    expect(contract.batch(requests, makeAuthContract()).dominantAuthStatus).toBe("EXPIRED");
  });
});

// --- determinism ---

describe("GatewayAuthBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical requests", () => {
    const req = makeAuthenticatedRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    expect(
      c1.batch([req], makeAuthContract()).batchHash,
    ).toBe(
      c2.batch([req], makeAuthContract()).batchHash,
    );
  });

  it("produces identical batchId for identical requests", () => {
    const req = makeDeniedRequest();
    const c1 = makeContract();
    const c2 = makeContract();
    expect(
      c1.batch([req], makeAuthContract()).batchId,
    ).toBe(
      c2.batch([req], makeAuthContract()).batchId,
    );
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeAuthenticatedRequest()], makeAuthContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different requests", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeAuthenticatedRequest()], makeAuthContract());
    const b2 = contract.batch([makeRevokedRequest()], makeAuthContract());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const req = makeAuthenticatedRequest();
    const c1 = createGatewayAuthBatchContract({ now: () => "2026-04-01T00:00:00.000Z" });
    const c2 = createGatewayAuthBatchContract({ now: () => "2026-04-01T01:00:00.000Z" });
    expect(
      c1.batch([req], makeAuthContract()).batchHash,
    ).not.toBe(
      c2.batch([req], makeAuthContract()).batchHash,
    );
  });
});

// --- factory function ---

describe("createGatewayAuthBatchContract", () => {
  it("returns a GatewayAuthBatchContract instance", () => {
    const contract = createGatewayAuthBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(GatewayAuthBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createGatewayAuthBatchContract();
    const result = contract.batch([], makeAuthContract());
    expect(result.dominantAuthStatus).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("GatewayAuthBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeAuthenticatedRequest()], makeAuthContract());
    const keys: Array<keyof GatewayAuthBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalRequests",
      "authenticatedCount",
      "deniedCount",
      "expiredCount",
      "revokedCount",
      "dominantAuthStatus",
      "results",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("sum of all status counts equals totalRequests", () => {
    const contract = makeContract();
    const requests = [
      makeAuthenticatedRequest({ tenantId: "t1" }),
      makeDeniedRequest({ tenantId: "t2" }),
      makeExpiredRequest({ tenantId: "t3" }),
      makeRevokedRequest({ tenantId: "t4" }),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    const sum =
      batch.authenticatedCount +
      batch.deniedCount +
      batch.expiredCount +
      batch.revokedCount;
    expect(sum).toBe(batch.totalRequests);
  });

  it("results array length equals totalRequests", () => {
    const contract = makeContract();
    const requests = [
      makeAuthenticatedRequest({ tenantId: "t1" }),
      makeRevokedRequest({ tenantId: "t2" }),
      makeExpiredRequest({ tenantId: "t3" }),
    ];
    const batch = contract.batch(requests, makeAuthContract());
    expect(batch.results).toHaveLength(batch.totalRequests);
  });
});
