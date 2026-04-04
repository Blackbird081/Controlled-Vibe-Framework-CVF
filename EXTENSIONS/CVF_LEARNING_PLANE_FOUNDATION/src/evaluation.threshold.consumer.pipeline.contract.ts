import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  EvaluationThresholdContract,
  createEvaluationThresholdContract,
} from "./evaluation.threshold.contract";
import type {
  EvaluationThresholdContractDependencies,
  ThresholdAssessment,
} from "./evaluation.threshold.contract";
import type { EvaluationResult } from "./evaluation.engine.contract";
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

const WARNING_ASSESSMENT_FAILING =
  "[evaluation-threshold] assessment failing — threshold assessment status is FAILING";
const WARNING_INSUFFICIENT_DATA =
  "[evaluation-threshold] insufficient data — threshold assessment has insufficient data";
const WARNING_FAILURES_DETECTED =
  "[evaluation-threshold] failures detected — one or more evaluation results failed";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationThresholdConsumerPipelineRequest {
  results: EvaluationResult[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface EvaluationThresholdConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  assessment: ThresholdAssessment;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface EvaluationThresholdConsumerPipelineContractDependencies {
  now?: () => string;
  thresholdContractDeps?: EvaluationThresholdContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * EvaluationThresholdConsumerPipelineContract (W4-T20 CP1 — Full Lane GC-019)
 * ----------------------------------------------------------------------------
 * Bridges EvaluationThresholdContract into the CPF consumer pipeline.
 *
 * Chain:
 *   results: EvaluationResult[]
 *     → EvaluationThresholdContract.assess()
 *     → ThresholdAssessment
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → EvaluationThresholdConsumerPipelineResult
 *
 * Query: "Assessment: {overallStatus} ({passCount}P/{warnCount}W/{failCount}F/{inconclusiveCount}I of {totalVerdicts})" (max 120 chars)
 * contextId: assessment.assessmentId
 *
 * Warnings:
 *   overallStatus === "FAILING" → WARNING_ASSESSMENT_FAILING
 *   overallStatus === "INSUFFICIENT_DATA" → WARNING_INSUFFICIENT_DATA
 *   failCount > 0 → WARNING_FAILURES_DETECTED
 */
export class EvaluationThresholdConsumerPipelineContract {
  private readonly now: () => string;
  private readonly thresholdContract: EvaluationThresholdContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: EvaluationThresholdConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.thresholdContract = createEvaluationThresholdContract({
      ...dependencies.thresholdContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: EvaluationThresholdConsumerPipelineRequest,
  ): EvaluationThresholdConsumerPipelineResult {
    const createdAt = this.now();

    const assessment: ThresholdAssessment = this.thresholdContract.assess(
      request.results,
    );

    const query = `Assessment: ${assessment.overallStatus} (${assessment.passCount}P/${assessment.warnCount}W/${assessment.failCount}F/${assessment.inconclusiveCount}I of ${assessment.totalVerdicts})`.slice(
      0,
      120,
    );

    const contextId = assessment.assessmentId;

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
    if (assessment.overallStatus === "FAILING") {
      warnings.push(WARNING_ASSESSMENT_FAILING);
    }
    if (assessment.overallStatus === "INSUFFICIENT_DATA") {
      warnings.push(WARNING_INSUFFICIENT_DATA);
    }
    if (assessment.failCount > 0) {
      warnings.push(WARNING_FAILURES_DETECTED);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t20-cp1-evaluation-threshold-consumer-pipeline",
      assessment.assessmentHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t20-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      assessment,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEvaluationThresholdConsumerPipelineContract(
  dependencies?: EvaluationThresholdConsumerPipelineContractDependencies,
): EvaluationThresholdConsumerPipelineContract {
  return new EvaluationThresholdConsumerPipelineContract(dependencies);
}
