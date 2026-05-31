import type { JsonModeContract, JsonModeRequest } from "../../json-mode-contract";
import type { ProviderCapabilityFile } from "../../provider-method-contract";
import { assertProviderMethodSupported } from "../../provider-method-gate";

type FetchLike = (input: string, init: {
  method: "POST";
  headers: Record<string, string>;
  body: string;
}) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

export interface DeepSeekJsonModeAdapterOptions {
  apiKey: string;
  endpoint?: string;
  modelId?: "deepseek-chat";
  fetchImpl?: FetchLike;
}

const DEEPSEEK_CHAT_CAPABILITY: ProviderCapabilityFile = {
  providerId: "deepseek",
  models: [{ modelId: "deepseek-chat", supportedMethods: ["complete", "chat", "json_mode"], defaultMethod: "complete" }],
};

export function createDeepSeekChatJsonModeAdapter(options: DeepSeekJsonModeAdapterOptions) {
  const modelId = options.modelId ?? "deepseek-chat";
  const endpoint = options.endpoint ?? "https://api.deepseek.com/chat/completions";
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);

  assertProviderMethodSupported(DEEPSEEK_CHAT_CAPABILITY, modelId, "json_mode");

  return {
    async jsonMode(request: JsonModeRequest): Promise<JsonModeContract> {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: request.schema
                ? `${request.prompt}\n\nReturn JSON matching this schema: ${JSON.stringify(request.schema)}`
                : request.prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const detail = response.text ? await response.text() : "";
        throw new Error(`DeepSeek json_mode request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
      }

      const payload = await response.json() as Record<string, unknown>;
      return {
        output: parseDeepSeekJsonPayload(payload),
        done: true,
        receiptObligation: request.traceId,
      };
    },
  };
}

function parseDeepSeekJsonPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const choices = payload.choices as Array<{ message?: { content?: string } }> | undefined;
  const content = choices?.[0]?.message?.content;
  if (!content) return payload;

  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { value: parsed };
  } catch {
    return { raw: content };
  }
}
