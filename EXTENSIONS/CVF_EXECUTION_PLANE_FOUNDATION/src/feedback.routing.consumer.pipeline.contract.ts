import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  FeedbackRoutingContract,
  createFeedbackRoutingContract,
} from "./feedback.routing.contract";
import type {
  FeedbackRoutingDecision,
  FeedbackRoutingContractDependencies,
} from "./feedback.routing.contract";
import type { ExecutionFeedbackSignal } from "./execution.feedback.contract";
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

export interface FeedbackRoutingConsumerPipelineRequest {
  feedbackSignal: ExecutionFeedbackSignal;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface FeedbackRoutingConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  routingDecision: FeedbackRoutingDecision;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface FeedbackRoutingConsumerPipelineContractDependencies {
  now?: () => string;
  feedbackRoutingDeps?: FeedbackRoutingContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveFeedbackRoutingQuery(decision: FeedbackRoutingDecision): string {
  const raw = `[feedback-routing] action:${decision.routingAction} priority:${decision.routingPriority}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildFeedbackRoutingWarnings(decision: FeedbackRoutingDecision): string[] {
  const warnings: string[] = [];
  if (decision.routingAction === "REJECT") {
    warnings.push("[feedback] rejection decision — immediate intervention required");
  }
  if (decision.routingAction === "ESCALATE") {
    warnings.push("[feedback] escalation decision — human review required");
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackRoutingConsumerPipelineContract (W2-T24 CP1)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF (feedback routing decision).
 *
 * Internal chain (single execute call):
 *   FeedbackRoutingContract.route(feedbackSignal)  → FeedbackRoutingDecision
 *   query = `[feedback-routing] action:${routingAction} priority:${routingPriority}`.slice(0, 120)
 *   contextId = routingDecision.decisionId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → FeedbackRoutingConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: REJECT → immediate intervention required; ESCALATE → human review required.
 * Gap closed: FeedbackRoutingContract had no governed consumer-visible enriched output path.
 */
export class FeedbackRoutingConsumerPipelineContract {
  private readonly now: () => string;
  private readonly feedbackRouting: FeedbackRoutingContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: FeedbackRoutingConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.feedbackRouting = createFeedbackRoutingContract({
      ...dependencies.feedbackRoutingDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: FeedbackRoutingConsumerPipelineRequest,
  ): FeedbackRoutingConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: route feedback signal → FeedbackRoutingDecision
    const routingDecision: FeedbackRoutingDecision =
      this.feedbackRouting.route(request.feedbackSignal);

    // Step 2: derive query and build consumer package
    const query = deriveFeedbackRoutingQuery(routingDecision);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: routingDecision.decisionId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on routingAction
    const warnings = buildFeedbackRoutingWarnings(routingDecision);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t24-cp1-feedback-routing-consumer-pipeline",
      routingDecision.decisionHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t24-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      routingDecision,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackRoutingConsumerPipelineContract(
  dependencies?: FeedbackRoutingConsumerPipelineContractDependencies,
): FeedbackRoutingConsumerPipelineContract {
  return new FeedbackRoutingConsumerPipelineContract(dependencies);
}
