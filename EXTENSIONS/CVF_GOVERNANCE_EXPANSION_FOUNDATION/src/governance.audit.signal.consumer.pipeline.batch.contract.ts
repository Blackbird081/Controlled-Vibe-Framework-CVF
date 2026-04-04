import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AuditTrigger } from "./governance.audit.signal.contract";
import type { GovernanceAuditSignalConsumerPipelineResult } from "./governance.audit.signal.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceAuditSignalConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceAuditSignalConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  criticalResultCount: number;
  alertActiveResultCount: number;
  batchHash: string;
}

export interface GovernanceAuditSignalConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countByTrigger(
  results: GovernanceAuditSignalConsumerPipelineResult[],
  trigger: AuditTrigger,
): number {
  return results.filter((r) => r.auditSignal.auditTrigger === trigger).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceAuditSignalConsumerPipelineBatchContract (W3-T16 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------------
 * Aggregates GovernanceAuditSignalConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   criticalResultCount  = count of results where auditTrigger === "CRITICAL_THRESHOLD"
 *   alertActiveResultCount = count of results where auditTrigger === "ALERT_ACTIVE"
 */
export class GovernanceAuditSignalConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceAuditSignalConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceAuditSignalConsumerPipelineResult[],
  ): GovernanceAuditSignalConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const criticalResultCount = countByTrigger(results, "CRITICAL_THRESHOLD");
    const alertActiveResultCount = countByTrigger(results, "ALERT_ACTIVE");

    const batchHash = computeDeterministicHash(
      "w3-t16-cp2-governance-audit-signal-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t16-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      criticalResultCount,
      alertActiveResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceAuditSignalConsumerPipelineBatchContract(
  dependencies?: GovernanceAuditSignalConsumerPipelineBatchContractDependencies,
): GovernanceAuditSignalConsumerPipelineBatchContract {
  return new GovernanceAuditSignalConsumerPipelineBatchContract(dependencies);
}
