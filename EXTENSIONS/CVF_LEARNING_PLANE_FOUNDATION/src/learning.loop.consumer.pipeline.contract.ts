import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningLoopContract,
  createLearningLoopContract,
} from "./learning.loop.contract";
import type {
  LearningLoopSummary,
  LearningLoopContractDependencies,
} from "./learning.loop.contract";
import type { GovernanceSignal } from "./governance.signal.contract";
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

const WARNING_REJECT_DOMINANT =
  "[learning-loop] dominant feedback class REJECT — critical governance signal re-injection";
const WARNING_ESCALATE_DOMINANT =
  "[learning-loop] dominant feedback class ESCALATE — elevated governance signal re-injection";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningLoopConsumerPipelineRequest {
  signals: GovernanceSignal[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningLoopConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  loopSummary: LearningLoopSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningLoopConsumerPipelineContractDependencies {
  now?: () => string;
  loopContractDeps?: LearningLoopContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningLoopConsumerPipelineContract (W4-T14 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges LearningLoopContract into the CPF consumer pipeline.
 *
 * Chain:
 *   GovernanceSignal[]
 *     → LearningLoopContract.summarize()
 *     → LearningLoopSummary { summaryId, dominantFeedbackClass, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → LearningLoopConsumerPipelineResult
 *
 * Query: derived from loopSummary.summary (max 120 chars)
 * contextId: loopSummary.summaryId
 *
 * Warnings:
 *   dominantFeedbackClass === "REJECT"   → WARNING_REJECT_DOMINANT
 *   dominantFeedbackClass === "ESCALATE" → WARNING_ESCALATE_DOMINANT
 *   RETRY / ACCEPT                       → no warning
 */
export class LearningLoopConsumerPipelineContract {
  private readonly now: () => string;
  private readonly loopContract: LearningLoopContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningLoopConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.loopContract = createLearningLoopContract({
      ...dependencies.loopContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: LearningLoopConsumerPipelineRequest,
  ): LearningLoopConsumerPipelineResult {
    const createdAt = this.now();

    const loopSummary: LearningLoopSummary = this.loopContract.summarize(
      request.signals,
    );

    const query = loopSummary.summary.slice(0, 120);

    const contextId = loopSummary.summaryId;

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
    if (loopSummary.dominantFeedbackClass === "REJECT") {
      warnings.push(WARNING_REJECT_DOMINANT);
    }
    if (loopSummary.dominantFeedbackClass === "ESCALATE") {
      warnings.push(WARNING_ESCALATE_DOMINANT);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t14-cp1-learning-loop-consumer-pipeline",
      loopSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t14-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      loopSummary,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningLoopConsumerPipelineContract(
  dependencies?: LearningLoopConsumerPipelineContractDependencies,
): LearningLoopConsumerPipelineContract {
  return new LearningLoopConsumerPipelineContract(dependencies);
}
