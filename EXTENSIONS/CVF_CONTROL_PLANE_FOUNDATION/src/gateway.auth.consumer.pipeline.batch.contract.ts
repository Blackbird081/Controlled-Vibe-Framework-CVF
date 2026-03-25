import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GatewayAuthConsumerPipelineResult } from "./gateway.auth.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayAuthConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GatewayAuthConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  nonAuthenticatedCount: number;
  batchHash: string;
}

export interface GatewayAuthConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthConsumerPipelineBatchContract (W1-T20 CP2 — Fast Lane GC-021)
 * -------------------------------------------------------------------------
 * Aggregates GatewayAuthConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   nonAuthenticatedCount = results where authResult.authenticated === false
 */
export class GatewayAuthConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayAuthConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GatewayAuthConsumerPipelineResult[],
  ): GatewayAuthConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const nonAuthenticatedCount = results.filter(
      (r) => r.authResult.authenticated === false,
    ).length;

    const batchHash = computeDeterministicHash(
      "w1-t20-cp2-gateway-auth-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t20-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      nonAuthenticatedCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthConsumerPipelineBatchContract(
  dependencies?: GatewayAuthConsumerPipelineBatchContractDependencies,
): GatewayAuthConsumerPipelineBatchContract {
  return new GatewayAuthConsumerPipelineBatchContract(dependencies);
}
