export interface StreamRequest {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface StreamContract {
  chunk: string;
  role: string;
  done: boolean;
  receiptObligation?: string;
}

export interface StreamCapableProvider {
  stream(request: StreamRequest): AsyncIterable<StreamContract>;
}

export const STREAM_CONTRACT_REQUIRED_FIELDS = ["chunk", "role", "done"] as const;

export function isStreamContract(value: unknown): value is StreamContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.chunk === "string"
    && typeof candidate.role === "string"
    && typeof candidate.done === "boolean"
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
