import { describe, it, expect } from "vitest";
import {
  GatewayAuthConsumerPipelineContract,
  createGatewayAuthConsumerPipelineContract,
} from "../src/gateway.auth.consumer.pipeline.contract";
import type {
  GatewayAuthConsumerPipelineRequest,
} from "../src/gateway.auth.consumer.pipeline.contract";
import type { GatewayAuthRequest } from "../src/gateway.auth.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T10:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeAuthRequest(opts: {
  token?: string;
  expiresAt?: string;
  revoked?: boolean;
  tenantId?: string;
  scope?: string[];
} = {}): GatewayAuthRequest {
  return {
    tenantId: opts.tenantId ?? "tenant-abc",
    credentials: {
      token: opts.token ?? "valid-token-xyz",
      expiresAt: opts.expiresAt,
      revoked: opts.revoked,
    },
    scope: opts.scope ?? ["read", "write"],
  };
}

function makeRequest(
  opts: {
    authRequest?: GatewayAuthRequest;
    consumerId?: string;
  } = {},
): GatewayAuthConsumerPipelineRequest {
  return {
    authRequest: opts.authRequest ?? makeAuthRequest(),
    consumerId: opts.consumerId,
  };
}

function makeContract(): GatewayAuthConsumerPipelineContract {
  return createGatewayAuthConsumerPipelineContract({ now: fixedNow });
}

const BASE_REQUEST = makeRequest();
const DENIED_REQUEST = makeRequest({ authRequest: makeAuthRequest({ token: "" }) });
const EXPIRED_REQUEST = makeRequest({
  authRequest: makeAuthRequest({ expiresAt: "2020-01-01T00:00:00.000Z" }),
});
const REVOKED_REQUEST = makeRequest({
  authRequest: makeAuthRequest({ revoked: true }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GatewayAuthConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGatewayAuthConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GatewayAuthConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("authResult");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("AUTHENTICATED — no warnings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.authResult.authStatus).toBe("AUTHENTICATED");
    expect(result.warnings).toHaveLength(0);
  });

  it("DENIED — warning contains [gateway-auth] prefix", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.authResult.authStatus).toBe("DENIED");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[gateway-auth]");
  });

  it("DENIED — warning references 'access denied'", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.warnings[0]).toContain("access denied");
  });

  it("DENIED — warning references 'tenant authentication failed'", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.warnings[0]).toContain("tenant authentication failed");
  });

  it("EXPIRED — warning references 'credential expired'", () => {
    const result = makeContract().execute(EXPIRED_REQUEST);
    expect(result.authResult.authStatus).toBe("EXPIRED");
    expect(result.warnings[0]).toContain("credential expired");
  });

  it("EXPIRED — warning references 'tenant session requires renewal'", () => {
    const result = makeContract().execute(EXPIRED_REQUEST);
    expect(result.warnings[0]).toContain("tenant session requires renewal");
  });

  it("REVOKED — warning references 'credential revoked'", () => {
    const result = makeContract().execute(REVOKED_REQUEST);
    expect(result.authResult.authStatus).toBe("REVOKED");
    expect(result.warnings[0]).toContain("credential revoked");
  });

  it("REVOKED — warning references 'tenant access has been revoked'", () => {
    const result = makeContract().execute(REVOKED_REQUEST);
    expect(result.warnings[0]).toContain("tenant access has been revoked");
  });

  it("query contains 'gateway-auth' prefix", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("gateway-auth");
  });

  it("query contains authStatus", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("AUTHENTICATED");
  });

  it("query contains tenantId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("tenant-abc");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute(
      makeRequest({ authRequest: makeAuthRequest({ tenantId: "t".repeat(200) }) }),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches authResult.resultId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.contextId).toBe(result.authResult.resultId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(BASE_REQUEST);
    const r2 = contract.execute(BASE_REQUEST);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different tenantId produces different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest({ authRequest: makeAuthRequest({ tenantId: "tenant-A" }) }));
    const r2 = contract.execute(makeRequest({ authRequest: makeAuthRequest({ tenantId: "tenant-B" }) }));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest({ consumerId: "consumer-001" }));
    expect(result.consumerId).toBe("consumer-001");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerId).toBeUndefined();
  });

  it("authResult.authenticated is true for valid token", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.authResult.authenticated).toBe(true);
  });

  it("authResult.authenticated is false for DENIED", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.authResult.authenticated).toBe(false);
  });

  it("authResult.scopeGranted is populated for AUTHENTICATED", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.authResult.scopeGranted).toEqual(["read", "write"]);
  });

  it("authResult.scopeGranted is empty for DENIED", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.authResult.scopeGranted).toHaveLength(0);
  });

  it("DENIED — pipelineHash and resultId still truthy", () => {
    const result = makeContract().execute(DENIED_REQUEST);
    expect(result.pipelineHash).toBeTruthy();
    expect(result.resultId).toBeTruthy();
  });
});
