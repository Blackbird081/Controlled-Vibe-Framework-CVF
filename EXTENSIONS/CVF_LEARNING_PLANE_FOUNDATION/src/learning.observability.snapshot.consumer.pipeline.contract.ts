import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningObservabilitySnapshotContract,
  createLearningObservabilitySnapshotContract,
} from "./learning.observability.snapshot.contract";
import type {
  LearningObservabilitySnapshotContractDependencies,
  LearningObservabilitySnapshot,
  SnapshotTrend,
} from "./learning.observability.snapshot.contract";
import type { LearningObservabilityReport, ObservabilityHealth } from "./learning.observability.contract";
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

const WARNING_CRITICAL_HEALTH_DOMINANT =
  "[learning-observability-snapshot] critical health dominant — observability snapshot indicates critical learning plane health";
const WARNING_DEGRADING_TREND =
  "[learning-observability-snapshot] degrading trend — observability health is degrading over time";
const WARNING_NO_REPORTS =
  "[learning-observability-snapshot] no reports — snapshot contains zero observability reports";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningObservabilitySnapshotConsumerPipelineRequest {
  reports: LearningObservabilityReport[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningObservabilitySnapshotConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  snapshot: LearningObservabilitySnapshot;
  dominantHealth: ObservabilityHealth;
  dominantTrend: SnapshotTrend;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningObservabilitySnapshotConsumerPipelineContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningObservabilitySnapshotConsumerPipelineContract (W4-T23 CP1 — Full Lane)
 * -------------------------------------------------------------------------------
 * Bridges LearningObservabilitySnapshotContract into CPF consumer pipeline.
 *
 * Query format: "ObservabilitySnapshot: {totalReports} reports, health={dominantHealth}, trend={snapshotTrend}"
 * contextId: snapshot.snapshotId
 *
 * Warnings:
 *   - dominantHealth === "CRITICAL" → WARNING_CRITICAL_HEALTH_DOMINANT
 *   - snapshotTrend === "DEGRADING" → WARNING_DEGRADING_TREND
 *   - totalReports === 0 → WARNING_NO_REPORTS
 */
export class LearningObservabilitySnapshotConsumerPipelineContract {
  private readonly now: () => string;
  private readonly snapshotContract: LearningObservabilitySnapshotContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningObservabilitySnapshotConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());

    const snapshotDeps: LearningObservabilitySnapshotContractDependencies = {
      now: this.now,
    };
    this.snapshotContract = createLearningObservabilitySnapshotContract(snapshotDeps);

    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: LearningObservabilitySnapshotConsumerPipelineRequest,
  ): LearningObservabilitySnapshotConsumerPipelineResult {
    const createdAt = this.now();

    // Create snapshot
    const snapshot = this.snapshotContract.snapshot(request.reports);

    const dominantHealth = snapshot.dominantHealth;
    const dominantTrend = snapshot.snapshotTrend;

    // Derive query
    const query = `ObservabilitySnapshot: ${snapshot.totalReports} reports, health=${dominantHealth}, trend=${dominantTrend}`.slice(
      0,
      120,
    );

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId: snapshot.snapshotId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute warnings
    const warnings: string[] = [];
    if (dominantHealth === "CRITICAL") {
      warnings.push(WARNING_CRITICAL_HEALTH_DOMINANT);
    }
    if (dominantTrend === "DEGRADING") {
      warnings.push(WARNING_DEGRADING_TREND);
    }
    if (snapshot.totalReports === 0) {
      warnings.push(WARNING_NO_REPORTS);
    }

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w4-t23-cp1-learning-observability-snapshot-consumer-pipeline",
      snapshot.snapshotHash,
      consumerPackage.pipelineHash,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t23-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      snapshot,
      dominantHealth,
      dominantTrend,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningObservabilitySnapshotConsumerPipelineContract(
  dependencies?: LearningObservabilitySnapshotConsumerPipelineContractDependencies,
): LearningObservabilitySnapshotConsumerPipelineContract {
  return new LearningObservabilitySnapshotConsumerPipelineContract(dependencies);
}
