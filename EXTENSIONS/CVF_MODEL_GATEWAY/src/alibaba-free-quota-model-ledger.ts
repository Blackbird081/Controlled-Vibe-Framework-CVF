export const ALIBABA_DASHSCOPE_INTL_ENDPOINT =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions" as const;

export const ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" as const;

export const ALIBABA_FREE_QUOTA_LEDGER_REFERENCE =
  "docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json" as const;

export const ALIBABA_T6_FREE_QUOTA_TARGET_MODEL = "qwen3.7-flash" as const;
export const ALIBABA_T6_FREE_QUOTA_TARGET_SNAPSHOT = "qwen3.7-flash-2026-07-15" as const;

export type AlibabaFreeQuotaStatus = "usable" | "expired" | "unknown";

export interface AlibabaFreeQuotaModelLedgerEntry {
  readonly modelId: string;
  readonly expirationDate: string;
  readonly freeQuotaRemainingAtCapture: number;
  readonly freeQuotaTotalAtCapture: number;
  readonly statusAtCapture: "Enabled";
  readonly diagnosticRerunResult?: "PASS" | "FAIL_FREE_TIER_EXHAUSTED";
}

export const ALIBABA_FREE_QUOTA_MODELS = [
  {
    modelId: "qwen3.7-flash-2026-07-15",
    expirationDate: "2026-10-22",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-plus",
    expirationDate: "2026-08-31",
    freeQuotaRemainingAtCapture: 989_246,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
    diagnosticRerunResult: "PASS",
  },
  {
    modelId: "qwen3.7-flash",
    expirationDate: "2026-10-22",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max-2026-05-17",
    expirationDate: "2026-08-23",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max-2026-06-08",
    expirationDate: "2026-09-07",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "glm-5.1",
    expirationDate: "2026-08-25",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max-preview",
    expirationDate: "2026-08-23",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "deepseek-v4-flash-0731",
    expirationDate: "2026-10-30",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max",
    expirationDate: "2026-08-19",
    freeQuotaRemainingAtCapture: 951_277,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "glm-5.2",
    expirationDate: "2026-09-23",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "kimi-k2.7-code",
    expirationDate: "2026-09-23",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "deepseek-v4-pro-0813",
    expirationDate: "2026-11-12",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max-2026-05-20",
    expirationDate: "2026-08-19",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-plus-2026-05-26",
    expirationDate: "2026-08-31",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.8-2.4t-a95b",
    expirationDate: "2026-11-11",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.8-max",
    expirationDate: "2026-10-31",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
] as const satisfies readonly AlibabaFreeQuotaModelLedgerEntry[];

export function getAlibabaFreeQuotaModel(
  modelId: string,
): AlibabaFreeQuotaModelLedgerEntry | undefined {
  return ALIBABA_FREE_QUOTA_MODELS.find((entry) => entry.modelId === modelId);
}

export function getAlibabaFreeQuotaStatus(
  modelId: string,
  now: Date = new Date(),
): AlibabaFreeQuotaStatus {
  const entry = getAlibabaFreeQuotaModel(modelId);
  if (!entry) {
    return "unknown";
  }
  const expirationExclusive = new Date(`${entry.expirationDate}T23:59:59.999Z`);
  return now.getTime() <= expirationExclusive.getTime() ? "usable" : "expired";
}

export function resolveAlibabaDashScopeEndpoint(
  env: Record<string, string | undefined> = {},
): string {
  return (
    env.DASHSCOPE_COMPAT_ENDPOINT?.trim() ||
    env.ALIBABA_DASHSCOPE_ENDPOINT?.trim() ||
    env.CVF_ALIBABA_DASHSCOPE_ENDPOINT?.trim() ||
    ALIBABA_DASHSCOPE_INTL_ENDPOINT
  );
}
