import type {
  ProviderExecutionAdapter,
  ProviderExecutionAdapterInput,
  ProviderExecutionAdapterResult,
} from "./provider-execution-bridge";
import type { CredentialReference } from "./credential-boundary";
import { CredentialBoundary } from "./credential-boundary";
import { classifyAdapterDestination } from "./adapter-destination-policy";

export type OpenAiCompatibleFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

export interface OpenAiCompatibleAdapterOptions {
  providerId: string;
  modelId: string;
  endpoint: string;
  secret: string;
  fetchImpl: OpenAiCompatibleFetch;
}

export interface CredentialBoundOpenAiCompatibleAdapterOptions {
  credential: CredentialBoundary;
  credentialReference: CredentialReference;
  providerId: string;
  modelId: string;
  endpoint: string;
  fetchImpl: OpenAiCompatibleFetch;
}

export function createOpenAiCompatibleExecuteAdapter(
  options: OpenAiCompatibleAdapterOptions,
): ProviderExecutionAdapter {
  const { providerId, modelId, endpoint, secret, fetchImpl } = options;
  return {
    providerId,
    async execute(
      input: ProviderExecutionAdapterInput,
    ): Promise<ProviderExecutionAdapterResult> {
      if (input.providerId !== providerId || input.modelId !== modelId) {
        throw new Error("OpenAI-compatible adapter identity mismatch");
      }

      // EAFR-R10. Classify the configured endpoint through the single
      // gateway-owned destination policy before ever invoking the injected
      // fetchImpl, so an unrecognised or external-store destination cannot
      // reach the network regardless of what fetch implementation the caller
      // supplies. A provider match whose identity differs from the adapter's
      // own configured providerId is also denied before fetch: identity
      // validation is not destination validation.
      const destination = classifyAdapterDestination(endpoint);
      if (destination.kind === "deny") {
        throw new Error(
          `CVF_ADAPTER_DESTINATION_DENIED: ${destination.reason}`,
        );
      }
      if (destination.kind === "provider" && destination.provider !== providerId) {
        throw new Error(
          `CVF_ADAPTER_DESTINATION_DENIED: endpoint resolves to provider `
          + `${destination.provider}, which does not match configured `
          + `providerId ${providerId}`,
        );
      }

      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          stream: false,
          messages: [
            ...(input.systemPrompt
              ? [{ role: "system", content: input.systemPrompt }]
              : []),
            { role: "user", content: input.prompt },
          ],
        }),
        signal: input.signal,
      });
      if (!response.ok) {
        throw new Error("OpenAI-compatible provider request failed");
      }
      const payload = (await response.json()) as Record<string, unknown>;
      return {
        text: readCompletionText(payload),
        usage: readUsage(payload),
      };
    },
  };
}

export function createCredentialBoundOpenAiCompatibleExecuteAdapter(
  options: CredentialBoundOpenAiCompatibleAdapterOptions,
): ProviderExecutionAdapter {
  if (options.credentialReference.providerId !== options.providerId) {
    throw new Error("Credential reference provider mismatch");
  }
  const secret = options.credential.resolveSecretForRuntime(options.credentialReference);
  if (!secret) {
    throw new Error("Credential unavailable for OpenAI-compatible adapter");
  }
  return createOpenAiCompatibleExecuteAdapter({
    providerId: options.providerId,
    modelId: options.modelId,
    endpoint: options.endpoint,
    secret,
    fetchImpl: options.fetchImpl,
  });
}

function readCompletionText(payload: Record<string, unknown>): string {
  const choices = payload.choices as
    | Array<{ message?: { content?: string } }>
    | undefined;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }
  const output = payload.output as { text?: string } | undefined;
  return output?.text ?? "";
}

function readUsage(
  payload: Record<string, unknown>,
): { inputTokens: number; outputTokens: number } | undefined {
  const usage = payload.usage as
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
      }
    | undefined;
  if (!usage) {
    return undefined;
  }
  return {
    inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
  };
}
