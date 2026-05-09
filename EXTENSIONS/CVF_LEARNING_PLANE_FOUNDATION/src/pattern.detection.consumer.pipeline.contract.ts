import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  PatternDetectionContract,
  createPatternDetectionContract,
} from "./pattern.detection.contract";
import type {
  PatternInsight,
  PatternDetectionContractDependencies,
} from "./pattern.detection.contract";
import type { FeedbackLedger } from "./feedback.ledger.contract";
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

const WARNING_CRITICAL =
  "[pattern-detection] critical health signal — governed intervention required";
const WARNING_DEGRADED =
  "[pattern-detection] degraded health signal — pattern quality at risk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDetectionConsumerPipelineRequest {
  ledger: FeedbackLedger;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface PatternDetectionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  insightResult: PatternInsight;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface PatternDetectionConsumerPipelineContractDependencies {
  now?: () => string;
  detectionContractDeps?: PatternDetectionContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDetectionConsumerPipelineContract (W4-T10 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges PatternDetectionContract into the CPF consumer pipeline.
 *
 * Chain:
 *   FeedbackLedger
 *     → PatternDetectionContract.analyze()
 *     → PatternInsight { insightId, dominantPattern, healthSignal, rates, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → PatternDetectionConsumerPipelineResult
 *
 * Query: pattern-detection:dominant:${dominantPattern}:health:${healthSignal}:ledger:${sourceLedgerId} (<=120)
 * contextId: insightResult.insightId
 *
 * Warnings:
 *   healthSignal === "CRITICAL" → WARNING_CRITICAL
 *   healthSignal === "DEGRADED" → WARNING_DEGRADED
 *   HEALTHY                     → no warning
 */
export class PatternDetectionConsumerPipelineContract {
  private readonly now: () => string;
  private readonly detectionContract: PatternDetectionContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: PatternDetectionConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.detectionContract = createPatternDetectionContract({
      ...dependencies.detectionContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: PatternDetectionConsumerPipelineRequest,
  ): PatternDetectionConsumerPipelineResult {
    const createdAt = this.now();

    const insightResult: PatternInsight = this.detectionContract.analyze(
      request.ledger,
    );

    const query =
      `pattern-detection:dominant:${insightResult.dominantPattern}:health:${insightResult.healthSignal}:ledger:${insightResult.sourceLedgerId}`.slice(
        0,
        120,
      );

    const contextId = insightResult.insightId;

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
    if (insightResult.healthSignal === "CRITICAL") {
      warnings.push(WARNING_CRITICAL);
    }
    if (insightResult.healthSignal === "DEGRADED") {
      warnings.push(WARNING_DEGRADED);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t10-cp1-pattern-detection-consumer-pipeline",
      insightResult.insightHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t10-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      insightResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDetectionConsumerPipelineContract(
  dependencies?: PatternDetectionConsumerPipelineContractDependencies,
): PatternDetectionConsumerPipelineContract {
  return new PatternDetectionConsumerPipelineContract(dependencies);
}
