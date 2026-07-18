import type {
  ProviderCapabilityFile,
  ProviderCapabilityModel,
  ProviderCapabilityOwnerRef,
  ProviderMethodName,
} from "./provider-method-contract";
import {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
  ALIBABA_FREE_QUOTA_MODELS,
} from "./alibaba-free-quota-model-ledger";

export const REVIEW_CVF_PROVIDER_METHODS = [
  "complete",
  "stream",
  "tool_call",
  "reasoning",
  "json_mode",
  "vision",
  "embedding",
  "receipt",
] as const satisfies readonly ProviderMethodName[];

export const LEGACY_PROVIDER_METHOD_ALIASES = {
  chat: "complete",
} as const satisfies Partial<Record<ProviderMethodName, ProviderMethodName>>;

const ALIBABA_FREE_QUOTA_CAPABILITY_MODELS: ProviderCapabilityModel[] = ALIBABA_FREE_QUOTA_MODELS.map(
  (entry) => ({
    modelId: entry.modelId,
    supportedMethods: ["complete", "chat"] as const,
    defaultMethod: "complete",
    metadata: {
      quotaSource: "operator_alibaba_model_studio_free_quota_screenshot",
      freeQuotaLedgerRef: ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
      expirationDate: entry.expirationDate,
      freeQuotaRemainingAtCapture: entry.freeQuotaRemainingAtCapture,
      freeQuotaTotalAtCapture: entry.freeQuotaTotalAtCapture,
      statusAtCapture: entry.statusAtCapture,
      diagnosticRerunResult:
        "diagnosticRerunResult" in entry ? entry.diagnosticRerunResult : null,
      defaultEndpointHost: new URL(ALIBABA_DASHSCOPE_INTL_ENDPOINT).host,
      claimBoundary:
        "bounded free-quota routing candidate only; no provider parity or ranking claim",
    },
  }),
);

export const PROVIDER_CAPABILITY_OWNER_REFS = [
  {
    name: "retry",
    ownerSurface: "fallback-policy",
    status: "existing_owner_surface",
    reference: "EXTENSIONS/CVF_MODEL_GATEWAY/src/fallback-policy.ts",
  },
  {
    name: "cost",
    ownerSurface: "quota-ledger",
    status: "existing_owner_surface",
    reference: "EXTENSIONS/CVF_MODEL_GATEWAY/src/quota-ledger.ts",
  },
  {
    name: "risk",
    ownerSurface: "gateway-policy",
    status: "existing_owner_surface",
    reference: "EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-policy.ts",
  },
] as const satisfies readonly ProviderCapabilityOwnerRef[];

export const PROVIDER_CAPABILITY_REGISTRY = [
  {
    contractVersion: "cvf.providerCapability.v1",
    providerId: "alibaba",
    capabilityRef: "provider-capability/alibaba",
    ownerRefs: PROVIDER_CAPABILITY_OWNER_REFS,
    models: [
      {
        modelId: "qwen-turbo",
        supportedMethods: ["complete", "chat", "stream"],
        defaultMethod: "complete",
      },
      {
        modelId: "qwen-vl-plus",
        supportedMethods: ["vision"],
        defaultMethod: "vision",
      },
      {
        modelId: "qwen3-32b",
        supportedMethods: ["complete", "chat"],
        defaultMethod: "complete",
      },
      {
        modelId: "qwen3-235b-a22b-thinking-2507",
        supportedMethods: ["complete", "chat", "reasoning"],
        defaultMethod: "complete",
      },
      ...ALIBABA_FREE_QUOTA_CAPABILITY_MODELS,
    ],
  },
  {
    contractVersion: "cvf.providerCapability.v1",
    providerId: "deepseek",
    capabilityRef: "provider-capability/deepseek",
    ownerRefs: PROVIDER_CAPABILITY_OWNER_REFS,
    models: [
      {
        modelId: "deepseek-chat",
        supportedMethods: ["complete", "chat", "json_mode"],
        defaultMethod: "complete",
      },
    ],
  },
  {
    contractVersion: "cvf.providerCapability.v1",
    providerId: "openai",
    capabilityRef: "provider-capability/openai",
    ownerRefs: PROVIDER_CAPABILITY_OWNER_REFS,
    models: [
      {
        modelId: "gpt-4o",
        supportedMethods: ["complete", "chat", "json_mode", "vision"],
        defaultMethod: "complete",
      },
    ],
  },
] as const satisfies readonly ProviderCapabilityFile[];
