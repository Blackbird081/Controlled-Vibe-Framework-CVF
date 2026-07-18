import { describe, expect, it } from "vitest";
import { ProviderHealthMonitor } from "../src/provider-health";
import { ProviderRegistry } from "../src/provider-registry";
import { QuotaLedger } from "../src/quota-ledger";
import {
  UnifiedGatewaySkeletonImpl,
  type UnifiedGatewaySkeletonOptions,
} from "../src/unified-gateway-skeleton";
import type {
  GatewayEmbeddingResponse,
  GatewayErrorEnvelope,
  GatewayExecuteResponse,
  GatewayHealthResponse,
  GatewayStreamChunk,
  UnifiedGatewayInterfaceContract,
} from "../src/unified-gateway-interface-contract";

// ---- shared test setup ----

function makeRegistry() {
  return new ProviderRegistry([
    {
      id: "test-provider",
      displayName: "Test Provider",
      status: "enabled",
      riskClass: "low",
      models: [{ id: "test-model", riskClass: "low" }],
    },
  ]);
}

function makeOptions(overrides: Partial<UnifiedGatewaySkeletonOptions> = {}): UnifiedGatewaySkeletonOptions {
  return {
    registry: makeRegistry(),
    health: new ProviderHealthMonitor(() => new Date("2026-06-15T00:00:00Z")),
    quota: new QuotaLedger(() => new Date("2026-06-15T00:00:00Z")),
    now: () => new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

const ALLOW_POLICY = {
  traceId: "trace-allow",
  policyResult: "allow" as const,
  dataClassification: "internal" as const,
  requestRiskClass: "low" as const,
  allowedProviderIds: ["test-provider"],
};

const DENY_POLICY = {
  traceId: "trace-deny",
  policyResult: "deny" as const,
  dataClassification: "internal" as const,
  requestRiskClass: "low" as const,
};

// ---- tests ----

describe("UnifiedGatewaySkeletonImpl", () => {
  it("satisfies UnifiedGatewayInterfaceContract at compile time", () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const _typeCheck: UnifiedGatewayInterfaceContract = skeleton;
    expect(_typeCheck).toBeDefined();
  });

  // AC2 / AC3: execute

  it("execute with allowed policy returns GatewayExecuteResponse shape", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions({
      localExecuteFn: async () => "hello from skeleton",
    }));
    const result = await skeleton.execute({
      traceId: "trace-exec-1",
      prompt: "test prompt",
      policy: ALLOW_POLICY,
    });
    expect("text" in result).toBe(true);
    if (!("text" in result)) throw new Error("unreachable");
    const response = result as GatewayExecuteResponse;
    expect(response.traceId).toBe("trace-exec-1");
    expect(response.text).toBe("hello from skeleton");
  });

  it("execute with denied policy returns GatewayErrorEnvelope with policy_denied and credentialShielded", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const result = await skeleton.execute({
      traceId: "trace-exec-denied",
      prompt: "test",
      policy: DENY_POLICY,
    });
    expect("errorClass" in result).toBe(true);
    const envelope = result as GatewayErrorEnvelope;
    expect(envelope.errorClass).toBe("policy_denied");
    expect(envelope.credentialShielded).toBe(true);
    expect(envelope.retryable).toBe(false);
    expect(envelope.traceId).toBe("trace-exec-denied");
  });

  it("execute without injected localExecuteFn returns empty text on allowed policy", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const result = await skeleton.execute({
      traceId: "trace-exec-empty",
      prompt: "prompt",
      policy: ALLOW_POLICY,
    });
    expect("text" in result).toBe(true);
    if (!("text" in result)) throw new Error("unreachable");
    expect((result as GatewayExecuteResponse).text).toBe("");
  });

  // AC2 / AC3: stream

  it("stream with allowed policy yields at least one GatewayStreamChunk with done: true", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions({
      localExecuteFn: async () => "streamed output",
    }));
    const chunks: Array<GatewayStreamChunk | GatewayErrorEnvelope> = [];
    for await (const item of skeleton.stream({
      traceId: "trace-stream-1",
      prompt: "stream prompt",
      policy: ALLOW_POLICY,
    })) {
      chunks.push(item);
    }
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    const last = chunks[chunks.length - 1];
    expect("chunk" in last).toBe(true);
    if (!("chunk" in last)) throw new Error("unreachable");
    expect((last as GatewayStreamChunk).done).toBe(true);
    expect((last as GatewayStreamChunk).chunk).toBe("streamed output");
  });

  it("stream with denied policy yields GatewayErrorEnvelope", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const chunks: Array<GatewayStreamChunk | GatewayErrorEnvelope> = [];
    for await (const item of skeleton.stream({
      traceId: "trace-stream-denied",
      prompt: "stream prompt",
      policy: DENY_POLICY,
    })) {
      chunks.push(item);
    }
    expect(chunks.length).toBe(1);
    const envelope = chunks[0] as GatewayErrorEnvelope;
    expect(envelope.errorClass).toBe("policy_denied");
    expect(envelope.credentialShielded).toBe(true);
  });

  // AC2 / AC3: embedding

  it("embedding with allowed policy returns GatewayEmbeddingResponse with embeddings and dimensions", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const result = await skeleton.embedding({
      traceId: "trace-embed-1",
      input: "hello world",
      policy: ALLOW_POLICY,
    });
    expect("embeddings" in result).toBe(true);
    if (!("embeddings" in result)) throw new Error("unreachable");
    const response = result as GatewayEmbeddingResponse;
    expect(response.traceId).toBe("trace-embed-1");
    expect(Array.isArray(response.embeddings)).toBe(true);
    expect(response.dimensions).toBe(3);
  });

  it("embedding with denied policy returns GatewayErrorEnvelope", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const result = await skeleton.embedding({
      traceId: "trace-embed-denied",
      input: "hello",
      policy: DENY_POLICY,
    });
    expect("errorClass" in result).toBe(true);
    const envelope = result as GatewayErrorEnvelope;
    expect(envelope.errorClass).toBe("policy_denied");
    expect(envelope.credentialShielded).toBe(true);
  });

  // AC2: health

  it("health returns GatewayHealthResponse with valid status", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());
    const result: GatewayHealthResponse = await skeleton.health("trace-health-1");
    expect(result.traceId).toBe("trace-health-1");
    expect(["ok", "degraded", "unavailable"]).toContain(result.status);
    expect(typeof result.checkedAt).toBe("string");
  });

  it("health with degraded provider returns degraded status", async () => {
    const healthMonitor = new ProviderHealthMonitor(() => new Date("2026-06-15T00:00:00Z"));
    healthMonitor.recordFailure("test-provider", 500, "server error");
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions({ health: healthMonitor }));
    const result = await skeleton.health("trace-health-degraded");
    expect(result.status).toBe("degraded");
    expect(result.providerHealthSummary?.["test-provider"]).toBe("degraded");
  });

  // AC4: credential shielding

  it("credential shielding: error envelope JSON does not contain injected secret values", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions({
      localExecuteFn: async () => { throw new Error("sk-test-secret leaked"); },
    }));
    const result = await skeleton.execute({
      traceId: "trace-shield",
      prompt: "leak test",
      policy: DENY_POLICY,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("sk-test-secret");
    expect("errorClass" in result).toBe(true);
    expect((result as GatewayErrorEnvelope).credentialShielded).toBe(true);
  });

  it("all error envelopes have providerIdShielded: true", async () => {
    const skeleton = new UnifiedGatewaySkeletonImpl(makeOptions());

    const execResult = await skeleton.execute({
      traceId: "t1",
      prompt: "p",
      policy: DENY_POLICY,
    });
    expect((execResult as GatewayErrorEnvelope).providerIdShielded).toBe(true);

    const chunks: Array<GatewayStreamChunk | GatewayErrorEnvelope> = [];
    for await (const item of skeleton.stream({ traceId: "t2", prompt: "p", policy: DENY_POLICY })) {
      chunks.push(item);
    }
    expect((chunks[0] as GatewayErrorEnvelope).providerIdShielded).toBe(true);

    const embedResult = await skeleton.embedding({ traceId: "t3", input: "x", policy: DENY_POLICY });
    expect((embedResult as GatewayErrorEnvelope).providerIdShielded).toBe(true);
  });
});
