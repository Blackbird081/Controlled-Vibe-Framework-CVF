import { describe, expect, it } from "vitest";
import {
  isReasoningContract,
  REASONING_CONTRACT_REQUIRED_FIELDS,
  type ReasoningCapableProvider,
  type ReasoningContract,
  type ReasoningRequest,
} from "../src/reasoning-contract";

describe("reasoning contract", () => {
  it("declares the required reasoning envelope fields", () => {
    expect(REASONING_CONTRACT_REQUIRED_FIELDS).toEqual(["reasoning", "conclusion", "done"]);
  });

  it("accepts a minimal reasoning contract", () => {
    const result: ReasoningContract = { reasoning: "because", conclusion: "ship", done: true };

    expect(isReasoningContract(result)).toBe(true);
  });

  it("accepts receipt obligation metadata and done=false", () => {
    expect(isReasoningContract({
      reasoning: "still thinking",
      conclusion: "partial",
      done: false,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed reasoning results", () => {
    expect(isReasoningContract({ conclusion: "ship", done: true })).toBe(false);
    expect(isReasoningContract({ reasoning: "because", done: true })).toBe(false);
    expect(isReasoningContract({ reasoning: "because", conclusion: "ship", done: "true" })).toBe(false);
  });

  it("defines a reasoning-capable provider method", async () => {
    const provider: ReasoningCapableProvider = {
      reasoning(_request: ReasoningRequest) {
        return Promise.resolve({ reasoning: "because", conclusion: "ship", done: true });
      },
    };

    await expect(provider.reasoning({ traceId: "trace-1", prompt: "Decide" }))
      .resolves.toEqual({ reasoning: "because", conclusion: "ship", done: true });
  });
});
