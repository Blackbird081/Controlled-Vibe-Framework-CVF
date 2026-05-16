import { describe, expect, it } from "vitest";
import { StickySessionStore } from "../src/sticky-session";

describe("StickySessionStore", () => {
  it("reuses active bindings", () => {
    const store = new StickySessionStore(60_000, () => new Date("2026-05-16T00:00:00Z"));

    store.bind("session-1", "dashscope", "qwen-turbo");

    expect(store.get("session-1")).toMatchObject({
      sessionId: "session-1",
      providerId: "dashscope",
      modelId: "qwen-turbo",
    });
  });

  it("expires records and supports policy override", () => {
    let now = new Date("2026-05-16T00:00:00Z");
    const store = new StickySessionStore(1_000, () => now);

    store.bind("session-1", "dashscope", "qwen-turbo");
    expect(store.get("session-1", { policyOverride: true })).toBeUndefined();

    now = new Date("2026-05-16T00:00:02Z");
    expect(store.get("session-1")).toBeUndefined();
  });
});
