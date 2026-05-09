import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  TruthModelUpdateContract,
  createTruthModelUpdateContract,
} from "./truth.model.update.contract";
import type {
  TruthModelUpdateContractDependencies,
} from "./truth.model.update.contract";
import type { TruthModel } from "./truth.model.contract";
import type { PatternInsight } from "./pattern.detection.contract";
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

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_HEALTH_DEGRADING =
  "[truth-model-update] health degrading — model health trajectory shows degradation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthModelUpdateConsumerPipelineRequest {
  model: TruthModel;
  insight: PatternInsight;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface TruthModelUpdateConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  updatedModel: TruthModel;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface TruthModelUpdateConsumerPipelineContractDependencies {
  now?: () => string;
  updateContractDeps?: TruthModelUpdateContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthModelUpdateConsumerPipelineContract (W4-T18 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges TruthModelUpdateContract into the CPF consumer pipeline.
 *
 * Chain:
 *   model + insight
 *     → TruthModelUpdateContract.update()
 *     → TruthModel (updated)
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → TruthModelUpdateConsumerPipelineResult
 *
 * Query: "Update: v{version} {dominantPattern} ({healthSignal} → {healthTrajectory})" (max 120 chars)
 * contextId: updatedModel.modelId
 *
 * Warnings:
 *   healthTrajectory === "DEGRADING" → WARNING_HEALTH_DEGRADING
 */
export class TruthModelUpdateConsumerPipelineContract {
  private readonly now: () => string;
  private readonly updateContract: TruthModelUpdateContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: TruthModelUpdateConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.updateContract = createTruthModelUpdateContract({
      ...dependencies.updateContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: TruthModelUpdateConsumerPipelineRequest,
  ): TruthModelUpdateConsumerPipelineResult {
    const createdAt = this.now();

    const updatedModel: TruthModel = this.updateContract.update(
      request.model,
      request.insight,
    );

    const query = `Update: v${updatedModel.version} ${updatedModel.dominantPattern} (${updatedModel.currentHealthSignal} → ${updatedModel.healthTrajectory})`.slice(
      0,
      120,
    );

    const contextId = updatedModel.modelId;

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    const warnings: string[] = [];
    if (updatedModel.healthTrajectory === "DEGRADING") {
      warnings.push(WARNING_HEALTH_DEGRADING);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t18-cp1-truth-model-update-consumer-pipeline",
      updatedModel.modelHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t18-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      updatedModel,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthModelUpdateConsumerPipelineContract(
  dependencies?: TruthModelUpdateConsumerPipelineContractDependencies,
): TruthModelUpdateConsumerPipelineContract {
  return new TruthModelUpdateConsumerPipelineContract(dependencies);
}
