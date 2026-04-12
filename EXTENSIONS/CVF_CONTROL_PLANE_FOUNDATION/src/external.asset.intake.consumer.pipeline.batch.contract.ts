import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExternalAssetIntakeConsumerPipelineResult } from "./external.asset.intake.consumer.pipeline.contract";

export interface ExternalAssetIntakeConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalProfiles: number;
  validCount: number;
  invalidCount: number;
  toolAssetCount: number;
  dominantTokenBudget: number;
  results: ExternalAssetIntakeConsumerPipelineResult[];
}

export interface ExternalAssetIntakeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

export class ExternalAssetIntakeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExternalAssetIntakeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ExternalAssetIntakeConsumerPipelineResult[],
  ): ExternalAssetIntakeConsumerPipelineBatchResult {
    const createdAt = this.now();
    const validCount = results.filter((result) => result.validationResult.valid).length;
    const invalidCount = results.length - validCount;
    const toolAssetCount = results.filter(
      (result) =>
        result.validationResult.normalizedProfile.candidate_asset_type ===
        "W7ToolAsset",
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
      "stage1-external-asset-intake-consumer-pipeline-batch",
      ...results.map((result) => result.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "stage1-external-asset-intake-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalProfiles: results.length,
      validCount,
      invalidCount,
      toolAssetCount,
      dominantTokenBudget,
      results,
    };
  }
}

export function createExternalAssetIntakeConsumerPipelineBatchContract(
  dependencies?: ExternalAssetIntakeConsumerPipelineBatchContractDependencies,
): ExternalAssetIntakeConsumerPipelineBatchContract {
  return new ExternalAssetIntakeConsumerPipelineBatchContract(dependencies);
}
