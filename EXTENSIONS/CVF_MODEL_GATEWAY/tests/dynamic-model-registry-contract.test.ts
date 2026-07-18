import { describe, expect, it } from "vitest";
import type {
  DynamicModelRecord,
  DynamicModelRegistryContract,
  FindOptimalQuery,
} from "../src/dynamic-model-registry-contract";
import {
  DYNAMIC_MODEL_REGISTRY_CONTRACT_VERSION,
} from "../src/dynamic-model-registry-contract";
import type { ProviderHealthState } from "../src/provider-health";
import type { ProviderMethodName } from "../src/provider-method-contract";
import type { ProviderStatus } from "../src/provider-registry";

describe("DynamicModelRecord shape", () => {
  it("accepts a minimal required-field record", () => {
    const record: DynamicModelRecord = {
      providerId: "anthropic",
      modelId: "claude-sonnet-4-6",
      tier: "frontier",
      supportedMethods: ["chat", "stream"],
      status: "enabled",
    };
    expect(record.tier).toBe("frontier");
    expect(record.providerId).toBe("anthropic");
  });

  it("accepts all optional fields", () => {
    const record: DynamicModelRecord = {
      providerId: "alibaba",
      modelId: "qwen3-32b",
      tier: "standard",
      supportedMethods: ["chat"],
      status: "enabled",
      maxContextTokens: 131072,
      costPerInputToken: 0.0000006,
      costPerOutputToken: 0.0000018,
      latencyClass: "medium",
      rateLimit: { requestsPerMinute: 60, tokensPerMinute: 200000 },
      healthState: "healthy",
    };
    expect(record.maxContextTokens).toBe(131072);
    expect(record.latencyClass).toBe("medium");
  });

  it("accepts experimental tier and experimental status", () => {
    const record: DynamicModelRecord = {
      providerId: "test-provider",
      modelId: "test-model-exp",
      tier: "experimental",
      supportedMethods: ["complete"],
      status: "experimental",
    };
    expect(record.tier).toBe("experimental");
    expect(record.status).toBe("experimental");
  });
});

describe("FindOptimalQuery shape", () => {
  it("accepts a minimal query with only requiredMethod", () => {
    const query: FindOptimalQuery = {
      requiredMethod: "embedding",
    };
    expect(query.requiredMethod).toBe("embedding");
  });

  it("accepts a fully-specified query", () => {
    const query: FindOptimalQuery = {
      requiredMethod: "chat",
      preferredTier: "standard",
      maxCostPerInputToken: 0.000001,
      latencyClass: "low",
      allowExperimental: false,
      allowedProviderIds: ["anthropic", "alibaba"],
      blockedProviderIds: ["untrusted"],
    };
    expect(query.preferredTier).toBe("standard");
    expect(query.latencyClass).toBe("low");
    expect(query.allowedProviderIds).toContain("anthropic");
  });
});

describe("DynamicModelRegistryContract type reuse", () => {
  it("supportedMethods field accepts ProviderMethodName values", () => {
    const method: ProviderMethodName = "tool_call";
    const record: DynamicModelRecord = {
      providerId: "p",
      modelId: "m",
      tier: "economy",
      supportedMethods: [method],
      status: "enabled",
    };
    expect(record.supportedMethods[0]).toBe("tool_call");
  });

  it("healthState field accepts all 5 ProviderHealthState values", () => {
    const states: ProviderHealthState[] = [
      "healthy",
      "degraded",
      "rate_limited",
      "unavailable",
      "unknown",
    ];
    for (const healthState of states) {
      const record: DynamicModelRecord = {
        providerId: "p",
        modelId: "m",
        tier: "standard",
        supportedMethods: ["chat"],
        status: "enabled",
        healthState,
      };
      expect(record.healthState).toBe(healthState);
    }
  });

  it("status field accepts all ProviderStatus values", () => {
    const statuses: ProviderStatus[] = ["enabled", "disabled", "experimental"];
    for (const status of statuses) {
      const record: DynamicModelRecord = {
        providerId: "p",
        modelId: "m",
        tier: "frontier",
        supportedMethods: ["vision"],
        status,
      };
      expect(record.status).toBe(status);
    }
  });
});

describe("DynamicModelRegistryContract interface is implementable", () => {
  const stub: DynamicModelRegistryContract = {
    getModel(_providerId: string, _modelId: string): DynamicModelRecord | undefined {
      return undefined;
    },
    findOptimal(_query: FindOptimalQuery): DynamicModelRecord[] {
      return [];
    },
    listRoutable(_options?: { allowExperimental?: boolean }): DynamicModelRecord[] {
      return [];
    },
  };

  it("stub satisfies the contract and compiles", () => {
    expect(stub.findOptimal({ requiredMethod: "chat" })).toEqual([]);
    expect(stub.listRoutable()).toEqual([]);
    expect(stub.getModel("p", "m")).toBeUndefined();
  });
});

describe("DYNAMIC_MODEL_REGISTRY_CONTRACT_VERSION", () => {
  it("exports the version constant", () => {
    expect(DYNAMIC_MODEL_REGISTRY_CONTRACT_VERSION).toBe("cvf.dynamicModelRegistry.v1");
  });
});
