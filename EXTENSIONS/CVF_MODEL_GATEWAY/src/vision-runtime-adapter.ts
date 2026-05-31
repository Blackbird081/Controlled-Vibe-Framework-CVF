import {
  isVisionContract,
  type VisionCapableProvider,
  type VisionContract,
  type VisionRequest,
} from "./vision-contract";

export type VisionRuntimeProvider = "alibaba";

export interface VisionRuntimeAdapterOptions {
  provider: VisionRuntimeProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
  fetchFn?: typeof fetch;
}

export interface VisionRuntimeRequestBody {
  model: string;
  messages: Array<{
    role: "user";
    content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;
  }>;
  max_tokens: number;
  temperature: number;
}

export const VISION_RUNTIME_DEFAULT_MODELS: Record<VisionRuntimeProvider, string> = {
  alibaba: "qwen-vl-plus",
};

export const VISION_RUNTIME_CAPABLE_MODELS: Record<VisionRuntimeProvider, readonly string[]> = {
  alibaba: ["qwen-vl-plus", "qwen-vl-max", "qwen-vl-max-latest"],
};

const DEFAULT_ALIBABA_COMPAT_ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const RAW_FILE_PATH_PATTERN = /^(?:[A-Za-z]:[\\/]|\.{0,2}[\\/]|file:)/;

export function isVisionRuntimeModel(provider: string, model: string): provider is VisionRuntimeProvider {
  return provider === "alibaba"
    && VISION_RUNTIME_CAPABLE_MODELS.alibaba.includes(model);
}

export function assertVisionProviderCapability(provider: string, model: string): void {
  if (!isVisionRuntimeModel(provider, model)) {
    throw new Error(`Provider lane ${provider}/${model} is not authorized for VisionRequest runtime.`);
  }
}

export function buildVisionRuntimeRequestBody(
  request: VisionRequest,
  model = VISION_RUNTIME_DEFAULT_MODELS.alibaba,
): VisionRuntimeRequestBody {
  assertVisionInputBoundary(request);
  return {
    model,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: request.prompt },
        { type: "image_url", image_url: { url: resolveImageUrlForProvider(request) } },
      ],
    }],
    max_tokens: 512,
    temperature: 0.2,
  };
}

export function createAlibabaVisionRuntimeAdapter(
  options: Omit<VisionRuntimeAdapterOptions, "provider"> & { provider?: "alibaba" },
): VisionCapableProvider {
  const model = options.model ?? VISION_RUNTIME_DEFAULT_MODELS.alibaba;
  assertVisionProviderCapability("alibaba", model);
  const fetchFn = options.fetchFn ?? fetch;
  const endpoint = options.endpoint ?? DEFAULT_ALIBABA_COMPAT_ENDPOINT;

  return {
    async vision(request: VisionRequest): Promise<VisionContract> {
      const body = buildVisionRuntimeRequestBody(request, model);
      const response = await fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
          Connection: "close",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errorBody = await safeReadJson(response);
        const message = readProviderErrorMessage(errorBody) ?? `Vision provider request failed with status ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const description = String(data.choices?.[0]?.message?.content ?? "").trim();
      const contract: VisionContract = {
        description,
        confidence: description ? 0.8 : 0,
        done: Boolean(description),
        receiptObligation: "vision_runtime_receipt_required",
      };
      if (!isVisionContract(contract)) {
        throw new Error("Vision provider returned an invalid VisionContract.");
      }
      return contract;
    },
  };
}

function assertVisionInputBoundary(request: VisionRequest): void {
  if (!request.prompt.trim()) {
    throw new Error("VisionRequest.prompt is required.");
  }
  const hasUrl = typeof request.imageUrl === "string" && request.imageUrl.trim().length > 0;
  const hasBase64 = typeof request.imageBase64 === "string" && request.imageBase64.trim().length > 0;
  if (hasUrl === hasBase64) {
    throw new Error("VisionRequest requires exactly one imageUrl or imageBase64 input.");
  }
  if (hasUrl) {
    const url = request.imageUrl!.trim();
    if (RAW_FILE_PATH_PATTERN.test(url) || !/^https?:\/\//i.test(url)) {
      throw new Error("VisionRequest.imageUrl must be an http(s) URL; raw file paths are not allowed.");
    }
  }
  if (hasBase64 && (/[\r\n]/.test(request.imageBase64!) || RAW_FILE_PATH_PATTERN.test(request.imageBase64!.trim()))) {
    throw new Error("VisionRequest.imageBase64 must be raw base64 data, not a file path or multiline payload.");
  }
}

function resolveImageUrlForProvider(request: VisionRequest): string {
  if (request.imageUrl) return request.imageUrl.trim();
  const mimeType = request.mimeType?.trim() || "image/png";
  return `data:${mimeType};base64,${request.imageBase64!.trim()}`;
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readProviderErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return null;
}
