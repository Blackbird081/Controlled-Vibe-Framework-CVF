import { describe, expect, it } from "vitest";
import { GatewayReceiptBuilder, sanitizeReceiptMetadata } from "../src/gateway-receipt";

describe("GatewayReceiptBuilder", () => {
  it("builds audit receipts with policy and validation fields", () => {
    const builder = new GatewayReceiptBuilder(
      () => new Date("2026-05-16T00:00:00Z"),
      () => "abc123",
    );

    const receipt = builder.build({
      traceId: "trace-1",
      providerId: "dashscope",
      requestedModelId: "qwen-turbo",
      selectedModelId: "qwen-turbo",
      decision: "selected",
      reason: "policy_health_quota_selected",
      policy: {
        traceId: "trace-1",
        policyResult: "allow",
        dataClassification: "internal",
        requestRiskClass: "medium",
      },
      validationState: "passed",
      metadata: { apiKey: "raw-secret", nested: { token: "raw-token", safe: "ok" } },
    });

    expect(receipt.receiptId).toBe("gw_20260516000000000_abc123");
    expect(receipt.policyResult).toBe("allow");
    expect(receipt.validationState).toBe("passed");
    expect(JSON.stringify(receipt)).not.toContain("raw-secret");
    expect(JSON.stringify(receipt)).not.toContain("raw-token");
  });

  it("sanitizes credential-like metadata keys recursively", () => {
    expect(sanitizeReceiptMetadata({ token: "abc", nested: { secret: "def", value: 1 } })).toEqual({
      token: "[REDACTED]",
      nested: { secret: "[REDACTED]", value: 1 },
    });
  });
});
