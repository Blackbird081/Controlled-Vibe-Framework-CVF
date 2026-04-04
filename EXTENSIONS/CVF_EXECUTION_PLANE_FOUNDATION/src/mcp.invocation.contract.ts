import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type MCPInvocationStatus = "SUCCESS" | "FAILURE" | "TIMEOUT" | "REJECTED";

export interface MCPInvocationRequest {
  toolName: string;
  toolArgs: Record<string, unknown>;
  contextId: string;
  requestId: string;
}

export interface MCPInvocationResult {
  resultId: string;
  issuedAt: string;
  toolName: string;
  contextId: string;
  sourceRequestId: string;
  invocationStatus: MCPInvocationStatus;
  responsePayload: unknown;
  invocationHash: string;
}

export interface MCPInvocationContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class MCPInvocationContract {
  private readonly now: () => string;

  constructor(dependencies: MCPInvocationContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  invoke(
    request: MCPInvocationRequest,
    status: MCPInvocationStatus,
    responsePayload: unknown,
  ): MCPInvocationResult {
    const issuedAt = this.now();

    const invocationHash = computeDeterministicHash(
      "w2-t8-cp1-mcp-invocation",
      `${issuedAt}:${request.toolName}:${request.contextId}`,
      `status:${status}`,
      `args:${JSON.stringify(request.toolArgs)}`,
    );

    const resultId = computeDeterministicHash(
      "w2-t8-cp1-result-id",
      invocationHash,
      issuedAt,
    );

    return {
      resultId,
      issuedAt,
      toolName: request.toolName,
      contextId: request.contextId,
      sourceRequestId: request.requestId,
      invocationStatus: status,
      responsePayload,
      invocationHash,
    };
  }
}

export function createMCPInvocationContract(
  dependencies?: MCPInvocationContractDependencies,
): MCPInvocationContract {
  return new MCPInvocationContract(dependencies);
}
