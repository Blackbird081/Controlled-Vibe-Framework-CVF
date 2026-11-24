import type { ProviderExecutionAdapter, ProviderExecutionAdapterInput, ProviderExecutionAdapterResult } from "../../provider-execution-bridge";
import type { CredentialReference } from "../../credential-boundary";
import { CredentialBoundary, fingerprintSecret } from "../../credential-boundary";
import { classifyAdapterDestination } from "../../adapter-destination-policy";
import { assertAlibabaFreeQuotaUse, resolveAlibabaDashScopeEndpoint } from "../../alibaba-free-quota-model-ledger";
import { ProviderExecutionError, sanitizeGatewayProviderUsage } from "../../unified-gateway-interface-contract";
import type { GatewayProviderUsage } from "../../unified-gateway-interface-contract";

export interface AlibabaRequestSignal {
  signal: AbortSignal;
  cause(): "request" | "deadline" | null;
  throwIfTerminal(): void;
  dispose(): void;
}
export type AlibabaExecutionFetch = (input: string, init: {
  method: "POST"; headers: Record<string, string>; body: string; signal: AbortSignal; redirect: "error";
}) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;
export interface AlibabaExecutionAdapterOptions {
  credential: CredentialBoundary;
  credentialRef: CredentialReference;
  env?: Record<string, string | undefined>;
  fetchImpl?: AlibabaExecutionFetch;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Web injects its existing cancellation owner; Gateway has no Web dependency. */
  composeRequestSignal?: (signal: AbortSignal | undefined, timeoutMs: number) => AlibabaRequestSignal;
}

/** Gateway fallback for callers without an existing cancellation owner. First cause wins. */
function composeSignal(request: AbortSignal | undefined, timeoutMs: number): AlibabaRequestSignal {
  const controller = new AbortController();
  let cause: "request" | "deadline" | null = null;
  const abort = (next: "request" | "deadline") => {
    if (cause) return;
    cause = next;
    controller.abort(); // Never propagate an arbitrary request reason.
  };
  const onAbort = () => abort("request");
  if (request?.aborted) onAbort();
  else request?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => abort("deadline"), timeoutMs);
  return {
    signal: controller.signal, cause: () => cause,
    throwIfTerminal() { if (cause) throw new ProviderExecutionError(cause === "request" ? "request_cancelled" : "provider_timeout"); },
    dispose() { clearTimeout(timer); request?.removeEventListener("abort", onAbort); },
  };
}
function record(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? value as Record<string, any> : {};
}
function usageOf(value: unknown): GatewayProviderUsage | undefined {
  const usage = record(value);
  return sanitizeGatewayProviderUsage({ inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens });
}
function result(text: string, providerUsage: GatewayProviderUsage | undefined): ProviderExecutionAdapterResult {
  return {
    text,
    ...(providerUsage ? { providerUsage } : {}),
    ...(providerUsage?.inputTokens !== undefined && providerUsage.outputTokens !== undefined
      ? { usage: { inputTokens: providerUsage.inputTokens, outputTokens: providerUsage.outputTokens } } : {}),
  };
}
function readCompletion(payload: unknown): ProviderExecutionAdapterResult {
  const data = record(payload);
  const choice = record(data.choices?.[0]);
  const usage = usageOf(data.usage);
  const text = record(choice.message).content;
  if (typeof text !== "string" || !text.trim() || (choice.finish_reason != null && choice.finish_reason !== "stop")) {
    throw new ProviderExecutionError("output_incomplete", { httpStatus: 200, usage });
  }
  return result(text, usage);
}
function readStream(raw: string): ProviderExecutionAdapterResult {
  let text = "";
  let finishReason: unknown;
  let malformed = false;
  let usage: GatewayProviderUsage | undefined;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trimStart();
    if (payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed === null) { malformed = true; continue; }
      const data = record(parsed);
      const choice = record(data.choices?.[0]);
      const delta = record(choice.delta);
      if (typeof delta.content === "string") text += delta.content;
      if (typeof choice.finish_reason === "string") finishReason = choice.finish_reason;
      if (data.usage) usage = sanitizeGatewayProviderUsage({ ...usage, ...usageOf(data.usage) });
    } catch { malformed = true; }
  }
  if (malformed || finishReason !== "stop" || !text.trim()) {
    throw new ProviderExecutionError("output_incomplete", { httpStatus: 200, usage });
  }
  return result(text, usage);
}

