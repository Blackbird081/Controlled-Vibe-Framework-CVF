import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { LearningStorageLog } from "./learning.storage.log.contract";
import type { LearningLoopSummary } from "./learning.loop.contract";
import type { FeedbackClass } from "./feedback.ledger.contract";

// --- Types ---

export type ObservabilityHealth = "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";

export interface LearningObservabilityReport {
  reportId: string;
  generatedAt: string;
  sourceStorageLogId: string;
  sourceLoopSummaryId: string;
  storageRecordCount: number;
  loopSignalCount: number;
  observabilityHealth: ObservabilityHealth;
  healthRationale: string;
  reportHash: string;
}

export interface LearningObservabilityContractDependencies {
  now?: () => string;
}

// --- Health Derivation ---
// REJECT | ESCALATE → CRITICAL
// RETRY → DEGRADED
// ACCEPT → HEALTHY
// Empty storage AND empty loop → UNKNOWN

function deriveHealth(
  storageRecordCount: number,
  loopSignalCount: number,
  dominantFeedbackClass: FeedbackClass,
): ObservabilityHealth {
  if (storageRecordCount === 0 && loopSignalCount === 0) return "UNKNOWN";

  switch (dominantFeedbackClass) {
    case "REJECT":
    case "ESCALATE":
      return "CRITICAL";
    case "RETRY":
      return "DEGRADED";
    case "ACCEPT":
      return "HEALTHY";
  }
}

function buildRationale(
  health: ObservabilityHealth,
  dominantFeedbackClass: FeedbackClass,
  storageRecordCount: number,
  loopSignalCount: number,
): string {
  if (health === "UNKNOWN") {
    return `No storage records and no loop signals — observability health is UNKNOWN.`;
  }
  return (
    `Observability health=${health}. ` +
    `Loop dominant feedback=${dominantFeedbackClass}. ` +
    `storageRecords=${storageRecordCount}, loopSignals=${loopSignalCount}.`
  );
}

// --- Contract ---

export class LearningObservabilityContract {
  private readonly now: () => string;

  constructor(dependencies: LearningObservabilityContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  report(
    storageLog: LearningStorageLog,
    loopSummary: LearningLoopSummary,
  ): LearningObservabilityReport {
    const generatedAt = this.now();
    const storageRecordCount = storageLog.totalRecords;
    const loopSignalCount = loopSummary.totalSignals;
    const observabilityHealth = deriveHealth(
      storageRecordCount,
      loopSignalCount,
      loopSummary.dominantFeedbackClass,
    );
    const healthRationale = buildRationale(
      observabilityHealth,
      loopSummary.dominantFeedbackClass,
      storageRecordCount,
      loopSignalCount,
    );

    const reportHash = computeDeterministicHash(
      "w4-t7-cp1-observability",
      `${generatedAt}:storage=${storageRecordCount}:loop=${loopSignalCount}`,
      `health:${observabilityHealth}:dominant:${loopSummary.dominantFeedbackClass}`,
      `storageLogId:${storageLog.logId}:loopSummaryId:${loopSummary.summaryId}`,
    );

    const reportId = computeDeterministicHash(
      "w4-t7-cp1-report-id",
      reportHash,
      generatedAt,
    );

    return {
      reportId,
      generatedAt,
      sourceStorageLogId: storageLog.logId,
      sourceLoopSummaryId: loopSummary.summaryId,
      storageRecordCount,
      loopSignalCount,
      observabilityHealth,
      healthRationale,
      reportHash,
    };
  }
}

export function createLearningObservabilityContract(
  dependencies?: LearningObservabilityContractDependencies,
): LearningObservabilityContract {
  return new LearningObservabilityContract(dependencies);
}
