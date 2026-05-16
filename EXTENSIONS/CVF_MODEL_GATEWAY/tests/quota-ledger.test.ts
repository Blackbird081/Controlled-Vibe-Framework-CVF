import { describe, expect, it } from "vitest";
import { QuotaLedger } from "../src/quota-ledger";

describe("QuotaLedger", () => {
  it("allows usage when no limit is configured", () => {
    const ledger = new QuotaLedger(() => new Date("2026-05-16T00:00:00Z"));

    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-turbo", estimatedTokens: 100 }),
    ).toMatchObject({ allowed: true, reason: "no_limit_configured" });
  });

  it("tracks requests, estimated tokens, and actual tokens separately", () => {
    const ledger = new QuotaLedger(() => new Date("2026-05-16T00:00:00Z"));
    ledger.setLimit("dashscope", "qwen-turbo", {
      requestsPerDay: 2,
      estimatedTokensPerDay: 200,
      actualTokensPerDay: 150,
    });

    ledger.recordUse({ providerId: "dashscope", modelId: "qwen-turbo", estimatedTokens: 80, actualTokens: 70 });

    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-turbo", estimatedTokens: 90, actualTokens: 80 }),
    ).toMatchObject({ allowed: true, reason: "within_quota" });
    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-turbo", estimatedTokens: 130 }),
    ).toMatchObject({ allowed: false, reason: "estimated_tokens_per_day_exceeded" });
    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-turbo", actualTokens: 90 }),
    ).toMatchObject({ allowed: false, reason: "actual_tokens_per_day_exceeded" });
  });
});
