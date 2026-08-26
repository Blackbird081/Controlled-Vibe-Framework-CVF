/**
 * P4B-B Live Proof Harness - Dry-Run Gate Tests
 *
 * These tests prove the harness is safe before any live call:
 *  - liveAuthorized=false performs NO network call and reads NO secret;
 *  - EAFR-R12: liveAuthorized=true alone is still NOT sufficient. The existing
 *    R1E orchestrator grant, evaluated by evaluateProviderExecutionAuthority
 *    from cvf-control-plane-foundation, must also allow the request before any
 *    secret is resolved, fetch is chosen, or the bridge is built. Every denial
 *    reason the evaluator can return is proven here to occur before secret or
 *    fetch access, using only synthetic grants, injected env and injected
 *    fetch;
 *  - the bridge-compatible wrapper flows a fake response through the governed
 *    bridge only when both liveAuthorized=true and the grant is allowed, with
 *    an injected fetch double;
 *  - no real key is read and no real network is touched in tests.
 *
 * No real provider, no real credential, no real network.
 */
import { describe, it, expect, vi } from "vitest";
import type { ProviderExecutionGrant } from "cvf-control-plane-foundation";
import {
  runLiveProof,
  createOpenAiCompatibleExecuteAdapter,
  P4B_B_LIVE_PROOF_HARNESS_VERSION,
} from "../src/p4b-b-live-proof-harness";
import {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  resolveAlibabaDashScopeEndpoint,
} from "../src/alibaba-free-quota-model-ledger";
import type { LiveProofFetch, LiveProofHarnessOptions } from "../src/p4b-b-live-proof-harness";
import type { CredentialReference } from "../src/credential-boundary";
import type { GatewayExecuteRequest } from "../src/unified-gateway-interface-contract";
import { createOpenAiCompatibleExecuteAdapter as createNeutralAdapter } from "../src/openai-compatible-execute-adapter";
import {
  attemptCandidate,
  consumesProviderCall,
} from "../scripts/run-p4b-b-live-proof";

const TRACE = "p4b-b-dry-run-trace-001";
const PROVIDER = "alibaba";
const MODEL = "qwen-flash";
const WORKER_AGENT_ID = "r12-test-worker";
const DELEGATION_ID = "r12-test-delegation";
const GRANT_ID = "r12-test-grant-001";
const NOW_ISO = "2026-08-26T12:00:00.000Z";
const FUTURE_EXPIRY = "2099-01-01T00:00:00.000Z";
const PAST_EXPIRY = "2020-01-01T00:00:00.000Z";

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

/** A synthetic grant that evaluateProviderExecutionAuthority accepts. Never a real credential. */
function makeValidGrant(overrides: Partial<ProviderExecutionGrant> = {}): ProviderExecutionGrant {
  return {
    authority: "ORCHESTRATOR_GRANT_REQUIRED",
    grantId: GRANT_ID,
    authorizedBy: "ORCHESTRATOR",
    subjectAgentId: WORKER_AGENT_ID,
    delegationId: DELEGATION_ID,
    allowedProviders: [PROVIDER],
    maxCalls: 1,
    expiresAt: FUTURE_EXPIRY,
    ...overrides,
  };
}

/** Base options carrying a fully authorized live-selection plus a valid grant and matching identity. */
function makeAuthorizedOptions(
  overrides: Partial<LiveProofHarnessOptions> = {},
): LiveProofHarnessOptions {
  return {
    providerId: PROVIDER,
    modelId: MODEL,
    method: "complete",
    credentialReference: makeRef(),
    env: { DASHSCOPE_API_KEY: "fake-test-secret" },
    fetchImpl: makeFetchDouble(),
    liveAuthorized: true,
    providerExecutionGrant: makeValidGrant(),
    workerAgentId: WORKER_AGENT_ID,
    delegationId: DELEGATION_ID,
    grantId: GRANT_ID,
    consumedCalls: 0,
    nowIso: NOW_ISO,
    ...overrides,
  };
}

