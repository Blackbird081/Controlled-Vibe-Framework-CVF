import { describe, expect, it } from "vitest";
import {
  isStreamContract,
  STREAM_CONTRACT_REQUIRED_FIELDS,
  type StreamCapableProvider,
  type StreamContract,
  type StreamRequest,
} from "../src/stream-contract";

describe("stream contract", () => {
  it("declares the required stream envelope fields", () => {
    expect(STREAM_CONTRACT_REQUIRED_FIELDS).toEqual(["chunk", "role", "done"]);
  });

  it("accepts a minimal stream contract chunk", () => {
    const chunk: StreamContract = {
      chunk: "hello",
      role: "assistant",
      done: false,
    };

    expect(isStreamContract(chunk)).toBe(true);
  });

  it("accepts receipt obligation metadata without requiring live SSE", () => {
    expect(isStreamContract({
      chunk: "",
      role: "assistant",
      done: true,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed chunks", () => {
    expect(isStreamContract({ role: "assistant", done: false })).toBe(false);
    expect(isStreamContract({ chunk: "x", role: "assistant", done: "false" })).toBe(false);
  });

  it("defines a stream-capable provider method returning AsyncIterable chunks", async () => {
    const provider: StreamCapableProvider = {
      async *stream(_request: StreamRequest) {
        yield { chunk: "a", role: "assistant", done: false };
        yield { chunk: "", role: "assistant", done: true };
      },
    };

    const chunks: StreamContract[] = [];
    for await (const chunk of provider.stream({ traceId: "trace-1", prompt: "Say hi" })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      { chunk: "a", role: "assistant", done: false },
      { chunk: "", role: "assistant", done: true },
    ]);
  });
});
