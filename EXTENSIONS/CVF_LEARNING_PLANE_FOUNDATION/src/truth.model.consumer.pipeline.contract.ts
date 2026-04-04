import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  TruthModelContract,
  createTruthModelContract,
} from "./truth.model.contract";
import type {
  TruthModelContractDependencies,
  TruthModel,
} from "./truth.model.contract";
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
  "[truth-model] health degrading — model health trajectory shows degradation";
const WARNING_LOW_CONFIDENCE =
  "[truth-model] low confidence — model confidence level below 0.3";
const WARNING_NO_INSIGHTS =
  "[truth-model] no insights — model built with zero insights";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthModelConsumerPipelineRequest {
  insights: PatternInsight[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface TruthModelConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  model: TruthModel;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface TruthModelConsumerPipelineContractDependencies {
  now?: () => string;
  modelContractDeps?: TruthModelContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthModelConsumerPipelineContract (W4-T19 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------
 * Bridges TruthModelContract into the CPF consumer pipeline.
 *
 * Chain:
 *   insights: PatternInsight[]
 *     → TruthModelContract.build()
 *     → TruthModel
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → TruthModelConsumerPipelineResult
 *
 * Query: "Model: v{version} {dominantPattern} ({totalInsights} insights, {healthTrajectory})" (max 120 chars)
 * contextId: model.modelId
 *
 * Warnings:
 *   healthTrajectory === "DEGRADING" → WARNING_HEALTH_DEGRADING
 *   confidenceLevel < 0.3 → WARNING_LOW_CONFIDENCE
 *   totalInsightsProcessed === 0 → WARNING_NO_INSIGHTS
 */
export class TruthModelConsumerPipelineContract {
  private readonly now: () => string;
  private readonly modelContract: TruthModelContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: TruthModelConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.modelContract = createTruthModelContract({
      ...dependencies.modelContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: TruthModelConsumerPipelineRequest,
  ): TruthModelConsumerPipelineResult {
    const createdAt = this.now();

    const model: TruthModel = this.modelContract.build(request.insights);

    const query = `Model: v${model.version} ${model.dominantPattern} (${model.totalInsightsProcessed} insights, ${model.healthTrajectory})`.slice(
      0,
      120,
    );

    const contextId = model.modelId;

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
    if (model.healthTrajectory === "DEGRADING") {
      warnings.push(WARNING_HEALTH_DEGRADING);
    }
    if (model.confidenceLevel < 0.3) {
      warnings.push(WARNING_LOW_CONFIDENCE);
    }
    if (model.totalInsightsProcessed === 0) {
      warnings.push(WARNING_NO_INSIGHTS);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t19-cp1-truth-model-consumer-pipeline",
      model.modelHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t19-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      model,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthModelConsumerPipelineContract(
  dependencies?: TruthModelConsumerPipelineContractDependencies,
): TruthModelConsumerPipelineContract {
  return new TruthModelConsumerPipelineContract(dependencies);
}
