import { describe, expect, it } from "vitest";
import {
  CredentialBoundary,
  FallbackPolicy,
  GatewayReceiptBuilder,
  ProviderHealthMonitor,
  ProviderRegistry,
  QuotaLedger,
  RoutingPolicyEngine,
  StickySessionStore,
} from "../src/index";

describe("Model Gateway runtime integration", () => {
  it("routes allowed requests and emits a sanitized governance receipt", () => {
    const registry = new ProviderRegistry([
      {
        id: "dashscope",
        displayName: "DashScope",
        status: "enabled",
        riskClass: "medium",
        credentialKeyIds: ["dashscope-live"],
        models: [{ id: "qwen-turbo", riskClass: "medium" }],
      },
    ]);
    const health = new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z"));
    const quota = new QuotaLedger(() => new Date("2026-05-16T00:00:00Z"));
    const router = new RoutingPolicyEngine(registry, health, quota);
    const credentials = new CredentialBoundary({ DASHSCOPE_API_KEY: "sk-live-secret-value" });
    const sticky = new StickySessionStore(60_000, () => new Date("2026-05-16T00:00:00Z"));

    const policy = {
      traceId: "trace-live",
      policyResult: "allow" as const,
      dataClassification: "internal" as const,
      requestRiskClass: "medium" as const,
      allowedProviderIds: ["dashscope"],
    };
    const route = router.decide({ traceId: "trace-live", policy, estimatedTokens: 100 });
    expect(route.status).toBe("selected");
    if (route.status !== "selected") {
      throw new Error("expected selected route");
    }

    sticky.bind("session-1", route.providerId, route.modelId);
    quota.recordUse({ providerId: route.providerId, modelId: route.modelId, estimatedTokens: 100, actualTokens: 80 });
    const credential = credentials.resolveMetadata({
      providerId: route.providerId,
      keyId: "dashscope-live",
      envNames: ["DASHSCOPE_API_KEY"],
    });

    const receipt = new GatewayReceiptBuilder(
      () => new Date("2026-05-16T00:00:00Z"),
      () => "runtime",
    ).build({
      traceId: "trace-live",
      providerId: route.providerId,
      requestedModelId: route.modelId,
      selectedModelId: route.modelId,
      decision: "selected",
      reason: route.reason,
      policy,
      providerRiskClass: route.provider.riskClass,
      quotaAllowed: route.quota.allowed,
      healthState: health.get(route.providerId).state,
      credentialKeyId: credential.keyId,
      credentialFingerprint: credential.fingerprint,
      validationState: "passed",
      metadata: { apiKey: "sk-live-secret-value" },
    });

    expect(receipt).toMatchObject({
      traceId: "trace-live",
      providerId: "dashscope",
      selectedModelId: "qwen-turbo",
      policyResult: "allow",
      quotaAllowed: true,
      validationState: "passed",
    });
    expect(sticky.get("session-1")).toMatchObject({ providerId: "dashscope", modelId: "qwen-turbo" });
    expect(JSON.stringify(receipt)).not.toContain("sk-live-secret-value");
  });

  it("captures fallback reason and previous route in the receipt", () => {
    const fallback = new FallbackPolicy({ maxAttempts: 2 }, () => new Date("2026-05-16T00:00:00Z"));
    const firstAttempt = fallback.createAttempt("dashscope", "qwen-turbo", "provider_timeout", 504);
    const decision = fallback.decide([firstAttempt], 504);

    const receipt = new GatewayReceiptBuilder(
      () => new Date("2026-05-16T00:00:00Z"),
      () => "fallback",
    ).build({
      traceId: "trace-fallback",
      providerId: "deepseek",
      requestedModelId: "qwen-turbo",
      selectedModelId: "deepseek-chat",
      decision: "fallback",
      reason: decision.reason,
      fallbackFromProviderId: firstAttempt.providerId,
      fallbackFromModelId: firstAttempt.modelId,
      policy: { traceId: "trace-fallback", policyResult: "allow", requestRiskClass: "medium" },
      healthState: "degraded",
      quotaAllowed: true,
      validationState: "passed",
    });

    expect(receipt).toMatchObject({
      decision: "fallback",
      reason: "retryable_or_unknown_failure",
      requestedModelId: "qwen-turbo",
      selectedModelId: "deepseek-chat",
      healthState: "degraded",
      quotaAllowed: true,
      fallback: {
        fromProviderId: "dashscope",
        fromModelId: "qwen-turbo",
      },
    });
  });
});
