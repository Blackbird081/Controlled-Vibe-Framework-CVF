import { describe, expect, it } from "vitest";
import {
  GatewayAuthLogBatchContract,
  createGatewayAuthLogBatchContract,
  type GatewayAuthLogBatch,
} from "../src/gateway.auth.log.batch.contract";
import { GatewayAuthLogContract } from "../src/gateway.auth.log.contract";
import { GatewayAuthContract } from "../src/gateway.auth.contract";
import type { GatewayAuthResult } from "../src/gateway.auth.contract";

// --- Helpers ---

const FIXED_NOW = "2026-04-05T00:00:00.000Z";
const PAST = "2025-01-01T00:00:00.000Z";
const FUTURE = "2030-01-01T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeLogContract() {
  return new GatewayAuthLogContract({ now: fixed });
}

function makeContract() {
  return createGatewayAuthLogBatchContract({ now: fixed });
}

function makeAuthContract() {
  return new GatewayAuthContract({ now: fixed });
}

function makeAuthenticatedResults(count: number): GatewayAuthResult[] {
  const auth = makeAuthContract();
  return Array.from({ length: count }, (_, i) =>
    auth.evaluate({
      tenantId: `tenant-auth-${i}`,
      credentials: { token: "valid-token", expiresAt: FUTURE, revoked: false },
      scope: ["read"],
    }),
  );
}

function makeDeniedResults(count: number): GatewayAuthResult[] {
  const auth = makeAuthContract();
  return Array.from({ length: count }, (_, i) =>
    auth.evaluate({
      tenantId: `tenant-denied-${i}`,
      credentials: { token: "", expiresAt: FUTURE, revoked: false },
      scope: ["read"],
    }),
  );
}

function makeExpiredResults(count: number): GatewayAuthResult[] {
  const auth = makeAuthContract();
  return Array.from({ length: count }, (_, i) =>
    auth.evaluate({
      tenantId: `tenant-expired-${i}`,
      credentials: { token: "expired-token", expiresAt: PAST, revoked: false },
      scope: ["read"],
    }),
  );
}

function makeRevokedResults(count: number): GatewayAuthResult[] {
  const auth = makeAuthContract();
  return Array.from({ length: count }, (_, i) =>
    auth.evaluate({
      tenantId: `tenant-revoked-${i}`,
      credentials: { token: "revoked-token", revoked: true },
      scope: ["read"],
    }),
  );
}

// --- empty batch ---

describe("GatewayAuthLogBatchContract.batch — empty", () => {
  it("returns EMPTY dominantAuthStatus for empty entries array", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.dominantAuthStatus).toBe("EMPTY");
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([], makeLogContract());
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- counts ---

describe("GatewayAuthLogBatchContract.batch — counts", () => {
  it("totalLogs equals number of entries", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(1), makeDeniedResults(1)],
      makeLogContract(),
    );
    expect(result.totalLogs).toBe(2);
  });

  it("totalRequests is sum of log.totalRequests across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(3), makeDeniedResults(2)],
      makeLogContract(),
    );
    expect(result.totalRequests).toBe(5);
  });

  it("authenticatedCount is sum across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(2), makeAuthenticatedResults(3)],
      makeLogContract(),
    );
    expect(result.authenticatedCount).toBe(5);
  });

  it("deniedCount is sum across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeDeniedResults(2), makeDeniedResults(1)],
      makeLogContract(),
    );
    expect(result.deniedCount).toBe(3);
  });

  it("expiredCount is sum across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeExpiredResults(2), makeExpiredResults(2)],
      makeLogContract(),
    );
    expect(result.expiredCount).toBe(4);
  });

  it("revokedCount is sum across all logs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRevokedResults(1), makeRevokedResults(2)],
      makeLogContract(),
    );
    expect(result.revokedCount).toBe(3);
  });
});

// --- dominantAuthStatus ---

