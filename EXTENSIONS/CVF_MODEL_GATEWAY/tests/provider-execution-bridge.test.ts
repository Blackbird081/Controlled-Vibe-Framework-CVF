import { createAlibabaExecutionAdapter } from "../src/providers/alibaba/execution-adapter";
import { ProviderExecutionError } from "../src/unified-gateway-interface-contract";
/**
 * Provider Execution Bridge - Deterministic Tests
 *
 * Tests all 14 required cases from the P4B-A work order.
 * No network calls, no real credentials, no concrete adapter imports.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
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
import { CredentialBoundary, fingerprintSecret } from "../src/credential-boundary";
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
    it("forwards one caller AbortSignal to the selected adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const controller = new AbortController();
      await bridge.execute(makeRequest(), { signal: controller.signal });
      expect(adapter.execute).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
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
  describe("material context manifest binding", () => {
    it("binds a manifest to the successful response and receipt call order precedes the adapter", async () => {
      const callOrder: string[] = [];
      const adapter = makeMockAdapter();
      adapter.execute.mockImplementation(async () => {
        callOrder.push("adapter.execute");
        return { text: "test", usage: { inputTokens: 1, outputTokens: 1 } };
      });
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.materialContextManifest).toBeDefined();
      expect(result.materialContextManifest!.traceId).toBe(TEST_TRACE_ID);
      expect(result.materialContextManifest!.selectedProviderId).toBe(TEST_PROVIDER_ID);
      expect(result.materialContextManifest!.selectedModelId).toBe(TEST_MODEL_ID);
      expect(result.materialContextManifestDisposition).toBe("attached");
      expect(result.receipt.metadata.materialContextManifestDigest).toBe(
        result.materialContextManifest!.manifestDigest,
      );
      expect(result.receipt.traceId).toBe(result.materialContextManifest!.traceId);
      expect(result.receipt.providerId).toBe(result.materialContextManifest!.selectedProviderId);
      expect(result.receipt.selectedModelId).toBe(result.materialContextManifest!.selectedModelId);
      const classes = result.materialContextManifest!.entries.map((e) => e.contextClass).sort();
      expect(classes).toEqual(["metadata", "policy", "prompt", "routing", "systemPrompt"]);
      expect(adapter.execute).toHaveBeenCalledTimes(1);
    });
    it("attaches a manifest to a shielded adapter-throw error result", async () => {
      const adapter = makeMockAdapter();
      adapter.execute.mockRejectedValueOnce(new Error("boom"));
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.error).toBeDefined();
      expect(result.materialContextManifest).toBeDefined();
      expect(result.materialContextManifest!.traceId).toBe(TEST_TRACE_ID);
      expect(result.materialContextManifestDisposition).toBe("attached");
      expect(result.receipt.metadata.materialContextManifestDigest).toBe(
        result.materialContextManifest!.manifestDigest,
      );
    });
    it("does not build or attach a manifest for a routing-stopped request, and never calls the adapter", async () => {
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
      expect(result.materialContextManifest).toBeUndefined();
      expect(result.materialContextManifestDisposition).toBe("not_built_precondition_stopped");
      expect(result.receipt.metadata.materialContextManifestDisposition).toBe(
        "not_built_precondition_stopped",
      );
      expect(adapter.execute).not.toHaveBeenCalled();
    });
    it("rejects a request whose canonicalization is hostile before the adapter is ever called", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;
      const request = makeRequest({ metadata: cyclic });
      const result = await bridge.execute(request);
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("invalid_request");
      expect(result.error!.credentialShielded).toBe(true);
      expect(result.receipt.validationState).toBe("failed");
      expect(result.response).toBeUndefined();
      expect(result.materialContextManifestDisposition).toBe("invalid");
      expect(result.receipt.metadata.materialContextManifestDisposition).toBe("invalid");
      expect(adapter.execute).not.toHaveBeenCalled();
    });
    it("rejects a request carrying a raw credential-like metadata key before the adapter is ever called", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const request = makeRequest({ metadata: { apiKey: "sk-should-never-cross-the-bridge" } });
      const result = await bridge.execute(request);
      expect(result.error).toBeDefined();
      expect(result.error!.errorClass).toBe("invalid_request");
      expect(result.materialContextManifestDisposition).toBe("invalid");
      expect(adapter.execute).not.toHaveBeenCalled();
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("sk-should-never-cross-the-bridge");
    });
    it("manifest never contains raw prompt, systemPrompt, or metadata material in a successful response", async () => {
      const secretPrompt = "the exact raw prompt text";
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
      });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(
        makeRequest({ prompt: secretPrompt, systemPrompt: "the exact raw system prompt" }),
      );
      const serialized = JSON.stringify(result.materialContextManifest);
      expect(serialized).not.toContain(secretPrompt);
      expect(serialized).not.toContain("the exact raw system prompt");
    });
  });
  describe("CSCC-R1-T2 canonicalExecutionId propagation (additive, legacy-compatible)", () => {
    it("omits canonicalExecutionId on the receipt when the request omits the carrier (legacy caller)", async () => {
      const options = makeBridgeOptions();
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest());
      expect(result.receipt.canonicalExecutionId).toBeUndefined();
      expect(result.materialContextManifest?.canonicalExecutionId).toBeUndefined();
      expect(result.attemptOutcome).toBeUndefined();
    });

    it("propagates canonicalExecutionId onto the receipt and manifest for a successful call", async () => {
      const options = makeBridgeOptions();
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest({ canonicalExecutionId: "env-canonical-success" }));
      expect(result.receipt.canonicalExecutionId).toBe("env-canonical-success");
      expect(result.materialContextManifest?.canonicalExecutionId).toBe("env-canonical-success");
    });

    it("propagates canonicalExecutionId identically on a pre-adapter-stopped receipt", async () => {
      const options = makeBridgeOptions();
      const bridge = new ProviderExecutionBridge(options);
      const request = makeRequest({
        canonicalExecutionId: "env-canonical-stopped",
        policy: { traceId: TEST_TRACE_ID, policyResult: "deny", reason: "test_denied" },
      });
      const result = await bridge.execute(request);
      expect(result.receipt.canonicalExecutionId).toBe("env-canonical-stopped");
    });
  });

  describe("CSCC-R1-T2 beforeProviderInvoke atomic attempt boundary", () => {
    it("legacy callers that omit beforeProviderInvoke see unchanged behavior (byte-identical call sequence)", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const bridge = new ProviderExecutionBridge(options);
      const result = await bridge.execute(makeRequest(), {});
      expect(adapter.execute).toHaveBeenCalledTimes(1);
      expect(result.response).toBeDefined();
      expect(result.attemptOutcome).toBeUndefined();
    });

    it("invokes the callback exactly once immediately before the single adapter.execute call, only after every pre-adapter stop passed", async () => {
      const callOrder: string[] = [];
      const adapter = makeMockAdapter();
      adapter.execute.mockImplementation(async () => {
        callOrder.push("adapter.execute");
        return { text: "test", usage: { inputTokens: 1, outputTokens: 1 } };
      });
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const bridge = new ProviderExecutionBridge(options);
      const beforeProviderInvoke = vi.fn(async () => {
        callOrder.push("beforeProviderInvoke");
        return { decision: "allow" as const, attemptIndex: 0 };
      });
      const result = await bridge.execute(makeRequest(), { beforeProviderInvoke });
      expect(beforeProviderInvoke).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(["beforeProviderInvoke", "adapter.execute"]);
      expect(result.attemptOutcome).toBe("invoked");
    });

    it("a callback denial never invokes the adapter and reports attemptOutcome 'denied'", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const bridge = new ProviderExecutionBridge(options);
      const beforeProviderInvoke = vi.fn(async () => ({
        decision: "deny" as const,
        attemptIndex: 0,
        reason: "quota_exhausted",
      }));
      const result = await bridge.execute(makeRequest(), { beforeProviderInvoke });
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("denied");
      // CSCC-R1-T2 rework: the frozen T1 Callback Outcome Table maps a
      // callback denial to errorClass "admission_blocked" (the same class
      // the pre-adapter checkBridgeAdmission stop uses), not "internal_error".
      expect(result.error?.errorClass).toBe("admission_blocked");
    });

    it("a callback throw never invokes the adapter and reports attemptOutcome 'callback_error'", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const bridge = new ProviderExecutionBridge(options);
      const beforeProviderInvoke = vi.fn(async () => {
        throw new Error("simulated admission rejection");
      });
      const result = await bridge.execute(makeRequest(), { beforeProviderInvoke });
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("callback_error");
      expect(result.error?.errorClass).toBe("internal_error");
    });

    it("every pre-adapter stop never invokes the callback and reports attemptOutcome 'not_reached'", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const bridge = new ProviderExecutionBridge(options);
      const beforeProviderInvoke = vi.fn(async () => ({ decision: "allow" as const, attemptIndex: 0 }));
      const request = makeRequest({
        policy: { traceId: TEST_TRACE_ID, policyResult: "deny", reason: "test_denied" },
      });
      const result = await bridge.execute(request, { beforeProviderInvoke });
      expect(beforeProviderInvoke).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
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


describe("typed provider terminal diagnostics (single attempt)", () => {
  it.each([
    ["request_cancelled", "provider_unavailable", false, 499],
    ["provider_timeout", "provider_unavailable", false, undefined],
    ["provider_http_error", "provider_unavailable", false, 401],
    ["provider_http_error", "provider_unavailable", true, 429],
    ["provider_http_error", "provider_unavailable", true, 503],
    ["output_incomplete", "invalid_request", false, 200],
    ["quota_locked", "policy_denied", false, undefined],
    ["credential_unavailable", "credential_shielded", false, undefined],
    ["destination_denied", "policy_denied", false, undefined],
    ["invalid_identity", "invalid_request", false, undefined],
    ["network_error", "provider_unavailable", false, undefined],
    ["unknown_error", "internal_error", false, undefined],
  ] as const)("preserves %s/%s without repeating invocation", async (code, errorClass, retryable, httpStatus) => {
    const adapter = makeMockAdapter();
    const failure = new ProviderExecutionError(code, { httpStatus, usage: { totalTokens: 8 } });
    failure.message = TEST_SECRET; (failure as any).cause = TEST_SECRET;
    adapter.execute.mockRejectedValueOnce(failure);
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const quotaUse = vi.spyOn(options.quota, "recordUse");
    const result = await new ProviderExecutionBridge(options).execute(makeRequest({ canonicalExecutionId: "canonical-safe" }), {
      beforeProviderInvoke: async () => ({ decision: "allow", attemptIndex: 1 }),
    });
    expect(adapter.execute).toHaveBeenCalledTimes(1);
    expect(result.error).toMatchObject({ errorClass, retryable, credentialShielded: true, providerDiagnostic: { code, usage: { totalTokens: 8 } } });
    expect(result.error?.providerDiagnostic?.httpStatus).toBe(httpStatus);
    expect(result.attemptOutcome).toBe("invoked");
    expect(result.receipt.canonicalExecutionId).toBe("canonical-safe");
    expect(result.materialContextManifestDisposition).toBe("attached");
    expect(quotaUse).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });
  it("retains the existing shielded legacy adapter-error behavior", async () => {
    const adapter = makeMockAdapter(); adapter.execute.mockRejectedValueOnce(new Error(TEST_SECRET));
    const result = await new ProviderExecutionBridge(makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) })).execute(makeRequest());
    expect(result.error).toEqual({ errorClass: "internal_error", traceId: TEST_TRACE_ID, message: "Provider adapter execution failed", credentialShielded: true, retryable: true });
    expect(adapter.execute).toHaveBeenCalledTimes(1); expect(result.attemptOutcome).toBeUndefined();
  });
  it("carries total-only actual usage without recording a fabricated token total", async () => {
    const adapter = makeMockAdapter(); adapter.execute.mockResolvedValueOnce({ text: "answer", providerUsage: { totalTokens: 9, secret: TEST_SECRET } });
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) }); const quotaUse = vi.spyOn(options.quota, "recordUse");
    const result = await new ProviderExecutionBridge(options).execute(makeRequest());
    expect(result.response?.providerUsage).toEqual({ totalTokens: 9 }); expect(result.response?.usage).toBeUndefined();
    expect(quotaUse).toHaveBeenCalledWith(expect.objectContaining({ actualTokens: undefined }));
    expect(JSON.stringify(result.response)).not.toContain(TEST_SECRET);
  });
});


describe("credential lineage across awaited attempt admission", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-12T07:00:00Z")); });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
  const oldKey = "before-admission-fixture-key";
  const newKey = "after-admission-fixture-key";
  function fixture() {
    const env = { ALIBABA_FIXTURE_KEY: oldKey, CVF_ALIBABA_FREE_QUOTA_ONLY: "1", CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1" };
    const credential = new CredentialBoundary(env);
    const credentialRef = { providerId: "alibaba", keyId: "fixture", envNames: ["ALIBABA_FIXTURE_KEY"] };
    const response = { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "answer" }, finish_reason: "stop" }] }), text: async () => "" };
    const fetchImpl = vi.fn(async (_url: string, _init: { headers: Record<string, string> }) => response);
    const adapter = createAlibabaExecutionAdapter({ credential, credentialRef, env, fetchImpl });
    const options = makeBridgeOptions();
    const registry = new ProviderRegistry();
    registry.register({ id: "alibaba", displayName: "Alibaba", status: "enabled", riskClass: "low", models: [{ id: "qwen-plus-character", riskClass: "low" }] });
    const bridge = new ProviderExecutionBridge({ ...options, routing: new RoutingPolicyEngine(registry, options.health, options.quota), credential, credentialRefs: new Map([["alibaba", credentialRef]]), adapters: new Map([["alibaba", adapter]]) });
    const request = makeRequest({ canonicalExecutionId: "canonical-rotating-key", policy: { traceId: TEST_TRACE_ID, policyResult: "allow", allowedProviderIds: ["alibaba"] }, routing: { traceId: TEST_TRACE_ID, preferredProviderId: "alibaba", requestedModelId: "qwen-plus-character" } });
    return { env, response, fetchImpl, bridge, request };
  }
  it("binds success receipt to the key used by HTTP after awaited admission rotates it", async () => {
    const f = fixture();
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => { await Promise.resolve(); f.env.ALIBABA_FIXTURE_KEY = newKey; return { decision: "allow", attemptIndex: 1 }; } });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
    expect(f.fetchImpl.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${newKey}`);
    expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret(newKey));
    expect(result.receipt.credentialFingerprint).not.toBe(fingerprintSecret(oldKey));
    expect(result.response?.text).toBe("answer"); expect(result.attemptOutcome).toBe("invoked");
    expect(JSON.stringify(result)).not.toContain(newKey);
  });
  it("binds typed HTTP failure to its actual key without stale preflight fingerprint", async () => {
    const f = fixture(); f.response.ok = false; f.response.status = 401;
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => { await Promise.resolve(); f.env.ALIBABA_FIXTURE_KEY = newKey; return { decision: "allow", attemptIndex: 1 }; } });
    expect(f.fetchImpl.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${newKey}`);
    expect(result.error?.providerDiagnostic).toEqual({ code: "provider_http_error", httpStatus: 401, credentialFingerprint: fingerprintSecret(newKey) });
    expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret(newKey));
    expect(result.receipt.credentialFingerprint).not.toBe(fingerprintSecret(oldKey));
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("omits actual fingerprint when admission removes the key before invocation", async () => {
    const f = fixture();
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => { await Promise.resolve(); f.env.ALIBABA_FIXTURE_KEY = ""; return { decision: "allow", attemptIndex: 1 }; } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
    expect(result.error?.providerDiagnostic).toEqual({ code: "credential_unavailable" });
    expect(result.receipt.credentialFingerprint).toBeUndefined();
    expect(result.attemptOutcome).toBe("invoked"); // Adapter boundary crossed; HTTP was not contacted.
  });
  it("omits stale fingerprint on cancellation during awaited admission", async () => {
    const f = fixture(); const controller = new AbortController();
    const result = await f.bridge.execute(f.request, { signal: controller.signal, beforeProviderInvoke: async () => { await Promise.resolve(); controller.abort("private reason"); return { decision: "allow", attemptIndex: 1 }; } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
    expect(result.error?.providerDiagnostic).toEqual({ code: "request_cancelled", httpStatus: 499 });
    expect(result.receipt.credentialFingerprint).toBeUndefined(); expect(result.attemptOutcome).toBe("invoked");
  });
  it.each(["not-a-fingerprint", "012345ABCDEF", "012345abcdef0"]) ("strips malformed adapter success fingerprint %s without fallback", async credentialFingerprint => {
    const adapter = makeMockAdapter(); adapter.execute.mockResolvedValueOnce({ text: "answer", credentialFingerprint });
    const result = await new ProviderExecutionBridge(makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) })).execute(makeRequest());
    expect(result.receipt.credentialFingerprint).toBeUndefined();
  });
  it("retains legacy preflight fingerprint when a legacy adapter omits the new field", async () => {
    const result = await new ProviderExecutionBridge(makeBridgeOptions()).execute(makeRequest());
    expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret(TEST_SECRET));
  });
  it("retains legacy untyped error fingerprint behavior", async () => {
    const adapter = makeMockAdapter(); adapter.execute.mockRejectedValueOnce(new Error("legacy"));
    const result = await new ProviderExecutionBridge(makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) })).execute(makeRequest());
    expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret(TEST_SECRET));
  });
});

describe('native subscription bridge boundary',()=>{
 function nativeOptions() {
  const registry=new ProviderRegistry();registry.register({id:'claude',displayName:'Claude',status:'enabled',riskClass:'low',models:[{id:'sonnet',riskClass:'low'}]});
  const health=new ProviderHealthMonitor(), quota=new QuotaLedger();const adapter={providerId:'claude',execute:vi.fn(async()=>({text:'actual',executionSurface:'claude_cli_subscription' as const,nativeProcessState:'started' as const,observedModelId:'actual-model',credentialFingerprint:'abcdef123456'}))};
  const resolver=vi.fn(async()=>({source:'native_subscription' as const,providerId:'claude' as const,available:true,executionSurface:'claude_cli_subscription' as const}));
  return {adapter,resolver,options:makeBridgeOptions({routing:new RoutingPolicyEngine(registry,health,quota),health,quota,credentialRefs:new Map([['claude',{source:'native_subscription' as const,providerId:'claude' as const}]]),adapters:new Map([['claude',adapter]]),nativeSubscriptionResolver:resolver})};
 }
 const request=()=>makeRequest({canonicalExecutionId:'native-1',traceId:'native-1',policy:{traceId:'native-1',policyResult:'allow',reason:'ok',allowedProviderIds:['claude']},routing:{traceId:'native-1',preferredProviderId:'claude',requestedModelId:'sonnet'}});
 it('uses native availability before callback and emits no API key identity or fingerprint',async()=>{const {adapter,resolver,options}=nativeOptions();const callback=vi.fn(async()=>({decision:'allow' as const,attemptIndex:0}));const result=await new ProviderExecutionBridge(options).execute(request(),{beforeProviderInvoke:callback});expect(resolver).toHaveBeenCalledTimes(1);expect(callback).toHaveBeenCalledTimes(1);expect(adapter.execute).toHaveBeenCalledTimes(1);expect(result.response).toMatchObject({executionSurface:'claude_cli_subscription',nativeProcessState:'started',observedModelId:'actual-model'});expect(result.receipt.credentialKeyId).toBeUndefined();expect(result.receipt.credentialFingerprint).toBeUndefined();});
 it('blocks missing/unavailable native resolver before callback and adapter',async()=>{for(const resolver of [undefined,async()=>({source:'native_subscription' as const,providerId:'claude' as const,available:false,executionSurface:'claude_cli_subscription' as const})]){const t=nativeOptions();const callback=vi.fn();const result=await new ProviderExecutionBridge({...t.options,nativeSubscriptionResolver:resolver}).execute(request(),{beforeProviderInvoke:callback});expect(result.error?.errorClass).toBe('credential_shielded');expect(callback).not.toHaveBeenCalled();expect(t.adapter.execute).not.toHaveBeenCalled();}});
  it('callback denial and typed native failures never leak credential fingerprint',async()=>{const t=nativeOptions();const denied=await new ProviderExecutionBridge(t.options).execute(request(),{beforeProviderInvoke:async()=>({decision:'deny',attemptIndex:0,reason:'denied'})});expect(denied.receipt.credentialKeyId).toBeUndefined();expect(denied.receipt.credentialFingerprint).toBeUndefined();expect(t.adapter.execute).not.toHaveBeenCalled();const fail={providerId:'claude',execute:async()=>{throw new ProviderExecutionError('credential_unavailable',{credentialFingerprint:'abcdef123456',executionSurface:'claude_cli_subscription',nativeProcessState:'not_started'});}};const failed=await new ProviderExecutionBridge({...t.options,adapters:new Map([['claude',fail]])}).execute(request(),{beforeProviderInvoke:async()=>({decision:'allow',attemptIndex:0})});expect(failed.error?.providerDiagnostic).toMatchObject({code:'credential_unavailable',executionSurface:'claude_cli_subscription',nativeProcessState:'not_started'});expect(failed.error?.providerDiagnostic?.credentialFingerprint).toBeUndefined();expect(failed.receipt.credentialFingerprint).toBeUndefined();});

 it('strips object and array enum impersonators from diagnostics and receipt metadata',async()=>{const state=['started'] as unknown as 'started';const model=['private-value'] as unknown as string;const e=new ProviderExecutionError('quota_locked',{executionSurface:'claude_cli_subscription',nativeProcessState:state});expect(e.diagnostic.nativeProcessState).toBeUndefined();expect(e.toGatewayEnvelope('trace').message).not.toContain('Alibaba');const t=nativeOptions();const adapter={providerId:'claude',execute:async()=>({text:'ok',executionSurface:'claude_cli_subscription' as const,nativeProcessState:state,observedModelId:model})};const result=await new ProviderExecutionBridge({...t.options,adapters:new Map([['claude',adapter]])}).execute(request());expect(result.response?.nativeProcessState).toBe('unknown');expect(result.response?.observedModelId).toBeUndefined();expect(JSON.stringify(result)).not.toContain('private-value');});

});
