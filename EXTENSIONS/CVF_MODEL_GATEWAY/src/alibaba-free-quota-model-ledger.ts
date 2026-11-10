export const ALIBABA_DASHSCOPE_INTL_ENDPOINT =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions" as const;
export const ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" as const;
export const ALIBABA_WORKSPACE_DASHSCOPE_ENDPOINT =
  "https://ws-remplsp27g5oicq1.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions" as const;
export const ALIBABA_FREE_QUOTA_LEDGER_REFERENCE =
  "docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json" as const;

// Historical locators, permanently absent from active candidates.
export const ALIBABA_T6_FREE_QUOTA_TARGET_MODEL = "qwen3.7-flash" as const;
export const ALIBABA_T6_FREE_QUOTA_TARGET_SNAPSHOT = "qwen3.7-flash-2026-07-15" as const;
export type AlibabaModelFamily = "text" | "vision" | "multimodal" | "speech" | "embedding";
export type AlibabaFreeQuotaStatus = "usable" | "expired" | "unknown" | "exhausted" | "disabled" | "retired";
export interface AlibabaFreeQuotaModelLedgerEntry {
  readonly modelId: string;
  readonly modelFamily: AlibabaModelFamily;
  readonly expirationDate: string;
  readonly freeQuotaRemainingAtCapture: number;
  readonly freeQuotaTotalAtCapture: number;
  readonly statusAtCapture: "Enabled" | "Disabled";
  readonly stopOnExhaustAtCapture: boolean;
}

// ALIBABA-QUOTA-SNAPSHOT:START
// Generated from the JSON ledger; no credentials belong here.
export const ALIBABA_FREE_QUOTA_MODELS = [
  {
    "modelId": "deepseek-v4-pro-0813",
    "modelFamily": "text",
    "expirationDate": "2026-11-12",
    "freeQuotaRemainingAtCapture": 981240,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen3.8-2.4t-a95b",
    "modelFamily": "text",
    "expirationDate": "2026-11-11",
    "freeQuotaRemainingAtCapture": 991820,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-image-2.1-pro",
    "modelFamily": "vision",
    "expirationDate": "2026-12-31",
    "freeQuotaRemainingAtCapture": 10,
    "freeQuotaTotalAtCapture": 10,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "wan3.0-video",
    "modelFamily": "vision",
    "expirationDate": "2026-11-04",
    "freeQuotaRemainingAtCapture": 30,
    "freeQuotaTotalAtCapture": 30,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-mt-image-2.0",
    "modelFamily": "vision",
    "expirationDate": "2026-11-25",
    "freeQuotaRemainingAtCapture": 100,
    "freeQuotaTotalAtCapture": 100,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-image-2.1-turbo",
    "modelFamily": "vision",
    "expirationDate": "2026-12-31",
    "freeQuotaRemainingAtCapture": 10,
    "freeQuotaTotalAtCapture": 10,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "wan3.0-video-prime",
    "modelFamily": "vision",
    "expirationDate": "2026-11-20",
    "freeQuotaRemainingAtCapture": 30,
    "freeQuotaTotalAtCapture": 30,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen3.8-omni-flash",
    "modelFamily": "multimodal",
    "expirationDate": "2026-12-16",
    "freeQuotaRemainingAtCapture": 991740,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen3.8-omni-flash-realtime",
    "modelFamily": "multimodal",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-asr-flash-message",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-tts-plus",
    "modelFamily": "speech",
    "expirationDate": "2026-12-15",
    "freeQuotaRemainingAtCapture": 10000,
    "freeQuotaTotalAtCapture": 10000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-asr-flash-streaming",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-asr-flash",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-asr-flash-filetrans",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-tts-flash",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 999840,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen-audio-3.1-tts-next",
    "modelFamily": "speech",
    "expirationDate": "2026-12-20",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen3.8-livetranslate-flash-realtime",
    "modelFamily": "speech",
    "expirationDate": "2026-12-15",
    "freeQuotaRemainingAtCapture": 1000000,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  },
  {
    "modelId": "qwen3.7-text-embedding",
    "modelFamily": "embedding",
    "expirationDate": "2026-11-08",
    "freeQuotaRemainingAtCapture": 999500,
    "freeQuotaTotalAtCapture": 1000000,
    "statusAtCapture": "Enabled",
    "stopOnExhaustAtCapture": true
  }
] as const satisfies readonly AlibabaFreeQuotaModelLedgerEntry[];
export const ALIBABA_RETIRED_MODEL_LOCKS = [
  {
    "modelId": "deepseek-v4-flash-0731",
    "expirationDate": "2026-10-30"
  },
  {
    "modelId": "deepseek-v4.1-flash",
    "expirationDate": "2026-12-12"
  },
  {
    "modelId": "glm-5.1",
    "expirationDate": "2026-08-25"
  },
  {
    "modelId": "glm-5.2",
    "expirationDate": "2026-09-23"
  },
  {
    "modelId": "glm-5.3",
    "expirationDate": "2026-11-22"
  },
  {
    "modelId": "kimi-k2.7-code",
    "expirationDate": "2026-09-23"
  },
  {
    "modelId": "kimi-k3",
    "expirationDate": "2026-11-16"
  },
  {
    "modelId": "qwen-image-3.0",
    "expirationDate": "2026-11-02"
  },
  {
    "modelId": "qwen-image-3.0-pro",
    "expirationDate": "2026-11-02"
  },
  {
    "modelId": "qwen3.7-flash",
    "expirationDate": "2026-10-22"
  },
  {
    "modelId": "qwen3.7-flash-2026-07-15",
    "expirationDate": "2026-10-22"
  },
  {
    "modelId": "qwen3.7-max",
    "expirationDate": "2026-08-19"
  },
  {
    "modelId": "qwen3.7-max-2026-05-17",
    "expirationDate": "2026-08-23"
  },
  {
    "modelId": "qwen3.7-max-2026-05-20",
    "expirationDate": "2026-08-19"
  },
  {
    "modelId": "qwen3.7-max-2026-06-08",
    "expirationDate": "2026-09-07"
  },
  {
    "modelId": "qwen3.7-max-preview",
    "expirationDate": "2026-08-23"
  },
  {
    "modelId": "qwen3.7-plus",
    "expirationDate": "2026-08-31"
  },
  {
    "modelId": "qwen3.7-plus-2026-05-26",
    "expirationDate": "2026-08-31"
  },
  {
    "modelId": "qwen3.8-27b",
    "expirationDate": "2026-11-16"
  },
  {
    "modelId": "qwen3.8-flash",
    "expirationDate": "2026-11-24"
  },
  {
    "modelId": "qwen3.8-max",
    "expirationDate": "2026-10-31"
  },
  {
    "modelId": "qwen3.8-max-0902",
    "expirationDate": "2026-11-30"
  }
] as const;
// ALIBABA-QUOTA-SNAPSHOT:END

