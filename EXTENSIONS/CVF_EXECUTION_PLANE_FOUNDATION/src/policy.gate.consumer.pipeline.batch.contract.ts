import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { PolicyGateConsumerPipelineResult } from "./policy.gate.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PolicyGateConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: PolicyGateConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  deniedResultCount: number;
  reviewResultCount: number;
  batchHash: string;
}

export interface PolicyGateConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PolicyGateConsumerPipelineBatchContract (W2-T23 CP2 — Fast Lane GC-021)
 * ---------------------------------------------------------------------------
 * Aggregates PolicyGateConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   deniedResultCount = count of results where gateResult.deniedCount > 0
 *   reviewResultCount = count of results where gateResult.reviewRequiredCount > 0
 */
export class PolicyGateConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: PolicyGateConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: PolicyGateConsumerPipelineResult[],
  ): PolicyGateConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const deniedResultCount = results.filter(
      (r) => r.gateResult.deniedCount > 0,
    ).length;

    const reviewResultCount = results.filter(
      (r) => r.gateResult.reviewRequiredCount > 0,
    ).length;

    const batchHash = computeDeterministicHash(
      "w2-t23-cp2-policy-gate-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t23-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      deniedResultCount,
      reviewResultCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPolicyGateConsumerPipelineBatchContract(
  dependencies?: PolicyGateConsumerPipelineBatchContractDependencies,
): PolicyGateConsumerPipelineBatchContract {
  return new PolicyGateConsumerPipelineBatchContract(dependencies);
}
