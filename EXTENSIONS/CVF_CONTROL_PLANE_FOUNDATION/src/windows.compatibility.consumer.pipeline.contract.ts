import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WindowsCompatibilityEvaluationContract,
  createWindowsCompatibilityEvaluationContract,
} from "./windows.compatibility.evaluation.contract";
import type {
  WindowsCompatibilityEvaluationRequest,
  WindowsCompatibilityEvaluationResult,
} from "./windows.compatibility.evaluation.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type {
  RankableKnowledgeItem,
  ScoringWeights,
} from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";

export interface WindowsCompatibilityConsumerPipelineRequest
  extends WindowsCompatibilityEvaluationRequest {
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WindowsCompatibilityConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  evaluationResult: WindowsCompatibilityEvaluationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface WindowsCompatibilityConsumerPipelineContractDependencies {
  now?: () => string;
  evaluationContract?: WindowsCompatibilityEvaluationContract;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

function buildWarnings(
  evaluationResult: WindowsCompatibilityEvaluationResult,
): string[] {
  const warnings = [...evaluationResult.blockers];

  if (evaluationResult.classification !== "WINDOWS_NATIVE") {
    warnings.push(`WARNING_${evaluationResult.classification}`);
  }

  if (evaluationResult.notes.includes("CROSS_PLATFORM_CLAIM_REQUIRES_TARGET_VALIDATION")) {
    warnings.push("WARNING_CROSS_PLATFORM_VALIDATION_REQUIRED");
  }

  return Array.from(new Set(warnings));
}

export class WindowsCompatibilityConsumerPipelineContract {
  private readonly now: () => string;
  private readonly evaluationContract: WindowsCompatibilityEvaluationContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WindowsCompatibilityConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.evaluationContract =
      dependencies.evaluationContract ??
      createWindowsCompatibilityEvaluationContract();
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WindowsCompatibilityConsumerPipelineRequest,
  ): WindowsCompatibilityConsumerPipelineResult {
    const createdAt = this.now();
    const evaluationResult = this.evaluationContract.evaluate(request);
    const query =
      `windows-compatibility:class:${evaluationResult.classification}:score:${evaluationResult.score}:blockers:${evaluationResult.blockers.length}`.slice(
        0,
        120,
      );

    const profile = request.intakeValidation.normalizedProfile;
    const environment = profile.execution_environment;
    const contextId = computeDeterministicHash(
      "windows-compatibility-context",
      profile.source_ref,
      profile.candidate_asset_type,
      environment?.os ?? "os:unspecified",
      environment?.shell ?? "shell:unspecified",
      evaluationResult.classification,
    );

    const warnings = buildWarnings(evaluationResult);

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
      "windows-compatibility-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "windows-compatibility-consumer-pipeline-result",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      evaluationResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createWindowsCompatibilityConsumerPipelineContract(
  dependencies?: WindowsCompatibilityConsumerPipelineContractDependencies,
): WindowsCompatibilityConsumerPipelineContract {
  return new WindowsCompatibilityConsumerPipelineContract(dependencies);
}
