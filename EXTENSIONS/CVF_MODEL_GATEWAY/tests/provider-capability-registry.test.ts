import { describe, expect, it } from "vitest";
import type { ProviderCapabilityModel } from "../src/provider-method-contract";
import {
  PROVIDER_CAPABILITY_OWNER_REFS,
  PROVIDER_CAPABILITY_REGISTRY,
  REVIEW_CVF_PROVIDER_METHODS,
} from "../src/provider-capability-registry";
import {
  ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
  ALIBABA_FREE_QUOTA_MODELS,
  getAlibabaFreeQuotaStatus,
} from "../src/alibaba-free-quota-model-ledger";
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

  it("registers all bounded Alibaba free-quota LLM ledger models as chat candidates", () => {
    const alibaba = PROVIDER_CAPABILITY_REGISTRY.find((entry) => entry.providerId === "alibaba");
    expect(alibaba).toBeDefined();
    const registeredModelIds = new Set(alibaba?.models.map((model) => model.modelId));
    for (const ledgerEntry of ALIBABA_FREE_QUOTA_MODELS) {
      expect(registeredModelIds.has(ledgerEntry.modelId)).toBe(true);
      expect(listRegistrySupportedMethods(
        PROVIDER_CAPABILITY_REGISTRY,
        "alibaba",
        ledgerEntry.modelId,
      )).toEqual(["complete", "chat"]);
      const contract = getProviderMethodContract(
        PROVIDER_CAPABILITY_REGISTRY,
        "alibaba",
        ledgerEntry.modelId,
      );
      expect(contract?.capabilityRef).toBe(`provider-capability/alibaba/${ledgerEntry.modelId}`);
    }
  });

  it("keeps Alibaba free-quota metadata bounded to the governed ledger reference", () => {
    const alibaba = PROVIDER_CAPABILITY_REGISTRY.find((entry) => entry.providerId === "alibaba");
    const qwen37Plus = alibaba?.models.find(
      (model): model is ProviderCapabilityModel => model.modelId === "qwen3.7-plus",
    );
    expect(qwen37Plus?.metadata).toMatchObject({
      freeQuotaLedgerRef: ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
      expirationDate: "2026-08-31",
      diagnosticRerunResult: "PASS",
      defaultEndpointHost: "dashscope-intl.aliyuncs.com",
    });
    expect(qwen37Plus?.metadata?.claimBoundary).toContain("no provider parity");
  });

  it("classifies Alibaba free-quota model usability by expiration before live use", () => {
    expect(getAlibabaFreeQuotaStatus(
      "qwen3.7-plus",
      new Date("2026-06-18T00:00:00Z"),
    )).toBe("usable");
    expect(getAlibabaFreeQuotaStatus(
      "qwen3.7-plus",
      new Date("2026-09-01T00:00:00Z"),
    )).toBe("expired");
    expect(getAlibabaFreeQuotaStatus(
      "unknown-model",
      new Date("2026-06-18T00:00:00Z"),
    )).toBe("unknown");
  });
});
