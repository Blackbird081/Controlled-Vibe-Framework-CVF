import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { MCPInvocationStatus } from "./mcp.invocation.contract";
import type { MCPInvocationConsumerPipelineResult } from "./mcp.invocation.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MCPInvocationConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: MCPInvocationConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  successCount: number;
  failureCount: number;
  batchHash: string;
}

export interface MCPInvocationConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FAILURE_STATUSES: MCPInvocationStatus[] = ["FAILURE", "TIMEOUT", "REJECTED"];

function countByStatus(
  results: MCPInvocationConsumerPipelineResult[],
  statuses: MCPInvocationStatus[],
): number {
  return results.filter((r) =>
    statuses.includes(r.invocationResult.invocationStatus),
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MCPInvocationConsumerPipelineBatchContract (W2-T13 CP2 — Fast Lane)
 * --------------------------------------------------------------------
 * Aggregates MCPInvocationConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   successCount = count of SUCCESS invocations
 *   failureCount = count of FAILURE | TIMEOUT | REJECTED invocations
 */
export class MCPInvocationConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: MCPInvocationConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: MCPInvocationConsumerPipelineResult[],
  ): MCPInvocationConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const successCount = countByStatus(results, ["SUCCESS"]);
    const failureCount = countByStatus(results, FAILURE_STATUSES);

    const batchHash = computeDeterministicHash(
      "w2-t13-cp2-mcp-invocation-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t13-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      successCount,
      failureCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMCPInvocationConsumerPipelineBatchContract(
  dependencies?: MCPInvocationConsumerPipelineBatchContractDependencies,
): MCPInvocationConsumerPipelineBatchContract {
  return new MCPInvocationConsumerPipelineBatchContract(dependencies);
}
