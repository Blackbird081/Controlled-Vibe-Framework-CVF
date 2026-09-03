/**
 * Canonical Execution Port - Deterministic Tests (CSCC-R1-T2)
 *
 * Covers the frozen T1 "Future T2 Deterministic Test-Name Manifest" risk
 * classes 1-7 and 9 plus Gateway identity coverage, using the exact
 * assertions named in
 * `docs/reference/CVF_CANONICAL_EXECUTION_PORT_INTERFACE_CONTRACT_2026-09-03.md`.
 * No network calls, no real credentials, no concrete provider adapter.
 *
 * Risk class 10 (integrated deterministic end-to-end across SOT3 -> port ->
 * adapter -> receipt/manifest/SOT3-record) is covered in
 * `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/canonical-web-gateway-execution.test.ts`,
 * the only in-manifest location where SOT3 and the port compose together.
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CanonicalExecutionAdapter,
  CANONICAL_EXECUTION_PORT_VERSION,
  type CanonicalExecutionPortRequest,
  type CanonicalExecutionAttemptBoundaryOutcome,
} from "../src/canonical-execution-port";
import { ProviderExecutionBridge } from "../src/provider-execution-bridge";
import type { ProviderExecutionAdapter, ProviderExecutionAdapterInput, ProviderExecutionAdapterResult, ProviderExecutionBridgeOptions } from "../src/provider-execution-bridge";
import type { CredentialReference } from "../src/credential-boundary";
import { RoutingPolicyEngine } from "../src/routing-policy";
import { CredentialBoundary } from "../src/credential-boundary";
import { ProviderHealthMonitor } from "../src/provider-health";
import { QuotaLedger } from "../src/quota-ledger";
import { ProviderRegistry } from "../src/provider-registry";
import { GatewayReceiptBuilder } from "../src/gateway-receipt";

const TEST_PROVIDER_ID = "test-provider";
const TEST_MODEL_ID = "test-model-v1";
const TEST_KEY_ID = "test-key-01";
const TEST_SECRET = "test-secret-value-for-testing";
const TEST_CANONICAL_ID = "env-canonical-001";

function makeCredentialRef(): CredentialReference {
  return { providerId: TEST_PROVIDER_ID, keyId: TEST_KEY_ID, envNames: ["TEST_API_KEY"] };
}

function makeMockAdapter(): ProviderExecutionAdapter & { execute: ReturnType<typeof vi.fn> } {
  const executeFn = vi.fn(
    async (_input: ProviderExecutionAdapterInput): Promise<ProviderExecutionAdapterResult> => ({
      text: "Hello from test adapter",
      usage: { inputTokens: 10, outputTokens: 15 },
    }),
  );
  return { providerId: TEST_PROVIDER_ID, execute: executeFn };
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
    () => new Date("2026-09-03T10:00:00Z"),
    () => "testnonce",
  );
  const routing = new RoutingPolicyEngine(registry, health, quota);
  const credentialRefs = new Map<string, CredentialReference>();
  credentialRefs.set(TEST_PROVIDER_ID, makeCredentialRef());
  const adapters = new Map<string, ProviderExecutionAdapter>();
  adapters.set(TEST_PROVIDER_ID, makeMockAdapter());
  return { routing, credential, health, quota, receipt, credentialRefs, adapters, ...overrides };
}

function makePortRequest(
  attemptBoundary: CanonicalExecutionPortRequest["attemptBoundary"],
  overrides?: Partial<CanonicalExecutionPortRequest>,
): CanonicalExecutionPortRequest {
  return {
    canonicalExecutionId: TEST_CANONICAL_ID,
    prompt: "Hello, world",
    policy: {
      traceId: TEST_CANONICAL_ID,
      policyResult: "allow",
      reason: "test_allow",
      allowedProviderIds: [TEST_PROVIDER_ID],
    },
    preferredProviderId: TEST_PROVIDER_ID,
    routing: { requestedModelId: TEST_MODEL_ID, estimatedTokens: 100 },
    attemptBoundary,
    ...overrides,
  };
}

function makeAllowCallback(attemptIndex = 0) {
  return vi.fn(
    async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => ({ decision: "allow", attemptIndex }),
  );
}

describe("CanonicalExecutionAdapter", () => {
  it("exports the port version constant", () => {
    expect(CANONICAL_EXECUTION_PORT_VERSION).toBe("cvf.canonicalExecutionPort.csccR1T2.v1");
  });

  // Risk class 1: every pre-adapter stop leaves both counts zero (spy never called).
  describe("every pre-adapter stop leaves admittedCount and providerCallCount unchanged", () => {
    it("routing denied never invokes the callback or the adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const request = makePortRequest(callback, {
        policy: { traceId: TEST_CANONICAL_ID, policyResult: "deny", reason: "test_denied" },
      });
      const result = await port.execute(request);
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("policy_denied");
    });

    it("no candidate provider never invokes the callback or the adapter", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const request = makePortRequest(callback, {
        policy: {
          traceId: TEST_CANONICAL_ID,
          policyResult: "allow",
          reason: "test_allow",
          allowedProviderIds: ["nonexistent-provider"],
        },
      });
      const result = await port.execute(request);
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("no_candidate");
    });

    it("missing adapter registration never invokes the callback", async () => {
      const options = makeBridgeOptions({ adapters: new Map() });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("provider_unavailable");
    });

    it("missing credential reference never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({
        adapters: new Map([[TEST_PROVIDER_ID, adapter]]),
        credentialRefs: new Map(),
      });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("credential_shielded");
    });

    it("unavailable credential metadata never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const credential = new CredentialBoundary({});
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]), credential });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("credential_shielded");
    });

    it("failed health check never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      options.health.recordFailure(TEST_PROVIDER_ID, 500, "test");
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
    });

    it("exceeded quota never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      options.quota.setLimit(TEST_PROVIDER_ID, TEST_MODEL_ID, { requestsPerDay: 1 });
      options.quota.recordUse({ providerId: TEST_PROVIDER_ID, modelId: TEST_MODEL_ID });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
    });

    it("checkBridgeAdmission block never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const admissionRecords = new Map([[TEST_PROVIDER_ID, {
        status: "blocked" as const,
        providerId: TEST_PROVIDER_ID,
        modelId: TEST_MODEL_ID,
        requestedMethod: "execute",
        normalizedMethod: "execute",
        supportedMethods: ["execute"],
        conformanceStatus: "blocked" as const,
        liveExecutionAuthorized: false as const,
        reasonCodes: ["conformance_blocked" as const],
        reasons: ["test_admission_blocked"],
        admissionTimestamp: "2026-09-03T00:00:00.000Z",
        traceId: "admission-trace-001",
      }]]);
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]), admissionRecords });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback));
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("admission_blocked");
    });

    it("material context manifest build/validate failure never invokes the callback", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;
      const result = await port.execute(makePortRequest(callback, { metadata: cyclic }));
      expect(callback).not.toHaveBeenCalled();
      expect(adapter.execute).not.toHaveBeenCalled();
      expect(result.attemptOutcome).toBe("not_reached");
      expect(result.error?.errorClass).toBe("invalid_request");
    });
  });

  // Risk class 2: callback denial invokes no adapter, increments neither count.
  it("callback denial short-circuits before adapter.execute with no admitted or provider-call count change", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
    const callback = vi.fn(
      async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => ({
        decision: "deny",
        attemptIndex: 0,
        reason: "attempt_quota_exhausted",
      }),
    );
    const result = await port.execute(makePortRequest(callback));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(adapter.execute).not.toHaveBeenCalled();
    expect(result.attemptOutcome).toBe("denied");
    // CSCC-R1-T2 rework: the frozen T1 Callback Outcome Table maps a
    // callback denial to errorClass "admission_blocked" (the same class the
    // pre-adapter checkBridgeAdmission stop uses), not "internal_error".
    expect(result.error?.errorClass).toBe("admission_blocked");
  });

  // Risk class 3: callback allow increments both exactly once immediately before one adapter call.
  it("callback allow returns its fresh attemptIndex after incrementing admittedCount and providerCallCount exactly once before the single adapter.execute call", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
    let admittedCount = 0;
    let providerCallCount = 0;
    const callback = vi.fn(async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
      admittedCount += 1;
      providerCallCount += 1;
      expect(adapter.execute).not.toHaveBeenCalled();
      return { decision: "allow", attemptIndex: 0 };
    });
    const result = await port.execute(makePortRequest(callback));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(admittedCount).toBe(1);
    expect(providerCallCount).toBe(1);
    expect(adapter.execute).toHaveBeenCalledTimes(1);
    expect(result.attemptOutcome).toBe("invoked");
    expect(result.response).toBeDefined();
  });

  // Risk class 4: callback throw produces typed no-invocation error.
  it("callback rejection before admission maps to a typed internal_error result without invoking the adapter or mutating the attempt ledger", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
    const callback = vi.fn(async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
      throw new Error("admission call rejected");
    });
    const result = await port.execute(makePortRequest(callback));
    expect(adapter.execute).not.toHaveBeenCalled();
    expect(result.error?.errorClass).toBe("internal_error");
    expect(result.attemptOutcome).toBe("callback_error");
  });

  // Risk class 5: retry receives a fresh attempt index.
  it("a second port call after retry returns a fresh attemptIndex, never reusing the prior one", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const bridge = new ProviderExecutionBridge(options);
    const port = new CanonicalExecutionAdapter(bridge);
    const seenIndices: number[] = [];
    let nextIndex = 0;
    const callback = vi.fn(async (): Promise<CanonicalExecutionAttemptBoundaryOutcome> => {
      const attemptIndex = nextIndex;
      nextIndex += 1;
      seenIndices.push(attemptIndex);
      return { decision: "allow", attemptIndex };
    });
    await port.execute(makePortRequest(callback));
    await port.execute(makePortRequest(callback));
    expect(seenIndices).toHaveLength(2);
    expect(seenIndices[0]).not.toBe(seenIndices[1]);
    expect(adapter.execute).toHaveBeenCalledTimes(2);
  });

  // Risk class 6: legacy Gateway caller omission preserves behavior.
  it("ProviderExecutionBridge.execute without beforeProviderInvoke behaves exactly as before this addition", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const bridge = new ProviderExecutionBridge(options);
    const result = await bridge.execute({
      traceId: "legacy-trace-001",
      prompt: "Hello, world",
      policy: {
        traceId: "legacy-trace-001",
        policyResult: "allow",
        reason: "test_allow",
        allowedProviderIds: [TEST_PROVIDER_ID],
      },
      routing: { traceId: "legacy-trace-001", preferredProviderId: TEST_PROVIDER_ID, requestedModelId: TEST_MODEL_ID },
    });
    expect(result.attemptOutcome).toBeUndefined();
    expect(result.receipt.canonicalExecutionId).toBeUndefined();
    expect(result.response).toBeDefined();
    expect(adapter.execute).toHaveBeenCalledTimes(1);
  });

  // Risk class 7: canonical Web adapter requires the callback.
  it("the canonical Web port adapter refuses to construct a CanonicalExecutionPortRequest without attemptBoundary", async () => {
    const adapter = makeMockAdapter();
    const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
    const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
    const requestWithoutCallback = {
      ...makePortRequest(makeAllowCallback()),
    } as CanonicalExecutionPortRequest;
    delete (requestWithoutCallback as Partial<CanonicalExecutionPortRequest>).attemptBoundary;
    await expect(port.execute(requestWithoutCallback)).rejects.toThrow(TypeError);
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  // Gateway identity coverage: canonicalExecutionId propagates to receipt and manifest.
  describe("Gateway identity coverage", () => {
    it("propagates canonicalExecutionId onto GatewayReceipt and MaterialContextManifest without payload copying", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const secretPrompt = "the exact raw canonical prompt text";
      const callback = makeAllowCallback();
      const result = await port.execute(makePortRequest(callback, { prompt: secretPrompt }));
      expect(result.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
      expect(result.receipt.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
      expect(result.materialContextManifest?.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
      const serializedReceipt = JSON.stringify(result.receipt);
      const serializedManifest = JSON.stringify(result.materialContextManifest);
      expect(serializedReceipt).not.toContain(secretPrompt);
      expect(serializedManifest).not.toContain(secretPrompt);
    });

    it("populates canonicalExecutionId identically on a pre-adapter-stopped receipt", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = makeAllowCallback();
      const result = await port.execute(
        makePortRequest(callback, {
          policy: { traceId: TEST_CANONICAL_ID, policyResult: "deny", reason: "test_denied" },
        }),
      );
      expect(result.receipt.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
      expect(result.materialContextManifest).toBeUndefined();
    });

    it("callback input carries the same canonicalExecutionId as the request, mapped 1:1 to traceId", async () => {
      const adapter = makeMockAdapter();
      const options = makeBridgeOptions({ adapters: new Map([[TEST_PROVIDER_ID, adapter]]) });
      const port = new CanonicalExecutionAdapter(new ProviderExecutionBridge(options));
      const callback = vi.fn(async (input) => {
        expect(input.canonicalExecutionId).toBe(TEST_CANONICAL_ID);
        expect(input.traceId).toBe(TEST_CANONICAL_ID);
        expect(input.providerId).toBe(TEST_PROVIDER_ID);
        expect(input.modelId).toBe(TEST_MODEL_ID);
        return { decision: "allow" as const, attemptIndex: 0 };
      });
      await port.execute(makePortRequest(callback));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // Risk class 9: MAO (CVF_EXECUTION_PLANE_FOUNDATION) imports no Web package.
  describe("CVF_EXECUTION_PLANE_FOUNDATION imports the canonical port only from CVF_MODEL_GATEWAY, never from cvf-web", () => {
    it("zero source files under EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src reference cvf-web", () => {
      const executionPlaneSrcRoot = resolve(__dirname, "../../CVF_EXECUTION_PLANE_FOUNDATION/src");
      const tsFiles: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const entryPath = join(dir, entry);
          const stats = statSync(entryPath);
          if (stats.isDirectory()) {
            walk(entryPath);
          } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
            tsFiles.push(entryPath);
          }
        }
      };
      walk(executionPlaneSrcRoot);
      expect(tsFiles.length).toBeGreaterThan(0);

      const cvfWebImportPattern = /cvf-web/;
      const offendingFiles = tsFiles.filter((filePath) => cvfWebImportPattern.test(readFileSync(filePath, "utf-8")));
      expect(offendingFiles).toEqual([]);
    });
  });
});
