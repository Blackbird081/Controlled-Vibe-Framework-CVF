import { describe, it, expect } from "vitest";
import {
  GatewayAuthConsumerPipelineBatchContract,
  createGatewayAuthConsumerPipelineBatchContract,
} from "../src/gateway.auth.consumer.pipeline.batch.contract";
import { createGatewayAuthConsumerPipelineContract } from "../src/gateway.auth.consumer.pipeline.contract";
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
} = {}): GatewayAuthRequest {
  return {
    tenantId: opts.tenantId ?? "tenant-batch",
    credentials: {
      token: opts.token ?? "valid-token",
      expiresAt: opts.expiresAt,
      revoked: opts.revoked,
    },
    scope: ["read"],
  };
}

function makeResult(opts: {
  token?: string;
  expiresAt?: string;
  revoked?: boolean;
  tenantId?: string;
} = {}) {
  const pipeline = createGatewayAuthConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ authRequest: makeAuthRequest(opts) });
}

function makeAuthenticatedResult(tenantId = "tenant-ok") {
  return makeResult({ tenantId });
}

function makeDeniedResult(tenantId = "tenant-denied") {
  return makeResult({ token: "", tenantId });
}

function makeExpiredResult(tenantId = "tenant-expired") {
  return makeResult({ expiresAt: "2020-01-01T00:00:00.000Z", tenantId });
}

function makeRevokedResult(tenantId = "tenant-revoked") {
  return makeResult({ revoked: true, tenantId });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GatewayAuthConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GatewayAuthConsumerPipelineBatchContract);
  });

  it("empty batch — totalResults is 0, dominantTokenBudget is 0", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult()]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("empty batch — nonAuthenticatedCount is 0", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.nonAuthenticatedCount).toBe(0);
  });

  it("nonAuthenticatedCount counts DENIED results", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult(), makeDeniedResult()]);
    expect(batch.nonAuthenticatedCount).toBe(1);
  });

  it("nonAuthenticatedCount counts EXPIRED results", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult(), makeExpiredResult()]);
    expect(batch.nonAuthenticatedCount).toBe(1);
  });

  it("nonAuthenticatedCount counts REVOKED results", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult(), makeRevokedResult()]);
    expect(batch.nonAuthenticatedCount).toBe(1);
  });

  it("nonAuthenticatedCount is 0 when all AUTHENTICATED", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeAuthenticatedResult("t1"),
      makeAuthenticatedResult("t2"),
    ]);
    expect(batch.nonAuthenticatedCount).toBe(0);
  });

  it("nonAuthenticatedCount equals totalResults when all non-authenticated", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeDeniedResult(), makeRevokedResult()]);
    expect(batch.nonAuthenticatedCount).toBe(2);
    expect(batch.nonAuthenticatedCount).toBe(batch.totalResults);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeAuthenticatedResult("t1");
    const r2 = makeDeniedResult("t2");
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("createdAt matches injected now", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult()]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeAuthenticatedResult("t1"),
      makeDeniedResult("t2"),
      makeExpiredResult("t3"),
    ]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGatewayAuthConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeAuthenticatedResult("t1"), makeRevokedResult("t2")]);
    expect(batch.results).toHaveLength(2);
  });
});
