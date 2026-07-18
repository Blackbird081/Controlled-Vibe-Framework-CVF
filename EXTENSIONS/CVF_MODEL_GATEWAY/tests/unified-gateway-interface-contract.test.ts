import { describe, expect, it } from "vitest";
import type {
  GatewayEmbeddingRequest,
  GatewayEmbeddingResponse,
  GatewayErrorEnvelope,
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayHealthResponse,
  GatewayStreamChunk,
  GatewayStreamRequest,
  UnifiedGatewayInterfaceContract,
} from "../src/unified-gateway-interface-contract";
import {
  UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION,
} from "../src/unified-gateway-interface-contract";
import type { GatewayPolicyContext } from "../src/gateway-policy";
import type { ProviderHealthState } from "../src/provider-health";
import type { DynamicModelRecord } from "../src/dynamic-model-registry-contract";
import type { RoutingRequest } from "../src/routing-policy";

const samplePolicy: GatewayPolicyContext = {
  traceId: "trace-001",
  policyResult: "allow",
};

describe("GatewayExecuteRequest shape", () => {
  it("accepts minimal required fields", () => {
    const req: GatewayExecuteRequest = {
      traceId: "trace-001",
      prompt: "hello",
      policy: samplePolicy,
    };
    expect(req.traceId).toBe("trace-001");
    expect(req.policy.policyResult).toBe("allow");
  });

  it("accepts all optional fields including RoutingRequest and DynamicModelRecord", () => {
    const routing: RoutingRequest = {
      traceId: "trace-001",
    };
    const model: DynamicModelRecord = {
      providerId: "anthropic",
      modelId: "claude-sonnet-4-6",
      tier: "frontier",
      supportedMethods: ["chat"],
      status: "enabled",
    };
    const req: GatewayExecuteRequest = {
      traceId: "trace-001",
      prompt: "hello",
      systemPrompt: "you are helpful",
      policy: samplePolicy,
      routing,
      preferredModel: model,
      metadata: { source: "test" },
    };
    expect(req.routing?.traceId).toBe("trace-001");
    expect(req.preferredModel?.tier).toBe("frontier");
  });
});

describe("GatewayExecuteResponse shape", () => {
  it("accepts all fields", () => {
    const resp: GatewayExecuteResponse = {
      traceId: "trace-001",
      text: "hello back",
      usage: { inputTokens: 10, outputTokens: 20 },
      receiptObligation: "rec-001",
      model: { providerId: "anthropic", modelId: "claude-sonnet-4-6" },
    };
    expect(resp.text).toBe("hello back");
    expect(resp.usage?.inputTokens).toBe(10);
  });
});

describe("GatewayStreamRequest and GatewayStreamChunk shape", () => {
  it("GatewayStreamRequest extends GatewayExecuteRequest", () => {
    const req: GatewayStreamRequest = {
      traceId: "trace-002",
      prompt: "stream me",
      policy: samplePolicy,
    };
    expect(req.traceId).toBe("trace-002");
  });

  it("GatewayStreamChunk accepts all fields", () => {
    const chunk: GatewayStreamChunk = {
      traceId: "trace-002",
      chunk: "partial text",
      done: false,
      receiptObligation: "rec-002",
    };
    expect(chunk.done).toBe(false);
    expect(chunk.chunk).toBe("partial text");
  });

  it("GatewayStreamChunk done=true", () => {
    const final: GatewayStreamChunk = {
      traceId: "trace-002",
      chunk: "",
      done: true,
    };
    expect(final.done).toBe(true);
  });
});

describe("GatewayEmbeddingRequest and GatewayEmbeddingResponse shape", () => {
  it("accepts string input", () => {
    const req: GatewayEmbeddingRequest = {
      traceId: "trace-003",
      input: "embed this",
      policy: samplePolicy,
    };
    expect(req.input).toBe("embed this");
  });

  it("accepts string array input", () => {
    const req: GatewayEmbeddingRequest = {
      traceId: "trace-003",
      input: ["a", "b"],
      model: "text-embedding-3",
      policy: samplePolicy,
    };
    expect(Array.isArray(req.input)).toBe(true);
  });

  it("GatewayEmbeddingResponse shape", () => {
    const resp: GatewayEmbeddingResponse = {
      traceId: "trace-003",
      embeddings: [[0.1, 0.2], [0.3, 0.4]],
      dimensions: 2,
    };
    expect(resp.dimensions).toBe(2);
    expect(resp.embeddings[0][0]).toBe(0.1);
  });
});

