import { describe, expect, it } from "vitest";
import { ProviderRegistry, type ProviderRecord } from "../src/provider-registry";

const enabledProvider: ProviderRecord = {
  id: "dashscope",
  displayName: "DashScope",
  status: "enabled",
  riskClass: "medium",
  models: [{ id: "qwen-turbo", riskClass: "medium", supportsStreaming: true }],
};

describe("ProviderRegistry", () => {
  it("registers providers and returns defensive copies", () => {
    const registry = new ProviderRegistry([enabledProvider]);

    const first = registry.get("dashscope")!;
    first.models[0]!.id = "mutated";

    expect(registry.get("dashscope")?.models[0]?.id).toBe("qwen-turbo");
    expect(registry.listRoutable().map((provider) => provider.id)).toEqual(["dashscope"]);
  });

  it("denies disabled and experimental providers unless explicitly allowed", () => {
    const registry = new ProviderRegistry([
      enabledProvider,
      {
        id: "disabled",
        displayName: "Disabled",
        status: "disabled",
        riskClass: "low",
        models: [{ id: "disabled-model", riskClass: "low" }],
      },
      {
        id: "experimental",
        displayName: "Experimental",
        status: "experimental",
        riskClass: "high",
        models: [{ id: "exp-model", riskClass: "high" }],
      },
    ]);

    expect(registry.isRoutable("disabled")).toBe(false);
    expect(registry.isRoutable("experimental")).toBe(false);
    expect(registry.isRoutable("experimental", { allowExperimental: true })).toBe(true);
  });

  it("asserts provider and model boundaries", () => {
    const registry = new ProviderRegistry([enabledProvider]);

    expect(() => registry.assertAllowed("dashscope", "qwen-turbo")).not.toThrow();
    expect(() => registry.assertAllowed("dashscope", "missing")).toThrow("model_not_registered");
    expect(() => registry.assertAllowed("missing")).toThrow("provider_not_registered");
  });
});
