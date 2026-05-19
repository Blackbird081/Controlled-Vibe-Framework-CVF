export interface JsonModeRequest {
  traceId: string;
  prompt: string;
  schema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface JsonModeContract {
  output: Record<string, unknown>;
  done: boolean;
  receiptObligation?: string;
}

export interface JsonModeCapableProvider {
  jsonMode(request: JsonModeRequest): Promise<JsonModeContract>;
}

export const JSON_MODE_CONTRACT_REQUIRED_FIELDS = ["output", "done"] as const;

export function isJsonModeContract(value: unknown): value is JsonModeContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Boolean(candidate.output)
    && typeof candidate.output === "object"
    && !Array.isArray(candidate.output)
    && typeof candidate.done === "boolean"
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
