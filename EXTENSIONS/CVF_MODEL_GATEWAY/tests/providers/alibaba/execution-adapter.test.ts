// Text Encoding Exception: Unicode fixture verifies provider text preservation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAlibabaExecutionAdapter } from "../../../src/providers/alibaba/execution-adapter";
import type { AlibabaExecutionAdapterOptions, AlibabaExecutionFetch } from "../../../src/providers/alibaba/execution-adapter";
import { CredentialBoundary, fingerprintSecret } from "../../../src/credential-boundary";
import { ProviderExecutionError } from "../../../src/unified-gateway-interface-contract";
import * as quota from "../../../src/alibaba-free-quota-model-ledger";

const MODEL = "qwen-plus-character";
const SECRET = "fixture-secret-do-not-emit";
const reference = { providerId: "alibaba", keyId: "fixture", envNames: ["TEST_ALIBABA_KEY"] };
const input = { traceId: "trace-alibaba", providerId: "alibaba", modelId: MODEL, prompt: "Question", systemPrompt: "System" };
function completion(overrides: Record<string, unknown> = {}) {
  return { choices: [{ message: { content: "Answer" }, finish_reason: "stop" }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 }, ...overrides };
}
function response(payload: unknown = completion()) {
  return { ok: true, status: 200, json: vi.fn(async () => payload), text: vi.fn(async () => String(payload)) };
}
function fixture(overrides: Partial<AlibabaExecutionAdapterOptions> = {}) {
  const env = { TEST_ALIBABA_KEY: SECRET, CVF_ALIBABA_FREE_QUOTA_ONLY: "1", CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1" };
  const fetchImpl = vi.fn<Parameters<AlibabaExecutionFetch>, ReturnType<AlibabaExecutionFetch>>(async () => response());
  const credential = new CredentialBoundary(env);
  const adapter = createAlibabaExecutionAdapter({ credential, credentialRef: reference, env, fetchImpl, ...overrides });
  return { adapter, fetchImpl, credential, env };
}
function admitProtocolFixture() { vi.spyOn(quota, "assertAlibabaFreeQuotaUse").mockImplementation(() => {}); }
function sse(events: unknown[]) { return events.map(event => `data: ${typeof event === "string" ? event : JSON.stringify(event)}\r\n`).join(""); }

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-12T07:00:00Z")); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Alibaba text protocol (injected transport, no network)", () => {
  it("uses current quota owner, defaults, identity and actual usage", async () => {
    const f = fixture();
    expect(await f.adapter.execute(input)).toEqual({ text: "Answer", credentialFingerprint: fingerprintSecret(SECRET), usage: { inputTokens: 2, outputTokens: 3 }, providerUsage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 } });
    const [endpoint, init] = f.fetchImpl.mock.calls[0];
    expect(endpoint).toBe(quota.ALIBABA_DASHSCOPE_INTL_ENDPOINT);
    expect(init.redirect).toBe("error");
    expect(init.headers).toEqual({ "Content-Type": "application/json", Authorization: `Bearer ${SECRET}`, Connection: "close" });
    expect(JSON.parse(init.body)).toEqual({ model: MODEL, messages: [{ role: "system", content: "System" }, { role: "user", content: "Question" }], max_tokens: 4096, temperature: 0.7 });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("honors explicit limits and does not allow metadata to replace identity, endpoint or credentials", async () => {
    const f = fixture({ maxTokens: 1200, temperature: 0.2 });
    await f.adapter.execute({ ...input, metadata: { model: "attacker", endpoint: "https://attacker.invalid", secret: "attacker", max_tokens: 1 } });
    expect(JSON.parse(f.fetchImpl.mock.calls[0][1].body)).toMatchObject({ model: MODEL, max_tokens: 1200, temperature: 0.2 });
    expect(f.fetchImpl.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${SECRET}`);
  });
  it.each([["qwen3-max", false], ["qwen3.5-plus", false], ["qwen3-235b-thinking", true], ["qwen3.5-max-thinking", true]])("sets thinking only for %s", async (modelId, thinking) => {
    admitProtocolFixture();
    const f = fixture(); await f.adapter.execute({ ...input, modelId });
    expect(JSON.parse(f.fetchImpl.mock.calls[0][1].body).enable_thinking).toBe(thinking);
  });
  it("consumes qvq SSE content, ignores reasoning and keeps terminal usage", async () => {
    admitProtocolFixture(); const f = fixture();
    const raw = sse([{ choices: [{ delta: { reasoning_content: "private reasoning" } }] }, { choices: [{ delta: { content: "Xin " } }] }, { choices: [{ delta: { content: "chào" }, finish_reason: "stop" }] }, { choices: [], usage: { prompt_tokens: 7, completion_tokens: 8, total_tokens: 15 } }, "[DONE]"]);
    f.fetchImpl.mockResolvedValueOnce(response(raw));
    expect(await f.adapter.execute({ ...input, modelId: "qvq-max" })).toEqual({ text: "Xin chào", credentialFingerprint: fingerprintSecret(SECRET), usage: { inputTokens: 7, outputTokens: 8 }, providerUsage: { inputTokens: 7, outputTokens: 8, totalTokens: 15 } });
    expect(JSON.parse(f.fetchImpl.mock.calls[0][1].body)).toMatchObject({ stream: true, stream_options: { include_usage: true }, max_tokens: 4096 });
    expect(JSON.parse(f.fetchImpl.mock.calls[0][1].body)).not.toHaveProperty("enable_thinking");
  });
  it.each([{}, { prompt_tokens: -1, total_tokens: "unknown" }])("keeps empty or invalid SSE usage unknown", async usage => {
    admitProtocolFixture(); const f = fixture();
    const raw = sse([{ choices: [{ delta: { content: "Complete" }, finish_reason: "stop" }] }, { choices: [], usage }, "[DONE]"]);
    f.fetchImpl.mockResolvedValueOnce(response(raw));
    expect(await f.adapter.execute({ ...input, modelId: "qvq-max" })).toEqual({ text: "Complete", credentialFingerprint: fingerprintSecret(SECRET) });
  });
  it("rejects a null SSE JSON frame even after an otherwise complete answer", async () => {
    admitProtocolFixture(); const f = fixture();
    const raw = sse([{ choices: [{ delta: { content: "Complete" }, finish_reason: "stop" }] }, null, "[DONE]"]);
    f.fetchImpl.mockResolvedValueOnce(response(raw));
    await expect(f.adapter.execute({ ...input, modelId: "qvq-max" })).rejects.toMatchObject({ diagnostic: { code: "output_incomplete" } });
  });
  it("resolves credential references at invocation so rotation and removal take effect", async () => {
    const f = fixture();
    f.env.TEST_ALIBABA_KEY = "rotated-fixture";
    await f.adapter.execute(input);
    expect(f.fetchImpl.mock.calls[0][1].headers.Authorization).toBe("Bearer rotated-fixture");
    f.env.TEST_ALIBABA_KEY = "";
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "credential_unavailable" } });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each([undefined, {}, { total_tokens: 9 }, { prompt_tokens: 2 }, { prompt_tokens: -1, completion_tokens: Infinity, total_tokens: "9" }])("preserves unknown or partial actual usage: %j", async usage => {
    const f = fixture(); f.fetchImpl.mockResolvedValueOnce(response(completion({ usage })));
    const result = await f.adapter.execute(input);
    expect(result.usage).toBeUndefined();
    if (usage && typeof usage.total_tokens === "number") expect(result.providerUsage).toEqual({ totalTokens: 9 });
    else if (usage && usage.prompt_tokens === 2) expect(result.providerUsage).toEqual({ inputTokens: 2 });
    else expect(result.providerUsage).toBeUndefined();
  });
  it("accepts JSON without finish_reason as the existing text client does", async () => {
    const f = fixture(); f.fetchImpl.mockResolvedValueOnce(response(completion({ choices: [{ message: { content: "Usable" } }] })));
    expect((await f.adapter.execute(input)).text).toBe("Usable");
  });
});

describe("real free-only and destination admission", () => {
  it.each(["unknown-future-model", "qwen3.7-flash", "qvq-max"]) ("blocks unavailable model %s even when ambient free-only is zero", async modelId => {
    const f = fixture(); f.env.CVF_ALIBABA_FREE_QUOTA_ONLY = "0";
    await expect(f.adapter.execute({ ...input, modelId })).rejects.toMatchObject({ diagnostic: { code: "quota_locked" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });
  it("blocks scope unconfirmed before credentials and HTTP", async () => {
    const f = fixture(); f.env.CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED = "0";
    const secret = vi.spyOn(f.credential, "resolveSecretForRuntime");
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "quota_locked" } });
    expect(secret).not.toHaveBeenCalled(); expect(f.fetchImpl).not.toHaveBeenCalled();
  });
  it("blocks a currently admitted model after expiry", async () => {
    vi.setSystemTime(new Date("2027-02-11T00:00:00Z")); const f = fixture();
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "quota_locked" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });
  it.each(["https://attacker.invalid/completions", "https://api.openai.com/v1/chat/completions", "http://localhost/x"]) ("denies destination %s", async endpoint => {
    const f = fixture({ env: { CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1", DASHSCOPE_COMPAT_ENDPOINT: endpoint } });
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "destination_denied" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });
  it.each([
    "http://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    "https://user:password@dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    "https://dashscope-intl.aliyuncs.com:8443/compatible-mode/v1/chat/completions",
  ])("rejects unsafe Alibaba URL before secret resolution: %s", async endpoint => {
    const f = fixture({ env: { CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1", DASHSCOPE_COMPAT_ENDPOINT: endpoint } });
    const secret = vi.spyOn(f.credential, "resolveSecretForRuntime");
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "destination_denied" } });
    expect(secret).not.toHaveBeenCalled(); expect(f.fetchImpl).not.toHaveBeenCalled();
  });
  it("admits an HTTPS Alibaba URL with its explicit default port", async () => {
    const f = fixture({ env: { CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1", DASHSCOPE_COMPAT_ENDPOINT: "https://dashscope-intl.aliyuncs.com:443/compatible-mode/v1/chat/completions" } });
    expect((await f.adapter.execute(input)).text).toBe("Answer");
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each(["input", "credential"]) ("denies %s provider mismatch", async mismatch => {
    const f = fixture(mismatch === "credential" ? { credentialRef: { ...reference, providerId: "other" } } : {});
    await expect(f.adapter.execute({ ...input, ...(mismatch === "input" ? { providerId: "other" } : {}) })).rejects.toMatchObject({ diagnostic: { code: "invalid_identity" } });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });
});

describe("safe terminal outcomes and cancellation", () => {
  it.each([400, 401, 403, 408, 429, 500, 503])("preserves HTTP %s without reading a provider error body or retrying", async status => {
    const f = fixture(); const resp = { ...response({ error: SECRET }), ok: false, status }; f.fetchImpl.mockResolvedValueOnce(resp);
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error).toBeInstanceOf(ProviderExecutionError);
    expect(error.toGatewayEnvelope(input.traceId).providerDiagnostic).toEqual({ code: "provider_http_error", httpStatus: status, credentialFingerprint: fingerprintSecret(SECRET) });
    expect(error.toGatewayEnvelope(input.traceId).retryable).toBe(status === 408 || status === 429 || status >= 500);
    expect(JSON.stringify(error)).not.toContain(SECRET); expect(resp.json).not.toHaveBeenCalled(); expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each(["length", "content_filter", "tool_calls", "empty", "nonstring"]) ("rejects incomplete JSON %s while retaining safe usage", async kind => {
    const f = fixture(); f.fetchImpl.mockResolvedValueOnce(response(completion({ choices: [{ message: { content: kind === "empty" ? " " : kind === "nonstring" ? 42 : "partial" }, finish_reason: kind === "empty" || kind === "nonstring" ? "stop" : kind }] })));
    await expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "output_incomplete", httpStatus: 200, usage: { totalTokens: 5 } } });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each([sse([{ choices: [{ delta: { content: "partial" }, finish_reason: "length" }] }]), sse([{ choices: [{ delta: { content: "no terminal" } }] }, "[DONE]"]), sse([{ choices: [{ delta: { content: "answer" }, finish_reason: "stop" }] }, "invalid-json"]), sse([{ choices: [{ delta: { reasoning_content: "reason only" }, finish_reason: "stop" }] }])])("rejects incomplete or malformed SSE", async raw => {
    admitProtocolFixture(); const f = fixture(); f.fetchImpl.mockResolvedValueOnce(response(raw));
    await expect(f.adapter.execute({ ...input, modelId: "qvq-max" })).rejects.toMatchObject({ diagnostic: { code: "output_incomplete" } });
  });
  it("rejects malformed JSON using a fixed incomplete diagnostic", async () => {
    const f = fixture(); const resp = response(); resp.json.mockRejectedValueOnce(new Error(SECRET)); f.fetchImpl.mockResolvedValueOnce(resp);
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error.diagnostic.code).toBe("output_incomplete"); expect(error.message).not.toContain(SECRET);
  });
  it("cancels before reading credentials or contacting HTTP without leaking request reason", async () => {
    const f = fixture(); const secret = vi.spyOn(f.credential, "resolveSecretForRuntime"); const controller = new AbortController(); controller.abort(SECRET);
    const error = await f.adapter.execute({ ...input, signal: controller.signal }).catch(value => value);
    expect(error.diagnostic.code).toBe("request_cancelled"); expect(secret).not.toHaveBeenCalled(); expect(f.fetchImpl).not.toHaveBeenCalled(); expect(JSON.stringify(error)).not.toContain(SECRET);
  });
  it.each(["fetch", "body"]) ("rechecks cancellation after awaited %s", async boundary => {
    const f = fixture(); const controller = new AbortController();
    const resp = response();
    if (boundary === "fetch") f.fetchImpl.mockImplementationOnce(async () => { controller.abort(SECRET); return resp; });
    else { resp.json.mockImplementationOnce(async () => { controller.abort(SECRET); return completion(); }); f.fetchImpl.mockResolvedValueOnce(resp); }
    await expect(f.adapter.execute({ ...input, signal: controller.signal })).rejects.toMatchObject({ diagnostic: { code: "request_cancelled" } });
    expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("bounds the native fetch with a deadline signal and disposes its timer", async () => {
    const f = fixture({ timeoutMs: 1 });
    f.fetchImpl.mockImplementationOnce(async (_url, init) => new Promise((_resolve, reject) => { init.signal.addEventListener("abort", () => reject(new Error(SECRET)), { once: true }); }));
    const pending = expect(f.adapter.execute(input)).rejects.toMatchObject({ diagnostic: { code: "provider_timeout" } });
    await vi.advanceTimersByTimeAsync(1000); await pending;
    expect(vi.getTimerCount()).toBe(0); expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("keeps the first cancellation cause and disposes an injected owner on failure", async () => {
    const dispose = vi.fn(); const controller = new AbortController(); let cause: "request" | "deadline" | null = null;
    const f = fixture({ composeRequestSignal: () => ({ signal: controller.signal, cause: () => cause, throwIfTerminal() { if (cause) throw new Error(SECRET); }, dispose }) });
    f.fetchImpl.mockImplementationOnce(async () => { cause = "deadline"; return response(); });
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error.diagnostic.code).toBe("provider_timeout"); expect(error.toGatewayEnvelope(input.traceId).retryable).toBe(false); expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("disposes an injected owner on success", async () => {
    const dispose = vi.fn(); const controller = new AbortController();
    const f = fixture({ composeRequestSignal: () => ({ signal: controller.signal, cause: () => null, throwIfTerminal() {}, dispose }) });
    await f.adapter.execute(input); expect(dispose).toHaveBeenCalledTimes(1);
  });
  it.each([new TypeError(SECRET), new Error(SECRET), { secret: SECRET }])("shields unknown transport failure without retry", async failure => {
    const f = fixture(); f.fetchImpl.mockRejectedValueOnce(failure);
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error.toGatewayEnvelope(input.traceId).retryable).toBe(false); expect(JSON.stringify(error)).not.toContain(SECRET); expect(error.message).not.toContain(SECRET); expect(f.fetchImpl).toHaveBeenCalledTimes(1);
  });
});


describe("actual invocation credential fingerprint", () => {
  it("returns the resolved credential fingerprint after rotation without exposing a key fragment", async () => {
    const f = fixture(); f.env.TEST_ALIBABA_KEY = "new-fixture-key";
    const result = await f.adapter.execute(input);
    expect(result.credentialFingerprint).toBe(fingerprintSecret("new-fixture-key"));
    expect(result.credentialFingerprint).not.toBe(fingerprintSecret(SECRET));
    expect(JSON.stringify(result)).not.toContain("new-fixture-key");
  });
  it("preserves the actual fingerprint through incomplete-output errors", async () => {
    const f = fixture(); f.env.TEST_ALIBABA_KEY = "new-fixture-key";
    f.fetchImpl.mockResolvedValueOnce(response(completion({ choices: [{ message: { content: "partial" }, finish_reason: "length" }] })));
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error.diagnostic).toEqual({ code: "output_incomplete", httpStatus: 200, usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 }, credentialFingerprint: fingerprintSecret("new-fixture-key") });
  });
  it("preserves the resolved fingerprint on cancellation after HTTP without retaining the request reason", async () => {
    const f = fixture(); const controller = new AbortController();
    f.fetchImpl.mockImplementationOnce(async () => { controller.abort(SECRET); return response(); });
    const error = await f.adapter.execute({ ...input, signal: controller.signal }).catch(value => value);
    expect(error.diagnostic).toEqual({ code: "request_cancelled", httpStatus: 499, credentialFingerprint: fingerprintSecret(SECRET) });
    expect(JSON.stringify(error)).not.toContain(SECRET);
  });
  it("omits invocation fingerprint when the credential is removed before resolution", async () => {
    const f = fixture(); f.env.TEST_ALIBABA_KEY = "";
    const error = await f.adapter.execute(input).catch(value => value);
    expect(error.diagnostic).toEqual({ code: "credential_unavailable" });
    expect(f.fetchImpl).not.toHaveBeenCalled();
  });
});
