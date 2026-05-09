import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  PlannerTriggerHeuristicsContract,
  createPlannerTriggerHeuristicsContract,
} from "./planner.trigger.heuristics.contract";
import type {
  PlannerTriggerHeuristicsRequest,
  PlannerTriggerHeuristicsResult,
} from "./planner.trigger.heuristics.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";

export interface PlannerTriggerConsumerPipelineRequest
  extends PlannerTriggerHeuristicsRequest {
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface PlannerTriggerConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  heuristicResult: PlannerTriggerHeuristicsResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface PlannerTriggerConsumerPipelineContractDependencies {
  now?: () => string;
  heuristicsContract?: PlannerTriggerHeuristicsContract;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

function buildWarnings(
  heuristicResult: PlannerTriggerHeuristicsResult,
): string[] {
  const warnings: string[] = [];

  if (heuristicResult.candidate_refs.length === 0) {
    warnings.push("WARNING_NO_TRIGGER_CANDIDATE");
  }

  if (heuristicResult.clarification_needed) {
    warnings.push("WARNING_CLARIFICATION_REQUIRED");
  }

  if (heuristicResult.negative_matches.length > 0) {
    warnings.push("WARNING_NEGATIVE_MATCH_PRESENT");
  }

  return warnings;
}

export class PlannerTriggerConsumerPipelineContract {
  private readonly now: () => string;
  private readonly heuristicsContract: PlannerTriggerHeuristicsContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: PlannerTriggerConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.heuristicsContract =
      dependencies.heuristicsContract ?? createPlannerTriggerHeuristicsContract();
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: PlannerTriggerConsumerPipelineRequest,
  ): PlannerTriggerConsumerPipelineResult {
    const createdAt = this.now();
    const heuristicResult = this.heuristicsContract.evaluate(request);
    const query =
      `planner-trigger:candidates:${heuristicResult.candidate_refs.length}:confidence:${heuristicResult.confidence}:clarify:${heuristicResult.clarification_needed}`.slice(
        0,
        120,
      );

    const contextId = computeDeterministicHash(
      "stage1-planner-trigger-context",
      request.text,
      heuristicResult.candidate_refs.join("|"),
      `clarify:${heuristicResult.clarification_needed}`,
    );

    const warnings = buildWarnings(heuristicResult);

    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    const pipelineHash = computeDeterministicHash(
      "stage1-planner-trigger-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "stage1-planner-trigger-consumer-pipeline-result",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      heuristicResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createPlannerTriggerConsumerPipelineContract(
  dependencies?: PlannerTriggerConsumerPipelineContractDependencies,
): PlannerTriggerConsumerPipelineContract {
  return new PlannerTriggerConsumerPipelineContract(dependencies);
}
