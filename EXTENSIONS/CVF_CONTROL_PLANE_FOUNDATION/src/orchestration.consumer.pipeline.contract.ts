import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  OrchestrationContract,
  createOrchestrationContract,
} from "./orchestration.contract";
import type {
  OrchestrationResult,
  OrchestrationContractDependencies,
} from "./orchestration.contract";
import type { DesignPlan } from "./design.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { ScoringWeights, RankableKnowledgeItem } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";

// --- Types ---

export interface OrchestrationConsumerPipelineRequest {
  plan: DesignPlan;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface OrchestrationConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  orchestrationResult: OrchestrationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface OrchestrationConsumerPipelineContractDependencies {
  orchestration?: OrchestrationContract;
  orchestrationDependencies?: OrchestrationContractDependencies;
  consumerPipeline?: ControlPlaneConsumerPipelineContract;
  consumerPipelineDependencies?: ControlPlaneConsumerPipelineContractDependencies;
  now?: () => string;
}

// --- Helpers ---

function deriveOrchestrationQuery(plan: DesignPlan): string {
  const raw = plan.vibeOriginal || plan.planId;
  return raw.length > 120 ? raw.slice(0, 120) : raw;
}

// --- Contract ---

export class OrchestrationConsumerPipelineContract {
  private readonly orchestration: OrchestrationContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: OrchestrationConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.orchestration =
      dependencies.orchestration ??
      createOrchestrationContract({
        ...dependencies.orchestrationDependencies,
        now: dependencies.orchestrationDependencies?.now ?? this.now,
      });
    this.consumerPipeline =
      dependencies.consumerPipeline ??
      createControlPlaneConsumerPipelineContract({
        ...dependencies.consumerPipelineDependencies,
        now: dependencies.consumerPipelineDependencies?.now ?? this.now,
      });
  }

  execute(
    request: OrchestrationConsumerPipelineRequest,
  ): OrchestrationConsumerPipelineResult {
    const createdAt = this.now();

    // Stage 1: Orchestrate the design plan into assignments
    const orchestrationResult = this.orchestration.orchestrate(request.plan);

    // Stage 2: Drive consumer pipeline using orchestration context
    const query = deriveOrchestrationQuery(request.plan);
    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId: orchestrationResult.orchestrationId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Aggregate warnings from orchestration
    const warnings = orchestrationResult.warnings.map(
      (w) => `[orchestration] ${w}`,
    );

    // Build deterministic hash
    const pipelineHash = computeDeterministicHash(
      "w1-t15-cp1-orchestration-consumer-pipeline",
      orchestrationResult.orchestrationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t15-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId ?? request.plan.consumerId,
      orchestrationResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

export function createOrchestrationConsumerPipelineContract(
  dependencies?: OrchestrationConsumerPipelineContractDependencies,
): OrchestrationConsumerPipelineContract {
  return new OrchestrationConsumerPipelineContract(dependencies);
}