describe("P4B-B live proof harness", () => {
  it("runner denies a parseable invalid grant before reading candidate env or resolving its endpoint", async () => {
    const unreadableEnv = new Proxy<Record<string, string | undefined>>({}, {
      get() {
        throw new Error("runner inspected candidate environment before grant acceptance");
      },
    });
    const outcome = await attemptCandidate(
      {
        providerId: PROVIDER,
        modelId: MODEL,
        method: "complete",
        aliases: ["DASHSCOPE_API_KEY"],
      },
      unreadableEnv,
      {
        providerExecutionGrant: makeValidGrant({ expiresAt: PAST_EXPIRY }),
        workerAgentId: WORKER_AGENT_ID,
        delegationId: DELEGATION_ID,
        grantId: GRANT_ID,
        consumedCalls: 0,
        nowIso: NOW_ISO,
      },
    );
    expect(outcome.outcome).toBe("FAIL");
    expect(outcome.keyAliasUsed).toBeNull();
    expect(outcome.keyPresent).toBe(false);
    expect(outcome.endpointHost).toBeNull();
    expect(outcome.detail?.diagnostic).toMatchObject({
      stage: "grant_evaluation",
      class: "live_proof_grant_denied",
    });
    expect(consumesProviderCall(outcome)).toBe(false);
  });

  it("re-exports the neutral OpenAI-compatible adapter", () => {
    expect(createOpenAiCompatibleExecuteAdapter).toBe(createNeutralAdapter);
  });

  it("exports the harness version constant", () => {
    expect(P4B_B_LIVE_PROOF_HARNESS_VERSION).toBe("cvf.p4bBLiveProofHarness.t3.v1");
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
        makeAuthorizedOptions({
          env: {},
          fetchImpl: undefined,
          liveAuthorized: false,
        }),
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
        makeAuthorizedOptions({
          env: { DASHSCOPE_API_KEY: "would-not-be-read" },
          fetchImpl: fetchDouble,
          liveAuthorized: false,
        }),
        makeRequest(),
      );
      expect(fetchDouble.calls).toBe(0);
    });

    it("reads no secret when not authorized (empty env still returns dry-run)", async () => {
      const result = await runLiveProof(
        makeAuthorizedOptions({
          env: {},
          fetchImpl: undefined,
          liveAuthorized: false,
        }),
        makeRequest(),
      );
      expect(result.authorized).toBe(false);
    });
  });

  describe("EAFR-R12 orchestrator-grant denial matrix (liveAuthorized=true, grant not allowed)", () => {
    const cases: Array<{
      name: string;
      overrides: Partial<LiveProofHarnessOptions>;
      grantOverrides?: Partial<ProviderExecutionGrant> | "absent";
    }> = [
      { name: "missing grant", overrides: {}, grantOverrides: "absent" },
      {
        name: "FORBIDDEN authority",
        overrides: {},
        grantOverrides: { authority: "FORBIDDEN", grantId: null, authorizedBy: null, allowedProviders: [], maxCalls: 0, expiresAt: null },
      },
      { name: "wrong authorizer", overrides: {}, grantOverrides: { authorizedBy: null } },
      { name: "missing grant id", overrides: {}, grantOverrides: { grantId: null } },
      { name: "mismatched grant id", overrides: { grantId: "different-grant-id" } },
      { name: "subject mismatch", overrides: {}, grantOverrides: { subjectAgentId: "someone-else" } },
      { name: "delegation mismatch", overrides: {}, grantOverrides: { delegationId: "other-delegation" } },
      { name: "provider outside allowlist", overrides: {}, grantOverrides: { allowedProviders: ["deepseek"] } },
      { name: "invalid consumed call count (negative)", overrides: { consumedCalls: -1 } },
      { name: "exhausted call budget", overrides: { consumedCalls: 1 }, grantOverrides: { maxCalls: 1 } },
      { name: "malformed expiry", overrides: {}, grantOverrides: { expiresAt: "not-a-date" } },
      { name: "expired grant", overrides: {}, grantOverrides: { expiresAt: PAST_EXPIRY } },
    ];

    for (const { name, overrides, grantOverrides } of cases) {
      it(`denies before secret/fetch/bridge access: ${name}`, async () => {
        const fetchDouble = makeFetchDouble();
        const providerExecutionGrant =
          grantOverrides === "absent"
            ? undefined
            : makeValidGrant(grantOverrides);
        const result = await runLiveProof(
          makeAuthorizedOptions({
            fetchImpl: fetchDouble,
            providerExecutionGrant,
            ...overrides,
          }),
          makeRequest(),
        );
        expect(result.authorized).toBe(false);
        if (result.authorized === false) {
          expect(result.diagnostic).toBe("live_proof_grant_denied");
          expect(result.message).toContain("no network call");
        }
        // No secret resolution, no fetch, no bridge execution occurred.
        expect(fetchDouble.calls).toBe(0);
      });
    }

    it("liveAuthorized=false still short-circuits even with an otherwise-valid grant", async () => {
      const fetchDouble = makeFetchDouble();
      const result = await runLiveProof(
        makeAuthorizedOptions({ fetchImpl: fetchDouble, liveAuthorized: false }),
        makeRequest(),
      );
      expect(result.authorized).toBe(false);
      if (result.authorized === false) {
        expect(result.diagnostic).toBe("live_proof_not_authorized");
      }
      expect(fetchDouble.calls).toBe(0);
    });
  });

  describe("authorized path with injected fetch double (no real network)", () => {
    it("flows a fake response through the governed bridge when liveAuthorized and the grant are both satisfied", async () => {
      const fetchDouble = makeFetchDouble();
      const result = await runLiveProof(
        makeAuthorizedOptions({ fetchImpl: fetchDouble }),
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
        makeAuthorizedOptions({ fetchImpl: fetchDouble }),
        makeRequest(),
      );
      expect(result.authorized).toBe(true);
      expect(calls).toEqual([ALIBABA_DASHSCOPE_INTL_ENDPOINT]);
    });

    it("classifies an absent secret without exposing a value, after the grant already allowed", async () => {
      await expect(
        runLiveProof(
          makeAuthorizedOptions({ env: {}, fetchImpl: makeFetchDouble() }),
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
        // A recognised provider endpoint, not a placeholder host: the adapter
        // now classifies destinations (see openai-compatible-execute-adapter.ts,
        // outside this manifest) and denies unrecognised hosts before this
        // secret-leak assertion can even run. That destination-classification
        // behavior is unrelated to and unmodified by EAFR-R12.
        endpoint: ALIBABA_DASHSCOPE_INTL_ENDPOINT,
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
