export interface VisionRequest {
  traceId: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface VisionContract {
  description: string;
  confidence?: number;
  done: boolean;
  receiptObligation?: string;
}

export interface VisionCapableProvider {
  vision(request: VisionRequest): Promise<VisionContract>;
}

export const VISION_CONTRACT_REQUIRED_FIELDS = ["description", "done"] as const;

export function isVisionContract(value: unknown): value is VisionContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.description === "string"
    && typeof candidate.done === "boolean"
    && (
      candidate.confidence === undefined
      || typeof candidate.confidence === "number"
    )
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
