export interface ReasoningRequest {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  chainOfThought?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ReasoningContract {
  reasoning: string;
  conclusion: string;
  done: boolean;
  receiptObligation?: string;
}

export interface ReasoningCapableProvider {
  reasoning(request: ReasoningRequest): Promise<ReasoningContract>;
}

export const REASONING_CONTRACT_REQUIRED_FIELDS = ["reasoning", "conclusion", "done"] as const;

export function isReasoningContract(value: unknown): value is ReasoningContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.reasoning === "string"
    && typeof candidate.conclusion === "string"
    && typeof candidate.done === "boolean"
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
