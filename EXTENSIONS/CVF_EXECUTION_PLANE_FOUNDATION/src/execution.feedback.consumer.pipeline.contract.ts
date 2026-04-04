import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionFeedbackContract,
  createExecutionFeedbackContract,
} from "./execution.feedback.contract";
import type {
  ExecutionFeedbackSignal,
  FeedbackClass,
  ExecutionFeedbackContractDependencies,
} from "./execution.feedback.contract";
import type { ExecutionObservation } from "./execution.observer.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { ScoringWeights, RankableKnowledgeItem } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

// --- Types ---

export interface ExecutionFeedbackConsumerPipelineRequest {
  observation: ExecutionObservation;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionFeedbackConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  feedbackSignal: ExecutionFeedbackSignal;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionFeedbackConsumerPipelineContractDependencies {
  feedbackContract?: ExecutionFeedbackContract;
  feedbackContractDependencies?: ExecutionFeedbackContractDependencies;
  consumerPipeline?: ControlPlaneConsumerPipelineContract;
  consumerPipelineDependencies?: ControlPlaneConsumerPipelineContractDependencies;
  now?: () => string;
}

// --- Helpers ---

function deriveFeedbackQuery(feedbackSignal: ExecutionFeedbackSignal): string {
  const raw = feedbackSignal.rationale;
  return raw.length > 120 ? raw.slice(0, 120) : raw;
}

function buildFeedbackWarnings(feedbackClass: FeedbackClass): string[] {
  if (feedbackClass === "ESCALATE") {
    return ["[feedback] escalation signal — governance review required"];
  }
  if (feedbackClass === "REJECT") {
    return ["[feedback] rejection signal — full replanning required"];
  }
  return [];
}

// --- Contract ---

export class ExecutionFeedbackConsumerPipelineContract {
  private readonly feedbackContract: ExecutionFeedbackContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionFeedbackConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.feedbackContract =
      dependencies.feedbackContract ??
      createExecutionFeedbackContract({
        ...dependencies.feedbackContractDependencies,
        now: dependencies.feedbackContractDependencies?.now ?? this.now,
      });
    this.consumerPipeline =
      dependencies.consumerPipeline ??
      createControlPlaneConsumerPipelineContract({
        ...dependencies.consumerPipelineDependencies,
        now: dependencies.consumerPipelineDependencies?.now ?? this.now,
      });
  }

  execute(
    request: ExecutionFeedbackConsumerPipelineRequest,
  ): ExecutionFeedbackConsumerPipelineResult {
    const createdAt = this.now();

    // Stage 1: Generate feedback signal from execution observation
    const feedbackSignal = this.feedbackContract.generate(request.observation);

    // Stage 2: Drive CPF consumer pipeline using feedback signal as context
    const query = deriveFeedbackQuery(feedbackSignal);
    const consumerPackage = this.consumerPipeline.execute({
      rankingRequest: {
        query,
        contextId: feedbackSignal.feedbackId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Build warnings from feedback class
    const warnings = buildFeedbackWarnings(feedbackSignal.feedbackClass);

    // Build deterministic hash
    const pipelineHash = computeDeterministicHash(
      "w2-t11-cp1-feedback-consumer-pipeline",
      feedbackSignal.feedbackHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t11-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      feedbackSignal,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

export function createExecutionFeedbackConsumerPipelineContract(
  dependencies?: ExecutionFeedbackConsumerPipelineContractDependencies,
): ExecutionFeedbackConsumerPipelineContract {
  return new ExecutionFeedbackConsumerPipelineContract(dependencies);
}
