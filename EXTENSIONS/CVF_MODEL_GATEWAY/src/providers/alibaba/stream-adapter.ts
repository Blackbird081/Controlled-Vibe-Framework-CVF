import type { StreamContract, StreamRequest } from "../../stream-contract";
import type { ProviderCapabilityFile } from "../../provider-method-contract";
import { assertProviderMethodSupported } from "../../provider-method-gate";

type FetchLike = (input: string, init: {
  method: "POST";
  headers: Record<string, string>;
  body: string;
}) => Promise<{
  ok: boolean;
  status: number;
  body?: AsyncIterable<Uint8Array> | null;
  text?: () => Promise<string>;
}>;

export interface AlibabaStreamAdapterOptions {
  apiKey: string;
  endpoint?: string;
  modelId?: "qwen-turbo";
  fetchImpl?: FetchLike;
}

const ALIBABA_QWEN_TURBO_CAPABILITY: ProviderCapabilityFile = {
  providerId: "alibaba",
  models: [{ modelId: "qwen-turbo", supportedMethods: ["complete", "chat", "stream"], defaultMethod: "complete" }],
};

export function createAlibabaQwenTurboStreamAdapter(options: AlibabaStreamAdapterOptions) {
  const modelId = options.modelId ?? "qwen-turbo";
  const endpoint = options.endpoint ?? "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);

  assertProviderMethodSupported(ALIBABA_QWEN_TURBO_CAPABILITY, modelId, "stream");

  return {
    async *stream(request: StreamRequest): AsyncIterable<StreamContract> {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          stream: true,
          messages: [
            ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
            { role: "user", content: request.prompt },
          ],
        }),
      });

      if (!response.ok) {
        const detail = response.text ? await response.text() : "";
        throw new Error(`Alibaba stream request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
      }

      if (!response.body) {
        yield {
          chunk: "",
          role: "assistant",
          done: true,
          receiptObligation: request.traceId,
        };
        return;
      }

      for await (const chunk of parseSseStream(response.body, request.traceId)) {
        yield chunk;
      }
    },
  };
}

async function* parseSseStream(
  body: AsyncIterable<Uint8Array>,
  traceId: string,
): AsyncIterable<StreamContract> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const bytes of body) {
    buffer += decoder.decode(bytes, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        yield { chunk: "", role: "assistant", done: true, receiptObligation: traceId };
        continue;
      }
      const text = readAlibabaDelta(data);
      if (text) {
        yield { chunk: text, role: "assistant", done: false, receiptObligation: traceId };
      }
    }
  }
}

function readAlibabaDelta(data: string): string {
  try {
    const parsed = JSON.parse(data);
    return parsed.output?.text
      ?? parsed.choices?.[0]?.delta?.content
      ?? parsed.choices?.[0]?.message?.content
      ?? "";
  } catch {
    return "";
  }
}
