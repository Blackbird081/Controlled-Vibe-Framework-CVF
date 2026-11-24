import { describe, expect, it, vi } from "vitest";
import { createOpenAiExecutionAdapter, openAiUsesCompletionTokenParam, resolveOpenAiChatEndpoint } from "../../../src/providers/openai/execution-adapter";
import type { OpenAiExecutionFetch } from "../../../src/providers/openai/execution-adapter";
import { CredentialBoundary, fingerprintSecret } from "../../../src/credential-boundary";
import { ProviderExecutionBridge } from "../../../src/provider-execution-bridge";
import { RoutingPolicyEngine } from "../../../src/routing-policy";
import { ProviderRegistry } from "../../../src/provider-registry";
import { ProviderHealthMonitor } from "../../../src/provider-health";
import { QuotaLedger } from "../../../src/quota-ledger";
import { GatewayReceiptBuilder } from "../../../src/gateway-receipt";

const MODEL = "gpt-4o-mini";
const SECRET = "fixture-openai-secret-do-not-emit";
const reference = { providerId: "openai", keyId: "web-openai", envNames: ["OPENAI_API_KEY"] };
const input = { traceId: "trace-openai", providerId: "openai", modelId: MODEL, prompt: "Question", systemPrompt: "System" };
const completion = (overrides: Record<string, unknown> = {}) => ({
  choices: [{ message: { content: "Answer" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
  ...overrides,
});
const reply = (payload: unknown = completion(), ok = true, status = 200) => ({ ok, status, json: vi.fn(async () => payload) });

function fixture(envOverrides: Record<string, string | undefined> = {}, payload: unknown = completion(), ok = true, status = 200) {
  const env: Record<string, string | undefined> = { OPENAI_API_KEY: SECRET, ...envOverrides };
  const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply(payload, ok, status));
  const credential = new CredentialBoundary(env);
  const adapter = createOpenAiExecutionAdapter({ credential, credentialRef: reference, env, fetchImpl });
  return { env, fetchImpl, credential, adapter };
}

describe("OpenAI execution adapter (injected transport, no network)", () => {
  it("sends one admitted request and reports only provider-reported usage", async () => {
    const f = fixture();
    expect(await f.adapter.execute(input)).toEqual({
      text: "Answer", credentialFingerprint: fingerprintSecret(SECRET),
      usage: { inputTokens: 11, outputTokens: 7 }, providerUsage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 },
    });
    const [endpoint, init] = f.fetchImpl.mock.calls[0];
    expect(endpoint).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.redirect).toBe("error");
    expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
    expect(JSON.parse(init.body)).toEqual({ model: MODEL, messages: [{ role: "system", content: "System" }, { role: "user", content: "Question" }], max_tokens: 4096, temperature: 0.7 });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("omits usage when the provider response carries none (no invented cost)", async () => {
    const f = fixture({}, { choices: [{ message: { content: "Answer" }, finish_reason: "stop" }] });
    const result = await f.adapter.execute(input);
    expect(result.usage).toBeUndefined();
    expect(result.providerUsage).toBeUndefined();
  });

  it.each(["gpt-6-luna", "gpt-6.1-terra"])("disables reasoning and caps completion tokens for %s", async (model) => {
    const f = fixture();
    await f.adapter.execute({ ...input, modelId: model });
    const body = JSON.parse(f.fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({ model, reasoning_effort: "none", max_completion_tokens: 4096 });
    expect(body).not.toHaveProperty("max_tokens");
    expect(body).not.toHaveProperty("temperature");
  });

  it("honors explicit maxTokens and uses max_completion_tokens for reasoning-family models", async () => {
    const env = { OPENAI_API_KEY: SECRET };
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply());
    const adapter = createOpenAiExecutionAdapter({ credential: new CredentialBoundary(env), credentialRef: reference, env, fetchImpl, maxTokens: 321 });
    await adapter.execute(input);
    await adapter.execute({ ...input, modelId: "gpt-5-mini" });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ max_tokens: 321, temperature: 0.7 });
    const reasoning = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(reasoning).toMatchObject({ max_completion_tokens: 321 });
    expect(reasoning).not.toHaveProperty("max_tokens");
    expect(reasoning).not.toHaveProperty("temperature");
  });

  it("missing key fails closed before any fetch", async () => {
    const f = fixture({ OPENAI_API_KEY: undefined });
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "credential_unavailable" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });

  it("maps HTTP errors to a closed diagnostic without leaking the secret", async () => {
    const f = fixture({}, { error: { message: `bad key ${SECRET}` } }, false, 401);
    const error = await f.adapter.execute(input).catch((e: unknown) => e as Error & { diagnostic: unknown });
    expect(error).toMatchObject({ diagnostic: { code: "provider_http_error", httpStatus: 401, credentialFingerprint: fingerprintSecret(SECRET) } });
    expect(JSON.stringify(error) + (error as Error).message).not.toContain(SECRET);
  });

  it("distinguishes a 429 insufficient_quota body (non-retryable quota lock) from a plain 429 rate limit, without retaining the body", async () => {
    const quota = fixture({}, { error: { code: "insufficient_quota", message: `you exceeded ${SECRET}` } }, false, 429);
    const quotaError = await quota.adapter.execute(input).catch((e: unknown) => e as Error & { diagnostic: unknown });
    expect(quotaError).toMatchObject({ diagnostic: { code: "quota_locked", httpStatus: 429 } });
    expect(JSON.stringify(quotaError) + (quotaError as Error).message).not.toContain(SECRET);
    const rate = fixture({}, { error: { code: "rate_limit_exceeded" } }, false, 429);
    await expect(rate.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "provider_http_error", httpStatus: 429 } });
    const garbage = fixture({}, "not an object", false, 429);
    await expect(garbage.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "provider_http_error", httpStatus: 429 } });
  });

  it("keeps an explicit temperature of 0 and uses max_completion_tokens only for gpt-5/o1/o3/o4 families", async () => {
    const env = { OPENAI_API_KEY: SECRET };
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply());
    const adapter = createOpenAiExecutionAdapter({ credential: new CredentialBoundary(env), credentialRef: reference, env, fetchImpl, temperature: 0 });
    await adapter.execute(input);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).temperature).toBe(0);
    for (const [model, completion] of [["gpt-4o", false], ["gpt-4-turbo", false], ["gpt-5-mini", true], ["o1", true], ["o3-mini", true], ["o4-mini", true]] as const) {
      expect(openAiUsesCompletionTokenParam(model)).toBe(completion);
    }
  });

  it.each(["length", "content_filter"])("rejects truncated or filtered output (%s) while preserving usage", async (finish) => {
    const f = fixture({}, completion({ choices: [{ message: { content: "cut" }, finish_reason: finish }] }));
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "output_incomplete", usage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 } } });
  });

  it("rejects identity mismatch before fetch", async () => {
    const f = fixture();
    await expect(f.adapter.execute({ ...input, providerId: "alibaba" })).rejects.toMatchObject({ diagnostic: { code: "invalid_identity" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });

  it("allows OPENAI_BASE_URL only inside the admitted provider host", async () => {
    expect(resolveOpenAiChatEndpoint({ OPENAI_BASE_URL: "https://api.openai.com/v1/" })).toBe("https://api.openai.com/v1/chat/completions");
    for (const bad of ["https://attacker.example/v1", "http://api.openai.com/v1", "https://api.openai.com:8443/v1", "https://user:pw@api.openai.com/v1", "not a url"]) {
      const f = fixture({ OPENAI_BASE_URL: bad });
      await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "destination_denied" } });
      expect(f.fetchImpl).not.toHaveBeenCalled();
    }
    const ok = fixture({ OPENAI_BASE_URL: "https://api.openai.com/v1" });
    await ok.adapter.execute(input);
    expect(ok.fetchImpl.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("reports request cancellation and deadline from the composed signal, not raw errors", async () => {
    const controller = new AbortController();
    const env = { OPENAI_API_KEY: SECRET };
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new Error("raw abort detail")));
    }));
    const adapter = createOpenAiExecutionAdapter({ credential: new CredentialBoundary(env), credentialRef: reference, env, fetchImpl });
    const pending = adapter.execute({ ...input, signal: controller.signal });
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ diagnostic: { code: "request_cancelled" } });

    vi.useFakeTimers();
    try {
      const timed = createOpenAiExecutionAdapter({ credential: new CredentialBoundary(env), credentialRef: reference, env, fetchImpl, timeoutMs: 1_000 });
      const slow = timed.execute(input).catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(1_500);
      expect(await slow).toMatchObject({ diagnostic: { code: "provider_timeout" } });
    } finally { vi.useRealTimers(); }
  });
});

