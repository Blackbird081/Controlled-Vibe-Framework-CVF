import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceSignalContract,
  createGovernanceSignalContract,
} from "./governance.signal.contract";
import type {
  GovernanceSignal,
  GovernanceSignalContractDependencies,
} from "./governance.signal.contract";
import type { ThresholdAssessment } from "./evaluation.threshold.contract";
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

const WARNING_ESCALATE =
  "[governance-signal] escalation required — governed intervention triggered";
const WARNING_TRIGGER_REVIEW =
  "[governance-signal] review triggered — governance threshold breached";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceSignalConsumerPipelineRequest {
  assessment: ThresholdAssessment;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceSignalConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  signalResult: GovernanceSignal;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface GovernanceSignalConsumerPipelineContractDependencies {
  now?: () => string;
  signalContractDeps?: GovernanceSignalContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceSignalConsumerPipelineContract (W4-T11 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges GovernanceSignalContract into the CPF consumer pipeline.
 *
 * Chain:
 *   ThresholdAssessment
 *     → GovernanceSignalContract.signal()
 *     → GovernanceSignal { signalId, signalType, urgency, recommendation, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → GovernanceSignalConsumerPipelineResult
 *
 * Query: governance-signal:type:${signalType}:urgency:${urgency}:assessment:${sourceAssessmentId} (<=120)
 * contextId: signalResult.signalId
 *
 * Warnings:
 *   signalType === "ESCALATE"       → WARNING_ESCALATE
 *   signalType === "TRIGGER_REVIEW" → WARNING_TRIGGER_REVIEW
 *   MONITOR / NO_ACTION             → no warning
 */
export class GovernanceSignalConsumerPipelineContract {
  private readonly now: () => string;
  private readonly signalContract: GovernanceSignalContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceSignalConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.signalContract = createGovernanceSignalContract({
      ...dependencies.signalContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceSignalConsumerPipelineRequest,
  ): GovernanceSignalConsumerPipelineResult {
    const createdAt = this.now();

    const signalResult: GovernanceSignal = this.signalContract.signal(
      request.assessment,
    );

    const query =
      `governance-signal:type:${signalResult.signalType}:urgency:${signalResult.urgency}:assessment:${signalResult.sourceAssessmentId}`.slice(
        0,
        120,
      );

    const contextId = signalResult.signalId;

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
    if (signalResult.signalType === "ESCALATE") {
      warnings.push(WARNING_ESCALATE);
    }
    if (signalResult.signalType === "TRIGGER_REVIEW") {
      warnings.push(WARNING_TRIGGER_REVIEW);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t11-cp1-governance-signal-consumer-pipeline",
      signalResult.signalHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t11-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      signalResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceSignalConsumerPipelineContract(
  dependencies?: GovernanceSignalConsumerPipelineContractDependencies,
): GovernanceSignalConsumerPipelineContract {
  return new GovernanceSignalConsumerPipelineContract(dependencies);
}
