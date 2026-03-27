import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningObservabilityContract,
  createLearningObservabilityContract,
} from "./learning.observability.contract";
import type {
  LearningObservabilityReport,
  LearningObservabilityContractDependencies,
} from "./learning.observability.contract";
import type { LearningStorageLog } from "./learning.storage.log.contract";
import type { LearningLoopSummary } from "./learning.loop.contract";
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
  "[learning-observability] critical observability health — governed intervention required";
const WARNING_DEGRADED =
  "[learning-observability] degraded observability health — learning loop at risk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningObservabilityConsumerPipelineRequest {
  storageLog: LearningStorageLog;
  loopSummary: LearningLoopSummary;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningObservabilityConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  reportResult: LearningObservabilityReport;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningObservabilityConsumerPipelineContractDependencies {
  now?: () => string;
  observabilityContractDeps?: LearningObservabilityContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningObservabilityConsumerPipelineContract (W4-T13 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges LearningObservabilityContract into the CPF consumer pipeline.
 *
 * Chain:
 *   LearningStorageLog + LearningLoopSummary
 *     → LearningObservabilityContract.report()
 *     → LearningObservabilityReport { reportId, observabilityHealth, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → LearningObservabilityConsumerPipelineResult
 *
 * Query: learning-observability:health:${observabilityHealth}:storage:${sourceStorageLogId}:loop:${sourceLoopSummaryId} (<=120)
 * contextId: reportResult.reportId
 *
 * Warnings:
 *   observabilityHealth === "CRITICAL" → WARNING_CRITICAL
 *   observabilityHealth === "DEGRADED" → WARNING_DEGRADED
 *   HEALTHY / UNKNOWN                  → no warning
 */
export class LearningObservabilityConsumerPipelineContract {
  private readonly now: () => string;
  private readonly observabilityContract: LearningObservabilityContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningObservabilityConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.observabilityContract = createLearningObservabilityContract({
      ...dependencies.observabilityContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: LearningObservabilityConsumerPipelineRequest,
  ): LearningObservabilityConsumerPipelineResult {
    const createdAt = this.now();

    const reportResult: LearningObservabilityReport =
      this.observabilityContract.report(
        request.storageLog,
        request.loopSummary,
      );

    const query =
      `learning-observability:health:${reportResult.observabilityHealth}:storage:${reportResult.sourceStorageLogId}:loop:${reportResult.sourceLoopSummaryId}`.slice(
        0,
        120,
      );

    const contextId = reportResult.reportId;

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
    if (reportResult.observabilityHealth === "CRITICAL") {
      warnings.push(WARNING_CRITICAL);
    }
    if (reportResult.observabilityHealth === "DEGRADED") {
      warnings.push(WARNING_DEGRADED);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t13-cp1-learning-observability-consumer-pipeline",
      reportResult.reportHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t13-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      reportResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningObservabilityConsumerPipelineContract(
  dependencies?: LearningObservabilityConsumerPipelineContractDependencies,
): LearningObservabilityConsumerPipelineContract {
  return new LearningObservabilityConsumerPipelineContract(dependencies);
}
