import { describe, expect, it, vi } from "vitest";
import {
  assertVisionProviderCapability,
  buildVisionRuntimeRequestBody,
  createAlibabaVisionRuntimeAdapter,
  isVisionRuntimeModel,
} from "../src/vision-runtime-adapter";

describe("vision-runtime-adapter", () => {
  it("accepts only the authorized Alibaba vision runtime lane", () => {
    expect(isVisionRuntimeModel("alibaba", "qwen-vl-plus")).toBe(true);
    expect(() => assertVisionProviderCapability("deepseek", "deepseek-chat"))
      .toThrow("not authorized for VisionRequest runtime");
  });

  it("builds OpenAI-compatible vision payload with URL image input", () => {
    const body = buildVisionRuntimeRequestBody({
      traceId: "trace-1",
      imageUrl: "https://example.com/image.png",
      prompt: "Describe the UI screenshot.",
    });

    expect(body).toMatchObject({
      model: "qwen-vl-plus",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Describe the UI screenshot." },
          { type: "image_url", image_url: { url: "https://example.com/image.png" } },
        ],
      }],
    });
  });

  it("rejects raw filesystem image paths", () => {
    expect(() => buildVisionRuntimeRequestBody({
      traceId: "trace-raw-path",
      imageUrl: "C:\\private\\photo.png",
      prompt: "Describe this image.",
    })).toThrow("raw file paths are not allowed");
  });

  it("rejects ambiguous image sources", () => {
    expect(() => buildVisionRuntimeRequestBody({
      traceId: "trace-ambiguous",
      imageUrl: "https://example.com/image.png",
      imageBase64: "iVBORw0KGgo=",
      prompt: "Describe this image.",
    })).toThrow("exactly one imageUrl or imageBase64");
  });

  it("allows legal base64 characters including slash", () => {
    const body = buildVisionRuntimeRequestBody({
      traceId: "trace-base64",
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8=",
      mimeType: "image/png",
      prompt: "Describe this image.",
    });

    expect(body.messages[0].content[1]).toMatchObject({
      type: "image_url",
      image_url: { url: expect.stringContaining("data:image/png;base64,") },
    });
  });

  it("returns a VisionContract from the provider response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "A compact interface screenshot with a clear header." } }],
      }),
    });
    const adapter = createAlibabaVisionRuntimeAdapter({
      apiKey: "test-key",
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    const result = await adapter.vision({
      traceId: "trace-2",
      imageBase64: "iVBORw0KGgo=",
      mimeType: "image/png",
      prompt: "Describe the image.",
    });

    expect(result).toMatchObject({
      description: "A compact interface screenshot with a clear header.",
      done: true,
      receiptObligation: "vision_runtime_receipt_required",
    });
    const requestBody = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(JSON.stringify(requestBody)).toContain("data:image/png;base64,");
    expect(JSON.stringify(requestBody)).not.toContain("C:\\");
  });
});
