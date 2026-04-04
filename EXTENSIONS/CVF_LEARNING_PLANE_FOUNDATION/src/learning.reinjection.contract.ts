import type { GovernanceSignal, GovernanceSignalType } from "./governance.signal.contract";
import type { LearningFeedbackInput } from "./feedback.ledger.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface LearningReinjectionResult {
  reinjectionId: string;
  reinjectedAt: string;
  sourceSignalId: string;
  sourceSignalType: GovernanceSignalType;
  feedbackInput: LearningFeedbackInput;
  reinjectionHash: string;
}

export interface LearningReinjectionContractDependencies {
  mapSignal?: (signal: GovernanceSignal) => LearningFeedbackInput;
  now?: () => string;
}

// --- Signal → FeedbackInput Mapping ---

// Priority: ESCALATE → REJECT (most severe), TRIGGER_REVIEW → ESCALATE,
//           MONITOR → RETRY, NO_ACTION → ACCEPT (least severe)
function defaultMapSignal(signal: GovernanceSignal): LearningFeedbackInput {
  switch (signal.signalType) {
    case "ESCALATE":
      return {
        feedbackId: signal.signalId,
        sourcePipelineId: signal.sourceAssessmentId,
        feedbackClass: "REJECT",
        priority: "critical",
        confidenceBoost: 0,
      };
    case "TRIGGER_REVIEW":
      return {
        feedbackId: signal.signalId,
        sourcePipelineId: signal.sourceAssessmentId,
        feedbackClass: "ESCALATE",
        priority: "critical",
        confidenceBoost: 0,
      };
    case "MONITOR":
      return {
        feedbackId: signal.signalId,
        sourcePipelineId: signal.sourceAssessmentId,
        feedbackClass: "RETRY",
        priority: "low",
        confidenceBoost: 0.05,
      };
    case "NO_ACTION":
      return {
        feedbackId: signal.signalId,
        sourcePipelineId: signal.sourceAssessmentId,
        feedbackClass: "ACCEPT",
        priority: "low",
        confidenceBoost: 0.1,
      };
  }
}

// --- Contract ---

export class LearningReinjectionContract {
  private readonly mapSignal: (signal: GovernanceSignal) => LearningFeedbackInput;
  private readonly now: () => string;

  constructor(dependencies: LearningReinjectionContractDependencies = {}) {
    this.mapSignal = dependencies.mapSignal ?? defaultMapSignal;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  reinject(signal: GovernanceSignal): LearningReinjectionResult {
    const reinjectedAt = this.now();
    const feedbackInput = this.mapSignal(signal);

    const reinjectionHash = computeDeterministicHash(
      "w4-t5-cp1-learning-reinjection",
      `${reinjectedAt}:${signal.signalId}`,
      `signal:${signal.signalType}:mapped:${feedbackInput.feedbackClass}`,
      `priority:${feedbackInput.priority}:boost:${feedbackInput.confidenceBoost}`,
    );

    const reinjectionId = computeDeterministicHash(
      "w4-t5-cp1-reinjection-id",
      reinjectionHash,
      reinjectedAt,
    );

    return {
      reinjectionId,
      reinjectedAt,
      sourceSignalId: signal.signalId,
      sourceSignalType: signal.signalType,
      feedbackInput,
      reinjectionHash,
    };
  }
}

export function createLearningReinjectionContract(
  dependencies?: LearningReinjectionContractDependencies,
): LearningReinjectionContract {
  return new LearningReinjectionContract(dependencies);
}
