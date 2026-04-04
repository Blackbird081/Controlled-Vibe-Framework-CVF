import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExecutionObservation, OutcomeClass } from "./execution.observer.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Overall risk derived from aggregated execution observations.
 *
 *   HIGH   — any FAILED observations, or total failedCount > 0
 *   MEDIUM — any GATED or SANDBOXED observations (no failures)
 *   LOW    — any PARTIAL observations (no failures, gates, or sandboxes)
 *   NONE   — all observations are SUCCESS
 */
export type ExecutionAuditRisk = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface ExecutionAuditSummary {
  summaryId: string;
  createdAt: string;
  totalObservations: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  gatedCount: number;
  sandboxedCount: number;
  /** Total entries across all observations */
  totalEntries: number;
  /** Total executed entries across all observations */
  totalExecuted: number;
  /** Total failed entries across all observations */
  totalFailed: number;
  /** Average confidenceSignal, rounded to 4 dp (0 for empty input) */
  averageConfidence: number;
  /** Severity-first dominant outcome: FAILED > GATED > SANDBOXED > PARTIAL > SUCCESS */
  dominantOutcome: OutcomeClass;
  overallRisk: ExecutionAuditRisk;
  auditSummary: string;
  auditHash: string;
}

export interface ExecutionAuditSummaryContractDependencies {
  now?: () => string;
}

// ─── Dominant outcome ─────────────────────────────────────────────────────────

const OUTCOME_PRIORITY: OutcomeClass[] = [
  "FAILED",
  "GATED",
  "SANDBOXED",
  "PARTIAL",
  "SUCCESS",
];

function computeDominantOutcome(observations: ExecutionObservation[]): OutcomeClass {
  if (observations.length === 0) return "SUCCESS";
  const present = new Set(observations.map((o) => o.outcomeClass));
  for (const cls of OUTCOME_PRIORITY) {
    if (present.has(cls)) return cls;
  }
  return "SUCCESS";
}

// ─── Overall risk ─────────────────────────────────────────────────────────────

function deriveOverallRisk(
  failedCount: number,
  gatedCount: number,
  sandboxedCount: number,
  partialCount: number,
  totalFailed: number,
): ExecutionAuditRisk {
  if (failedCount > 0 || totalFailed > 0) return "HIGH";
  if (gatedCount > 0 || sandboxedCount > 0) return "MEDIUM";
  if (partialCount > 0) return "LOW";
  return "NONE";
}

// ─── Summary text ─────────────────────────────────────────────────────────────

function buildAuditSummary(
  total: number,
  dominantOutcome: OutcomeClass,
  overallRisk: ExecutionAuditRisk,
  averageConfidence: number,
  counts: { success: number; partial: number; failed: number; gated: number; sandboxed: number },
): string {
  if (total === 0) return "No execution observations recorded.";
  return (
    `${total} observation(s): success=${counts.success}, partial=${counts.partial}, ` +
    `failed=${counts.failed}, gated=${counts.gated}, sandboxed=${counts.sandboxed}. ` +
    `DominantOutcome=${dominantOutcome}. OverallRisk=${overallRisk}. ` +
    `AvgConfidence=${averageConfidence.toFixed(2)}.`
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionAuditSummaryContract (W6-T9)
 * ---------------------------------------
 * Aggregates a batch of ExecutionObservation records into a single audit
 * summary consumable by the governance layer (GEF GovernanceAuditSignal).
 *
 * Dominant outcome uses severity-first priority: FAILED > GATED > SANDBOXED > PARTIAL > SUCCESS.
 * Overall risk is derived from the presence of failures, gates, sandboxes, or partials.
 */
export class ExecutionAuditSummaryContract {
  private readonly now: () => string;

  constructor(dependencies: ExecutionAuditSummaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(observations: ExecutionObservation[]): ExecutionAuditSummary {
    const createdAt = this.now();
    const totalObservations = observations.length;

    const successCount   = observations.filter((o) => o.outcomeClass === "SUCCESS").length;
    const partialCount   = observations.filter((o) => o.outcomeClass === "PARTIAL").length;
    const failedCount    = observations.filter((o) => o.outcomeClass === "FAILED").length;
    const gatedCount     = observations.filter((o) => o.outcomeClass === "GATED").length;
    const sandboxedCount = observations.filter((o) => o.outcomeClass === "SANDBOXED").length;

    const totalEntries  = observations.reduce((s, o) => s + o.totalEntries, 0);
    const totalExecuted = observations.reduce((s, o) => s + o.executedCount, 0);
    const totalFailed   = observations.reduce((s, o) => s + o.failedCount, 0);

    const averageConfidence =
      totalObservations === 0
        ? 0
        : Math.round(
            (observations.reduce((s, o) => s + o.confidenceSignal, 0) / totalObservations) * 10000,
          ) / 10000;

    const dominantOutcome = computeDominantOutcome(observations);
    const overallRisk = deriveOverallRisk(
      failedCount,
      gatedCount,
      sandboxedCount,
      partialCount,
      totalFailed,
    );

    const auditSummary = buildAuditSummary(
      totalObservations,
      dominantOutcome,
      overallRisk,
      averageConfidence,
      { success: successCount, partial: partialCount, failed: failedCount, gated: gatedCount, sandboxed: sandboxedCount },
    );

    const auditHash = computeDeterministicHash(
      "w6-t9-cp1-audit-summary",
      `${createdAt}:total=${totalObservations}`,
      `dominant=${dominantOutcome}:risk=${overallRisk}`,
      `executed=${totalExecuted}:failed=${totalFailed}`,
      `avgConf=${averageConfidence}`,
    );

    const summaryId = computeDeterministicHash(
      "w6-t9-cp1-summary-id",
      auditHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalObservations,
      successCount,
      partialCount,
      failedCount,
      gatedCount,
      sandboxedCount,
      totalEntries,
      totalExecuted,
      totalFailed,
      averageConfidence,
      dominantOutcome,
      overallRisk,
      auditSummary,
      auditHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionAuditSummaryContract(
  dependencies?: ExecutionAuditSummaryContractDependencies,
): ExecutionAuditSummaryContract {
  return new ExecutionAuditSummaryContract(dependencies);
}
