export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface ToolCallRequest {
  traceId: string;
  prompt: string;
  tools: ToolDefinition[];
  metadata?: Record<string, unknown>;
}

export interface ToolCallContract {
  toolName: string;
  arguments: Record<string, unknown>;
  done: boolean;
  receiptObligation?: string;
}

export interface ToolCallCapableProvider {
  toolCall(request: ToolCallRequest): Promise<ToolCallContract>;
}

export const TOOL_CALL_CONTRACT_REQUIRED_FIELDS = ["toolName", "arguments", "done"] as const;

export function isToolCallContract(value: unknown): value is ToolCallContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.toolName === "string"
    && Boolean(candidate.arguments)
    && typeof candidate.arguments === "object"
    && !Array.isArray(candidate.arguments)
    && typeof candidate.done === "boolean"
    && (
      candidate.receiptObligation === undefined
      || typeof candidate.receiptObligation === "string"
    )
  );
}
