import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type FeedbackClass = "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT";

export type FeedbackPriority = "critical" | "high" | "medium" | "low";

/**
 * Cross-plane independent input type. Structurally compatible with
 * ExecutionFeedbackSignal (W2-T4) but owned by the learning plane.
 * Any plane's feedback signal can be converted to this interface
 * without learning-plane code importing from other plane packages.
 */
export interface LearningFeedbackInput {
  feedbackId: string;
  sourcePipelineId: string;
  sourceObservationId?: string;
  feedbackClass: FeedbackClass;
  priority: FeedbackPriority;
  confidenceBoost: number;
}

export interface FeedbackRecord {
  recordId: string;
  recordedAt: string;
  sourcePipelineId: string;
  feedbackClass: FeedbackClass;
  priority: FeedbackPriority;
  confidenceBoost: number;
}

export interface FeedbackLedger {
  ledgerId: string;
  compiledAt: string;
  records: FeedbackRecord[];
  totalRecords: number;
  acceptCount: number;
  retryCount: number;
  escalateCount: number;
  rejectCount: number;
  ledgerHash: string;
}

export interface FeedbackLedgerContractDependencies {
  now?: () => string;
}

// --- Record Building ---

function buildRecord(
  signal: LearningFeedbackInput,
  compiledAt: string,
): FeedbackRecord {
  const recordId = computeDeterministicHash(
    "w4-t1-cp1-feedback-record",
    signal.feedbackId,
    signal.sourcePipelineId,
    signal.feedbackClass,
  );
  return {
    recordId,
    recordedAt: compiledAt,
    sourcePipelineId: signal.sourcePipelineId,
    feedbackClass: signal.feedbackClass,
    priority: signal.priority,
    confidenceBoost: signal.confidenceBoost,
  };
}

// --- Contract ---

export class FeedbackLedgerContract {
  private readonly now: () => string;

  constructor(dependencies: FeedbackLedgerContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  compile(signals: LearningFeedbackInput[]): FeedbackLedger {
    const compiledAt = this.now();
    const records = signals.map((s) => buildRecord(s, compiledAt));

    const acceptCount = records.filter((r) => r.feedbackClass === "ACCEPT").length;
    const retryCount = records.filter((r) => r.feedbackClass === "RETRY").length;
    const escalateCount = records.filter((r) => r.feedbackClass === "ESCALATE").length;
    const rejectCount = records.filter((r) => r.feedbackClass === "REJECT").length;

    const ledgerHash = computeDeterministicHash(
      "w4-t1-cp1-feedback-ledger",
      `${compiledAt}:total:${records.length}`,
      `accept:${acceptCount}:retry:${retryCount}`,
      `escalate:${escalateCount}:reject:${rejectCount}`,
    );

    const ledgerId = computeDeterministicHash(
      "w4-t1-cp1-ledger-id",
      ledgerHash,
      compiledAt,
    );

    return {
      ledgerId,
      compiledAt,
      records,
      totalRecords: records.length,
      acceptCount,
      retryCount,
      escalateCount,
      rejectCount,
      ledgerHash,
    };
  }
}

export function createFeedbackLedgerContract(
  dependencies?: FeedbackLedgerContractDependencies,
): FeedbackLedgerContract {
  return new FeedbackLedgerContract(dependencies);
}
