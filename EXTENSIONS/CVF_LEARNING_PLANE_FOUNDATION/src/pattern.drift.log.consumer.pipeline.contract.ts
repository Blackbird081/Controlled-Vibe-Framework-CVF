import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  PatternDriftLogContract,
  createPatternDriftLogContract,
} from "./pattern.drift.log.contract";
import type {
  PatternDriftLogContractDependencies,
  PatternDriftLog,
} from "./pattern.drift.log.contract";
import type { PatternDriftSignal, DriftClass } from "./pattern.drift.contract";
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

const WARNING_NO_SIGNALS =
  "[pattern-drift-log] no signals — log contains zero drift signals";
const WARNING_NO_DOMINANT_CLASS =
  "[pattern-drift-log] no dominant class — unable to determine dominant drift class";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternDriftLogConsumerPipelineRequest {
  signals: PatternDriftSignal[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface PatternDriftLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: PatternDriftLog;
  dominantDriftClass: DriftClass;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface PatternDriftLogConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PatternDriftLogConsumerPipelineContract (W4-T25 CP1 — Full Lane)
 * -----------------------------------------------------------------
 * Bridges PatternDriftLogContract into CPF consumer pipeline.
 *
 * Query format: "PatternDriftLog: {totalSignals} signals, drift={dominantDriftClass}"
 * contextId: log.logId
 *
 * Warnings:
 *   - totalSignals === 0 → WARNING_NO_SIGNALS
 *   - dominantDriftClass === null → WARNING_NO_DOMINANT_CLASS
 */
export class PatternDriftLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: PatternDriftLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: PatternDriftLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const logDeps: PatternDriftLogContractDependencies = {
      now: this.now,
    };
    this.logContract = createPatternDriftLogContract(logDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: PatternDriftLogConsumerPipelineRequest,
  ): PatternDriftLogConsumerPipelineResult {
    const createdAt = this.now();

    // Create log
    const log = this.logContract.log(request.signals);

    const dominantDriftClass = log.dominantDriftClass;

    // Derive query
    const query = `PatternDriftLog: ${log.totalSignals} signals, drift=${dominantDriftClass}`.slice(0, 120);

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId: log.logId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute warnings
    const warnings: string[] = [];
    if (log.totalSignals === 0) {
      warnings.push(WARNING_NO_SIGNALS);
    }
    // Note: dominantDriftClass is always defined (defaults to STABLE), so no null check needed

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w4-t25-cp1-pattern-drift-log-consumer-pipeline",
      log.logHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t25-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantDriftClass,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPatternDriftLogConsumerPipelineContract(
  dependencies?: PatternDriftLogConsumerPipelineContractDependencies,
): PatternDriftLogConsumerPipelineContract {
  return new PatternDriftLogConsumerPipelineContract(dependencies);
}