describe("OpenAI adapter through ProviderExecutionBridge", () => {
  function bridgeFixture(fetchImpl: OpenAiExecutionFetch, env: Record<string, string | undefined> = { OPENAI_API_KEY: SECRET }) {
    const credential = new CredentialBoundary(env);
    const registry = new ProviderRegistry([{ id: "openai", displayName: "OpenAI", status: "enabled", riskClass: "low", models: [{ id: MODEL, riskClass: "low" }] }]);
    const health = new ProviderHealthMonitor(); const quota = new QuotaLedger();
    const bridge = new ProviderExecutionBridge({
      routing: new RoutingPolicyEngine(registry, health, quota), credential, health, quota, receipt: new GatewayReceiptBuilder(),
      credentialRefs: new Map([["openai", reference]]),
      adapters: new Map([["openai", createOpenAiExecutionAdapter({ credential, credentialRef: reference, env, fetchImpl })]]),
    });
    const request = {
      traceId: "trace-bridge", prompt: "Hello", canonicalExecutionId: "canonical-openai",
      policy: { traceId: "trace-bridge", policyResult: "allow" as const, reason: "test_allow", allowedProviderIds: ["openai"] },
      routing: { traceId: "trace-bridge", preferredProviderId: "openai", requestedModelId: MODEL },
    };
    return { bridge, request };
  }

  it("success: one fetch, provider usage and key fingerprint bound into the receipt", async () => {
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply());
    const f = bridgeFixture(fetchImpl);
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => ({ decision: "allow", attemptIndex: 1 }) });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.response?.text).toBe("Answer");
    expect(result.response?.providerUsage).toEqual({ inputTokens: 11, outputTokens: 7, totalTokens: 18 });
    expect(result.attemptOutcome).toBe("invoked");
    expect(result.receipt.credentialFingerprint).toBe(fingerprintSecret(SECRET));
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("HTTP error: typed provider diagnostic, no secret", async () => {
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply({}, false, 429));
    const f = bridgeFixture(fetchImpl);
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => ({ decision: "allow", attemptIndex: 1 }) });
    expect(result.response).toBeUndefined();
    expect(result.error?.providerDiagnostic).toMatchObject({ code: "provider_http_error", httpStatus: 429 });
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("missing key: no fetch is made", async () => {
    const fetchImpl = vi.fn<Parameters<OpenAiExecutionFetch>, ReturnType<OpenAiExecutionFetch>>(async () => reply());
    const f = bridgeFixture(fetchImpl, {});
    const result = await f.bridge.execute(f.request, { beforeProviderInvoke: async () => ({ decision: "allow", attemptIndex: 1 }) });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.response).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