describe("GatewayAuthLogBatchContract.batch — dominantAuthStatus", () => {
  it("returns AUTHENTICATED when it has the highest aggregate count", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(3), makeDeniedResults(1)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("AUTHENTICATED");
  });

  it("returns DENIED when it has the highest aggregate count", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeDeniedResults(3), makeAuthenticatedResults(1)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("DENIED");
  });

  it("returns EXPIRED when it has the highest aggregate count", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeExpiredResults(3), makeAuthenticatedResults(1)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("EXPIRED");
  });

  it("returns REVOKED when it has the highest aggregate count", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRevokedResults(3), makeAuthenticatedResults(1)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("REVOKED");
  });

  it("returns REVOKED on tie with EXPIRED (precedence: REVOKED > EXPIRED)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRevokedResults(2), makeExpiredResults(2)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("REVOKED");
  });

  it("returns REVOKED on tie with DENIED (precedence: REVOKED > DENIED)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeRevokedResults(2), makeDeniedResults(2)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("REVOKED");
  });

  it("returns EXPIRED on tie with DENIED (precedence: EXPIRED > DENIED)", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeExpiredResults(2), makeDeniedResults(2)],
      makeLogContract(),
    );
    expect(result.dominantAuthStatus).toBe("EXPIRED");
  });
});

// --- determinism ---

describe("GatewayAuthLogBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical entries", () => {
    const entries = [makeAuthenticatedResults(2)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchHash).toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("produces identical batchId for identical entries", () => {
    const entries = [makeDeniedResults(1)];
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch(entries, makeLogContract()).batchId).toBe(
      c2.batch(entries, makeLogContract()).batchId,
    );
  });

  it("produces different batchHash for different entries", () => {
    const contract = makeContract();
    const b1 = contract.batch([makeAuthenticatedResults(1)], makeLogContract());
    const b2 = contract.batch([makeRevokedResults(1)], makeLogContract());
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const entries = [makeAuthenticatedResults(1)];
    const c1 = createGatewayAuthLogBatchContract({
      now: () => "2026-04-05T00:00:00.000Z",
    });
    const c2 = createGatewayAuthLogBatchContract({
      now: () => "2026-04-05T01:00:00.000Z",
    });
    expect(c1.batch(entries, makeLogContract()).batchHash).not.toBe(
      c2.batch(entries, makeLogContract()).batchHash,
    );
  });

  it("batchId !== batchHash for non-empty input", () => {
    const contract = makeContract();
    const result = contract.batch([makeAuthenticatedResults(1)], makeLogContract());
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- factory function ---

describe("createGatewayAuthLogBatchContract", () => {
  it("returns a GatewayAuthLogBatchContract instance", () => {
    const contract = createGatewayAuthLogBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(GatewayAuthLogBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createGatewayAuthLogBatchContract();
    const result = contract.batch([], makeLogContract());
    expect(result.dominantAuthStatus).toBe("EMPTY");
    expect(typeof result.createdAt).toBe("string");
  });
});

// --- output shape ---

describe("GatewayAuthLogBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(1)],
      makeLogContract(),
    );
    const keys: Array<keyof GatewayAuthLogBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalLogs",
      "totalRequests",
      "authenticatedCount",
      "deniedCount",
      "expiredCount",
      "revokedCount",
      "dominantAuthStatus",
      "logs",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("logs array length equals totalLogs", () => {
    const contract = makeContract();
    const result = contract.batch(
      [makeAuthenticatedResults(2), makeRevokedResults(1)],
      makeLogContract(),
    );
    expect(result.logs).toHaveLength(result.totalLogs);
  });

  it("sum of all status counts equals totalRequests", () => {
    const contract = makeContract();
    const result = contract.batch(
      [
        makeAuthenticatedResults(2),
        makeDeniedResults(1),
        makeExpiredResults(1),
        makeRevokedResults(1),
      ],
      makeLogContract(),
    );
    const sum =
      result.authenticatedCount +
      result.deniedCount +
      result.expiredCount +
      result.revokedCount;
    expect(sum).toBe(result.totalRequests);
  });
});
