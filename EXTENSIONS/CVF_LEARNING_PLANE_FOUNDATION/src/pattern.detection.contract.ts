import type { FeedbackLedger, FeedbackClass } from "./feedback.ledger.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type HealthSignal = "HEALTHY" | "DEGRADED" | "CRITICAL";

export type DominantPattern = FeedbackClass | "PROCEED" | "MONITOR" | "MIXED" | "EMPTY";

export interface PatternInsight {
  insightId: string;
  analyzedAt: string;
  sourceLedgerId: string;
  dominantPattern: DominantPattern;
  acceptRate: number;
  retryRate: number;
  escalateRate: number;
  rejectRate: number;
  healthSignal: HealthSignal;
  summary: string;
  insightHash: string;
}

export interface PatternDetectionContractDependencies {
  classifyHealth?: (escalateRate: number, rejectRate: number) => HealthSignal;
  now?: () => string;
}

// --- Health Classification ---

function defaultClassifyHealth(
  escalateRate: number,
  rejectRate: number,
): HealthSignal {
  const badRate = escalateRate + rejectRate;
  if (rejectRate > 0 || badRate >= 0.6) return "CRITICAL";
  if (badRate >= 0.3) return "DEGRADED";
  return "HEALTHY";
}

// --- Dominant Pattern ---

function deriveDominantPattern(ledger: FeedbackLedger): DominantPattern {
  if (ledger.totalRecords === 0) return "EMPTY";

  const counts: Record<FeedbackClass, number> = {
    ACCEPT: ledger.acceptCount,
    RETRY: ledger.retryCount,
    ESCALATE: ledger.escalateCount,
    REJECT: ledger.rejectCount,
  };

  const max = Math.max(...Object.values(counts));
  const dominant = (Object.keys(counts) as FeedbackClass[]).filter(
    (k) => counts[k] === max,
  );

  return dominant.length === 1 ? dominant[0] : "MIXED";
}

// --- Rate Computation ---

function computeRates(ledger: FeedbackLedger): {
  acceptRate: number;
  retryRate: number;
  escalateRate: number;
  rejectRate: number;
} {
  const total = ledger.totalRecords;
  if (total === 0) {
    return { acceptRate: 0, retryRate: 0, escalateRate: 0, rejectRate: 0 };
  }
  const round = (n: number) => Math.round((n / total) * 100) / 100;
  return {
    acceptRate: round(ledger.acceptCount),
    retryRate: round(ledger.retryCount),
    escalateRate: round(ledger.escalateCount),
    rejectRate: round(ledger.rejectCount),
  };
}

// --- Summary Building ---

function buildSummary(
  ledger: FeedbackLedger,
  dominantPattern: DominantPattern,
  healthSignal: HealthSignal,
  rates: ReturnType<typeof computeRates>,
): string {
  if (ledger.totalRecords === 0) {
    return "No feedback signals recorded. Ledger is empty — learning plane has no patterns to detect.";
  }
  const dominant =
    dominantPattern === "MIXED"
      ? "mixed outcome distribution"
      : dominantPattern === "EMPTY"
        ? "no outcomes"
        : `dominant ${dominantPattern} pattern`;
  return (
    `Learning plane analysis of ${ledger.totalRecords} feedback signal(s): ` +
    `${dominant} detected. ` +
    `Health: ${healthSignal}. ` +
    `Accept: ${Math.round(rates.acceptRate * 100)}%, ` +
    `Retry: ${Math.round(rates.retryRate * 100)}%, ` +
    `Escalate: ${Math.round(rates.escalateRate * 100)}%, ` +
    `Reject: ${Math.round(rates.rejectRate * 100)}%.`
  );
}

// --- Contract ---

export class PatternDetectionContract {
  private readonly classifyHealth: (
    escalateRate: number,
    rejectRate: number,
  ) => HealthSignal;
  private readonly now: () => string;

  constructor(dependencies: PatternDetectionContractDependencies = {}) {
    this.classifyHealth =
      dependencies.classifyHealth ?? defaultClassifyHealth;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  analyze(ledger: FeedbackLedger): PatternInsight {
    const analyzedAt = this.now();
    const rates = computeRates(ledger);
    const dominantPattern = deriveDominantPattern(ledger);
    const healthSignal = this.classifyHealth(rates.escalateRate, rates.rejectRate);
    const summary = buildSummary(ledger, dominantPattern, healthSignal, rates);

    const insightHash = computeDeterministicHash(
      "w4-t1-cp2-pattern-detection",
      `${analyzedAt}:${ledger.ledgerId}`,
      `dominant:${dominantPattern}:health:${healthSignal}`,
      `accept:${rates.acceptRate}:escalate:${rates.escalateRate}`,
    );

    const insightId = computeDeterministicHash(
      "w4-t1-cp2-insight-id",
      insightHash,
      analyzedAt,
    );

    return {
      insightId,
      analyzedAt,
      sourceLedgerId: ledger.ledgerId,
      dominantPattern,
      acceptRate: rates.acceptRate,
      retryRate: rates.retryRate,
      escalateRate: rates.escalateRate,
      rejectRate: rates.rejectRate,
      healthSignal,
      summary,
      insightHash,
    };
  }
}

export function createPatternDetectionContract(
  dependencies?: PatternDetectionContractDependencies,
): PatternDetectionContract {
  return new PatternDetectionContract(dependencies);
}
