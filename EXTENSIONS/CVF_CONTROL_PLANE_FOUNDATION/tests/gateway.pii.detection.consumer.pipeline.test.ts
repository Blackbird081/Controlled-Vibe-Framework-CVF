import { describe, it, expect } from "vitest";
import {
  GatewayPIIDetectionConsumerPipelineContract,
  createGatewayPIIDetectionConsumerPipelineContract,
} from "../src/gateway.pii.detection.consumer.pipeline.contract";
import type {
  GatewayPIIDetectionConsumerPipelineRequest,
} from "../src/gateway.pii.detection.consumer.pipeline.contract";
import type { GatewayPIIDetectionRequest } from "../src/gateway.pii.detection.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeDetectionRequest(opts: {
  signal?: string;
  tenantId?: string;
  withCustom?: boolean;
} = {}): GatewayPIIDetectionRequest {
  const {
    signal = "no personal data here",
    tenantId = "tenant-abc",
    withCustom = false,
  } = opts;
  if (withCustom) {
    return {
      signal,
      tenantId,
      config: {
        enabledTypes: ["CUSTOM"],
        customPatterns: [{ pattern: "ACCT-\\d+", label: "[PII_ACCT]" }],
      },
    };
  }
  return { signal, tenantId };
}

function makeContract(): GatewayPIIDetectionConsumerPipelineContract {
  return createGatewayPIIDetectionConsumerPipelineContract({ now: fixedNow });
}

const CLEAN_REQUEST: GatewayPIIDetectionConsumerPipelineRequest = {
  detectionRequest: makeDetectionRequest(),
};

const PII_REQUEST: GatewayPIIDetectionConsumerPipelineRequest = {
  detectionRequest: makeDetectionRequest({ signal: "email: user@example.com" }),
};

const CUSTOM_REQUEST: GatewayPIIDetectionConsumerPipelineRequest = {
  detectionRequest: makeDetectionRequest({
    signal: "account ACCT-12345 flagged",
    withCustom: true,
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GatewayPIIDetectionConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createGatewayPIIDetectionConsumerPipelineContract();
    expect(contract).toBeInstanceOf(GatewayPIIDetectionConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("detectionResult");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("clean signal — no PII — no warnings", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.detectionResult.piiDetected).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("PII detected — warnings contain [pii] prefix", () => {
    const result = makeContract().execute(PII_REQUEST);
    expect(result.detectionResult.piiDetected).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[pii]");
  });

  it("PII detected — warning references 'redact before consumer use'", () => {
    const result = makeContract().execute(PII_REQUEST);
    expect(result.warnings[0]).toContain("redact before consumer use");
  });

  it("custom pattern match — warning references 'custom pattern match detected'", () => {
    const result = makeContract().execute(CUSTOM_REQUEST);
    const hasCustomWarning = result.warnings.some((w) =>
      w.includes("custom pattern match detected"),
    );
    expect(hasCustomWarning).toBe(true);
  });

  it("pii + custom — two warnings emitted", () => {
    const bothRequest: GatewayPIIDetectionConsumerPipelineRequest = {
      detectionRequest: {
        signal: "email user@test.com account ACCT-99",
        tenantId: "tenant-xyz",
        config: {
          enabledTypes: ["EMAIL", "CUSTOM"],
          customPatterns: [{ pattern: "ACCT-\\d+", label: "[PII_ACCT]" }],
        },
      },
    };
    const result = makeContract().execute(bothRequest);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("query contains tenantId", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.consumerPackage.query).toContain("tenant-abc");
  });

  it("query contains 'pii'", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.consumerPackage.query).toContain("pii");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute({
      detectionRequest: makeDetectionRequest({
        tenantId: "t".repeat(60),
        signal: "clean",
      }),
    });
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches detectionResult.resultId", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.consumerPackage.contextId).toBe(result.detectionResult.resultId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(CLEAN_REQUEST);
    const r2 = contract.execute(CLEAN_REQUEST);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different tenants produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute({
      detectionRequest: makeDetectionRequest({ tenantId: "tenant-a" }),
    });
    const r2 = contract.execute({
      detectionRequest: makeDetectionRequest({ tenantId: "tenant-b" }),
    });
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("candidateItems reflected in rankedKnowledgeResult", () => {
    const result = makeContract().execute({
      ...CLEAN_REQUEST,
      candidateItems: [
        { itemId: "item-1", title: "PII Policy", content: "pii policy item", relevanceScore: 0.8, source: "policy" },
      ],
    });
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(1);
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute({
      ...CLEAN_REQUEST,
      consumerId: "consumer-pii",
    });
    expect(result.consumerId).toBe("consumer-pii");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(CLEAN_REQUEST);
    expect(result.consumerId).toBeUndefined();
  });
});
