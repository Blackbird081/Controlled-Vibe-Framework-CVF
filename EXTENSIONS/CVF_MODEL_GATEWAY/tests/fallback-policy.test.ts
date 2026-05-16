import { describe, expect, it } from "vitest";
import { FallbackPolicy } from "../src/fallback-policy";

describe("FallbackPolicy", () => {
  it("allows retryable failures while attempts remain", () => {
    const policy = new FallbackPolicy({ maxAttempts: 2 }, () => new Date("2026-05-16T00:00:00Z"));
    const attempt = policy.createAttempt("dashscope", "qwen-turbo", "timeout", 504);

    expect(attempt.at).toBe("2026-05-16T00:00:00.000Z");
    expect(policy.decide([attempt], 504)).toMatchObject({
      shouldFallback: true,
      reason: "retryable_or_unknown_failure",
      remainingAttempts: 1,
    });
  });

  it("stops on non-retryable status and max attempts", () => {
    const policy = new FallbackPolicy({ maxAttempts: 1 });
    const attempt = policy.createAttempt("dashscope", "qwen-turbo", "bad request", 400);

    expect(policy.decide([], 400)).toMatchObject({ shouldFallback: false, reason: "non_retryable_status" });
    expect(policy.decide([attempt], 500)).toMatchObject({ shouldFallback: false, reason: "max_attempts_reached" });
  });
});
