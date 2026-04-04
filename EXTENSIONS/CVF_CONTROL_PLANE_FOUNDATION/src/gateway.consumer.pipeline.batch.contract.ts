import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GatewayConsumerPipelineResult } from "./gateway.consumer.pipeline.contract";

// --- Types ---

export interface GatewayConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: GatewayConsumerPipelineResult[];
  dominantTokenBudget: number;
  batchHash: string;
}

export interface GatewayConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function computeDominantTokenBudget(
  results: GatewayConsumerPipelineResult[],
): number {
  if (results.length === 0) return 0;
  return Math.max(
    ...results.map(
      (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
    ),
  );
}

// --- Contract ---

export class GatewayConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GatewayConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GatewayConsumerPipelineResult[],
  ): GatewayConsumerPipelineBatch {
    const createdAt = this.now();
    const dominantTokenBudget = computeDominantTokenBudget(results);

    const batchHash = computeDeterministicHash(
      "w1-t14-cp2-gateway-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineGatewayHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t14-cp2-gateway-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      results,
      dominantTokenBudget,
      batchHash,
    };
  }
}

export function createGatewayConsumerPipelineBatchContract(
  dependencies?: GatewayConsumerPipelineBatchContractDependencies,
): GatewayConsumerPipelineBatchContract {
  return new GatewayConsumerPipelineBatchContract(dependencies);
}
