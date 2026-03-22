import type { GovernanceSignal } from "./governance.signal.contract";
import type { FeedbackClass } from "./feedback.ledger.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import { createLearningReinjectionContract } from "./learning.reinjection.contract";

// --- Types ---

export interface LearningLoopSummary {
  summaryId: string;
  createdAt: string;
  totalSignals: number;
  rejectCount: number;
  escalateCount: number;
  retryCount: number;
  acceptCount: number;
  dominantFeedbackClass: FeedbackClass;
  summary: string;
  summaryHash: string;
}

export interface LearningLoopContractDependencies {
  now?: () => string;
}

// --- Dominant FeedbackClass Derivation ---

// Priority: REJECT > ESCALATE > RETRY > ACCEPT
function deriveDominantFeedbackClass(
  rejectCount: number,
  escalateCount: number,
  retryCount: number,
  total: number,
): FeedbackClass {
  if (total === 0) return "ACCEPT";
  if (rejectCount > 0) return "REJECT";
  if (escalateCount > 0) return "ESCALATE";
  if (retryCount > 0) return "RETRY";
  return "ACCEPT";
}

// --- Summary Building ---

function buildSummary(
  dominant: FeedbackClass,
  rejectCount: number,
  escalateCount: number,
  retryCount: number,
  acceptCount: number,
  total: number,
): string {
  if (total === 0) {
    return `Learning loop summary: no signals re-injected.`;
  }
  const breakdown = `reject=${rejectCount}, escalate=${escalateCount}, retry=${retryCount}, accept=${acceptCount}, total=${total}`;
  return (
    `Learning loop summary: dominant feedback=${dominant}. ` +
    `(${breakdown})`
  );
}

// --- Contract ---

export class LearningLoopContract {
  private readonly now: () => string;

  constructor(dependencies: LearningLoopContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(signals: GovernanceSignal[]): LearningLoopSummary {
    const createdAt = this.now();
    const reinjector = createLearningReinjectionContract();

    let rejectCount = 0;
    let escalateCount = 0;
    let retryCount = 0;
    let acceptCount = 0;

    for (const signal of signals) {
      const result = reinjector.reinject(signal);
      switch (result.feedbackInput.feedbackClass) {
        case "REJECT":
          rejectCount++;
          break;
        case "ESCALATE":
          escalateCount++;
          break;
        case "RETRY":
          retryCount++;
          break;
        case "ACCEPT":
          acceptCount++;
          break;
      }
    }

    const totalSignals = signals.length;
    const dominantFeedbackClass = deriveDominantFeedbackClass(
      rejectCount,
      escalateCount,
      retryCount,
      totalSignals,
    );
    const summary = buildSummary(
      dominantFeedbackClass,
      rejectCount,
      escalateCount,
      retryCount,
      acceptCount,
      totalSignals,
    );

    const summaryHash = computeDeterministicHash(
      "w4-t5-cp2-learning-loop",
      `${createdAt}:total=${totalSignals}`,
      `reject=${rejectCount}:escalate=${escalateCount}:retry=${retryCount}:accept=${acceptCount}`,
      `dominant:${dominantFeedbackClass}`,
    );

    const summaryId = computeDeterministicHash(
      "w4-t5-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalSignals,
      rejectCount,
      escalateCount,
      retryCount,
      acceptCount,
      dominantFeedbackClass,
      summary,
      summaryHash,
    };
  }
}

export function createLearningLoopContract(
  dependencies?: LearningLoopContractDependencies,
): LearningLoopContract {
  return new LearningLoopContract(dependencies);
}
