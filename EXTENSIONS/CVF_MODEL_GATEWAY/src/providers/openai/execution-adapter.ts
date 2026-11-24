import type { ProviderExecutionAdapter, ProviderExecutionAdapterInput, ProviderExecutionAdapterResult } from "../../provider-execution-bridge";
import type { CredentialReference } from "../../credential-boundary";
import { CredentialBoundary, fingerprintSecret } from "../../credential-boundary";
import { classifyAdapterDestination } from "../../adapter-destination-policy";
import { ProviderExecutionError, sanitizeGatewayProviderUsage } from "../../unified-gateway-interface-contract";
import type { GatewayProviderUsage } from "../../unified-gateway-interface-contract";

export const OPENAI_CHAT_COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions" as const;

export interface OpenAiRequestSignal {
  signal: AbortSignal;
  cause(): "request" | "deadline" | null;
  throwIfTerminal(): void;
  dispose(): void;
}
export type OpenAiExecutionFetch = (input: string, init: {
  method: "POST"; headers: Record<string, string>; body: string; signal: AbortSignal; redirect: "error";
}) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export interface OpenAiExecutionAdapterOptions {
  credential: CredentialBoundary;
  credentialRef: CredentialReference;
  /** Defaults to process.env; only OPENAI_BASE_URL and CVF_AI_PROVIDER_TIMEOUT_MS are read from it. */
  env?: Record<string, string | undefined>;
  fetchImpl?: OpenAiExecutionFetch;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Web injects its existing cancellation owner; Gateway has no Web dependency. */
  composeRequestSignal?: (signal: AbortSignal | undefined, timeoutMs: number) => OpenAiRequestSignal;
}

/** Gateway fallback for callers without an existing cancellation owner. First cause wins. */
function composeSignal(request: AbortSignal | undefined, timeoutMs: number): OpenAiRequestSignal {
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
/** Reasoning-family models reject max_tokens/temperature and require max_completion_tokens. */
export function openAiUsesCompletionTokenParam(model: string): boolean {
  return /^(gpt-[56]|o[134])/i.test(model);
}
/**
 * Builds the chat-completions endpoint from OPENAI_BASE_URL (default: the OpenAI host). This function does not
 * validate; the adapter then enforces that the result is https, has no credentials or port, and classifies as provider
 * `openai` under the gateway destination policy, so OPENAI_BASE_URL can only re-point inside the admitted host.
 */
export function resolveOpenAiChatEndpoint(env: Record<string, string | undefined>): string {
  const base = env.OPENAI_BASE_URL?.trim();
  if (!base) return OPENAI_CHAT_COMPLETIONS_ENDPOINT;
  const trimmed = base.replace(/\/+$/, "");
  return /\/chat\/completions$/i.test(trimmed) ? trimmed : `${trimmed}/chat/completions`;
}
async function isInsufficientQuota(response: { json(): Promise<unknown> }): Promise<boolean> {
  try {
    const error = record(record(await response.json()).error);
    return error.code === "insufficient_quota" || error.type === "insufficient_quota";
  } catch { return false; }
}
function readCompletion(payload: unknown): ProviderExecutionAdapterResult {
  const data = record(payload);
  const choice = record(data.choices?.[0]);
  const usage = usageOf(data.usage);
  const text = record(choice.message).content;
  if (typeof text !== "string" || !text.trim() || (choice.finish_reason != null && choice.finish_reason !== "stop")) {
    throw new ProviderExecutionError("output_incomplete", { httpStatus: 200, usage });
  }
  return {
    text,
    ...(usage ? { providerUsage: usage } : {}),
    ...(usage?.inputTokens !== undefined && usage.outputTokens !== undefined
      ? { usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens } } : {}),
  };
}

/**
 * One OpenAI chat-completions text invocation; no retry, provider fallback, or secret captured at
 * construction. Usage is reported only when the provider response carries it.
 */
export function createOpenAiExecutionAdapter(options: OpenAiExecutionAdapterOptions): ProviderExecutionAdapter {
  const credentialRef = { ...options.credentialRef, envNames: [...options.credentialRef.envNames] };
  return {
    providerId: "openai",
    async execute(input: ProviderExecutionAdapterInput): Promise<ProviderExecutionAdapterResult> {
      const env = options.env ?? process.env;
      const configuredTimeout = Number(options.timeoutMs ?? env.CVF_AI_PROVIDER_TIMEOUT_MS ?? 60_000);
      const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? Math.max(1_000, configuredTimeout) : 60_000;
      const cancellation = (options.composeRequestSignal ?? composeSignal)(input.signal, timeoutMs);
      let credentialFingerprint: string | undefined;
      try {
        cancellation.throwIfTerminal();
        if (input.providerId !== "openai" || credentialRef.providerId !== "openai") throw new ProviderExecutionError("invalid_identity");
        const endpoint = resolveOpenAiChatEndpoint(env);
        let destinationUrl: URL;
        try { destinationUrl = new URL(endpoint); }
        catch { throw new ProviderExecutionError("destination_denied"); }
        if (destinationUrl.protocol !== "https:" || destinationUrl.username || destinationUrl.password || destinationUrl.port) {
          throw new ProviderExecutionError("destination_denied");
        }
        const destination = classifyAdapterDestination(endpoint);
        if (destination.kind !== "provider" || destination.provider !== "openai") throw new ProviderExecutionError("destination_denied");
        const secret = options.credential.resolveSecretForRuntime(credentialRef);
        if (!secret) throw new ProviderExecutionError("credential_unavailable");
        credentialFingerprint = fingerprintSecret(secret);
        cancellation.throwIfTerminal();
        const limit = options.maxTokens || 4096;
        const response = await (options.fetchImpl ?? globalThis.fetch)(endpoint, {
          method: "POST", redirect: "error",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
          body: JSON.stringify({
            model: input.modelId,
            messages: [
              ...(input.systemPrompt !== undefined ? [{ role: "system", content: input.systemPrompt }] : []),
              { role: "user", content: input.prompt },
            ],
            ...(openAiUsesCompletionTokenParam(input.modelId)
              ? { max_completion_tokens: limit }
              : { max_tokens: limit, temperature: options.temperature ?? 0.7 }),
            ...(/^(gpt-6-luna|gpt-6\.1-terra)(?:$|-)/i.test(input.modelId) ? { reasoning_effort: "none" } : {}),
          }),
          signal: cancellation.signal,
        });
        cancellation.throwIfTerminal();
        if (!response.ok) {
          // Only the closed marker `insufficient_quota` is read from a 429 body; the body is never retained or forwarded.
          if (response.status === 429 && await isInsufficientQuota(response)) throw new ProviderExecutionError("quota_locked", { httpStatus: 429 });
          throw new ProviderExecutionError("provider_http_error", { httpStatus: response.status });
        }
        let payload: unknown;
        try { payload = await response.json(); }
        catch { cancellation.throwIfTerminal(); throw new ProviderExecutionError("output_incomplete", { httpStatus: response.status }); }
        cancellation.throwIfTerminal();
        return { ...readCompletion(payload), credentialFingerprint };
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
