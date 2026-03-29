import { describe, it, expect } from "vitest";
import {
  GatewayPIIDetectionLogConsumerPipelineContract,
  createGatewayPIIDetectionLogConsumerPipelineContract,
} from "../src/gateway.pii.detection.log.consumer.pipeline.contract";
import type { GatewayPIIDetectionResult } from "../src/gateway.pii.detection.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test PII detection result
function makePIIResult(overrides: Partial<GatewayPIIDetectionResult> = {}): GatewayPIIDetectionResult {
  return {
    resultId: overrides.resultId ?? "detection-result-1",
    detectedAt: overrides.detectedAt ?? FIXED_NOW,
    tenantId: overrides.tenantId ?? "tenant-1",
    piiDetected: overrides.piiDetected ?? false,
    piiTypes: overrides.piiTypes ?? [],
    matches: overrides.matches ?? [],
    redactedSignal: overrides.redactedSignal ?? "clean signal",
    detectionHash: overrides.detectionHash ?? "hash-1",
  };
}

const cleanResult = makePIIResult({ resultId: "clean-1", piiDetected: false, piiTypes: [], matches: [] });
const ssnResult = makePIIResult({
  resultId: "ssn-1",
  piiDetected: true,
  piiTypes: ["SSN"],
  matches: [{ piiType: "SSN", matchCount: 1 }],
  redactedSignal: "[PII_SSN]",
});
const emailResult = makePIIResult({
  resultId: "email-1",
  piiDetected: true,
  piiTypes: ["EMAIL"],
  matches: [{ piiType: "EMAIL", matchCount: 2 }],
  redactedSignal: "[PII_EMAIL] [PII_EMAIL]",
});
const phoneResult = makePIIResult({
  resultId: "phone-1",
  piiDetected: true,
  piiTypes: ["PHONE"],
  matches: [{ piiType: "PHONE", matchCount: 1 }],
  redactedSignal: "[PII_PHONE]",
});
const creditCardResult = makePIIResult({
  resultId: "cc-1",
  piiDetected: true,
  piiTypes: ["CREDIT_CARD"],
  matches: [{ piiType: "CREDIT_CARD", matchCount: 1 }],
  redactedSignal: "[PII_CC]",
});

