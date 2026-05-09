import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  TruthScoreLogContract,
  createTruthScoreLogContract,
} from "./truth.score.log.contract";
import type {
  TruthScoreLogContractDependencies,
  TruthScoreLog,
} from "./truth.score.log.contract";
import type { TruthScore } from "./truth.score.contract";
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

const WARNING_INSUFFICIENT_SCORES =
  "[truth-score-log] insufficient scores — dominant class is INSUFFICIENT";
const WARNING_WEAK_SCORES =
  "[truth-score-log] weak scores — dominant class is WEAK";
const WARNING_NO_SCORES =
  "[truth-score-log] no scores — log contains zero truth scores";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruthScoreLogConsumerPipelineRequest {
  scores: TruthScore[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface TruthScoreLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: TruthScoreLog;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface TruthScoreLogConsumerPipelineContractDependencies {
  now?: () => string;
  logContractDeps?: TruthScoreLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreLogConsumerPipelineContract (W4-T21 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Bridges TruthScoreLogContract into the CPF consumer pipeline.
 *
 * Chain:
 *   scores: TruthScore[]
 *     → TruthScoreLogContract.log()
 *     → TruthScoreLog
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → TruthScoreLogConsumerPipelineResult
 *
 * Query: "ScoreLog: {totalScores} scores, avg={averageComposite}, dominant={dominantClass}" (max 120 chars)
 * contextId: log.logId
 *
 * Warnings:
 *   dominantClass === "INSUFFICIENT" → WARNING_INSUFFICIENT_SCORES
 *   dominantClass === "WEAK" → WARNING_WEAK_SCORES
 *   totalScores === 0 → WARNING_NO_SCORES
 */
export class TruthScoreLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: TruthScoreLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: TruthScoreLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.logContract = createTruthScoreLogContract({
      ...dependencies.logContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: TruthScoreLogConsumerPipelineRequest,
  ): TruthScoreLogConsumerPipelineResult {
    const createdAt = this.now();

    const log: TruthScoreLog = this.logContract.log(request.scores);

    const query = `ScoreLog: ${log.totalScores} scores, avg=${log.averageComposite}, dominant=${log.dominantClass}`.slice(
      0,
      120,
    );

    const contextId = log.logId;

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
    if (log.dominantClass === "INSUFFICIENT") {
      warnings.push(WARNING_INSUFFICIENT_SCORES);
    }
    if (log.dominantClass === "WEAK") {
      warnings.push(WARNING_WEAK_SCORES);
    }
    if (log.totalScores === 0) {
      warnings.push(WARNING_NO_SCORES);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t21-cp1-truth-score-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t21-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreLogConsumerPipelineContract(
  dependencies?: TruthScoreLogConsumerPipelineContractDependencies,
): TruthScoreLogConsumerPipelineContract {
  return new TruthScoreLogConsumerPipelineContract(dependencies);
}
