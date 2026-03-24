import { describe, it, expect } from "vitest";
import {
  GatewayPIIDetectionConsumerPipelineBatchContract,
  createGatewayPIIDetectionConsumerPipelineBatchContract,
} from "../src/gateway.pii.detection.consumer.pipeline.batch.contract";
import { createGatewayPIIDetectionConsumerPipelineContract } from "../src/gateway.pii.detection.consumer.pipeline.contract";
import type { GatewayPIIDetectionRequest } from "../src/gateway.pii.detection.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeDetectionRequest(opts: {
  signal?: string;
  tenantId?: string;
} = {}): GatewayPIIDetectionRequest {
  return {
    signal: opts.signal ?? "no personal data here",
    tenantId: opts.tenantId ?? "tenant-abc",
  };
}

function makeResult(opts: { signal?: string; tenantId?: string } = {}) {
  const pipeline = createGatewayPIIDetectionConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({ detectionRequest: makeDetectionRequest(opts) });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GatewayPIIDetectionConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(GatewayPIIDetectionConsumerPipelineBatchContract);
  });

  it("empty batch — dominantTokenBudget is 0, totalResults is 0", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("empty batch — detectedCount and cleanCount are 0", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.detectedCount).toBe(0);
    expect(batch.cleanCount).toBe(0);
  });

  it("detectedCount counts results where piiDetected is true", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const piiResult = makeResult({ signal: "email: user@example.com" });
    const cleanResult = makeResult({ signal: "clean text" });
    const batch = contract.batch([piiResult, cleanResult]);
    expect(batch.detectedCount).toBe(1);
  });

  it("cleanCount counts results where piiDetected is false", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const piiResult = makeResult({ signal: "email: user@example.com" });
    const clean1 = makeResult({ signal: "safe text one" });
    const clean2 = makeResult({ signal: "safe text two", tenantId: "t2" });
    const batch = contract.batch([piiResult, clean1, clean2]);
    expect(batch.cleanCount).toBe(2);
  });

  it("detectedCount + cleanCount equals totalResults", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ signal: "email: a@b.com" });
    const r2 = makeResult({ signal: "no pii" });
    const r3 = makeResult({ signal: "another@email.org" });
    const batch = contract.batch([r1, r2, r3]);
    expect(batch.detectedCount + batch.cleanCount).toBe(batch.totalResults);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ tenantId: "t1" });
    const r2 = makeResult({ tenantId: "t2" });
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("createdAt matches injected now", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult({ tenantId: "t1" }),
      makeResult({ tenantId: "t2" }),
      makeResult({ tenantId: "t3" }),
    ]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineBatchContract({ now: fixedNow });
    const input = [makeResult({ tenantId: "t1" }), makeResult({ tenantId: "t2" })];
    const batch = contract.batch(input);
    expect(batch.results).toHaveLength(2);
  });
});