describe("GatewayPIIDetectionLogConsumerPipelineContract", () => {
  const contract = new GatewayPIIDetectionLogConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GatewayPIIDetectionLogConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGatewayPIIDetectionLogConsumerPipelineContract();
      expect(c.execute({ results: [cleanResult] })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ results: [ssnResult] });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has log", () => {
      expect(result.log).toBeDefined();
      expect(result.log.totalScanned).toBeGreaterThanOrEqual(0);
    });

    it("has dominantPIIType", () => {
      expect(result.dominantPIIType).toBeDefined();
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
      const result = contract.execute({ results: [cleanResult], consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ results: [cleanResult] });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ results: [ssnResult] });
      const r2 = contract.execute({ results: [ssnResult] });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ results: [ssnResult] });
      const r2 = contract.execute({ results: [ssnResult] });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different results", () => {
      const r1 = contract.execute({ results: [ssnResult] });
      const r2 = contract.execute({ results: [emailResult] });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("pipelineHash differs across timestamps", () => {
      const c1 = new GatewayPIIDetectionLogConsumerPipelineContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new GatewayPIIDetectionLogConsumerPipelineContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.execute({ results: [ssnResult] }).pipelineHash).not.toBe(
        c2.execute({ results: [ssnResult] }).pipelineHash,
      );
    });
  });

  describe("query derivation", () => {
    it("query contains totalScanned", () => {
      const result = contract.execute({ results: [ssnResult, emailResult] });
      expect(result.consumerPackage.query).toContain("2 scanned");
    });

    it("query contains piiDetectedCount", () => {
      const result = contract.execute({ results: [ssnResult, cleanResult] });
      expect(result.consumerPackage.query).toContain("detected=1");
    });

    it("query contains dominantPIIType", () => {
      const result = contract.execute({ results: [ssnResult] });
      expect(result.consumerPackage.query).toContain("type=SSN");
    });

    it("query shows 'none' when no PII detected", () => {
      const result = contract.execute({ results: [cleanResult] });
      expect(result.consumerPackage.query).toContain("type=none");
    });

    it("query is capped at 120 characters", () => {
      const result = contract.execute({ results: [ssnResult] });
      expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("query changes with different PII type", () => {
      const r1 = contract.execute({ results: [ssnResult] });
      const r2 = contract.execute({ results: [emailResult] });
      expect(r1.consumerPackage.query).not.toBe(r2.consumerPackage.query);
    });
  });

  describe("contextId", () => {
    it("contextId equals log.logId", () => {
      const result = contract.execute({ results: [ssnResult] });
      expect(result.consumerPackage.contextId).toBe(result.log.logId);
    });

    it("contextId differs for different results", () => {
      const r1 = contract.execute({ results: [ssnResult] });
      const r2 = contract.execute({ results: [emailResult] });
      expect(r1.consumerPackage.contextId).not.toBe(r2.consumerPackage.contextId);
    });
  });

  describe("warning messages", () => {
    it("no warning for non-empty results with low PII rate", () => {
      expect(contract.execute({ results: [cleanResult, cleanResult, ssnResult] }).warnings).toHaveLength(0);
    });

    it("WARNING_NO_SCANS for empty results array", () => {
      const result = contract.execute({ results: [] });
      expect(result.warnings).toContain(
        "[gateway-pii-detection-log] no scans — log contains zero PII detection scans",
      );
    });

    it("WARNING_HIGH_PII_RATE when PII detections exceed 50%", () => {
      const result = contract.execute({ results: [cleanResult, ssnResult, emailResult] });
      expect(result.warnings).toContain(
        "[gateway-pii-detection-log] high PII rate — detected PII exceeds 50% of scans",
      );
    });

    it("no high PII warning at exactly 50%", () => {
      const results = [cleanResult, cleanResult, ssnResult, emailResult];
      const result = contract.execute({ results });
      expect(result.warnings).not.toContain(
        "[gateway-pii-detection-log] high PII rate — detected PII exceeds 50% of scans",
      );
    });
  });

  describe("dominantPIIType propagation", () => {
    it("dominantPIIType is SSN for SSN result", () => {
      const result = contract.execute({ results: [ssnResult] });
      expect(result.dominantPIIType).toBe("SSN");
    });

    it("dominantPIIType is EMAIL for EMAIL result", () => {
      const result = contract.execute({ results: [emailResult] });
      expect(result.dominantPIIType).toBe("EMAIL");
    });

    it("dominantPIIType is PHONE for PHONE result", () => {
      const result = contract.execute({ results: [phoneResult] });
      expect(result.dominantPIIType).toBe("PHONE");
    });

    it("dominantPIIType is CREDIT_CARD for credit card result", () => {
      const result = contract.execute({ results: [creditCardResult] });
      expect(result.dominantPIIType).toBe("CREDIT_CARD");
    });

    it("dominantPIIType is null for clean results", () => {
      const result = contract.execute({ results: [cleanResult] });
      expect(result.dominantPIIType).toBeNull();
    });

    it("dominantPIIType matches log.dominantPIIType", () => {
      const result = contract.execute({ results: [ssnResult] });
      expect(result.dominantPIIType).toBe(result.log.dominantPIIType);
    });
  });

  describe("log propagation", () => {
    it("log.totalScanned matches results length", () => {
      const result = contract.execute({ results: [ssnResult, emailResult, cleanResult] });
      expect(result.log.totalScanned).toBe(3);
    });

    it("log.piiDetectedCount is correct", () => {
      const result = contract.execute({ results: [ssnResult, emailResult, cleanResult] });
      expect(result.log.piiDetectedCount).toBe(2);
    });

    it("log.cleanCount is correct", () => {
      const result = contract.execute({ results: [ssnResult, cleanResult, cleanResult] });
      expect(result.log.cleanCount).toBe(2);
    });
  });
});


// ─── Batch Contract Tests ─────────────────────────────────────────────────────

import {
  GatewayPIIDetectionLogConsumerPipelineBatchContract,
  createGatewayPIIDetectionLogConsumerPipelineBatchContract,
} from "../src/gateway.pii.detection.log.consumer.pipeline.batch.contract";

const NOW_2 = "2026-03-27T12:00:00.000Z";
const batchContract = new GatewayPIIDetectionLogConsumerPipelineBatchContract({ now: () => NOW_2 });

// Helper: create test result (using contract from above)
const pipelineContract = new GatewayPIIDetectionLogConsumerPipelineContract({ now: () => FIXED_NOW });
function makeResult(results: GatewayPIIDetectionResult[]): any {
  return pipelineContract.execute({ results });
}

const cleanOnlyResult = makeResult([cleanResult]);
const ssnOnlyResult = makeResult([ssnResult]);
const emailOnlyResult = makeResult([emailResult]);
const phoneOnlyResult = makeResult([phoneResult]);
const creditCardOnlyResult = makeResult([creditCardResult]);

