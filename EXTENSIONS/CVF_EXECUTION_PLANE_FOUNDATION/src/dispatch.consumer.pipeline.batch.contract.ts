import type { DispatchConsumerPipelineResult } from "./dispatch.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface DispatchConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDispatches: number;
  totalAuthorized: number;
  totalBlocked: number;
  totalEscalated: number;
  dominantTokenBudget: number;
  results: DispatchConsumerPipelineResult[];
}

export interface DispatchConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class DispatchConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: DispatchConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: DispatchConsumerPipelineResult[],
  ): DispatchConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalDispatches = results.reduce(
      (sum, r) => sum + r.dispatchResult.totalDispatched,
      0,
    );
    const totalAuthorized = results.reduce(
      (sum, r) => sum + r.dispatchResult.authorizedCount,
      0,
    );
    const totalBlocked = results.reduce(
      (sum, r) => sum + r.dispatchResult.blockedCount,
      0,
    );
    const totalEscalated = results.reduce(
      (sum, r) => sum + r.dispatchResult.escalatedCount,
      0,
    );

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t27-cp2-dispatch-consumer-batch",
      `totalDispatches=${totalDispatches}`,
      `authorized=${totalAuthorized}`,
      `blocked=${totalBlocked}`,
      `escalated=${totalEscalated}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t27-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalDispatches,
      totalAuthorized,
      totalBlocked,
      totalEscalated,
      dominantTokenBudget,
      results,
    };
  }
}

export function createDispatchConsumerPipelineBatchContract(
  dependencies?: DispatchConsumerPipelineBatchContractDependencies,
): DispatchConsumerPipelineBatchContract {
  return new DispatchConsumerPipelineBatchContract(dependencies);
}