describe("GatewayHealthResponse shape", () => {
  it("accepts ok status without summary", () => {
    const resp: GatewayHealthResponse = {
      traceId: "trace-004",
      status: "ok",
      checkedAt: "2026-06-15T00:00:00Z",
    };
    expect(resp.status).toBe("ok");
  });

  it("providerHealthSummary accepts ProviderHealthState values", () => {
    const states: ProviderHealthState[] = [
      "healthy",
      "degraded",
      "rate_limited",
      "unavailable",
      "unknown",
    ];
    const summary: Record<string, ProviderHealthState> = {};
    states.forEach((state, i) => {
      summary[`provider-${i}`] = state;
    });
    const resp: GatewayHealthResponse = {
      traceId: "trace-004",
      status: "degraded",
      providerHealthSummary: summary,
      checkedAt: "2026-06-15T00:00:00Z",
    };
    expect(resp.providerHealthSummary?.["provider-0"]).toBe("healthy");
    expect(resp.providerHealthSummary?.["provider-2"]).toBe("rate_limited");
  });
});

describe("GatewayErrorEnvelope shape", () => {
  it("credentialShielded must be true literal", () => {
    const err: GatewayErrorEnvelope = {
      errorClass: "policy_denied",
      traceId: "trace-005",
      message: "request denied by policy",
      credentialShielded: true,
      retryable: false,
    };
    expect(err.credentialShielded).toBe(true);
    expect(err.retryable).toBe(false);
    expect(err.errorClass).toBe("policy_denied");
  });

  it("accepts all GatewayErrorClass values", () => {
    const classes = [
      "policy_denied",
      "no_candidate",
      "quota_exceeded",
      "provider_unavailable",
      "invalid_request",
      "credential_shielded",
      "internal_error",
    ] as const;
    for (const errorClass of classes) {
      const err: GatewayErrorEnvelope = {
        errorClass,
        traceId: "trace-005",
        message: "error",
        credentialShielded: true,
        retryable: false,
      };
      expect(err.errorClass).toBe(errorClass);
    }
  });

  it("accepts optional providerIdShielded", () => {
    const err: GatewayErrorEnvelope = {
      errorClass: "provider_unavailable",
      traceId: "trace-005",
      message: "provider down",
      credentialShielded: true,
      providerIdShielded: true,
      retryable: true,
    };
    expect(err.providerIdShielded).toBe(true);
  });
});

describe("UnifiedGatewayInterfaceContract is implementable", () => {
  const stub: UnifiedGatewayInterfaceContract = {
    async execute(_req: GatewayExecuteRequest) {
      const err: GatewayErrorEnvelope = {
        errorClass: "internal_error",
        traceId: _req.traceId,
        message: "stub",
        credentialShielded: true,
        retryable: false,
      };
      return err;
    },
    async *stream(_req: GatewayStreamRequest) {
      const chunk: GatewayStreamChunk = {
        traceId: _req.traceId,
        chunk: "",
        done: true,
      };
      yield chunk;
    },
    async embedding(_req: GatewayEmbeddingRequest) {
      const resp: GatewayEmbeddingResponse = {
        traceId: _req.traceId,
        embeddings: [],
        dimensions: 0,
      };
      return resp;
    },
    async health(traceId: string) {
      const resp: GatewayHealthResponse = {
        traceId,
        status: "ok",
        checkedAt: new Date().toISOString(),
      };
      return resp;
    },
  };

  it("stub satisfies the contract and compiles", async () => {
    const result = await stub.health("trace-stub");
    expect(result.status).toBe("ok");
    const embedResult = await stub.embedding({
      traceId: "trace-stub",
      input: "test",
      policy: samplePolicy,
    });
    if ("dimensions" in embedResult) {
      expect(embedResult.dimensions).toBe(0);
    }
  });
});

describe("UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION", () => {
  it("exports the version constant", () => {
    expect(UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION).toBe("cvf.unifiedGatewayInterface.v1");
  });
});
