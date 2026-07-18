/**
 * P4B-B Live Proof Harness - Dry-Run Gate Tests
 *
 * These tests prove the harness is safe before any live call:
 *  - liveAuthorized=false performs NO network call and reads NO secret;
 *  - the bridge-compatible wrapper flows a fake response through the governed
 *    bridge when liveAuthorized=true with an injected fetch double;
 *  - no real key is read and no real network is touched in tests.
 *
 * No real provider, no real credential, no real network.
 */
import { describe, it, expect, vi } from "vitest";
import {
  runLiveProof,
  createOpenAiCompatibleExecuteAdapter,
  P4B_B_LIVE_PROOF_HARNESS_VERSION,
} from "../src/p4b-b-live-proof-harness";
import {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  resolveAlibabaDashScopeEndpoint,
} from "../src/alibaba-free-quota-model-ledger";
import type { LiveProofFetch } from "../src/p4b-b-live-proof-harness";
import type { CredentialReference } from "../src/credential-boundary";
import type { GatewayExecuteRequest } from "../src/unified-gateway-interface-contract";

const TRACE = "p4b-b-dry-run-trace-001";
const PROVIDER = "alibaba";
const MODEL = "qwen-turbo";

function makeRef(): CredentialReference {
  return {
    providerId: PROVIDER,
    keyId: "alibaba-key-01",
    envNames: ["DASHSCOPE_API_KEY", "ALIBABA_API_KEY"],
  };
}

function makeRequest(): GatewayExecuteRequest {
  return {
    traceId: TRACE,
    prompt: "ping",
    policy: {
      traceId: TRACE,
      policyResult: "allow",
      reason: "test_allow",
      allowedProviderIds: [PROVIDER],
    },
    routing: {
      traceId: TRACE,
      preferredProviderId: PROVIDER,
      requestedModelId: MODEL,
      estimatedTokens: 16,
    },
  };
}

function makeFetchDouble(): LiveProofFetch & { calls: number } {
  const fn = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: "pong" } }],
      usage: { prompt_tokens: 2, completion_tokens: 1 },
    }),
  }));
  const wrapped = fn as unknown as LiveProofFetch & { calls: number };
  Object.defineProperty(wrapped, "calls", { get: () => fn.mock.calls.length });
  return wrapped;
}

describe("P4B-B live proof harness", () => {
  it("exports the harness version constant", () => {
    expect(P4B_B_LIVE_PROOF_HARNESS_VERSION).toBe("cvf.p4bBLiveProofHarness.t2.v1");
  });

  it("defaults Alibaba live calls to the international DashScope endpoint", () => {
    expect(resolveAlibabaDashScopeEndpoint({})).toBe(ALIBABA_DASHSCOPE_INTL_ENDPOINT);
    expect(resolveAlibabaDashScopeEndpoint({
      ALIBABA_DASHSCOPE_ENDPOINT: "https://example.invalid/v1/chat/completions",
    })).toBe("https://example.invalid/v1/chat/completions");
  });

  describe("dry-run gate (liveAuthorized=false)", () => {
    it("returns a classified dry-run diagnostic", async () => {
      const result = await runLiveProof(
        {
          providerId: PROVIDER,
          modelId: MODEL,
          method: "complete",
          credentialReference: makeRef(),
          env: {},
          liveAuthorized: false,
        },
        makeRequest(),
      );
      expect(result.authorized).toBe(false);
      if (result.authorized === false) {
        expect(result.diagnostic).toBe("live_proof_not_authorized");
        expect(result.message).toContain("no network call");
      }
    });

    it("makes no network call when not authorized", async () => {
      const fetchDouble = makeFetchDouble();
      await runLiveProof(
        {
          providerId: PROVIDER,
          modelId: MODEL,
          method: "complete",
          credentialReference: makeRef(),
          env: { DASHSCOPE_API_KEY: "would-not-be-read" },
          fetchImpl: fetchDouble,
          liveAuthorized: false,
        },
        makeRequest(),
      );
      expect(fetchDouble.calls).toBe(0);
    });

    it("reads no secret when not authorized (empty env still returns dry-run)", async () => {
      const result = await runLiveProof(
        {
          providerId: PROVIDER,
          modelId: MODEL,
          method: "complete",
          credentialReference: makeRef(),
          env: {},
          liveAuthorized: false,
        },
        makeRequest(),
      );
      expect(result.authorized).toBe(false);
    });
  });

  describe("authorized path with injected fetch double (no real network)", () => {
    it("flows a fake response through the governed bridge", async () => {
      const fetchDouble = makeFetchDouble();
      const result = await runLiveProof(
        {
          providerId: PROVIDER,
          modelId: MODEL,
          method: "complete",
          credentialReference: makeRef(),
          env: { DASHSCOPE_API_KEY: "fake-test-secret" },
          fetchImpl: fetchDouble,
          liveAuthorized: true,
        },
        makeRequest(),
      );
      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.admissionStatus).toBe("admitted");
        expect(result.bridgeResult.response?.text).toBe("pong");
        expect(result.bridgeResult.response?.model).toEqual({
          providerId: PROVIDER,
          modelId: MODEL,
        });
        expect(fetchDouble.calls).toBe(1);
      }
    });

    it("uses the default international endpoint for Alibaba when no endpoint override is supplied", async () => {
      const calls: string[] = [];
      const fetchDouble: LiveProofFetch = async (input, init) => {
        calls.push(input);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: "pong" } }],
            usage: { prompt_tokens: 2, completion_tokens: 1 },
          }),
        };
      };
      const result = await runLiveProof(
        {
          providerId: PROVIDER,
          modelId: MODEL,
          method: "complete",
          credentialReference: makeRef(),
          env: { DASHSCOPE_API_KEY: "fake-test-secret" },
          fetchImpl: fetchDouble,
          liveAuthorized: true,
        },
        makeRequest(),
      );
      expect(result.authorized).toBe(true);
      expect(calls).toEqual([ALIBABA_DASHSCOPE_INTL_ENDPOINT]);
    });

    it("classifies an absent secret without exposing a value", async () => {
      await expect(
        runLiveProof(
          {
            providerId: PROVIDER,
            modelId: MODEL,
            method: "complete",
            credentialReference: makeRef(),
            env: {},
            fetchImpl: makeFetchDouble(),
            liveAuthorized: true,
          },
          makeRequest(),
        ),
      ).rejects.toThrow(/live_proof_credential_absent/);
    });
  });

  describe("wrapper adapter does not leak the secret", () => {
    it("never includes the raw secret in its returned result", async () => {
      const fetchDouble = makeFetchDouble();
      const adapter = createOpenAiCompatibleExecuteAdapter({
        providerId: PROVIDER,
        modelId: MODEL,
        endpoint: "https://example.invalid/v1/chat/completions",
        secret: "super-secret-value",
        fetchImpl: fetchDouble,
      });
      const out = await adapter.execute({
        traceId: TRACE,
        providerId: PROVIDER,
        modelId: MODEL,
        prompt: "ping",
      });
      expect(JSON.stringify(out)).not.toContain("super-secret-value");
    });
  });
});
