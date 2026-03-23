/**
 * CPF Gateway Auth & Auth Log — Dedicated Tests (W6-T32)
 * ========================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GatewayAuthContract.evaluate:
 *     - revoked=true → authStatus=REVOKED (checked before expiry)
 *     - revoked takes priority over expired token
 *     - expired token (expiresAt <= now) → authStatus=EXPIRED
 *     - empty token → authStatus=DENIED
 *     - whitespace-only token → authStatus=DENIED
 *     - valid token, not revoked, not expired → authStatus=AUTHENTICATED
 *     - authenticated → authenticated=true, scopeGranted=request.scope
 *     - denied/revoked/expired → authenticated=false, scopeGranted=[]
 *     - tenantId propagated
 *     - evaluatedAt = injected now()
 *     - authHash deterministic for same inputs and timestamp
 *     - resultId truthy
 *     - factory createGatewayAuthContract returns working instance
 *   GatewayAuthLogContract.log:
 *     - empty results → dominantStatus = DENIED (all 0, DENIED threshold -1)
 *     - single AUTHENTICATED result → dominantStatus = AUTHENTICATED
 *     - single REVOKED result → dominantStatus = REVOKED
 *     - single EXPIRED result → dominantStatus = EXPIRED
 *     - frequency-first: AUTHENTICATED×3 > DENIED×1 → AUTHENTICATED wins
 *     - tiebreak: DENIED=1 REVOKED=1 → DENIED wins (higher priority)
 *     - tiebreak: REVOKED=1 EXPIRED=1 → REVOKED wins
 *     - all status counts accurate (authenticated/denied/expired/revoked)
 *     - totalRequests = results.length
 *     - logHash deterministic for same inputs and timestamp
 *     - logId truthy
 *     - createdAt = injected now()
 *     - factory createGatewayAuthLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  GatewayAuthContract,
  createGatewayAuthContract,
} from "../src/gateway.auth.contract";
import type { GatewayAuthRequest, GatewayAuthResult } from "../src/gateway.auth.contract";

import {
  GatewayAuthLogContract,
  createGatewayAuthLogContract,
} from "../src/gateway.auth.log.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T09:00:00.000Z";
const PAST = "2026-01-01T00:00:00.000Z";   // before FIXED_NOW → expired
const FUTURE = "2026-12-31T23:59:59.000Z"; // after FIXED_NOW → not expired
const fixedNow = () => FIXED_NOW;

function makeAuthRequest(overrides: Partial<GatewayAuthRequest> = {}): GatewayAuthRequest {
  return {
    tenantId: "tenant-001",
    credentials: { token: "valid-token-xyz" },
    scope: ["read", "write"],
    ...overrides,
  };
}

function makeAuthResult(overrides: Partial<GatewayAuthResult> = {}): GatewayAuthResult {
  return {
    resultId: "rid-1",
    evaluatedAt: FIXED_NOW,
    tenantId: "tenant-001",
    authenticated: true,
    authStatus: "AUTHENTICATED",
    scopeGranted: ["read"],
    authHash: "hash-1",
    ...overrides,
  };
}

// ─── GatewayAuthContract.evaluate ─────────────────────────────────────────────

describe("GatewayAuthContract.evaluate", () => {
  const contract = new GatewayAuthContract({ now: fixedNow });

  describe("REVOKED", () => {
    it("revoked=true → authStatus=REVOKED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", revoked: true },
      }));
      expect(result.authStatus).toBe("REVOKED");
    });

    it("revoked takes priority over expired token", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", revoked: true, expiresAt: PAST },
      }));
      expect(result.authStatus).toBe("REVOKED");
    });

    it("revoked → authenticated=false", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", revoked: true },
      }));
      expect(result.authenticated).toBe(false);
    });

    it("revoked → scopeGranted=[]", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", revoked: true },
        scope: ["admin"],
      }));
      expect(result.scopeGranted).toEqual([]);
    });
  });

  describe("EXPIRED", () => {
    it("expiresAt <= now → authStatus=EXPIRED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", expiresAt: PAST },
      }));
      expect(result.authStatus).toBe("EXPIRED");
    });

    it("expiresAt === now (exact equality) → EXPIRED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", expiresAt: FIXED_NOW },
      }));
      expect(result.authStatus).toBe("EXPIRED");
    });

    it("expiresAt > now → not expired", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", expiresAt: FUTURE },
      }));
      expect(result.authStatus).toBe("AUTHENTICATED");
    });

    it("expired → authenticated=false, scopeGranted=[]", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "tok", expiresAt: PAST },
      }));
      expect(result.authenticated).toBe(false);
      expect(result.scopeGranted).toEqual([]);
    });
  });

  describe("DENIED", () => {
    it("empty token → authStatus=DENIED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "" },
      }));
      expect(result.authStatus).toBe("DENIED");
    });

    it("whitespace-only token → authStatus=DENIED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "   " },
      }));
      expect(result.authStatus).toBe("DENIED");
    });

    it("denied → authenticated=false, scopeGranted=[]", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "" },
        scope: ["read"],
      }));
      expect(result.authenticated).toBe(false);
      expect(result.scopeGranted).toEqual([]);
    });
  });

  describe("AUTHENTICATED", () => {
    it("valid token, not revoked, not expired → AUTHENTICATED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "valid-tok", expiresAt: FUTURE },
      }));
      expect(result.authStatus).toBe("AUTHENTICATED");
    });

    it("no expiresAt → AUTHENTICATED", () => {
      const result = contract.evaluate(makeAuthRequest({
        credentials: { token: "valid-tok" },
      }));
      expect(result.authStatus).toBe("AUTHENTICATED");
    });

    it("authenticated=true when AUTHENTICATED", () => {
      expect(contract.evaluate(makeAuthRequest()).authenticated).toBe(true);
    });

    it("scopeGranted = request.scope when authenticated", () => {
      const result = contract.evaluate(makeAuthRequest({ scope: ["read", "write", "admin"] }));
      expect(result.scopeGranted).toEqual(["read", "write", "admin"]);
    });
  });

  describe("output fields", () => {
    it("tenantId propagated", () => {
      const result = contract.evaluate(makeAuthRequest({ tenantId: "tenant-xyz" }));
      expect(result.tenantId).toBe("tenant-xyz");
    });

    it("evaluatedAt = injected now()", () => {
      expect(contract.evaluate(makeAuthRequest()).evaluatedAt).toBe(FIXED_NOW);
    });

    it("authHash deterministic for same inputs and timestamp", () => {
      const req = makeAuthRequest({ tenantId: "t-det" });
      const r1 = contract.evaluate(req);
      const r2 = contract.evaluate(req);
      expect(r1.authHash).toBe(r2.authHash);
    });

    it("resultId is truthy", () => {
      expect(contract.evaluate(makeAuthRequest()).resultId.length).toBeGreaterThan(0);
    });
  });

  it("factory createGatewayAuthContract returns working instance", () => {
    const c = createGatewayAuthContract({ now: fixedNow });
    const result = c.evaluate(makeAuthRequest());
    expect(result.evaluatedAt).toBe(FIXED_NOW);
    expect(result.authStatus).toBe("AUTHENTICATED");
  });
});

// ─── GatewayAuthLogContract.log ───────────────────────────────────────────────

describe("GatewayAuthLogContract.log", () => {
  const contract = new GatewayAuthLogContract({ now: fixedNow });

  describe("empty results", () => {
    it("empty → dominantStatus = DENIED (all 0 > threshold -1, DENIED is first)", () => {
      expect(contract.log([]).dominantStatus).toBe("DENIED");
    });

    it("empty → totalRequests = 0", () => {
      expect(contract.log([]).totalRequests).toBe(0);
    });

    it("empty → all status counts = 0", () => {
      const log = contract.log([]);
      expect(log.authenticatedCount).toBe(0);
      expect(log.deniedCount).toBe(0);
      expect(log.expiredCount).toBe(0);
      expect(log.revokedCount).toBe(0);
    });
  });

  describe("dominantStatus — frequency-first", () => {
    it("single AUTHENTICATED → dominantStatus = AUTHENTICATED", () => {
      const log = contract.log([makeAuthResult({ authStatus: "AUTHENTICATED" })]);
      expect(log.dominantStatus).toBe("AUTHENTICATED");
    });

    it("single REVOKED → dominantStatus = REVOKED", () => {
      const log = contract.log([makeAuthResult({ authStatus: "REVOKED" })]);
      expect(log.dominantStatus).toBe("REVOKED");
    });

    it("single EXPIRED → dominantStatus = EXPIRED", () => {
      const log = contract.log([makeAuthResult({ authStatus: "EXPIRED" })]);
      expect(log.dominantStatus).toBe("EXPIRED");
    });

    it("AUTHENTICATED×3 > DENIED×1 → AUTHENTICATED wins", () => {
      const results = [
        makeAuthResult({ authStatus: "AUTHENTICATED" }),
        makeAuthResult({ authStatus: "AUTHENTICATED" }),
        makeAuthResult({ authStatus: "AUTHENTICATED" }),
        makeAuthResult({ authStatus: "DENIED" }),
      ];
      expect(contract.log(results).dominantStatus).toBe("AUTHENTICATED");
    });

    it("DENIED=1 REVOKED=1 tie → DENIED wins (higher priority)", () => {
      const results = [
        makeAuthResult({ authStatus: "DENIED" }),
        makeAuthResult({ authStatus: "REVOKED" }),
      ];
      expect(contract.log(results).dominantStatus).toBe("DENIED");
    });

    it("REVOKED=1 EXPIRED=1 tie → REVOKED wins (higher priority)", () => {
      const results = [
        makeAuthResult({ authStatus: "REVOKED" }),
        makeAuthResult({ authStatus: "EXPIRED" }),
      ];
      expect(contract.log(results).dominantStatus).toBe("REVOKED");
    });
  });

  describe("counts", () => {
    it("all status counts accurate", () => {
      const results = [
        makeAuthResult({ authStatus: "AUTHENTICATED" }),
        makeAuthResult({ authStatus: "AUTHENTICATED" }),
        makeAuthResult({ authStatus: "DENIED" }),
        makeAuthResult({ authStatus: "EXPIRED" }),
        makeAuthResult({ authStatus: "REVOKED" }),
        makeAuthResult({ authStatus: "REVOKED" }),
      ];
      const log = contract.log(results);
      expect(log.authenticatedCount).toBe(2);
      expect(log.deniedCount).toBe(1);
      expect(log.expiredCount).toBe(1);
      expect(log.revokedCount).toBe(2);
      expect(log.totalRequests).toBe(6);
    });
  });

  describe("output fields", () => {
    it("createdAt = injected now()", () => {
      expect(contract.log([]).createdAt).toBe(FIXED_NOW);
    });

    it("logHash deterministic for same inputs and timestamp", () => {
      const results = [makeAuthResult({ authStatus: "DENIED" })];
      const l1 = contract.log(results);
      const l2 = contract.log(results);
      expect(l1.logHash).toBe(l2.logHash);
    });

    it("logId is truthy", () => {
      expect(contract.log([]).logId.length).toBeGreaterThan(0);
    });
  });

  it("factory createGatewayAuthLogContract returns working instance", () => {
    const c = createGatewayAuthLogContract({ now: fixedNow });
    const log = c.log([makeAuthResult({ authStatus: "EXPIRED" })]);
    expect(log.dominantStatus).toBe("EXPIRED");
    expect(log.createdAt).toBe(FIXED_NOW);
  });
});
