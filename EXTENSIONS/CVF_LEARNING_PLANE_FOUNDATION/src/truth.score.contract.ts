import type { TruthModel } from "./truth.model.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Qualitative class derived from the composite truth score.
 *
 *   STRONG       — score ≥ 80: high-confidence, healthy, stable or improving model
 *   ADEQUATE     — score ≥ 55: usable model; some uncertainty or mild degradation
 *   WEAK         — score ≥ 30: low confidence or clear degradation; caution advised
 *   INSUFFICIENT — score < 30: insufficient data or critical signals; not actionable
 */
export type TruthScoreClass = "STRONG" | "ADEQUATE" | "WEAK" | "INSUFFICIENT";

export interface TruthScoreDimensions {
  /** Confidence dimension: 0–25. Based on model.confidenceLevel (0–1). */
  confidenceScore: number;
  /** Health dimension: 0–25. Based on currentHealthSignal. */
  healthScore: number;
  /** Trajectory dimension: 0–25. Based on healthTrajectory. */
  trajectoryScore: number;
  /** Pattern dimension: 0–25. Based on dominantPattern. */
  patternScore: number;
}

export interface TruthScore {
  scoreId: string;
  scoredAt: string;
  sourceTruthModelId: string;
  sourceTruthModelVersion: number;
  /** Composite score 0–100 (sum of the four 0–25 dimensions). */
  compositeScore: number;
  scoreClass: TruthScoreClass;
  dimensions: TruthScoreDimensions;
  rationale: string;
  scoreHash: string;
}

export interface TruthScoreContractDependencies {
  now?: () => string;
}

// ─── Dimension Scoring ────────────────────────────────────────────────────────

/** Maps confidenceLevel (0–1) to 0–25. */
function scoreConfidence(model: TruthModel): number {
  return Math.round(model.confidenceLevel * 25);
}

/**
 * Maps currentHealthSignal to 0–25.
 * HEALTHY → 25, DEGRADED → 12, CRITICAL → 0.
 * Unknown inputs default to 0.
 */
function scoreHealth(model: TruthModel): number {
  switch (model.currentHealthSignal) {
    case "HEALTHY":  return 25;
    case "DEGRADED": return 12;
    case "CRITICAL": return 0;
    default:         return 0;
  }
}

/**
 * Maps healthTrajectory to 0–25.
 * IMPROVING → 25, STABLE → 18, DEGRADING → 5, UNKNOWN → 0.
 */
function scoreTrajectory(model: TruthModel): number {
  switch (model.healthTrajectory) {
    case "IMPROVING": return 25;
    case "STABLE":    return 18;
    case "DEGRADING": return 5;
    case "UNKNOWN":   return 0;
    default:          return 0;
  }
}

/**
 * Maps dominantPattern to 0–25.
 * ACCEPT/PROCEED → 25, MONITOR → 15, RETRY → 8, ESCALATE → 3, REJECT → 0.
 */
function scorePattern(model: TruthModel): number {
  switch (model.dominantPattern) {
    case "ACCEPT":
    case "PROCEED":  return 25;
    case "MONITOR":  return 15;
    case "RETRY":    return 8;
    case "ESCALATE": return 3;
    case "REJECT":   return 0;
    default:         return 0;
  }
}

// ─── Class Derivation ─────────────────────────────────────────────────────────

function deriveScoreClass(composite: number): TruthScoreClass {
  if (composite >= 80) return "STRONG";
  if (composite >= 55) return "ADEQUATE";
  if (composite >= 30) return "WEAK";
  return "INSUFFICIENT";
}

// ─── Rationale ───────────────────────────────────────────────────────────────

function buildRationale(
  dims: TruthScoreDimensions,
  composite: number,
  scoreClass: TruthScoreClass,
  model: TruthModel,
): string {
  return (
    `TruthScore=${composite}/100 (${scoreClass}). ` +
    `confidence=${dims.confidenceScore}/25 (level=${model.confidenceLevel.toFixed(2)}), ` +
    `health=${dims.healthScore}/25 (${model.currentHealthSignal}), ` +
    `trajectory=${dims.trajectoryScore}/25 (${model.healthTrajectory}), ` +
    `pattern=${dims.patternScore}/25 (${model.dominantPattern}).`
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TruthScoreContract (W6-T8)
 * ---------------------------
 * Produces a numeric TruthScore (0–100) from a TruthModel, enabling graded
 * governance decisions beyond binary PASS/FAIL evaluation verdicts.
 *
 * Scoring dimensions (each 0–25, summing to 0–100 composite):
 *   - confidenceScore  — how much data has been processed
 *   - healthScore      — current health signal severity
 *   - trajectoryScore  — direction of health change over time
 *   - patternScore     — dominant decision pattern
 */
export class TruthScoreContract {
  private readonly now: () => string;

  constructor(dependencies: TruthScoreContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  score(model: TruthModel): TruthScore {
    const scoredAt = this.now();

    const dimensions: TruthScoreDimensions = {
      confidenceScore: scoreConfidence(model),
      healthScore:     scoreHealth(model),
      trajectoryScore: scoreTrajectory(model),
      patternScore:    scorePattern(model),
    };

    const compositeScore =
      dimensions.confidenceScore +
      dimensions.healthScore +
      dimensions.trajectoryScore +
      dimensions.patternScore;

    const scoreClass = deriveScoreClass(compositeScore);
    const rationale  = buildRationale(dimensions, compositeScore, scoreClass, model);

    const scoreHash = computeDeterministicHash(
      "w6-t8-cp1-truth-score",
      `${scoredAt}:modelId=${model.modelId}:version=${model.version}`,
      `composite=${compositeScore}:class=${scoreClass}`,
    );

    const scoreId = computeDeterministicHash(
      "w6-t8-cp1-score-id",
      scoreHash,
      scoredAt,
    );

    return {
      scoreId,
      scoredAt,
      sourceTruthModelId: model.modelId,
      sourceTruthModelVersion: model.version,
      compositeScore,
      scoreClass,
      dimensions,
      rationale,
      scoreHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTruthScoreContract(
  dependencies?: TruthScoreContractDependencies,
): TruthScoreContract {
  return new TruthScoreContract(dependencies);
}
