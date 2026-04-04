import type {
  ExecutionFeedbackSignal,
  FeedbackClass,
} from "./execution.feedback.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type RoutingAction = FeedbackClass;

export type RoutingPriority = "critical" | "high" | "medium" | "low";

export interface FeedbackRoutingDecision {
  decisionId: string;
  createdAt: string;
  sourceFeedbackId: string;
  sourcePipelineId: string;
  routingAction: RoutingAction;
  routingPriority: RoutingPriority;
  rationale: string;
  decisionHash: string;
}

export interface FeedbackRoutingContractDependencies {
  now?: () => string;
}

// --- Priority Derivation ---

function deriveRoutingPriority(
  feedbackClass: FeedbackClass,
  confidenceBoost: number,
): RoutingPriority {
  if (feedbackClass === "REJECT") return "critical";
  if (feedbackClass === "ESCALATE") return "high";
  if (feedbackClass === "RETRY") {
    return confidenceBoost === 0 ? "high" : "medium";
  }
  return "low"; // ACCEPT
}

// --- Rationale Building ---

function buildRoutingRationale(
  feedbackClass: FeedbackClass,
  signal: ExecutionFeedbackSignal,
): string {
  switch (feedbackClass) {
    case "ACCEPT":
      return `Execution outcome accepted — no further routing action required. Source: ${signal.sourcePipelineId}.`;
    case "RETRY":
      return `Execution outcome requires retry — ${signal.rationale} Route back to dispatch after resolving blockers.`;
    case "ESCALATE":
      return `Execution outcome requires escalation — ${signal.rationale} Route to governance review before retrying.`;
    case "REJECT":
      return `Execution outcome rejected — ${signal.rationale} Full replanning required; do not retry without new design authorization.`;
  }
}

// --- Contract ---

export class FeedbackRoutingContract {
  private readonly now: () => string;

  constructor(dependencies: FeedbackRoutingContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  route(signal: ExecutionFeedbackSignal): FeedbackRoutingDecision {
    const createdAt = this.now();
    const routingAction: RoutingAction = signal.feedbackClass;
    const routingPriority = deriveRoutingPriority(
      signal.feedbackClass,
      signal.confidenceBoost,
    );
    const rationale = buildRoutingRationale(signal.feedbackClass, signal);

    const decisionHash = computeDeterministicHash(
      "w2-t5-cp1-feedback-routing",
      `${createdAt}:${signal.feedbackId}`,
      `action:${routingAction}:priority:${routingPriority}`,
      `pipeline:${signal.sourcePipelineId}`,
    );

    const decisionId = computeDeterministicHash(
      "w2-t5-cp1-decision-id",
      decisionHash,
      createdAt,
    );

    return {
      decisionId,
      createdAt,
      sourceFeedbackId: signal.feedbackId,
      sourcePipelineId: signal.sourcePipelineId,
      routingAction,
      routingPriority,
      rationale,
      decisionHash,
    };
  }
}

export function createFeedbackRoutingContract(
  dependencies?: FeedbackRoutingContractDependencies,
): FeedbackRoutingContract {
  return new FeedbackRoutingContract(dependencies);
}
