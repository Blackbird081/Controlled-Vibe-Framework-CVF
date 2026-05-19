export interface EmbeddingRequest {
  traceId: string;
  input: string | string[];
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingContract {
  embeddings: number[][];
  dimensions: number;
  done: boolean;
  receiptObligation?: string;
}

export interface EmbeddingCapableProvider {
  embedding(request: EmbeddingRequest): Promise<EmbeddingContract>;
}

export const EMBEDDING_CONTRACT_REQUIRED_FIELDS = ["embeddings", "dimensions", "done"] as const;

export function isEmbeddingContract(value: unknown): value is EmbeddingContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.embeddings)
    && candidate.embeddings.every((row) =>
      Array.isArray(row) && row.every((item) => typeof item === "number")
    )
    && typeof candidate.dimensions === "number"
    && typeof candidate.done === "boolean"
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
