import { describe, expect, it } from "vitest";
import { ProviderHealthMonitor } from "../src/provider-health";
import { ProviderRegistry } from "../src/provider-registry";
import { QuotaLedger } from "../src/quota-ledger";
import {
  ROUTING_POLICY_CONTRACT_VERSION,
  RoutingPolicyEngine,
  buildRoutingPolicyContractSnapshot,
} from "../src";

function buildEngine() {
  const registry = new ProviderRegistry([
    {
      id: "dashscope",
      displayName: "DashScope",
      status: "enabled",
      riskClass: "medium",
      models: [{ id: "qwen-turbo", riskClass: "medium" }],
    },
    {
      id: "deepseek",
      displayName: "DeepSeek",
      status: "enabled",
      riskClass: "medium",
      models: [{ id: "deepseek-chat", riskClass: "medium" }],
    },
  ]);
  return {
    registry,
    health: new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z")),
    quota: new QuotaLedger(() => new Date("2026-05-16T00:00:00Z")),
  };
}

function buildPipelineEngine() {
  const registry = new ProviderRegistry([
    {
      id: "deepseek",
      displayName: "DeepSeek",
      status: "enabled",
      riskClass: "medium",
      models: [{ id: "deepseek-chat", riskClass: "medium" }],
    },
    {
      id: "alibaba",
      displayName: "Alibaba",
      status: "enabled",
      riskClass: "medium",
      models: [
        { id: "qwen-turbo", riskClass: "medium" },
        { id: "qwen-vl-plus", riskClass: "medium" },
      ],
    },
    {
      id: "high-risk",
      displayName: "High Risk",
      status: "enabled",
      riskClass: "high",
      models: [{ id: "high-risk-model", riskClass: "high" }],
    },
  ]);
  return {
    registry,
    health: new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z")),
    quota: new QuotaLedger(() => new Date("2026-05-16T00:00:00Z")),
  };
}

