import type { ExecutionObservation, OutcomeClass } from "./execution.observer.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type FeedbackClass = "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT";

export type FeedbackPriority = "critical" | "high" | "medium" | "low";

export interface ExecutionFeedbackSignal {
  feedbackId: string;
  createdAt: string;
  sourceObservationId: string;
  sourcePipelineId: string;
  feedbackClass: FeedbackClass;
  priority: FeedbackPriority;
  rationale: string;
  confidenceBoost: number;
  feedbackHash: string;
}

export interface ExecutionFeedbackContractDependencies {
  mapFeedbackClass?: (outcomeClass: OutcomeClass) => FeedbackClass;
  now?: () => string;
}

// --- Feedback Mapping ---

const FEEDBACK_CLASS_MAP: Record<OutcomeClass, FeedbackClass> = {
  SUCCESS: "ACCEPT",
  PARTIAL: "RETRY",
  FAILED: "ESCALATE",
  GATED: "ESCALATE",
  SANDBOXED: "RETRY",
};

function defaultMapFeedbackClass(outcomeClass: OutcomeClass): FeedbackClass {
  return FEEDBACK_CLASS_MAP[outcomeClass] ?? "ESCALATE";
}

// --- Priority Derivation ---

function derivePriority(
  feedbackClass: FeedbackClass,
  confidenceSignal: number,
): FeedbackPriority {
  if (feedbackClass === "ESCALATE") {
    return confidenceSignal < 0.2 ? "critical" : "high";
  }
  if (feedbackClass === "RETRY") {
    return confidenceSignal < 0.4 ? "high" : "medium";
  }
  if (feedbackClass === "REJECT") {
    return "critical";
  }
  return "low"; // ACCEPT
}

// --- Rationale Building ---

function buildRationale(
  observation: ExecutionObservation,
  feedbackClass: FeedbackClass,
): string {
  const { outcomeClass, executedCount, totalEntries, failedCount, sandboxedCount } =
    observation;

  switch (feedbackClass) {
    case "ACCEPT":
      return `Execution completed successfully — ${executedCount}/${totalEntries} entries executed, no failures.`;
    case "RETRY":
      if (sandboxedCount > 0) {
        return `${sandboxedCount} execution(s) delegated to sandbox — retry after sandbox review and risk resolution.`;
      }
      return `Partial execution outcome (${executedCount}/${totalEntries}) — retry after resolving skipped or gated entries.`;
    case "ESCALATE":
      if (outcomeClass === "FAILED") {
        return `${failedCount} execution failure(s) detected — escalate for investigation before retrying.`;
      }
      return `All entries blocked by policy gate (GATED) — escalate to governance review before proceeding.`;
    case "REJECT":
      return `Execution observation indicates irrecoverable failure — reject and require full replanning.`;
  }
}

// --- Confidence Boost ---

function computeConfidenceBoost(
  feedbackClass: FeedbackClass,
  confidenceSignal: number,
): number {
  // ACCEPT: boost = remaining distance to 1.0 * 0.5
  if (feedbackClass === "ACCEPT") {
    return Math.round((1.0 - confidenceSignal) * 0.5 * 100) / 100;
  }
  // RETRY/ESCALATE: boost = 0 (no confidence improvement yet)
  return 0;
}

// --- Contract ---

export class ExecutionFeedbackContract {
  private readonly mapFeedbackClass: (outcomeClass: OutcomeClass) => FeedbackClass;
  private readonly now: () => string;

  constructor(dependencies: ExecutionFeedbackContractDependencies = {}) {
    this.mapFeedbackClass =
      dependencies.mapFeedbackClass ?? defaultMapFeedbackClass;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  generate(observation: ExecutionObservation): ExecutionFeedbackSignal {
    const createdAt = this.now();
    const feedbackClass = this.mapFeedbackClass(observation.outcomeClass);
    const priority = derivePriority(feedbackClass, observation.confidenceSignal);
    const rationale = buildRationale(observation, feedbackClass);
    const confidenceBoost = computeConfidenceBoost(
      feedbackClass,
      observation.confidenceSignal,
    );

    const feedbackHash = computeDeterministicHash(
      "w2-t4-cp2-execution-feedback",
      `${createdAt}:${observation.observationId}`,
      `feedback:${feedbackClass}:priority:${priority}`,
      `confidence:${observation.confidenceSignal.toFixed(2)}`,
    );

    const feedbackId = computeDeterministicHash(
      "w2-t4-cp2-feedback-id",
      feedbackHash,
      createdAt,
    );

    return {
      feedbackId,
      createdAt,
      sourceObservationId: observation.observationId,
      sourcePipelineId: observation.sourcePipelineId,
      feedbackClass,
      priority,
      rationale,
      confidenceBoost,
      feedbackHash,
    };
  }
}

export function createExecutionFeedbackContract(
  dependencies?: ExecutionFeedbackContractDependencies,
): ExecutionFeedbackContract {
  return new ExecutionFeedbackContract(dependencies);
}
