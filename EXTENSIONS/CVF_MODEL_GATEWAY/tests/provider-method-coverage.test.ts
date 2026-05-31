import { describe, expect, it, vi } from "vitest";
import {
  assertProviderMethodSupported,
  listSupportedMethods,
  UnsupportedMethodError,
} from "../src/provider-method-gate";
import type { ProviderCapabilityFile } from "../src/provider-method-contract";
import { createAlibabaQwenTurboStreamAdapter } from "../src/providers/alibaba/stream-adapter";
import { createDeepSeekChatJsonModeAdapter } from "../src/providers/deepseek/json-mode-adapter";

const alibabaCapability: ProviderCapabilityFile = {
  providerId: "alibaba",
  models: [{ modelId: "qwen-turbo", supportedMethods: ["complete", "chat", "stream"], defaultMethod: "complete" }],
};

const deepseekCapability: ProviderCapabilityFile = {
  providerId: "deepseek",
  models: [{ modelId: "deepseek-chat", supportedMethods: ["complete", "chat", "json_mode"], defaultMethod: "complete" }],
};

async function* bytes(lines: string[]) {
  const encoder = new TextEncoder();
  for (const line of lines) {
    yield encoder.encode(line);
  }
}

describe("provider method coverage", () => {
  it("lists supported methods for Alibaba qwen-turbo and DeepSeek deepseek-chat", () => {
    expect(listSupportedMethods(alibabaCapability, "qwen-turbo")).toEqual(["complete", "chat", "stream"]);
    expect(listSupportedMethods(deepseekCapability, "deepseek-chat")).toEqual(["complete", "chat", "json_mode"]);
  });

  it("keeps legacy chat as an accepted alias for complete", () => {
    expect(() => assertProviderMethodSupported(alibabaCapability, "qwen-turbo", "complete")).not.toThrow();
    expect(() => assertProviderMethodSupported(alibabaCapability, "qwen-turbo", "chat")).not.toThrow();
  });

  it("throws a typed error for unsupported methods", () => {
    expect(() => assertProviderMethodSupported(alibabaCapability, "qwen-turbo", "json_mode"))
      .toThrow(UnsupportedMethodError);
    expect(() => assertProviderMethodSupported(deepseekCapability, "deepseek-chat", "stream"))
      .toThrow("deepseek/deepseek-chat does not support stream");
  });

  it("normalizes Alibaba qwen-turbo SSE chunks into StreamContract entries", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: bytes([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        "data: [DONE]\n\n",
      ]),
    });
    const adapter = createAlibabaQwenTurboStreamAdapter({ apiKey: "redacted", fetchImpl });

    const chunks = [];
    for await (const chunk of adapter.stream({ traceId: "trace-1", prompt: "Say hello" })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      { chunk: "Hello", role: "assistant", done: false, receiptObligation: "trace-1" },
      { chunk: " world", role: "assistant", done: false, receiptObligation: "trace-1" },
      { chunk: "", role: "assistant", done: true, receiptObligation: "trace-1" },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining("dashscope"), expect.objectContaining({
      method: "POST",
    }));
  });

  it("normalizes DeepSeek json_mode response content into JsonModeContract", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "{\"summary\":\"ok\",\"risk\":\"low\"}" } }],
      }),
    });
    const adapter = createDeepSeekChatJsonModeAdapter({ apiKey: "redacted", fetchImpl });

    const result = await adapter.jsonMode({
      traceId: "trace-json",
      prompt: "Return a JSON summary",
      schema: { type: "object" },
    });

    expect(result).toEqual({
      output: { summary: "ok", risk: "low" },
      done: true,
      receiptObligation: "trace-json",
    });
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body).response_format).toEqual({ type: "json_object" });
  });
});
