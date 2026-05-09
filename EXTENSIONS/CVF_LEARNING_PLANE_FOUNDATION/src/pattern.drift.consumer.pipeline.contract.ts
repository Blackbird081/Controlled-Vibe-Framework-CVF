import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  PatternDriftContract,
  createPatternDriftContract,
} from "./pattern.drift.contract";
import type {
  PatternDriftSignal,
  PatternDriftContractDependencies,
} from "./pattern.drift.contract";
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

const WARNING_CRITICAL_DRIFT =
  "[pattern-drift] critical drift detected — immediate re-evaluation required";
const WARNING_DRIFTING =
  "[pattern-drift] drift detected — model change requires monitoring";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDriftConsumerPipelineRequest {
  baseline: TruthModel;
  current: TruthModel;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface PatternDriftConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  driftResult: PatternDriftSignal;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface PatternDriftConsumerPipelineContractDependencies {
  now?: () => string;
  driftContractDeps?: PatternDriftContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDriftConsumerPipelineContract (W4-T12 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Bridges PatternDriftContract into the CPF consumer pipeline.
 *
 * Chain:
 *   TruthModel (baseline) + TruthModel (current)
 *     → PatternDriftContract.detect()
 *     → PatternDriftSignal { driftId, driftClass, driftRationale, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → PatternDriftConsumerPipelineResult
 *
 * Query: pattern-drift:class:${driftClass}:baseline:${baselineModelId}:current:${currentModelId} (<=120)
 * contextId: driftResult.driftId
 *
 * Warnings:
 *   driftClass === "CRITICAL_DRIFT" → WARNING_CRITICAL_DRIFT
 *   driftClass === "DRIFTING"       → WARNING_DRIFTING
 *   driftClass === "STABLE"         → no warning
 */
export class PatternDriftConsumerPipelineContract {
  private readonly now: () => string;
  private readonly driftContract: PatternDriftContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: PatternDriftConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.driftContract = createPatternDriftContract({
      ...dependencies.driftContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: PatternDriftConsumerPipelineRequest,
  ): PatternDriftConsumerPipelineResult {
    const createdAt = this.now();

    const driftResult: PatternDriftSignal = this.driftContract.detect(
      request.baseline,
      request.current,
    );

    const query =
      `pattern-drift:class:${driftResult.driftClass}:baseline:${driftResult.baselineModelId}:current:${driftResult.currentModelId}`.slice(
        0,
        120,
      );

    const contextId = driftResult.driftId;

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
    if (driftResult.driftClass === "CRITICAL_DRIFT") {
      warnings.push(WARNING_CRITICAL_DRIFT);
    }
    if (driftResult.driftClass === "DRIFTING") {
      warnings.push(WARNING_DRIFTING);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t12-cp1-pattern-drift-consumer-pipeline",
      driftResult.driftHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t12-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      driftResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDriftConsumerPipelineContract(
  dependencies?: PatternDriftConsumerPipelineContractDependencies,
): PatternDriftConsumerPipelineContract {
  return new PatternDriftConsumerPipelineContract(dependencies);
}
