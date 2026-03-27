import { describe, it, expect } from "vitest";
import {
  GatewayAuthLogConsumerPipelineContract,
  createGatewayAuthLogConsumerPipelineContract,
} from "../src/gateway.auth.log.consumer.pipeline.contract";
import type { GatewayAuthResult } from "../src/gateway.auth.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test auth result
function makeAuthResult(overrides: Partial<GatewayAuthResult> = {}): GatewayAuthResult {
  return {
    authId: overrides.authId ?? "auth-1",
    requestedAt: overrides.requestedAt ?? FIXED_NOW,
    authStatus: overrides.authStatus ?? "AUTHENTICATED",
    userId: overrides.userId ?? "user-1",
    sessionId: overrides.sessionId ?? "session-1",
    authHash: overrides.authHash ?? "hash-1",
  };
}

const authenticatedResult = makeAuthResult({ authId: "auth-authenticated", authStatus: "AUTHENTICATED" });
const deniedResult = makeAuthResult({ authId: "auth-denied", authStatus: "DENIED" });
const expiredResult = makeAuthResult({ authId: "auth-expired", authStatus: "EXPIRED" });
const revokedResult = makeAuthResult({ authId: "auth-revoked", authStatus: "REVOKED" });

describe("GatewayAuthLogConsumerPipelineContract", () => {
  const contract = new GatewayAuthLogConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GatewayAuthLogConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGatewayAuthLogConsumerPipelineContract();
      expect(c.execute({ results: [authenticatedResult] })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ results: [authenticatedResult] });

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

    it("has dominantStatus", () => {
      expect(result.dominantStatus).toBeDefined();
      expect(["AUTHENTICATED", "DENIED", "EXPIRED", "REVOKED"]).toContain(result.dominantStatus);
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
      const result = contract.execute({ results: [authenticatedResult], consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ results: [authenticatedResult] });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ results: [authenticatedResult] });
      const r2 = contract.execute({ results: [authenticatedResult] });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ results: [authenticatedResult] });
      const r2 = contract.execute({ results: [authenticatedResult] });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different results", () => {
      const r1 = contract.execute({ results: [authenticatedResult] });
      const r2 = contract.execute({ results: [deniedResult] });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new GatewayAuthLogConsumerPipelineContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new GatewayAuthLogConsumerPipelineContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.execute({ results: [authenticatedResult] }).pipelineHash).not.toBe(
        c2.execute({ results: [authenticatedResult] }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains totalRequests", () => {
      const result = contract.execute({ results: [authenticatedResult, deniedResult] });
      expect(result.consumerPackage.query).toContain("2 requests");
    });

    it("query contains dominantStatus", () => {
      const result = contract.execute({ results: [authenticatedResult] });
      expect(result.consumerPackage.query).toContain("status=AUTHENTICATED");
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ results: [authenticatedResult] });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different status", () => {
      const r1 = contract.execute({ results: [authenticatedResult] });
      const r2 = contract.execute({ results: [deniedResult] });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals log.logId", () => {
      const result = contract.execute({ results: [authenticatedResult] });
      expect(result.consumerPackage.contextId).toBe(result.log.logId);
    });

    it("contextId differs for different results", () => {
      const r1 = contract.execute({ results: [authenticatedResult] });
      const r2 = contract.execute({ results: [deniedResult] });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for non-empty results with low denial rate", () => {
      expect(contract.execute({ results: [authenticatedResult, authenticatedResult, deniedResult] }).warnings).toHaveLength(0);
    });

    it("WARNING_NO_REQUESTS for empty results array", () => {
      const result = contract.execute({ results: [] });
      expect(result.warnings).toContain(
        "[gateway-auth-log] no requests — log contains zero auth requests",
      );
    });

    it("WARNING_HIGH_DENIAL_RATE when denials exceed 30%", () => {
      const result = contract.execute({ results: [authenticatedResult, deniedResult, deniedResult] });
      expect(result.warnings).toContain(
        "[gateway-auth-log] high denial rate — denied requests exceed 30% of total",
      );
    });

    it("no high denial warning at exactly 30%", () => {
      const results = [
        authenticatedResult,
        authenticatedResult,
        authenticatedResult,
        authenticatedResult,
        authenticatedResult,
        authenticatedResult,
        authenticatedResult,
        deniedResult,
        deniedResult,
        deniedResult,
      ];
      const result = contract.execute({ results });
      expect(result.warnings).not.toContain(
        "[gateway-auth-log] high denial rate — denied requests exceed 30% of total",
      );
    });
  });

  describe("dominantStatus propagation", () => {
    it("dominantStatus is AUTHENTICATED for all authenticated results", () => {
      const result = contract.execute({ results: [authenticatedResult, authenticatedResult] });
      expect(result.dominantStatus).toBe("AUTHENTICATED");
    });

    it("dominantStatus is DENIED when denied results are most frequent", () => {
      const result = contract.execute({ results: [authenticatedResult, deniedResult, deniedResult] });
      expect(result.dominantStatus).toBe("DENIED");
    });

    it("dominantStatus is EXPIRED when expired results are most frequent", () => {
      const result = contract.execute({ results: [authenticatedResult, expiredResult, expiredResult] });
      expect(result.dominantStatus).toBe("EXPIRED");
    });

    it("dominantStatus is REVOKED when revoked results are most frequent", () => {
      const result = contract.execute({ results: [authenticatedResult, revokedResult, revokedResult] });
      expect(result.dominantStatus).toBe("REVOKED");
    });

    it("dominantStatus matches log.dominantStatus", () => {
      const result = contract.execute({ results: [deniedResult] });
      expect(result.dominantStatus).toBe(result.log.dominantStatus);
    });
  });

  describe("log propagation", () => {
    it("log.totalRequests matches results length", () => {
      const result = contract.execute({ results: [authenticatedResult, deniedResult, expiredResult] });
      expect(result.log.totalRequests).toBe(3);
    });

    it("log.authenticatedCount is correct", () => {
      const result = contract.execute({ results: [authenticatedResult, authenticatedResult, deniedResult] });
      expect(result.log.authenticatedCount).toBe(2);
    });

    it("log.deniedCount is correct", () => {
      const result = contract.execute({ results: [authenticatedResult, deniedResult, deniedResult] });
      expect(result.log.deniedCount).toBe(2);
    });

    it("log.expiredCount is correct", () => {
      const result = contract.execute({ results: [expiredResult, expiredResult] });
      expect(result.log.expiredCount).toBe(2);
    });

    it("log.revokedCount is correct", () => {
      const result = contract.execute({ results: [revokedResult] });
      expect(result.log.revokedCount).toBe(1);
    });
  });
});