describe("GatewayPIIDetectionLogConsumerPipelineBatchContract", () => {
  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GatewayPIIDetectionLogConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGatewayPIIDetectionLogConsumerPipelineBatchContract();
      expect(c.batch([ssnOnlyResult])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([ssnOnlyResult, emailOnlyResult]);

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

    it("has totalScanned", () => {
      expect(batch.totalScanned).toBeGreaterThanOrEqual(0);
    });

    it("has overallDominantPIIType", () => {
      expect(batch.overallDominantPIIType).toBeDefined();
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
      const b1 = batchContract.batch([ssnOnlyResult]);
      const b2 = batchContract.batch([ssnOnlyResult]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("batchHash differs for different result sets", () => {
      const b1 = batchContract.batch([ssnOnlyResult]);
      const b2 = batchContract.batch([emailOnlyResult]);
      expect(b1.batchHash).not.toBe(b2.batchHash);
    });

    it("batchHash differs across timestamps", () => {
      const c1 = new GatewayPIIDetectionLogConsumerPipelineBatchContract({ now: () => "2026-03-27T10:00:00.000Z" });
      const c2 = new GatewayPIIDetectionLogConsumerPipelineBatchContract({ now: () => "2026-03-27T11:00:00.000Z" });
      expect(c1.batch([ssnOnlyResult]).batchHash).not.toBe(c2.batch([ssnOnlyResult]).batchHash);
    });
  });

  describe("totalLogs", () => {
    it("equals results length", () => {
      expect(batchContract.batch([ssnOnlyResult, emailOnlyResult, phoneOnlyResult]).totalLogs).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalLogs).toBe(0);
    });
  });

  describe("totalScanned", () => {
    it("sums totalScanned across all logs", () => {
      const r1 = makeResult([ssnResult, emailResult]);
      const r2 = makeResult([phoneResult]);
      const batch = batchContract.batch([r1, r2]);
      expect(batch.totalScanned).toBe(3);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).totalScanned).toBe(0);
    });
  });

  describe("overallDominantPIIType", () => {
    it("is SSN for all SSN results", () => {
      const batch = batchContract.batch([ssnOnlyResult, ssnOnlyResult]);
      expect(batch.overallDominantPIIType).toBe("SSN");
    });

    it("is EMAIL when EMAIL results are most frequent", () => {
      const batch = batchContract.batch([ssnOnlyResult, emailOnlyResult, emailOnlyResult]);
      expect(batch.overallDominantPIIType).toBe("EMAIL");
    });

    it("is PHONE when PHONE results are most frequent", () => {
      const batch = batchContract.batch([ssnOnlyResult, phoneOnlyResult, phoneOnlyResult]);
      expect(batch.overallDominantPIIType).toBe("PHONE");
    });

    it("is CREDIT_CARD when credit card results are most frequent", () => {
      const batch = batchContract.batch([ssnOnlyResult, creditCardOnlyResult, creditCardOnlyResult]);
      expect(batch.overallDominantPIIType).toBe("CREDIT_CARD");
    });

    it("prioritizes SSN in frequency ties (severity-based)", () => {
      const batch = batchContract.batch([ssnOnlyResult, emailOnlyResult]);
      expect(batch.overallDominantPIIType).toBe("SSN");
    });

    it("is null for all clean results", () => {
      const batch = batchContract.batch([cleanOnlyResult, cleanOnlyResult]);
      expect(batch.overallDominantPIIType).toBeNull();
    });

    it("is null for empty batch", () => {
      expect(batchContract.batch([]).overallDominantPIIType).toBeNull();
    });
  });

  describe("dominantTokenBudget", () => {
    it("is max of estimatedTokens across results", () => {
      const batch = batchContract.batch([ssnOnlyResult, emailOnlyResult]);
      const expected = Math.max(
        ssnOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
        emailOnlyResult.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batch.dominantTokenBudget).toBe(expected);
    });

    it("equals single result estimatedTokens for one-element batch", () => {
      const batch = batchContract.batch([ssnOnlyResult]);
      expect(batch.dominantTokenBudget).toBe(ssnOnlyResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("is 0 for empty batch", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });
  });

  describe("general fields", () => {
    it("totalLogs equals results length", () => {
      expect(batchContract.batch([ssnOnlyResult, emailOnlyResult, phoneOnlyResult]).totalLogs).toBe(3);
    });

    it("createdAt equals now()", () => {
      expect(batchContract.batch([ssnOnlyResult]).createdAt).toBe(NOW_2);
    });
  });
});
