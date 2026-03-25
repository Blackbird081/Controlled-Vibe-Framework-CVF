import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  TruthScoreContract,
  createTruthScoreContract,
} from "./truth.score.contract";
import type {
  TruthScore,
  TruthScoreContractDependencies,
} from "./truth.score.contract";
import type { TruthModel } from "./truth.model.contract";
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

const WARNING_INSUFFICIENT =
  "[truth-score] insufficient truth data — model not actionable";
const WARNING_WEAK =
  "[truth-score] weak truth signal — model quality degraded";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthScoreConsumerPipelineRequest {
  model: TruthModel;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface TruthScoreConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  scoreResult: TruthScore;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface TruthScoreConsumerPipelineContractDependencies {
  now?: () => string;
  scoreContractDeps?: TruthScoreContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreConsumerPipelineContract (W4-T9 CP1 — Full Lane GC-019)
 * ------------------------------------------------------------------
 * Bridges TruthScoreContract into the CPF consumer pipeline.
 *
 * Chain:
 *   TruthModel
 *     → TruthScoreContract.score()
 *     → TruthScore { compositeScore, scoreClass, scoreId, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → TruthScoreConsumerPipelineResult
 *
 * Query: truth-score:class:${scoreClass}:score:${compositeScore}:model:${sourceTruthModelId} (<=120)
 * contextId: scoreResult.scoreId
 *
 * Warnings:
 *   scoreClass === "INSUFFICIENT" → WARNING_INSUFFICIENT
 *   scoreClass === "WEAK"         → WARNING_WEAK
 *   STRONG / ADEQUATE             → no warning
 */
export class TruthScoreConsumerPipelineContract {
  private readonly now: () => string;
  private readonly scoreContract: TruthScoreContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: TruthScoreConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.scoreContract = createTruthScoreContract({
      ...dependencies.scoreContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: TruthScoreConsumerPipelineRequest,
  ): TruthScoreConsumerPipelineResult {
    const createdAt = this.now();

    const scoreResult: TruthScore = this.scoreContract.score(request.model);

    const query =
      `truth-score:class:${scoreResult.scoreClass}:score:${scoreResult.compositeScore}:model:${scoreResult.sourceTruthModelId}`.slice(
        0,
        120,
      );

    const contextId = scoreResult.scoreId;

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
    if (scoreResult.scoreClass === "INSUFFICIENT") {
      warnings.push(WARNING_INSUFFICIENT);
    }
    if (scoreResult.scoreClass === "WEAK") {
      warnings.push(WARNING_WEAK);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t9-cp1-truth-score-consumer-pipeline",
      scoreResult.scoreHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t9-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      scoreResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreConsumerPipelineContract(
  dependencies?: TruthScoreConsumerPipelineContractDependencies,
): TruthScoreConsumerPipelineContract {
  return new TruthScoreConsumerPipelineContract(dependencies);
}