// ─── Batch Contract Tests ─────────────────────────────────────────────────────

import {
  GatewayAuthLogConsumerPipelineBatchContract,
  createGatewayAuthLogConsumerPipelineBatchContract,
} from "../src/gateway.auth.log.consumer.pipeline.batch.contract";

const NOW_2 = "2026-03-27T12:00:00.000Z";
const batchContract = new GatewayAuthLogConsumerPipelineBatchContract({ now: () => NOW_2 });

// Helper: create test result
function makeResult(results: GatewayAuthResult[]): any {
  return contract.execute({ results });
}

const authenticatedOnlyResult = makeResult([authenticatedResult]);
const deniedOnlyResult = makeResult([deniedResult]);
const expiredOnlyResult = makeResult([expiredResult]);
const revokedOnlyResult = makeResult([revokedResult]);

describe("GatewayAuthLogConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GatewayAuthLogConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGatewayAuthLogConsumerPipelineBatchContract();
      expect(c.batch([authenticatedOnlyResult])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([authenticatedOnlyResult, deniedOnlyResult]);

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

    it("has totalRequests", () => {
      expect(batch.totalRequests).toBeGreaterThanOrEqual(0);
    });

    it("has overallDominantStatus", () => {
      expect(batch.overallDominantStatus).toBeDefined();
      expect(["AUTHENTICATED", "DENIED", "EXPIRED", "REVOKED"]).toContain(batch.overallDominantStatus);
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
      const b1 = batchContract.batch([authenticatedOnlyResult]);
      const b2 = batchContract.batch([authenticatedOnlyResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([authenticatedOnlyResult]);
      const b2 = batchContract.batch([deniedOnlyResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new GatewayAuthLogConsumerPipelineBatchContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new GatewayAuthLogConsumerPipelineBatchContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.batch([authenticatedOnlyResult]).batchHash).not.toBe(c2.batch([authenticatedOnlyResult]).batchHash);
    });
  });

  describe("totalLogs", () => {
    it("equals results length", () => {
      expect(batchContract.batch([authenticatedOnlyResult, deniedOnlyResult, expiredOnlyResult]).totalLogs).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalLogs).toBe(0);
    });
  });

  describe("totalRequests", () => {
    it("sums totalRequests across all logs", () => {
      const r1 = makeResult([authenticatedResult, authenticatedResult]);
      const r2 = makeResult([deniedResult]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalRequests).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalRequests).toBe(0);
    });
  });

  describe("overallDominantStatus", () => {
    it("is AUTHENTICATED for all authenticated results", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, authenticatedOnlyResult]);
      expect(batch.overallDominantStatus).toBe("AUTHENTICATED");
    });

    it("is DENIED when denied results are most frequent", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, deniedOnlyResult, deniedOnlyResult]);
      expect(batch.overallDominantStatus).toBe("DENIED");
    });

    it("is EXPIRED when expired results are most frequent", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, expiredOnlyResult, expiredOnlyResult]);
      expect(batch.overallDominantStatus).toBe("EXPIRED");
    });

    it("is REVOKED when revoked results are most frequent", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, revokedOnlyResult, revokedOnlyResult]);
      expect(batch.overallDominantStatus).toBe("REVOKED");
    });

    it("prioritizes DENIED in frequency ties", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, deniedOnlyResult]);
      expect(batch.overallDominantStatus).toBe("DENIED");
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const batch = batchContract.batch([authenticatedOnlyResult, deniedOnlyResult]);
      const expected = Math.max(
        authenticatedOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
        deniedOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batch.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const batch = batchContract.batch([authenticatedOnlyResult]);
      expect(batch.dominantTokenBudget).toBe(authenticatedOnlyResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalLogs equals results length", () => {
      expect(batchContract.batch([authenticatedOnlyResult, deniedOnlyResult, expiredOnlyResult]).totalLogs).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([authenticatedOnlyResult]).createdAt).toBe(NOW_2);
    });
  });
});