export function getAlibabaFreeQuotaModel(modelId: string): AlibabaFreeQuotaModelLedgerEntry | undefined {
  return ALIBABA_FREE_QUOTA_MODELS.find(entry => entry.modelId === modelId.trim().toLowerCase());
}

export function getAlibabaFreeQuotaStatus(modelId: string, now: Date = new Date()): AlibabaFreeQuotaStatus {
  if (!Number.isFinite(now.getTime())) return "unknown";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const entry = getAlibabaFreeQuotaModel(modelId);
  if (!entry) {
    const retired = ALIBABA_RETIRED_MODEL_LOCKS.find(item => item.modelId === modelId.trim().toLowerCase());
    return retired ? (today >= retired.expirationDate ? "expired" : "retired") : "unknown";
  }
  // Date-only source: lock at the start of the displayed expiry day.
  if (today >= entry.expirationDate) return "expired";
  if (entry.statusAtCapture !== "Enabled" || !entry.stopOnExhaustAtCapture) return "disabled";
  if (entry.freeQuotaRemainingAtCapture <= 0) return "exhausted";
  return "usable";
}

/** Earliest expiry within a compatible family; never silently change a pinned model. */
export function listAlibabaFreeQuotaTestCandidates(family: AlibabaModelFamily, now: Date = new Date()) {
  return ALIBABA_FREE_QUOTA_MODELS.filter(entry => entry.modelFamily === family &&
    getAlibabaFreeQuotaStatus(entry.modelId, now) === "usable")
    .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.modelId.localeCompare(b.modelId));
}

/** Local free-only policy evaluated before transport, not live governance proof. */
export function assertAlibabaFreeQuotaUse(modelId: string,
  env: Record<string, string | undefined> = process.env, now: Date = new Date()): void {
  if (!Number.isFinite(now.getTime())) throw new Error("ALIBABA_MODEL_LOCKED: invalid local clock");
  const status = getAlibabaFreeQuotaStatus(modelId, now);
  if (status === "expired" || status === "retired") throw new Error(`ALIBABA_MODEL_LOCKED: ${modelId} (${status})`);
  if (env.CVF_ALIBABA_FREE_QUOTA_ONLY !== "1") return;
  if (status !== "usable") throw new Error(`ALIBABA_FREE_QUOTA_REFUSED: ${modelId} (${status})`);
  if (env.CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED !== "1") {
    throw new Error("ALIBABA_FREE_QUOTA_SCOPE_UNCONFIRMED: verify free entitlement and Stop-on-Exhaust for the configured endpoint/workspace");
  }
}

export function resolveAlibabaDashScopeEndpoint(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.DASHSCOPE_COMPAT_ENDPOINT?.trim() || env.ALIBABA_DASHSCOPE_ENDPOINT?.trim()
    || env.CVF_ALIBABA_DASHSCOPE_ENDPOINT?.trim();
  if (explicit) return explicit;
  const base = env.ALIBABA_BASE_URL?.trim().replace(/\/$/, "");
  return base ? (base.endsWith("/chat/completions") ? base : `${base}/chat/completions`) : ALIBABA_DASHSCOPE_INTL_ENDPOINT;
}
