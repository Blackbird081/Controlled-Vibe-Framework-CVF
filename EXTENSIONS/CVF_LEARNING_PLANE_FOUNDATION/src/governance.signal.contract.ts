import type { ThresholdAssessment } from "./evaluation.threshold.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type GovernanceSignalType =
  | "ESCALATE"
  | "TRIGGER_REVIEW"
  | "MONITOR"
  | "NO_ACTION";

export type GovernanceUrgency = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export interface GovernanceSignal {
  signalId: string;
  issuedAt: string;
  sourceAssessmentId: string;
  sourceOverallStatus: string;
  signalType: GovernanceSignalType;
  urgency: GovernanceUrgency;
  recommendation: string;
  signalHash: string;
}

export interface GovernanceSignalContractDependencies {
  deriveSignal?: (assessment: ThresholdAssessment) => GovernanceSignalType;
  now?: () => string;
}

// --- Signal Derivation ---

function defaultDeriveSignal(
  assessment: ThresholdAssessment,
): GovernanceSignalType {
  switch (assessment.overallStatus) {
    case "FAILING":
      return "ESCALATE";
    case "WARNING":
      return "TRIGGER_REVIEW";
    case "INSUFFICIENT_DATA":
      return "MONITOR";
    case "PASSING":
      return "NO_ACTION";
  }
}

// --- Urgency Derivation ---

function deriveUrgency(signalType: GovernanceSignalType): GovernanceUrgency {
  switch (signalType) {
    case "ESCALATE":
      return "CRITICAL";
    case "TRIGGER_REVIEW":
      return "HIGH";
    case "MONITOR":
      return "LOW";
    case "NO_ACTION":
      return "LOW";
  }
}

// --- Recommendation Building ---

function buildRecommendation(
  signalType: GovernanceSignalType,
  assessment: ThresholdAssessment,
): string {
  switch (signalType) {
    case "ESCALATE":
      return (
        `ESCALATE to governance — ${assessment.failCount} of ${assessment.totalVerdicts} evaluation(s) failed. ` +
        `Immediate governance intervention required. Halt execution and initiate replanning.`
      );
    case "TRIGGER_REVIEW":
      return (
        `TRIGGER governance review — ${assessment.warnCount} of ${assessment.totalVerdicts} evaluation(s) flagged. ` +
        `Schedule review of execution and policy configurations before proceeding.`
      );
    case "MONITOR":
      return (
        `MONITOR learning state — insufficient evaluation data ` +
        `(${assessment.inconclusiveCount} inconclusive of ${assessment.totalVerdicts} total). ` +
        `Continue accumulating insights before taking governance action.`
      );
    case "NO_ACTION":
      return (
        `NO GOVERNANCE ACTION required — all ${assessment.passCount} evaluation(s) passed. ` +
        `Learning plane is operating within acceptable thresholds.`
      );
  }
}

// --- Contract ---

export class GovernanceSignalContract {
  private readonly deriveSignal: (
    assessment: ThresholdAssessment,
  ) => GovernanceSignalType;
  private readonly now: () => string;

  constructor(dependencies: GovernanceSignalContractDependencies = {}) {
    this.deriveSignal =
      dependencies.deriveSignal ?? defaultDeriveSignal;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  signal(assessment: ThresholdAssessment): GovernanceSignal {
    const issuedAt = this.now();
    const signalType = this.deriveSignal(assessment);
    const urgency = deriveUrgency(signalType);
    const recommendation = buildRecommendation(signalType, assessment);

    const signalHash = computeDeterministicHash(
      "w4-t4-cp1-governance-signal",
      `${issuedAt}:${assessment.assessmentId}`,
      `signal:${signalType}:urgency:${urgency}`,
      `status:${assessment.overallStatus}:total:${assessment.totalVerdicts}`,
    );

    const signalId = computeDeterministicHash(
      "w4-t4-cp1-signal-id",
      signalHash,
      issuedAt,
    );

    return {
      signalId,
      issuedAt,
      sourceAssessmentId: assessment.assessmentId,
      sourceOverallStatus: assessment.overallStatus,
      signalType,
      urgency,
      recommendation,
      signalHash,
    };
  }
}

export function createGovernanceSignalContract(
  dependencies?: GovernanceSignalContractDependencies,
): GovernanceSignalContract {
  return new GovernanceSignalContract(dependencies);
}
