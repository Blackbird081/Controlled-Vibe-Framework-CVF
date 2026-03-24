import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  FeedbackResolutionContract,
  createFeedbackResolutionContract,
} from "./feedback.resolution.contract";
import type {
  FeedbackResolutionSummary,
  UrgencyLevel,
  FeedbackResolutionContractDependencies,
} from "./feedback.resolution.contract";
import type { FeedbackRoutingDecision } from "./feedback.routing.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackResolutionConsumerPipelineRequest {
  decisions: FeedbackRoutingDecision[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface FeedbackResolutionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  resolutionSummary: FeedbackResolutionSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface FeedbackResolutionConsumerPipelineContractDependencies {
  now?: () => string;
  resolutionContractDeps?: FeedbackResolutionContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildResolutionWarnings(urgencyLevel: UrgencyLevel): string[] {
  if (urgencyLevel === "CRITICAL") {
    return ["[feedback-resolution] critical urgency — escalated or rejected decisions require immediate attention"];
  }
  if (urgencyLevel === "HIGH") {
    return ["[feedback-resolution] high urgency — retry decisions require attention"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackResolutionConsumerPipelineContract (W2-T16)
 * ---------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   FeedbackResolutionContract.resolve(decisions)  → FeedbackResolutionSummary
 *   query = resolutionSummary.summary.slice(0, 120)
 *   contextId = resolutionSummary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → FeedbackResolutionConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: CRITICAL → escalated/rejected decisions; HIGH → retry decisions require attention.
 */
export class FeedbackResolutionConsumerPipelineContract {
  private readonly now: () => string;
  private readonly resolutionContract: FeedbackResolutionContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: FeedbackResolutionConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.resolutionContract = createFeedbackResolutionContract({
      ...dependencies.resolutionContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: FeedbackResolutionConsumerPipelineRequest,
  ): FeedbackResolutionConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: resolve decisions → FeedbackResolutionSummary
    const resolutionSummary: FeedbackResolutionSummary =
      this.resolutionContract.resolve(request.decisions);

    // Step 2: derive query from resolution summary text
    const query = resolutionSummary.summary.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: resolutionSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on urgencyLevel
    const warnings = buildResolutionWarnings(resolutionSummary.urgencyLevel);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t16-cp1-feedback-resolution-consumer-pipeline",
      resolutionSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t16-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      resolutionSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackResolutionConsumerPipelineContract(
  dependencies?: FeedbackResolutionConsumerPipelineContractDependencies,
): FeedbackResolutionConsumerPipelineContract {
  return new FeedbackResolutionConsumerPipelineContract(dependencies);
}