describe("RoutingPolicyEngine", () => {
  it("fails closed when Guard Contract policy context is missing", () => {
    const parts = buildEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    expect(engine.decide({ traceId: "trace-0" })).toMatchObject({
      status: "denied",
      reason: "missing_policy_context",
    });
  });

  it("fails closed when Guard Contract policy denies or requires approval", () => {
    const parts = buildEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    expect(engine.decide({
      traceId: "trace-1",
      policy: { traceId: "trace-1", policyResult: "deny", reason: "dlp_block" },
    })).toMatchObject({ status: "denied", reason: "dlp_block" });

    expect(engine.decide({
      traceId: "trace-2",
      policy: { traceId: "trace-2", policyResult: "requires_approval" },
    })).toMatchObject({ status: "requires_approval" });
  });

  it("selects a provider only after policy, health, and quota pass", () => {
    const parts = buildEngine();
    parts.quota.setLimit("dashscope", "qwen-turbo", { requestsPerDay: 1 });
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    const decision = engine.decide({
      traceId: "trace-3",
      requestedModelId: "qwen-turbo",
      estimatedTokens: 20,
      policy: { traceId: "trace-3", policyResult: "allow", allowedProviderIds: ["dashscope"] },
    });

    expect(decision).toMatchObject({
      status: "selected",
      providerId: "dashscope",
      modelId: "qwen-turbo",
      reason: "policy_health_quota_selected",
    });
  });

  it("skips unhealthy or quota-blocked providers", () => {
    const parts = buildEngine();
    parts.health.recordFailure("dashscope", 429, "rate limit");
    parts.quota.setLimit("deepseek", "deepseek-chat", { requestsPerDay: 0 });
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    expect(engine.decide({
      traceId: "trace-4",
      policy: { traceId: "trace-4", policyResult: "allow" },
    })).toMatchObject({ status: "no_candidate" });
  });

  it("builds bounded routing-policy contract snapshots without changing decisions", () => {
    const parts = buildEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);
    const request = {
      traceId: "trace-snapshot",
      requestedModelId: "qwen-turbo",
      policy: { traceId: "trace-snapshot", policyResult: "allow" as const },
    };

    const decision = engine.decide(request);
    const snapshot = buildRoutingPolicyContractSnapshot(request, decision);

    expect(snapshot.version).toBe(ROUTING_POLICY_CONTRACT_VERSION);
    expect(snapshot.source).toBe("model-gateway:routing-policy");
    expect(snapshot.traceId).toBe("trace-snapshot");
    expect(snapshot.status).toBe(decision.status);
    expect(snapshot.policyResult).toBe("allow");
  });

  it("returns decision and snapshot together for model-gateway index consumers", () => {
    const parts = buildEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    const result = engine.decideWithSnapshot({
      traceId: "trace-index-snapshot",
      policy: { traceId: "trace-index-snapshot", policyResult: "deny", reason: "policy_denied" },
    });

    expect(result.decision.status).toBe("denied");
    expect(result.snapshot.status).toBe("denied");
    expect(result.snapshot.reason).toBe("policy_denied");
  });

  it("keeps minimal routing requests backward compatible when optional context is absent", () => {
    const parts = buildEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    const decision = engine.decide({
      traceId: "trace-backward-compatible",
      requestedModelId: "qwen-turbo",
      policy: { traceId: "trace-backward-compatible", policyResult: "allow" },
    });

    expect(decision).toEqual({
      status: "selected",
      traceId: "trace-backward-compatible",
      providerId: "dashscope",
      modelId: "qwen-turbo",
      reason: "policy_health_quota_selected",
      provider: {
        id: "dashscope",
        displayName: "DashScope",
        status: "enabled",
        riskClass: "medium",
        models: [{ id: "qwen-turbo", riskClass: "medium" }],
      },
      quota: {
        allowed: true,
        reason: "no_limit_configured",
        usage: {
          providerId: "dashscope",
          modelId: "qwen-turbo",
          day: "2026-05-16",
          requestCount: 0,
          estimatedTokenCount: 0,
          actualTokenCount: 0,
        },
      },
    });
  });

  it("filters candidates by required provider capability", () => {
    const parts = buildPipelineEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    const decision = engine.decide({
      traceId: "trace-capability",
      requiredCapabilities: ["vision"],
      policy: { traceId: "trace-capability", policyResult: "allow" },
    });

    expect(decision).toMatchObject({
      status: "selected",
      providerId: "alibaba",
      modelId: "qwen-vl-plus",
      reason: "policy_health_quota_selected",
    });
  });

  it("applies risk and cost policy without changing the upstream policy boundary", () => {
    const parts = buildPipelineEngine();
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    expect(engine.decide({
      traceId: "trace-risk",
      preferredProviderId: "high-risk",
      riskScore: 0.9,
      policy: { traceId: "trace-risk", policyResult: "allow" },
    })).toMatchObject({
      status: "selected",
      providerId: "deepseek",
      modelId: "deepseek-chat",
    });

    expect(engine.decide({
      traceId: "trace-cost",
      estimatedTokens: 200,
      costBudget: 100,
      policy: { traceId: "trace-cost", policyResult: "allow" },
    })).toMatchObject({
      status: "no_candidate",
      reason: "no_provider_passed_routing_policy_pipeline",
    });
  });

  it("records fallbackChain when the preferred candidate fails health before a later candidate is selected", () => {
    const parts = buildPipelineEngine();
    parts.health.recordFailure("alibaba", 429, "rate limit");
    const engine = new RoutingPolicyEngine(parts.registry, parts.health, parts.quota);

    const decision = engine.decide({
      traceId: "trace-fallback",
      preferredProviderId: "alibaba",
      policy: { traceId: "trace-fallback", policyResult: "allow" },
    });

    expect(decision).toMatchObject({
      status: "selected",
      providerId: "deepseek",
      modelId: "deepseek-chat",
      fallbackChain: [
        { providerId: "alibaba", modelId: "qwen-turbo" },
        { providerId: "deepseek", modelId: "deepseek-chat" },
      ],
    });

    const snapshot = buildRoutingPolicyContractSnapshot({
      traceId: "trace-fallback",
      preferredProviderId: "alibaba",
      executionStage: "execution",
      riskScore: 0.3,
      policy: { traceId: "trace-fallback", policyResult: "allow" },
    }, decision);
    expect(snapshot.version).toBe(ROUTING_POLICY_CONTRACT_VERSION);
    expect(snapshot.appliedPolicies).toEqual(["stage", "risk"]);
    expect(snapshot.fallbackChainLength).toBe(2);
  });
});
