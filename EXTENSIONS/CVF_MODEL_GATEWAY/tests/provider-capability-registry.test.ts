import { describe, expect, it } from "vitest";
import {
  PROVIDER_CAPABILITY_OWNER_REFS,
  PROVIDER_CAPABILITY_REGISTRY,
  REVIEW_CVF_PROVIDER_METHODS,
} from "../src/provider-capability-registry";
import {
  assertRegistryProviderMethodSupported,
  getProviderMethodContract,
  listRegistrySupportedMethods,
  normalizeProviderMethodName,
  UnsupportedMethodError,
} from "../src/provider-method-gate";

describe("provider capability registry", () => {
  it("declares the Review-CVF provider methods as the canonical matrix axis", () => {
    expect(REVIEW_CVF_PROVIDER_METHODS).toEqual([
      "complete",
      "stream",
      "tool_call",
      "reasoning",
      "json_mode",
      "vision",
      "embedding",
      "receipt",
    ]);
  });

  it("keeps retry, cost, and risk as owner references instead of provider methods", () => {
    expect(PROVIDER_CAPABILITY_OWNER_REFS.map((entry) => entry.name)).toEqual(["retry", "cost", "risk"]);
    expect(PROVIDER_CAPABILITY_OWNER_REFS.every((entry) => entry.status === "existing_owner_surface")).toBe(true);
    expect(REVIEW_CVF_PROVIDER_METHODS).not.toContain("retry");
    expect(REVIEW_CVF_PROVIDER_METHODS).not.toContain("cost");
    expect(REVIEW_CVF_PROVIDER_METHODS).not.toContain("risk");
  });

  it("returns registry-backed method contracts for known provider models", () => {
    expect(getProviderMethodContract(PROVIDER_CAPABILITY_REGISTRY, "alibaba", "qwen-turbo")).toEqual({
      providerId: "alibaba",
      modelId: "qwen-turbo",
      supportedMethods: ["complete", "chat", "stream"],
      defaultMethod: "complete",
      capabilityRef: "provider-capability/alibaba/qwen-turbo",
    });
    expect(listRegistrySupportedMethods(PROVIDER_CAPABILITY_REGISTRY, "deepseek", "deepseek-chat"))
      .toEqual(["complete", "chat", "json_mode"]);
    expect(getProviderMethodContract(PROVIDER_CAPABILITY_REGISTRY, "openai", "gpt-4o")).toEqual({
      providerId: "openai",
      modelId: "gpt-4o",
      supportedMethods: ["complete", "chat", "json_mode", "vision"],
      defaultMethod: "complete",
      capabilityRef: "provider-capability/openai/gpt-4o",
    });
  });

  it("preserves legacy chat as an alias for complete", () => {
    expect(normalizeProviderMethodName("chat")).toBe("complete");
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen-turbo",
      "chat",
    )).not.toThrow();
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen-turbo",
      "complete",
    )).not.toThrow();
  });

  it("fails deterministically for unsupported provider methods before adapter calls", () => {
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen-turbo",
      "tool_call",
    )).toThrow(UnsupportedMethodError);
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "deepseek",
      "deepseek-chat",
      "stream",
    )).toThrow("deepseek/deepseek-chat does not support stream");
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "missing",
      "unknown-model",
      "complete",
    )).toThrow("missing/unknown-model does not support complete");
  });

  it("records bounded vision support without claiming all-provider parity", () => {
    expect(listRegistrySupportedMethods(PROVIDER_CAPABILITY_REGISTRY, "alibaba", "qwen-vl-plus")).toEqual(["vision"]);
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen-vl-plus",
      "vision",
    )).not.toThrow();
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "deepseek",
      "deepseek-chat",
      "vision",
    )).toThrow(UnsupportedMethodError);
  });

  it("registers bounded Alibaba Qwen3 models without broad provider parity claims", () => {
    expect(getProviderMethodContract(PROVIDER_CAPABILITY_REGISTRY, "alibaba", "qwen3-32b")).toEqual({
      providerId: "alibaba",
      modelId: "qwen3-32b",
      supportedMethods: ["complete", "chat"],
      defaultMethod: "complete",
      capabilityRef: "provider-capability/alibaba/qwen3-32b",
    });
    expect(getProviderMethodContract(PROVIDER_CAPABILITY_REGISTRY, "alibaba", "qwen3-235b-a22b-thinking-2507")).toEqual({
      providerId: "alibaba",
      modelId: "qwen3-235b-a22b-thinking-2507",
      supportedMethods: ["complete", "chat", "reasoning"],
      defaultMethod: "complete",
      capabilityRef: "provider-capability/alibaba/qwen3-235b-a22b-thinking-2507",
    });
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen3-32b",
      "complete",
    )).not.toThrow();
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen3-235b-a22b-thinking-2507",
      "complete",
    )).not.toThrow();
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "alibaba",
      "qwen3-32b",
      "reasoning",
    )).toThrow(UnsupportedMethodError);
  });

  it("registers OpenAI gpt-4o as the bounded third provider without broad parity claims", () => {
    expect(listRegistrySupportedMethods(PROVIDER_CAPABILITY_REGISTRY, "openai", "gpt-4o"))
      .toEqual(["complete", "chat", "json_mode", "vision"]);
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "openai",
      "gpt-4o",
      "complete",
    )).not.toThrow();
    expect(() => assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      "openai",
      "gpt-4o",
      "embedding",
    )).toThrow(UnsupportedMethodError);
  });
});