/** One text invocation; no retry, provider fallback, or secret captured at construction. */
export function createAlibabaExecutionAdapter(options: AlibabaExecutionAdapterOptions): ProviderExecutionAdapter {
  const credentialRef = { ...options.credentialRef, envNames: [...options.credentialRef.envNames] };
  return {
    providerId: "alibaba",
    async execute(input: ProviderExecutionAdapterInput): Promise<ProviderExecutionAdapterResult> {
      const env = options.env ?? process.env;
      const configuredTimeout = Number(options.timeoutMs ?? env.CVF_AI_PROVIDER_TIMEOUT_MS ?? 60_000);
      const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? Math.max(1_000, configuredTimeout) : 60_000;
      const cancellation = (options.composeRequestSignal ?? composeSignal)(input.signal, timeoutMs);
      let credentialFingerprint: string | undefined;
      try {
        cancellation.throwIfTerminal();
        if (input.providerId !== "alibaba" || credentialRef.providerId !== "alibaba") throw new ProviderExecutionError("invalid_identity");
        try {
          // Existing policy owner decides; this bounded adapter can never opt into paid access.
          assertAlibabaFreeQuotaUse(input.modelId, { ...env, CVF_ALIBABA_FREE_QUOTA_ONLY: "1" });
        } catch { throw new ProviderExecutionError("quota_locked"); }
        const endpoint = resolveAlibabaDashScopeEndpoint(env);
        let destinationUrl: URL;
        try { destinationUrl = new URL(endpoint); }
        catch { throw new ProviderExecutionError("destination_denied"); }
        if (destinationUrl.protocol !== "https:" || destinationUrl.username || destinationUrl.password || destinationUrl.port) {
          throw new ProviderExecutionError("destination_denied");
        }
        const destination = classifyAdapterDestination(endpoint);
        if (destination.kind !== "provider" || destination.provider !== "alibaba") throw new ProviderExecutionError("destination_denied");
        const secret = options.credential.resolveSecretForRuntime(credentialRef);
        if (!secret) throw new ProviderExecutionError("credential_unavailable");
        credentialFingerprint = fingerprintSecret(secret);
        cancellation.throwIfTerminal();
        const streaming = /^qvq-/i.test(input.modelId);
        const response = await (options.fetchImpl ?? globalThis.fetch)(endpoint, {
          method: "POST", redirect: "error",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}`, Connection: "close" },
          body: JSON.stringify({
            model: input.modelId,
            messages: [
              ...(input.systemPrompt !== undefined ? [{ role: "system", content: input.systemPrompt }] : []),
              { role: "user", content: input.prompt },
            ],
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7,
            ...(streaming ? { stream: true, stream_options: { include_usage: true } } : {}),
            ...(/^qwen3(?:\.\d+)?-/i.test(input.modelId) && !streaming
              ? { enable_thinking: /^qwen3(?:\.\d+)?-.*thinking/i.test(input.modelId) } : {}),
          }),
          signal: cancellation.signal,
        });
        cancellation.throwIfTerminal();
        if (!response.ok) throw new ProviderExecutionError("provider_http_error", { httpStatus: response.status });
        let payload: unknown;
        try { payload = streaming ? await response.text() : await response.json(); }
        catch { cancellation.throwIfTerminal(); throw new ProviderExecutionError("output_incomplete", { httpStatus: response.status }); }
        cancellation.throwIfTerminal();
        return { ...(streaming ? readStream(payload as string) : readCompletion(payload)), credentialFingerprint };
      } catch (error) {
        if (cancellation.cause() === "request") throw new ProviderExecutionError("request_cancelled", { httpStatus: 499, credentialFingerprint });
        if (cancellation.cause() === "deadline") throw new ProviderExecutionError("provider_timeout", { credentialFingerprint });
        if (error instanceof ProviderExecutionError) {
          throw new ProviderExecutionError(error.diagnostic.code, {
            httpStatus: error.diagnostic.httpStatus, usage: error.diagnostic.usage, credentialFingerprint,
          });
        }
        // No raw Error.message/cause, provider response, request or secret crosses the adapter.
        throw new ProviderExecutionError(error instanceof TypeError ? "network_error" : "unknown_error", { credentialFingerprint });
      } finally { cancellation.dispose(); }
    },
  };
}
