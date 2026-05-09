import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ProvisionalEvaluationSignalContract,
  createProvisionalEvaluationSignalContract,
} from "./provisional.evaluation.signal.contract";
import type {
  ProvisionalEvaluationSignal,
  ProvisionalEvaluationSignalContractDependencies,
  WeakTriggerDefinitionCaptureInput,
} from "./provisional.evaluation.signal.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

export interface ProvisionalEvaluationSignalConsumerPipelineRequest {
  input: WeakTriggerDefinitionCaptureInput;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ProvisionalEvaluationSignalConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  signalResult: ProvisionalEvaluationSignal | null;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ProvisionalEvaluationSignalConsumerPipelineContractDependencies {
  now?: () => string;
  signalContractDeps?: ProvisionalEvaluationSignalContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

export class ProvisionalEvaluationSignalConsumerPipelineContract {
  private readonly now: () => string;
  private readonly signalContract: ProvisionalEvaluationSignalContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ProvisionalEvaluationSignalConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.signalContract = createProvisionalEvaluationSignalContract({
      ...dependencies.signalContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ProvisionalEvaluationSignalConsumerPipelineRequest,
  ): ProvisionalEvaluationSignalConsumerPipelineResult {
    const createdAt = this.now();
    const signalResult = this.signalContract.captureWeakTriggerDefinition(
      request.input,
    );

    const query = signalResult
      ? `provisional-signal:${signalResult.name}:severity:${signalResult.severity}:phase:${signalResult.phase.join("|")}`.slice(
          0,
          120,
        )
      : "provisional-signal:none:weak-trigger-definition";

    const contextId = signalResult?.signalId
      ?? computeDeterministicHash(
        "stage1-provisional-eval-signal-context",
        request.input.sourceRef,
        request.input.textSample,
      );

    const warnings = signalResult
      ? [`WARNING_PROVISIONAL_SIGNAL_${signalResult.severity.toUpperCase()}`]
      : [];

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
      "stage1-provisional-eval-signal-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "stage1-provisional-eval-signal-consumer-pipeline-result",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      signalResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createProvisionalEvaluationSignalConsumerPipelineContract(
  dependencies?: ProvisionalEvaluationSignalConsumerPipelineContractDependencies,
): ProvisionalEvaluationSignalConsumerPipelineContract {
  return new ProvisionalEvaluationSignalConsumerPipelineContract(dependencies);
}
