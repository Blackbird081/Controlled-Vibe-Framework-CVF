import { describe, expect, it } from "vitest";
import { ProviderHealthMonitor } from "../src/provider-health";
import { ProviderRegistry } from "../src/provider-registry";
import { QuotaLedger } from "../src/quota-ledger";
import { RoutingPolicyEngine } from "../src/routing-policy";

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
});
