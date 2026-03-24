import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExecutionAuditRisk } from "./execution.audit.summary.contract";
import type { ExecutionAuditSummaryConsumerPipelineResult } from "./execution.audit.summary.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionAuditSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: ExecutionAuditSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  highRiskResultCount: number;
  mediumRiskResultCount: number;
  batchHash: string;
}

export interface ExecutionAuditSummaryConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByRisk(
  results: ExecutionAuditSummaryConsumerPipelineResult[],
  risk: ExecutionAuditRisk,
): number {
  return results.filter((r) => r.auditSummary.overallRisk === risk).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionAuditSummaryConsumerPipelineBatchContract (W2-T15 CP2 — Fast Lane GC-021)
 * ------------------------------------------------------------------------------------
 * Aggregates ExecutionAuditSummaryConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   highRiskResultCount   = count of results where overallRisk === "HIGH"
 *   mediumRiskResultCount = count of results where overallRisk === "MEDIUM"
 */
export class ExecutionAuditSummaryConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionAuditSummaryConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExecutionAuditSummaryConsumerPipelineResult[],
  ): ExecutionAuditSummaryConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const highRiskResultCount = countByRisk(results, "HIGH");
    const mediumRiskResultCount = countByRisk(results, "MEDIUM");

    const batchHash = computeDeterministicHash(
      "w2-t15-cp2-execution-audit-summary-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t15-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      highRiskResultCount,
      mediumRiskResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionAuditSummaryConsumerPipelineBatchContract(
  dependencies?: ExecutionAuditSummaryConsumerPipelineBatchContractDependencies,
): ExecutionAuditSummaryConsumerPipelineBatchContract {
  return new ExecutionAuditSummaryConsumerPipelineBatchContract(dependencies);
}
