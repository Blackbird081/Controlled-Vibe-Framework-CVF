export const ALIBABA_DASHSCOPE_INTL_ENDPOINT =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions" as const;

export const ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" as const;

export const ALIBABA_FREE_QUOTA_LEDGER_REFERENCE =
  "docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json" as const;

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
    modelId: "qwen3.6-plus-2026-04-02",
    expirationDate: "2026-07-01",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.6-plus",
    expirationDate: "2026-07-01",
    freeQuotaRemainingAtCapture: 911_370,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
    diagnosticRerunResult: "PASS",
  },
  {
    modelId: "qwen3.6-flash",
    expirationDate: "2026-07-16",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.6-flash-2026-04-16",
    expirationDate: "2026-07-16",
    freeQuotaRemainingAtCapture: 998_675,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
    diagnosticRerunResult: "PASS",
  },
  {
    modelId: "qwen3.6-35b-a3b",
    expirationDate: "2026-07-16",
    freeQuotaRemainingAtCapture: 998_835,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.6-max-preview",
    expirationDate: "2026-07-19",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.5-plus-2026-04-20",
    expirationDate: "2026-07-22",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.6-27b",
    expirationDate: "2026-07-22",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "deepseek-v4-flash",
    expirationDate: "2026-07-23",
    freeQuotaRemainingAtCapture: 998_902,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
    diagnosticRerunResult: "PASS",
  },
  {
    modelId: "deepseek-v4-pro",
    expirationDate: "2026-07-23",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-max",
    expirationDate: "2026-08-19",
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
    modelId: "qwen3.7-max-2026-05-17",
    expirationDate: "2026-08-23",
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
    modelId: "glm-5.1",
    expirationDate: "2026-08-25",
    freeQuotaRemainingAtCapture: 1_000_000,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
  },
  {
    modelId: "qwen3.7-plus",
    expirationDate: "2026-08-31",
    freeQuotaRemainingAtCapture: 998_474,
    freeQuotaTotalAtCapture: 1_000_000,
    statusAtCapture: "Enabled",
    diagnosticRerunResult: "PASS",
  },
  {
    modelId: "qwen3.7-plus-2026-05-26",
    expirationDate: "2026-08-31",
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
