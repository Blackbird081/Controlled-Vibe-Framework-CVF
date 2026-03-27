import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  LearningReinjectionContract,
  createLearningReinjectionContract,
} from "./learning.reinjection.contract";
import type {
  LearningReinjectionResult,
  LearningReinjectionContractDependencies,
} from "./learning.reinjection.contract";
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

const WARNING_REJECT =
  "[learning-reinjection] REJECT feedback class — critical signal requires immediate attention";
const WARNING_ESCALATE =
  "[learning-reinjection] ESCALATE feedback class — signal requires escalation review";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningReinjectionConsumerPipelineRequest {
  signal: GovernanceSignal;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface LearningReinjectionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  reinjectionResult: LearningReinjectionResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface LearningReinjectionConsumerPipelineContractDependencies {
  now?: () => string;
  reinjectionContractDeps?: LearningReinjectionContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * LearningReinjectionConsumerPipelineContract (W4-T15 CP1 — Full Lane GC-019)
 * ---------------------------------------------------------------------------
 * Bridges LearningReinjectionContract into the CPF consumer pipeline.
 *
 * Chain:
 *   GovernanceSignal
 *     → LearningReinjectionContract.reinject()
 *     → LearningReinjectionResult { feedbackInput, sourceSignalType, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → LearningReinjectionConsumerPipelineResult
 *
 * Query: "Reinjection: {sourceSignalType} → {feedbackClass}" (max 120 chars)
 * contextId: reinjectionResult.reinjectionId
 *
 * Warnings:
 *   feedbackInput.feedbackClass === "REJECT"    → WARNING_REJECT
 *   feedbackInput.feedbackClass === "ESCALATE"  → WARNING_ESCALATE
 */
export class LearningReinjectionConsumerPipelineContract {
  private readonly now: () => string;
  private readonly reinjectionContract: LearningReinjectionContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: LearningReinjectionConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.reinjectionContract = createLearningReinjectionContract({
      ...dependencies.reinjectionContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: LearningReinjectionConsumerPipelineRequest,
  ): LearningReinjectionConsumerPipelineResult {
    const createdAt = this.now();

    const reinjectionResult: LearningReinjectionResult =
      this.reinjectionContract.reinject(request.signal);

    const query = `Reinjection: ${reinjectionResult.sourceSignalType} → ${reinjectionResult.feedbackInput.feedbackClass}`.slice(
      0,
      120,
    );

    const contextId = reinjectionResult.reinjectionId;

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
    if (reinjectionResult.feedbackInput.feedbackClass === "REJECT") {
      warnings.push(WARNING_REJECT);
    }
    if (reinjectionResult.feedbackInput.feedbackClass === "ESCALATE") {
      warnings.push(WARNING_ESCALATE);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t15-cp1-learning-reinjection-consumer-pipeline",
      reinjectionResult.reinjectionHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t15-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      reinjectionResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLearningReinjectionConsumerPipelineContract(
  dependencies?: LearningReinjectionConsumerPipelineContractDependencies,
): LearningReinjectionConsumerPipelineContract {
  return new LearningReinjectionConsumerPipelineContract(dependencies);
}
