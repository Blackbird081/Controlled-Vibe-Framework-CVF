import { describe, expect, it } from "vitest";
import {
  isJsonModeContract,
  JSON_MODE_CONTRACT_REQUIRED_FIELDS,
  type JsonModeCapableProvider,
  type JsonModeContract,
  type JsonModeRequest,
} from "../src/json-mode-contract";

describe("json mode contract", () => {
  it("declares the required JSON mode envelope fields", () => {
    expect(JSON_MODE_CONTRACT_REQUIRED_FIELDS).toEqual(["output", "done"]);
  });

  it("accepts a minimal JSON mode contract", () => {
    const result: JsonModeContract = { output: { ok: true }, done: true };

    expect(isJsonModeContract(result)).toBe(true);
  });

  it("accepts receipt obligation metadata and done=false", () => {
    expect(isJsonModeContract({
      output: { partial: true },
      done: false,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed JSON mode results", () => {
    expect(isJsonModeContract({ done: true })).toBe(false);
    expect(isJsonModeContract({ output: { ok: true } })).toBe(false);
    expect(isJsonModeContract({ output: [], done: true })).toBe(false);
  });

  it("defines a JSON-mode-capable provider method", async () => {
    const provider: JsonModeCapableProvider = {
      jsonMode(_request: JsonModeRequest) {
        return Promise.resolve({ output: { ok: true }, done: true });
      },
    };

    await expect(provider.jsonMode({ traceId: "trace-1", prompt: "Return JSON" }))
      .resolves.toEqual({ output: { ok: true }, done: true });
  });
});
