import { describe, expect, it } from "vitest";
import {
  isToolCallContract,
  TOOL_CALL_CONTRACT_REQUIRED_FIELDS,
  type ToolCallCapableProvider,
  type ToolCallContract,
  type ToolCallRequest,
} from "../src/tool-call-contract";

describe("tool call contract", () => {
  it("declares the required tool-call envelope fields", () => {
    expect(TOOL_CALL_CONTRACT_REQUIRED_FIELDS).toEqual(["toolName", "arguments", "done"]);
  });

  it("accepts a minimal tool-call contract", () => {
    const result: ToolCallContract = { toolName: "search", arguments: { q: "cvf" }, done: true };

    expect(isToolCallContract(result)).toBe(true);
  });

  it("accepts receipt obligation metadata and done=false", () => {
    expect(isToolCallContract({
      toolName: "search",
      arguments: { q: "cvf" },
      done: false,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed tool-call results", () => {
    expect(isToolCallContract({ arguments: {}, done: true })).toBe(false);
    expect(isToolCallContract({ toolName: "search", done: true })).toBe(false);
    expect(isToolCallContract({ toolName: "search", arguments: [], done: true })).toBe(false);
  });

  it("defines a tool-call-capable provider method", async () => {
    const provider: ToolCallCapableProvider = {
      toolCall(_request: ToolCallRequest) {
        return Promise.resolve({ toolName: "search", arguments: { q: "cvf" }, done: true });
      },
    };

    await expect(provider.toolCall({ traceId: "trace-1", prompt: "Search", tools: [] }))
      .resolves.toEqual({ toolName: "search", arguments: { q: "cvf" }, done: true });
  });
});
