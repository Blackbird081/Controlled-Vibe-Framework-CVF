import type { TruthScore } from "./truth.score.contract";
import type { FeedbackLedger } from "./feedback.ledger.contract";
import type { EvaluationResult } from "./evaluation.engine.contract";
import type { GovernanceSignal } from "./governance.signal.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Qualitative class derived from the composite reputation score.
 *
 *   TRUSTED      — score ≥ 80: high-trust agent; eligible for full task allocation
 *   RELIABLE     — score ≥ 55: reliable agent; eligible for most task allocation
 *   PROVISIONAL  — score ≥ 30: provisional agent; limited task allocation
 *   UNTRUSTED    — score < 30: insufficient trust; task allocation rejected
 */
export type ReputationClass = "TRUSTED" | "RELIABLE" | "PROVISIONAL" | "UNTRUSTED";

export interface ReputationSignalDimensions {
  /** Truth contribution: 0–40. Derived from TruthScore.compositeScore (0–100). */
  truthContribution: number;
  /** Feedback contribution: 0–35. Derived from FeedbackLedger accept ratio. */
  feedbackContribution: number;
  /** Evaluation contribution: 0–15. Derived from EvaluationResult.verdict. */
  evaluationContribution: number;
  /** Governance contribution: 0–10. Derived from GovernanceSignal.signalType. */
  governanceContribution: number;
}

export interface ReputationSignalInput {
  agentId: string;
  truthScore: TruthScore;
  feedbackLedger: FeedbackLedger;
  evaluationResult: EvaluationResult;
  governanceSignal: GovernanceSignal;
}

export interface ReputationSignal {
  signalId: string;
  computedAt: string;
  agentId: string;
  /** Composite reputation score 0–100 (sum of the four weighted dimensions). */
  compositeReputationScore: number;
  reputationClass: ReputationClass;
  dimensions: ReputationSignalDimensions;
  rationale: string;
  reputationHash: string;
}

export interface ReputationSignalContractDependencies {
  now?: () => string;
}

// ─── Dimension Scoring ────────────────────────────────────────────────────────

/** Maps TruthScore.compositeScore (0–100) to 0–40 (40% weight). */
function scoreTruth(truthScore: TruthScore): number {
  return Math.round(truthScore.compositeScore * 0.4);
}

/**
 * Maps FeedbackLedger accept ratio to 0–35 (35% weight).
 * Empty ledger (no records) → 0.
 */
function scoreFeedback(ledger: FeedbackLedger): number {
  if (ledger.totalRecords === 0) return 0;
  return Math.round((ledger.acceptCount / ledger.totalRecords) * 35);
}

/**
 * Maps EvaluationResult.verdict to 0–15 (15% weight).
 * PASS → 15, WARN → 8, INCONCLUSIVE → 5, FAIL → 0.
 */
function scoreEvaluation(result: EvaluationResult): number {
  switch (result.verdict) {
    case "PASS":         return 15;
    case "WARN":         return 8;
    case "INCONCLUSIVE": return 5;
    case "FAIL":         return 0;
    default:             return 0;
  }
}

/**
 * Maps GovernanceSignal.signalType to 0–10 (10% weight).
 * NO_ACTION → 10, MONITOR → 7, TRIGGER_REVIEW → 3, ESCALATE → 0.
 */
function scoreGovernance(signal: GovernanceSignal): number {
  switch (signal.signalType) {
    case "NO_ACTION":      return 10;
    case "MONITOR":        return 7;
    case "TRIGGER_REVIEW": return 3;
    case "ESCALATE":       return 0;
    default:               return 0;
  }
}

// ─── Class Derivation ─────────────────────────────────────────────────────────

function deriveReputationClass(score: number): ReputationClass {
  if (score >= 80) return "TRUSTED";
  if (score >= 55) return "RELIABLE";
  if (score >= 30) return "PROVISIONAL";
  return "UNTRUSTED";
}

// ─── Rationale ───────────────────────────────────────────────────────────────

function buildRationale(
  dims: ReputationSignalDimensions,
  composite: number,
  reputationClass: ReputationClass,
  input: ReputationSignalInput,
): string {
  return (
    `ReputationScore=${composite}/100 (${reputationClass}). ` +
    `truth=${dims.truthContribution}/40 (TruthScore=${input.truthScore.compositeScore}/100 [${input.truthScore.scoreClass}]), ` +
    `feedback=${dims.feedbackContribution}/35 (accept=${input.feedbackLedger.acceptCount}/${input.feedbackLedger.totalRecords} records), ` +
    `evaluation=${dims.evaluationContribution}/15 (verdict=${input.evaluationResult.verdict}), ` +
    `governance=${dims.governanceContribution}/10 (signal=${input.governanceSignal.signalType}).`
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ReputationSignalContract (W10-T1 CP1)
 * --------------------------------------
 * Composites four existing LPF outputs (FIXED INPUT surfaces) into a single
 * governed reputation signal for an agent.
 *
 * Scoring dimensions (summing to 0–100 composite):
 *   - truthContribution    (0–40) — from TruthScore.compositeScore
 *   - feedbackContribution (0–35) — from FeedbackLedger accept ratio
 *   - evaluationContribution (0–15) — from EvaluationResult.verdict
 *   - governanceContribution (0–10) — from GovernanceSignal.signalType
 *
 * Class thresholds: TRUSTED ≥ 80 · RELIABLE ≥ 55 · PROVISIONAL ≥ 30 · UNTRUSTED < 30
 *
 * All upstream contracts (TruthScore W6-T8, FeedbackLedger W4-T1,
 * EvaluationEngine W4-T3, GovernanceSignal W4-T4) are FIXED INPUT.
 */
export class ReputationSignalContract {
  private readonly now: () => string;

  constructor(dependencies: ReputationSignalContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  compute(input: ReputationSignalInput): ReputationSignal {
    const computedAt = this.now();

    const dimensions: ReputationSignalDimensions = {
      truthContribution:      scoreTruth(input.truthScore),
      feedbackContribution:   scoreFeedback(input.feedbackLedger),
      evaluationContribution: scoreEvaluation(input.evaluationResult),
      governanceContribution: scoreGovernance(input.governanceSignal),
    };

    const compositeReputationScore =
      dimensions.truthContribution +
      dimensions.feedbackContribution +
      dimensions.evaluationContribution +
      dimensions.governanceContribution;

    const reputationClass = deriveReputationClass(compositeReputationScore);
    const rationale = buildRationale(dimensions, compositeReputationScore, reputationClass, input);

    const reputationHash = computeDeterministicHash(
      "w10-t1-cp1-reputation-signal",
      `${computedAt}:agentId=${input.agentId}`,
      `composite=${compositeReputationScore}:class=${reputationClass}`,
      `truth=${dimensions.truthContribution}:feedback=${dimensions.feedbackContribution}`,
      `evaluation=${dimensions.evaluationContribution}:governance=${dimensions.governanceContribution}`,
    );

    const signalId = computeDeterministicHash(
      "w10-t1-cp1-signal-id",
      reputationHash,
      computedAt,
    );

    return {
      signalId,
      computedAt,
      agentId: input.agentId,
      compositeReputationScore,
      reputationClass,
      dimensions,
      rationale,
      reputationHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createReputationSignalContract(
  dependencies?: ReputationSignalContractDependencies,
): ReputationSignalContract {
  return new ReputationSignalContract(dependencies);
}
