import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { PlannerTriggerConsumerPipelineResult } from "./planner.trigger.consumer.pipeline.contract";

export interface PlannerTriggerConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  clarificationCount: number;
  zeroCandidateCount: number;
  negativeMatchCount: number;
  dominantTokenBudget: number;
  results: PlannerTriggerConsumerPipelineResult[];
}

export interface PlannerTriggerConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

export class PlannerTriggerConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: PlannerTriggerConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: PlannerTriggerConsumerPipelineResult[],
  ): PlannerTriggerConsumerPipelineBatchResult {
    const createdAt = this.now();
    const clarificationCount = results.filter(
      (result) => result.heuristicResult.clarification_needed,
    ).length;
    const zeroCandidateCount = results.filter(
      (result) => result.heuristicResult.candidate_refs.length === 0,
    ).length;
    const negativeMatchCount = results.filter(
      (result) => result.heuristicResult.negative_matches.length > 0,
    ).length;
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (result) => result.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "stage1-planner-trigger-consumer-pipeline-batch",
      ...results.map((result) => result.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "stage1-planner-trigger-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      clarificationCount,
      zeroCandidateCount,
      negativeMatchCount,
      dominantTokenBudget,
      results,
    };
  }
}

export function createPlannerTriggerConsumerPipelineBatchContract(
  dependencies?: PlannerTriggerConsumerPipelineBatchContractDependencies,
): PlannerTriggerConsumerPipelineBatchContract {
  return new PlannerTriggerConsumerPipelineBatchContract(dependencies);
}
