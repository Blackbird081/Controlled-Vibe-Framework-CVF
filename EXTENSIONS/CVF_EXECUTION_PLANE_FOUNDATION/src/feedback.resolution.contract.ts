import type {
  FeedbackRoutingDecision,
  RoutingAction,
} from "./feedback.routing.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type UrgencyLevel = "CRITICAL" | "HIGH" | "NORMAL";

export interface FeedbackResolutionSummary {
  summaryId: string;
  resolvedAt: string;
  totalDecisions: number;
  acceptCount: number;
  retryCount: number;
  escalateCount: number;
  rejectCount: number;
  urgencyLevel: UrgencyLevel;
  summary: string;
  summaryHash: string;
}

export interface FeedbackResolutionContractDependencies {
  now?: () => string;
}

// --- Urgency Classification ---

function deriveUrgencyLevel(
  escalateCount: number,
  rejectCount: number,
  retryCount: number,
): UrgencyLevel {
  if (escalateCount > 0 || rejectCount > 0) return "CRITICAL";
  if (retryCount > 0) return "HIGH";
  return "NORMAL";
}

// --- Summary Building ---

function buildResolutionSummary(
  total: number,
  acceptCount: number,
  retryCount: number,
  escalateCount: number,
  rejectCount: number,
  urgencyLevel: UrgencyLevel,
): string {
  if (total === 0) {
    return "No routing decisions to resolve. Resolution summary is empty.";
  }
  const parts: string[] = [];
  if (acceptCount > 0) parts.push(`${acceptCount} accepted`);
  if (retryCount > 0) parts.push(`${retryCount} queued for retry`);
  if (escalateCount > 0) parts.push(`${escalateCount} escalated`);
  if (rejectCount > 0) parts.push(`${rejectCount} rejected`);
  return (
    `Execution feedback resolution: ${parts.join(", ")}. ` +
    `Urgency: ${urgencyLevel}.`
  );
}

// --- Contract ---

export class FeedbackResolutionContract {
  private readonly now: () => string;

  constructor(dependencies: FeedbackResolutionContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  resolve(decisions: FeedbackRoutingDecision[]): FeedbackResolutionSummary {
    const resolvedAt = this.now();

    const acceptCount = decisions.filter(
      (d) => d.routingAction === "ACCEPT",
    ).length;
    const retryCount = decisions.filter(
      (d) => d.routingAction === "RETRY",
    ).length;
    const escalateCount = decisions.filter(
      (d) => d.routingAction === "ESCALATE",
    ).length;
    const rejectCount = decisions.filter(
      (d) => d.routingAction === "REJECT",
    ).length;

    const urgencyLevel = deriveUrgencyLevel(
      escalateCount,
      rejectCount,
      retryCount,
    );
    const totalDecisions = decisions.length;
    const summaryText = buildResolutionSummary(
      totalDecisions,
      acceptCount,
      retryCount,
      escalateCount,
      rejectCount,
      urgencyLevel,
    );

    const summaryHash = computeDeterministicHash(
      "w2-t5-cp2-feedback-resolution",
      `${resolvedAt}:total:${totalDecisions}`,
      `accept:${acceptCount}:retry:${retryCount}`,
      `escalate:${escalateCount}:reject:${rejectCount}`,
      `urgency:${urgencyLevel}`,
    );

    const summaryId = computeDeterministicHash(
      "w2-t5-cp2-summary-id",
      summaryHash,
      resolvedAt,
    );

    return {
      summaryId,
      resolvedAt,
      totalDecisions,
      acceptCount,
      retryCount,
      escalateCount,
      rejectCount,
      urgencyLevel,
      summary: summaryText,
      summaryHash,
    };
  }
}

export function createFeedbackResolutionContract(
  dependencies?: FeedbackResolutionContractDependencies,
): FeedbackResolutionContract {
  return new FeedbackResolutionContract(dependencies);
}
