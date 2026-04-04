import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { OrchestrationConsumerPipelineResult } from "./orchestration.consumer.pipeline.contract";

// --- Types ---

export interface OrchestrationConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: OrchestrationConsumerPipelineResult[];
  dominantTokenBudget: number;
  batchHash: string;
}

export interface OrchestrationConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function computeDominantTokenBudget(
  results: OrchestrationConsumerPipelineResult[],
): number {
  if (results.length === 0) return 0;
  return Math.max(
    ...results.map(
      (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
    ),
  );
}

// --- Contract ---

export class OrchestrationConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: OrchestrationConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: OrchestrationConsumerPipelineResult[],
  ): OrchestrationConsumerPipelineBatch {
    const createdAt = this.now();
    const dominantTokenBudget = computeDominantTokenBudget(results);

    const batchHash = computeDeterministicHash(
      "w1-t15-cp2-orchestration-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t15-cp2-orchestration-consumer-pipeline-batch-id",
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

export function createOrchestrationConsumerPipelineBatchContract(
  dependencies?: OrchestrationConsumerPipelineBatchContractDependencies,
): OrchestrationConsumerPipelineBatchContract {
  return new OrchestrationConsumerPipelineBatchContract(dependencies);
}
