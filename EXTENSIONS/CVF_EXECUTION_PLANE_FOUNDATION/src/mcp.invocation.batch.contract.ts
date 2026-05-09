import type { MCPInvocationResult, MCPInvocationStatus } from "./mcp.invocation.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Priority ---

// Dominant: frequency-first; ties broken by FAILURE > TIMEOUT > REJECTED > SUCCESS
const STATUS_PRIORITY: MCPInvocationStatus[] = [
  "FAILURE",
  "TIMEOUT",
  "REJECTED",
  "SUCCESS",
];

// --- Types ---

export interface MCPInvocationBatch {
  batchId: string;
  createdAt: string;
  totalInvocations: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  rejectedCount: number;
  dominantStatus: MCPInvocationStatus;
  batchHash: string;
}

export interface MCPInvocationBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class MCPInvocationBatchContract {
  private readonly now: () => string;

  constructor(dependencies: MCPInvocationBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: MCPInvocationResult[]): MCPInvocationBatch {
    const createdAt = this.now();

    const successCount = results.filter(
      (r) => r.invocationStatus === "SUCCESS",
    ).length;
    const failureCount = results.filter(
      (r) => r.invocationStatus === "FAILURE",
    ).length;
    const timeoutCount = results.filter(
      (r) => r.invocationStatus === "TIMEOUT",
    ).length;
    const rejectedCount = results.filter(
      (r) => r.invocationStatus === "REJECTED",
    ).length;

    const counts: Record<MCPInvocationStatus, number> = {
      SUCCESS: successCount,
      FAILURE: failureCount,
      TIMEOUT: timeoutCount,
      REJECTED: rejectedCount,
    };

    let dominantStatus: MCPInvocationStatus = "FAILURE";
    let maxCount = -1;
    for (const s of STATUS_PRIORITY) {
      if (counts[s] > maxCount) {
        maxCount = counts[s];
        dominantStatus = s;
      }
    }

    const batchHash = computeDeterministicHash(
      "w2-t8-cp2-mcp-batch",
      `${createdAt}:total:${results.length}`,
      `success:${successCount}:failure:${failureCount}:timeout:${timeoutCount}:rejected:${rejectedCount}`,
      `dominant:${dominantStatus}`,
    );

    const batchId = computeDeterministicHash(
      "w2-t8-cp2-batch-id",
      batchHash,
      createdAt,
    );

    return {
      batchId,
      createdAt,
      totalInvocations: results.length,
      successCount,
      failureCount,
      timeoutCount,
      rejectedCount,
      dominantStatus,
      batchHash,
    };
  }
}

export function createMCPInvocationBatchContract(
  dependencies?: MCPInvocationBatchContractDependencies,
): MCPInvocationBatchContract {
  return new MCPInvocationBatchContract(dependencies);
}
