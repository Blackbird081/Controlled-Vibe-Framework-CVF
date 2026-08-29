import { describe, expect, it, vi } from "vitest";
import { CredentialBoundary } from "../src/credential-boundary";
import {
  createCredentialBoundOpenAiCompatibleExecuteAdapter,
  createOpenAiCompatibleExecuteAdapter,
  type OpenAiCompatibleFetch,
} from "../src/openai-compatible-execute-adapter";

const reference = {
  providerId: "openai",
  keyId: "lpci-openai",
  envNames: ["LPCI_LLM_API_KEY"],
};

function successFetch(content = "answer") {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 4, completion_tokens: 2 },
    }),
  })) as unknown as OpenAiCompatibleFetch;
}

describe("OpenAI-compatible execute adapter", () => {
  it("maps one injected fetch response without exposing the secret", async () => {
    const fetchImpl = successFetch();
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });

    const result = await adapter.execute({
      traceId: "trace-1",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
      systemPrompt: "system",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      text: "answer",
      usage: { inputTokens: 4, outputTokens: 2 },
    });
    expect(JSON.stringify(result)).not.toContain("fake-test-secret");
  });

  it("forwards the adapter AbortSignal to the actual fetch entry", async () => {
    const fetchImpl = successFetch();
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });
    const controller = new AbortController();
    await adapter.execute({
      traceId: "trace-signal",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
      signal: controller.signal,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("fails identity mismatch before the injected fetch", async () => {
    const fetchImpl = successFetch();
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });

    await expect(adapter.execute({
      traceId: "trace-2",
      providerId: "alibaba",
      modelId: "gpt-4o",
      prompt: "question",
    })).rejects.toThrow("identity mismatch");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps credential resolution inside the Model Gateway factory", async () => {
    const fetchImpl = successFetch("credential-bound answer");
    const boundary = new CredentialBoundary({ LPCI_LLM_API_KEY: "fake-contained-secret" });
    const adapter = createCredentialBoundOpenAiCompatibleExecuteAdapter({
      credential: boundary,
      credentialReference: reference,
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      fetchImpl,
    });

    const result = await adapter.execute({
      traceId: "trace-3",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    });
    expect(result.text).toBe("credential-bound answer");
    expect(JSON.stringify(result)).not.toContain("fake-contained-secret");
  });

  it("fails missing credential before adapter or fetch execution", () => {
    const fetchImpl = successFetch();
    expect(() => createCredentialBoundOpenAiCompatibleExecuteAdapter({
      credential: new CredentialBoundary({}),
      credentialReference: reference,
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      fetchImpl,
    })).toThrow("Credential unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("shields provider response details on an injected failure", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => "sensitive provider diagnostic",
    })) as unknown as OpenAiCompatibleFetch;
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });

    await expect(adapter.execute({
      traceId: "trace-4",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    })).rejects.toThrow("OpenAI-compatible provider request failed");
  });

  // EAFR-R10. Closes the EAFR-R8 adapter boundary residual: the adapter now
  // classifies its configured endpoint through the shared, gateway-owned
  // classifyAdapterDestination policy before ever invoking the injected
  // fetchImpl, so an unrecognised or external-store destination is denied
  // before any network I/O regardless of which fetch implementation the
  // caller supplies.
  it("[EAFR-R10] denies an unrecognised endpoint before the injected fetch is called", async () => {
    const unrecognisedEndpoint = "https://not-a-recognised-provider.example.invalid/v1/chat/completions";
    const fetchImpl = successFetch("must not be reached");
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: unrecognisedEndpoint,
      secret: "fake-test-secret",
      fetchImpl,
    });

    await expect(adapter.execute({
      traceId: "trace-r10-deny",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    })).rejects.toThrow("CVF_ADAPTER_DESTINATION_DENIED");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("[EAFR-R10] denies an external-store endpoint before the injected fetch is called", async () => {
    const upstashEndpoint = "https://balanced-shrew-118656.upstash.io/some/path";
    const fetchImpl = successFetch("must not be reached");
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: upstashEndpoint,
      secret: "fake-test-secret",
      fetchImpl,
    });

    await expect(adapter.execute({
      traceId: "trace-r10-store-deny",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    })).rejects.toThrow("CVF_ADAPTER_DESTINATION_DENIED");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("[EAFR-R10] denies a covered provider endpoint whose identity does not match configured providerId, before fetch", async () => {
    const fetchImpl = successFetch("must not be reached");
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      // A real, recognised provider endpoint, but for a different provider
      // than the adapter is configured with.
      endpoint: "https://api.anthropic.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });

    await expect(adapter.execute({
      traceId: "trace-r10-provider-mismatch",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    })).rejects.toThrow("CVF_ADAPTER_DESTINATION_DENIED");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("[EAFR-R10] permits a matching provider endpoint through to the injected fetch", async () => {
    const fetchImpl = successFetch("matching provider permitted");
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      secret: "fake-test-secret",
      fetchImpl,
    });

    const result = await adapter.execute({
      traceId: "trace-r10-provider-match",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.text).toBe("matching provider permitted");
  });

  it("[EAFR-R10] permits a non-provider (relative path) compatibility endpoint through to the injected fetch", async () => {
    const fetchImpl = successFetch("non-provider permitted");
    const adapter = createOpenAiCompatibleExecuteAdapter({
      providerId: "openai",
      modelId: "gpt-4o",
      endpoint: "/api/local-openai-compatible-proxy",
      secret: "fake-test-secret",
      fetchImpl,
    });

    const result = await adapter.execute({
      traceId: "trace-r10-non-provider",
      providerId: "openai",
      modelId: "gpt-4o",
      prompt: "question",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.text).toBe("non-provider permitted");
  });
});
