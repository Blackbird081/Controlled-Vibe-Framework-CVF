import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExternalAssetIntakeProfileContract,
  createExternalAssetIntakeProfileContract,
} from "./external.asset.intake.profile.contract";
import type {
  ExternalAssetIntakeProfile,
  ExternalAssetIntakeValidationResult,
} from "./external.asset.intake.profile.contract";
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

export interface ExternalAssetIntakeConsumerPipelineRequest {
  profile: ExternalAssetIntakeProfile;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExternalAssetIntakeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  validationResult: ExternalAssetIntakeValidationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface ExternalAssetIntakeConsumerPipelineContractDependencies {
  now?: () => string;
  validationContract?: ExternalAssetIntakeProfileContract;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

function buildWarnings(
  validationResult: ExternalAssetIntakeValidationResult,
): string[] {
  const warnings = validationResult.issues.map(
    (issue) => `WARNING_${issue.code}_${issue.field.toUpperCase()}`,
  );

  if (!validationResult.valid) {
    warnings.push("WARNING_EXTERNAL_ASSET_INTAKE_INVALID");
  }

  return Array.from(new Set(warnings));
}

export class ExternalAssetIntakeConsumerPipelineContract {
  private readonly now: () => string;
  private readonly validationContract: ExternalAssetIntakeProfileContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExternalAssetIntakeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.validationContract =
      dependencies.validationContract ?? createExternalAssetIntakeProfileContract();
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExternalAssetIntakeConsumerPipelineRequest,
  ): ExternalAssetIntakeConsumerPipelineResult {
    const createdAt = this.now();
    const validationResult = this.validationContract.validate(request.profile);
    const normalizedProfile = validationResult.normalizedProfile;
    const environmentFragment =
      normalizedProfile.execution_environment === undefined
        ? "env:unspecified"
        : `env:${normalizedProfile.execution_environment.os}:${normalizedProfile.execution_environment.shell}`;

    const query = `external-asset-intake:type:${normalizedProfile.candidate_asset_type}:quality:${normalizedProfile.source_quality}:${environmentFragment}:valid:${validationResult.valid}`.slice(
      0,
      120,
    );

    const contextId = computeDeterministicHash(
      "stage1-external-asset-intake-context",
      normalizedProfile.source_ref,
      normalizedProfile.candidate_asset_type,
      normalizedProfile.source_quality,
      environmentFragment,
    );

    const warnings = buildWarnings(validationResult);

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
      "stage1-external-asset-intake-consumer-pipeline",
      contextId,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "stage1-external-asset-intake-consumer-pipeline-result",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      validationResult,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createExternalAssetIntakeConsumerPipelineContract(
  dependencies?: ExternalAssetIntakeConsumerPipelineContractDependencies,
): ExternalAssetIntakeConsumerPipelineContract {
  return new ExternalAssetIntakeConsumerPipelineContract(dependencies);
}
