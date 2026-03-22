import type {
  FeedbackResolutionSummary,
  UrgencyLevel,
} from "./feedback.resolution.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ReintakeAction = "REPLAN" | "RETRY" | "ACCEPT";

export interface ExecutionReintakeRequest {
  reintakeId: string;
  requestedAt: string;
  sourceSummaryId: string;
  sourceUrgencyLevel: UrgencyLevel;
  reintakeAction: ReintakeAction;
  reintakeVibe: string;
  reintakeHash: string;
}

export interface ExecutionReintakeContractDependencies {
  deriveAction?: (urgencyLevel: UrgencyLevel) => ReintakeAction;
  now?: () => string;
}

// --- Action Derivation ---

function defaultDeriveAction(urgencyLevel: UrgencyLevel): ReintakeAction {
  if (urgencyLevel === "CRITICAL") return "REPLAN";
  if (urgencyLevel === "HIGH") return "RETRY";
  return "ACCEPT";
}

// --- Vibe Building ---

function buildReintakeVibe(
  action: ReintakeAction,
  summary: FeedbackResolutionSummary,
): string {
  switch (action) {
    case "REPLAN":
      return (
        `Full replanning required — execution resolution summary reports CRITICAL urgency ` +
        `(escalate: ${summary.escalateCount}, reject: ${summary.rejectCount}). ` +
        `New design authorization required before re-dispatch.`
      );
    case "RETRY":
      return (
        `Execution retry requested — execution resolution summary reports HIGH urgency ` +
        `(retry: ${summary.retryCount}). ` +
        `Re-route to intake for revised orchestration before re-dispatch.`
      );
    case "ACCEPT":
      return (
        `Execution outcome accepted — no re-intake required. ` +
        `Resolution summary: ${summary.summary}`
      );
  }
}

// --- Contract ---

export class ExecutionReintakeContract {
  private readonly deriveAction: (urgencyLevel: UrgencyLevel) => ReintakeAction;
  private readonly now: () => string;

  constructor(dependencies: ExecutionReintakeContractDependencies = {}) {
    this.deriveAction =
      dependencies.deriveAction ?? defaultDeriveAction;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  reinject(summary: FeedbackResolutionSummary): ExecutionReintakeRequest {
    const requestedAt = this.now();
    const reintakeAction = this.deriveAction(summary.urgencyLevel);
    const reintakeVibe = buildReintakeVibe(reintakeAction, summary);

    const reintakeHash = computeDeterministicHash(
      "w2-t6-cp1-execution-reintake",
      `${requestedAt}:${summary.summaryId}`,
      `action:${reintakeAction}:urgency:${summary.urgencyLevel}`,
      `escalate:${summary.escalateCount}:reject:${summary.rejectCount}:retry:${summary.retryCount}`,
    );

    const reintakeId = computeDeterministicHash(
      "w2-t6-cp1-reintake-id",
      reintakeHash,
      requestedAt,
    );

    return {
      reintakeId,
      requestedAt,
      sourceSummaryId: summary.summaryId,
      sourceUrgencyLevel: summary.urgencyLevel,
      reintakeAction,
      reintakeVibe,
      reintakeHash,
    };
  }
}

export function createExecutionReintakeContract(
  dependencies?: ExecutionReintakeContractDependencies,
): ExecutionReintakeContract {
  return new ExecutionReintakeContract(dependencies);
}
