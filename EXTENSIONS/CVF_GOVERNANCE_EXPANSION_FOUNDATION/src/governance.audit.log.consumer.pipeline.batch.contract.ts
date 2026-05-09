import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AuditTrigger } from "./governance.audit.signal.contract";
import type { GovernanceAuditLogConsumerPipelineResult } from "./governance.audit.log.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceAuditLogConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceAuditLogConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  criticalThresholdResultCount: number;
  alertActiveResultCount: number;
  batchHash: string;
}

export interface GovernanceAuditLogConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDominantTrigger(
  results: GovernanceAuditLogConsumerPipelineResult[],
  trigger: AuditTrigger,
): number {
  return results.filter(
    (r) => r.auditLog.dominantTrigger === trigger,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceAuditLogConsumerPipelineBatchContract (W3-T9 CP2 — Fast Lane)
 * -------------------------------------------------------------------------
 * Aggregates GovernanceAuditLogConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   criticalThresholdResultCount = results with dominantTrigger === "CRITICAL_THRESHOLD"
 *   alertActiveResultCount       = results with dominantTrigger === "ALERT_ACTIVE"
 */
export class GovernanceAuditLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceAuditLogConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceAuditLogConsumerPipelineResult[],
  ): GovernanceAuditLogConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const criticalThresholdResultCount = countDominantTrigger(results, "CRITICAL_THRESHOLD");
    const alertActiveResultCount = countDominantTrigger(results, "ALERT_ACTIVE");

    const batchHash = computeDeterministicHash(
      "w3-t9-cp2-audit-log-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t9-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      criticalThresholdResultCount,
      alertActiveResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceAuditLogConsumerPipelineBatchContract(
  dependencies?: GovernanceAuditLogConsumerPipelineBatchContractDependencies,
): GovernanceAuditLogConsumerPipelineBatchContract {
  return new GovernanceAuditLogConsumerPipelineBatchContract(dependencies);
}
