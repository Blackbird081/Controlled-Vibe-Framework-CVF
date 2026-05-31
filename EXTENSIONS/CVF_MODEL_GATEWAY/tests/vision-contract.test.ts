import { describe, expect, it } from "vitest";
import {
  isVisionContract,
  VISION_CONTRACT_REQUIRED_FIELDS,
  type VisionCapableProvider,
  type VisionContract,
  type VisionRequest,
} from "../src/vision-contract";

describe("vision contract", () => {
  it("declares the required vision envelope fields", () => {
    expect(VISION_CONTRACT_REQUIRED_FIELDS).toEqual(["description", "done"]);
  });

  it("accepts a minimal vision contract", () => {
    const result: VisionContract = { description: "a cat", done: true };

    expect(isVisionContract(result)).toBe(true);
  });

  it("accepts confidence and receipt obligation metadata", () => {
    expect(isVisionContract({
      description: "a cat",
      confidence: 0.9,
      done: true,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed vision results", () => {
    expect(isVisionContract({ done: true })).toBe(false);
    expect(isVisionContract({ description: "a cat" })).toBe(false);
    expect(isVisionContract({ description: "a cat", done: true, confidence: "0.9" })).toBe(false);
  });

  it("defines a vision-capable provider method", async () => {
    const provider: VisionCapableProvider = {
      vision(_request: VisionRequest) {
        return Promise.resolve({ description: "a cat", done: true });
      },
    };

    await expect(provider.vision({ traceId: "trace-1", prompt: "Describe" }))
      .resolves.toEqual({ description: "a cat", done: true });
  });
});
