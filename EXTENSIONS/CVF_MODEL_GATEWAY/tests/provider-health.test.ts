import { describe, expect, it } from "vitest";
import { ProviderHealthMonitor } from "../src/provider-health";

describe("ProviderHealthMonitor", () => {
  it("treats unknown, healthy, and degraded providers as usable", () => {
    const monitor = new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z"));

    expect(monitor.isUsable("dashscope")).toBe(true);
    expect(monitor.recordSuccess("dashscope").state).toBe("healthy");
    expect(monitor.recordFailure("dashscope", 500, "timeout").state).toBe("degraded");
    expect(monitor.isUsable("dashscope")).toBe(true);
  });

  it("classifies rate limits and repeated failures as not usable", () => {
    const monitor = new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z"));

    expect(monitor.recordFailure("dashscope", 429, "quota").state).toBe("rate_limited");
    expect(monitor.isUsable("dashscope")).toBe(false);

    const second = new ProviderHealthMonitor(() => new Date("2026-05-16T00:00:00Z"));
    second.recordFailure("deepseek", 500, "one");
    second.recordFailure("deepseek", 500, "two");
    expect(second.recordFailure("deepseek", 500, "three").state).toBe("unavailable");
    expect(second.isUsable("deepseek")).toBe(false);
  });
});
