/**
 * Provider Execution Bridge - Deterministic Tests
 *
 * Tests all 14 required cases from the P4B-A work order.
 * No network calls, no real credentials, no concrete adapter imports.
 */
import { describe, it, expect, vi } from "vitest";
import {
  ProviderExecutionBridge,
  PROVIDER_EXECUTION_BRIDGE_VERSION,
} from "../src/provider-execution-bridge";
import type {
  ProviderExecutionAdapter,
  ProviderExecutionAdapterInput,
  ProviderExecutionAdapterResult,
  ProviderExecutionBridgeOptions,
} from "../src/provider-execution-bridge";
import type { GatewayExecuteRequest } from "../src/unified-gateway-interface-contract";
import type { CredentialReference } from "../src/credential-boundary";
import type { RoutingDecision } from "../src/routing-policy";
import { RoutingPolicyEngine } from "../src/routing-policy";
import { CredentialBoundary } from "../src/credential-boundary";
import { ProviderHealthMonitor } from "../src/provider-health";
import { QuotaLedger } from "../src/quota-ledger";
import { ProviderRegistry } from "../src/provider-registry";
import { GatewayReceiptBuilder } from "../src/gateway-receipt";
const TEST_TRACE_ID = "test-trace-001";
const TEST_PROVIDER_ID = "test-provider";
const TEST_MODEL_ID = "test-model-v1";
const TEST_KEY_ID = "test-key-01";
const TEST_SECRET = "test-secret-value-for-testing";
function makeRequest(overrides?: Partial<GatewayExecuteRequest>): GatewayExecuteRequest {
  return {
    traceId: TEST_TRACE_ID,
    prompt: "Hello, world",
    policy: {
      traceId: TEST_TRACE_ID,
      policyResult: "allow",
      reason: "test_allow",
      allowedProviderIds: [TEST_PROVIDER_ID],
    },
    routing: {
      traceId: TEST_TRACE_ID,
      preferredProviderId: TEST_PROVIDER_ID,
      requestedModelId: TEST_MODEL_ID,
      estimatedTokens: 100,
    },
    ...overrides,
  };
}
function makeCredentialRef(): CredentialReference {
  return {
    providerId: TEST_PROVIDER_ID,
    keyId: TEST_KEY_ID,
    envNames: ["TEST_API_KEY"],
  };
}
function makeMockAdapter(): ProviderExecutionAdapter & {
  execute: ReturnType<typeof vi.fn>;
} {
  const executeFn = vi.fn(
    async (_input: ProviderExecutionAdapterInput): Promise<ProviderExecutionAdapterResult> => ({
      text: "Hello from test adapter",
      usage: { inputTokens: 10, outputTokens: 15 },
    }),
  );
  return {
    providerId: TEST_PROVIDER_ID,
    execute: executeFn,
  };
}
function makeSelectedDecision(): Extract<RoutingDecision, { status: "selected" }> {
  return {
    status: "selected",
    traceId: TEST_TRACE_ID,
    providerId: TEST_PROVIDER_ID,
    modelId: TEST_MODEL_ID,
    reason: "test_selected",
    provider: {
      id: TEST_PROVIDER_ID,
      displayName: "Test",
      status: "enabled",
      riskClass: "low",
      models: [{ id: TEST_MODEL_ID, riskClass: "low" }],
    },
    quota: {
      allowed: true,
      reason: "within_quota",
      usage: {
        providerId: TEST_PROVIDER_ID,
        modelId: TEST_MODEL_ID,
        day: "2026-06-15",
        requestCount: 0,
        estimatedTokenCount: 0,
        actualTokenCount: 0,
      },
    },
  };
}
function makeBridgeOptions(overrides?: Partial<ProviderExecutionBridgeOptions>): ProviderExecutionBridgeOptions {
  const registry = new ProviderRegistry();
  registry.register({
    id: TEST_PROVIDER_ID,
    displayName: "Test Provider",
    status: "enabled",
    riskClass: "low",
    models: [{ id: TEST_MODEL_ID, riskClass: "low" }],
  });
  const health = new ProviderHealthMonitor();
  const quota = new QuotaLedger();
  const credential = new CredentialBoundary({ TEST_API_KEY: TEST_SECRET });
  const receipt = new GatewayReceiptBuilder(
    () => new Date("2026-06-15T10:00:00Z"),
    () => "testnonce",
  );
  const routing = new RoutingPolicyEngine(registry, health, quota);
  const credentialRefs = new Map<string, CredentialReference>();
  credentialRefs.set(TEST_PROVIDER_ID, makeCredentialRef());
  const adapters = new Map<string, ProviderExecutionAdapter>();
  adapters.set(TEST_PROVIDER_ID, makeMockAdapter());
  return {
    routing,
    credential,
    health,
    quota,
    receipt,
    credentialRefs,
    adapters,
    ...overrides,
  };
}
describe("ProviderExecutionBridge", () => {
  describe("contract version", () => {
    it("exports the bridge version constant", () => {
      expect(PROVIDER_EXECUTION_BRIDGE_VERSION).toBe("cvf.providerExecutionBridge.p4bA.v1");
    });
  });
  describe("denied routing", () => {
    it("returns receipt and does not call adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const request = makeRequest({
        policy: {
          traceId: TEST_TRACE_ID,
          policyResult: "deny",
          reason: "test_denied",
        },
      });
      const result = await bridge.execute(request);
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("policy_denied");
      expect(result.receipt).toBeDefined();
      expect(result.receipt.decision).toBe("denied");
      expect(result.response).toBeUndefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("approval-required routing", () => {
    it("returns receipt and does not call adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const request = makeRequest({
        policy: {
          traceId: TEST_TRACE_ID,
          policyResult: "requires_approval",
          reason: "test_approval_required",
        },
      });
      const result = await bridge.execute(request);
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("policy_denied");
      expect(result.receipt).toBeDefined();
      expect(result.receipt.decision).toBe("requires_approval");
      expect(result.response).toBeUndefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("no-candidate routing", () => {
    it("returns receipt and does not call adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const request = makeRequest({
        policy: {
          traceId: TEST_TRACE_ID,
          policyResult: "allow",
          reason: "test_allow",
          allowedProviderIds: ["nonexistent-provider"],
        },
      });
      const result = await bridge.execute(request);
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("no_candidate");
      expect(result.receipt).toBeDefined();
      expect(result.receipt.decision).toBe("no_candidate");
      expect(result.response).toBeUndefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("selected provider without injected adapter", () => {
    it("fails shielded with receipt", async () => {
      const options = makeBridgeOptions({
        adapters: new Map(), // no adapters
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("provider_unavailable");
      expect(result.error!.credentialShielded).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.response).toBeUndefined();
    });
    it("rejects an adapter whose providerId does not match the selected provider", async () => {
      const adapter = { ...makeMockAdapter(), providerId: "wrong-provider" };
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const result = await new ProviderExecutionBridge(options).execute(makeRequest());
      expect(result.error?.errorClass).toBe("provider_unavailable");
      expect(result.error?.credentialShielded).toBe(true);
      expect(result.receipt.validationState).toBe("failed");
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("selected provider without credential metadata", () => {
    it("fails shielded with receipt when no credential ref", async () => {
      const options = makeBridgeOptions({
        credentialRefs: new Map(), // no credential refs
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("credential_shielded");
      expect(result.error!.credentialShielded).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.response).toBeUndefined();
    });
    it("fails shielded when credential is not available", async () => {
      const credential = new CredentialBoundary({}); // no env vars
      const options = makeBridgeOptions({ credential });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("credential_shielded");
      expect(result.receipt).toBeDefined();
      expect(result.response).toBeUndefined();
    });
  });
  describe("unusable provider health", () => {
    it("routing rejects unhealthy provider with no_candidate", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("no_candidate");
      expect(result.receipt).toBeDefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
    it("bridge rejects provider that becomes unusable after routing", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      vi.spyOn(options.routing, "decide").mockReturnValueOnce(makeSelectedDecision());
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("provider_unavailable");
      expect(result.receipt).toBeDefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("over-quota provider", () => {
    it("routing rejects over-quota provider with no_candidate", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      options.quota.setLimit(TEST_PROVIDER_ID, TEST_MODEL_ID, { requestsPerDay: 1 });
      options.quota.recordUse({ providerId: TEST_PROVIDER_ID, modelId: TEST_MODEL_ID });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("no_candidate");
      expect(result.receipt).toBeDefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
    it("bridge rejects provider that becomes over-quota after routing", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      vi.spyOn(options.routing, "decide").mockReturnValueOnce(makeSelectedDecision());
      options.quota.setLimit(TEST_PROVIDER_ID, TEST_MODEL_ID, { requestsPerDay: 1 });
      options.quota.recordUse({ providerId: TEST_PROVIDER_ID, modelId: TEST_MODEL_ID });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("quota_exceeded");
      expect(result.receipt).toBeDefined();
      expect(adapter.execute).not.toHaveBeenCalled();
    });
  });
  describe("successful execution", () => {
    it("calls adapter exactly once", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      await bridge.execute(makeRequest());
      expect(adapter.execute).toHaveBeenCalledTimes(1);
      expect(adapter.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: TEST_TRACE_ID,
          providerId: TEST_PROVIDER_ID,
          modelId: TEST_MODEL_ID,
          prompt: "Hello, world",
        }),
      );
    });
  });
  describe("success records health and quota", () => {
    it("records health success after adapter execution", async () => {
      const options = makeBridgeOptions();
      const healthSpy = vi.spyOn(options.health, "recordSuccess");
      const bridge = new ProviderExecutionBridge(options);
      await bridge.execute(makeRequest());
      expect(healthSpy).toHaveBeenCalledWith(TEST_PROVIDER_ID);
    });
    it("records quota after adapter execution", async () => {
      const options = makeBridgeOptions();
      const quotaSpy = vi.spyOn(options.quota, "recordUse");
      const bridge = new ProviderExecutionBridge(options);
      await bridge.execute(makeRequest());
      expect(quotaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: TEST_PROVIDER_ID,
          modelId: TEST_MODEL_ID,
        }),
      );
    });
  });
  describe("success returns provider/model and receipt", () => {
    it("returns complete response with provider, model, and receipt", async () => {
      const options = makeBridgeOptions();
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.response).toBeDefined();
      expect(result.response!.traceId).toBe(TEST_TRACE_ID);
      expect(result.response!.text).toBe("Hello from test adapter");
      expect(result.response!.usage).toEqual({ inputTokens: 10, outputTokens: 15 });
      expect(result.response!.model).toEqual({
        providerId: TEST_PROVIDER_ID,
        modelId: TEST_MODEL_ID,
      });
      expect(result.receipt).toBeDefined();
      expect(result.receipt.traceId).toBe(TEST_TRACE_ID);
      expect(result.receipt.decision).toBe("selected");
      expect(result.receipt.validationState).toBe("passed");
      expect(result.error).toBeUndefined();
    });
  });
  describe("adapter error", () => {
    it("records health failure and returns shielded error with receipt", async () => {
      const adapter = makeMockAdapter();
      adapter.execute.mockRejectedValueOnce(new Error("Provider connection failed"));
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const healthSpy = vi.spyOn(options.health, "recordFailure");
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("internal_error");
      expect(result.error!.credentialShielded).toBe(true);
      expect(result.error!.message).toBe("Provider adapter execution failed");
      expect(result.error!.message).not.toContain("Provider connection failed");
      expect(result.receipt).toBeDefined();
      expect(result.receipt.validationState).toBe("failed");
      expect(result.response).toBeUndefined();
      expect(healthSpy).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        undefined,
        "adapter_execution_error",
      );
    });
  });
  describe("serialized outputs do not contain test secret", () => {
    it("success output does not leak secret", async () => {
      const options = makeBridgeOptions();
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(TEST_SECRET);
    });
    it("error output does not leak secret", async () => {
      const adapter = makeMockAdapter();
      adapter.execute.mockRejectedValueOnce(new Error(`Auth failed with ${TEST_SECRET}`));
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(TEST_SECRET);
    });
  });
  describe("ordered execution spies", () => {
    it("proves routing and metadata checks precede adapter invocation", async () => {
      const callOrder: string[] = [];
      const adapter = makeMockAdapter();
      adapter.execute.mockImplementation(async () => {
        callOrder.push("adapter.execute");
        return { text: "test", usage: { inputTokens: 5, outputTokens: 5 } };
      });
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      vi.spyOn(options.routing, "decide").mockImplementation(() => {
        callOrder.push("routing.decide");
        return makeSelectedDecision();
      });
      vi.spyOn(options.credential, "resolveMetadata").mockImplementation(() => {
        callOrder.push("credential.resolveMetadata");
        return {
          providerId: TEST_PROVIDER_ID,
          keyId: TEST_KEY_ID,
          available: true,
          source: "env",
        };
      });
      vi.spyOn(options.health, "isUsable").mockImplementation(() => {
        callOrder.push("health.isUsable");
        return true;
      });
      vi.spyOn(options.quota, "canUse").mockImplementation(() => {
        callOrder.push("quota.canUse");
        return { allowed: true, reason: "within_quota", usage: {
          providerId: TEST_PROVIDER_ID, modelId: TEST_MODEL_ID,
          day: "2026-06-15", requestCount: 0, estimatedTokenCount: 0, actualTokenCount: 0,
        }};
      });
      const bridge = new ProviderExecutionBridge(options);
      await bridge.execute(makeRequest());
      const routingIdx = callOrder.indexOf("routing.decide");
      const credentialIdx = callOrder.indexOf("credential.resolveMetadata");
      const healthIdx = callOrder.indexOf("health.isUsable");
      const quotaIdx = callOrder.indexOf("quota.canUse");
      const adapterIdx = callOrder.indexOf("adapter.execute");
      expect(routingIdx).toBeGreaterThanOrEqual(0);
      expect(credentialIdx).toBeGreaterThanOrEqual(0);
      expect(healthIdx).toBeGreaterThanOrEqual(0);
      expect(quotaIdx).toBeGreaterThanOrEqual(0);
      expect(adapterIdx).toBeGreaterThanOrEqual(0);
      expect(routingIdx).toBeLessThan(credentialIdx);
      expect(credentialIdx).toBeLessThan(healthIdx);
      expect(healthIdx).toBeLessThan(quotaIdx);
      expect(quotaIdx).toBeLessThan(adapterIdx);
    });
  });
  describe("negative source assertions", () => {
    it("bridge source does not reference concrete adapters or network", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const bridgeSrc = fs.readFileSync(
        path.resolve(__dirname, "../src/provider-execution-bridge.ts"),
        "utf-8",
      );
      expect(bridgeSrc).not.toMatch(/alibaba/i);
      expect(bridgeSrc).not.toMatch(/deepseek/i);
      expect(bridgeSrc).not.toMatch(/dashscope/i);
      expect(bridgeSrc).not.toMatch(/\bfetch\s*\(/);
      expect(bridgeSrc).not.toMatch(/https?:\/\//);
      expect(bridgeSrc).not.toMatch(/resolveSecretForRuntime/);
      expect(bridgeSrc).not.toMatch(/\.env\.local/);
      expect(bridgeSrc).not.toMatch(/DASHSCOPE_API_KEY/);
      expect(bridgeSrc).not.toMatch(/DEEPSEEK_API_KEY/);
    });
  });
});
