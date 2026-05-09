import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GatewayPIIDetectionConsumerPipelineResult } from "./gateway.pii.detection.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayPIIDetectionConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GatewayPIIDetectionConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  detectedCount: number;
  cleanCount: number;
  batchHash: string;
}

export interface GatewayPIIDetectionConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayPIIDetectionConsumerPipelineBatchContract (W1-T18 CP2 — Fast Lane)
 * --------------------------------------------------------------------------
 * Aggregates GatewayPIIDetectionConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   detectedCount = results where detectionResult.piiDetected === true
 *   cleanCount    = results where detectionResult.piiDetected === false
 */
export class GatewayPIIDetectionConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayPIIDetectionConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GatewayPIIDetectionConsumerPipelineResult[],
  ): GatewayPIIDetectionConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const detectedCount = results.filter(
      (r) => r.detectionResult.piiDetected === true,
    ).length;

    const cleanCount = results.filter(
      (r) => r.detectionResult.piiDetected === false,
    ).length;

    const batchHash = computeDeterministicHash(
      "w1-t18-cp2-pii-detection-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t18-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      detectedCount,
      cleanCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayPIIDetectionConsumerPipelineBatchContract(
  dependencies?: GatewayPIIDetectionConsumerPipelineBatchContractDependencies,
): GatewayPIIDetectionConsumerPipelineBatchContract {
  return new GatewayPIIDetectionConsumerPipelineBatchContract(dependencies);
}
