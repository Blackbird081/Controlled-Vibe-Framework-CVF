import type { TruthModel } from "./truth.model.contract.js";
import { TruthScoreContract } from "./truth.score.contract.js";
import type { TruthScore } from "./truth.score.contract.js";

export const WEIGHTING_DOCTRINE_VERSION =
  "cvf.truthScoreWeightingDoctrine.wd1.v1";

/**
 * Minimum calibration confidence required to lift isProvisional=true.
 * Derived from LP-LP1+LP-LP2: 7 sessions, confidence=0.7.
 * Per 2026-04-12 decision s3.7 — provisional until calibration complete.
 */
export const WEIGHTING_DOCTRINE_CONFIDENCE_GATE = 0.7;

/**
 * Canonical TruthScore dimension weights (each dimension max points):
 *   confidence  → 25 pts  (how much data has been processed)
 *   health      → 25 pts  (current health signal severity)
 *   trajectory  → 25 pts  (direction of health change over time)
 *   pattern     → 25 pts  (dominant decision pattern)
 *
 * Total: 100 pts. Weights codify equal-weight doctrine from LP-LP2
 * calibration data (7 sessions, all ACCEPT/HEALTHY/STABLE).
 */
export const WEIGHTING_DOCTRINE_WEIGHTS = {
  confidenceMaxPts: 25,
  healthMaxPts: 25,
  trajectoryMaxPts: 25,
  patternMaxPts: 25,
  totalMaxPts: 100,
} as const;

export type WeightingDoctrineOutcome =
  | "DOCTRINE_APPLIED"
  | "CONFIDENCE_GATE_NOT_MET";

export interface WeightingDoctrineResult {
  contractVersion: typeof WEIGHTING_DOCTRINE_VERSION;
  outcome: WeightingDoctrineOutcome;
  confidenceLevel: number;
  confidenceGateRequired: typeof WEIGHTING_DOCTRINE_CONFIDENCE_GATE;
  confidenceGateMet: boolean;
  /**
   * TruthScore with isProvisional=false when gate met, isProvisional=true otherwise.
   * Uses the same dimension scoring as TruthScoreContract — doctrine confirms
   * these weights as canonical rather than changing them.
   */
  truthScore: TruthScore & { isProvisional: boolean };
  doctrineNote: string;
  /** Always false — advisory doctrine only, not live scoring activation */
  runtimeScoringAuthorized: false;
}

export interface WeightingDoctrineDependencies {
  now?: () => string;
}

/**
 * Applies the TruthScore Weighting Doctrine to a calibrated TruthModel.
 *
 * When confidenceLevel ≥ WEIGHTING_DOCTRINE_CONFIDENCE_GATE (0.7):
 *   - outcome: DOCTRINE_APPLIED
 *   - isProvisional: false  ← provisional status lifted
 *
 * When confidenceLevel < threshold:
 *   - outcome: CONFIDENCE_GATE_NOT_MET
 *   - isProvisional: true   ← remains provisional
 *
 * runtimeScoringAuthorized is always false.
 * The doctrine confirms equal-weight (25/25/25/25) scoring as canonical,
 * derived from LP-LP1+LP-LP2 calibration (7 ALLOW sessions, confidence=0.7).
 */
export function applyWeightingDoctrine(
  model: TruthModel,
  deps: WeightingDoctrineDependencies = {},
): WeightingDoctrineResult {
  const scoreContract = new TruthScoreContract({ now: deps.now });
  const rawScore = scoreContract.score(model);

  const confidenceGateMet =
    model.confidenceLevel >= WEIGHTING_DOCTRINE_CONFIDENCE_GATE;

  const outcome: WeightingDoctrineOutcome = confidenceGateMet
    ? "DOCTRINE_APPLIED"
    : "CONFIDENCE_GATE_NOT_MET";

  const doctrineNote = confidenceGateMet
    ? `WD1 doctrine applied. Confidence ${model.confidenceLevel.toFixed(2)} ≥ ${WEIGHTING_DOCTRINE_CONFIDENCE_GATE}. ` +
      `TruthScore ${rawScore.compositeScore}/100 (${rawScore.scoreClass}) is now canonical (not provisional). ` +
      `Weights: confidence=${WEIGHTING_DOCTRINE_WEIGHTS.confidenceMaxPts}/health=${WEIGHTING_DOCTRINE_WEIGHTS.healthMaxPts}/` +
      `trajectory=${WEIGHTING_DOCTRINE_WEIGHTS.trajectoryMaxPts}/pattern=${WEIGHTING_DOCTRINE_WEIGHTS.patternMaxPts}.`
    : `Confidence gate not met: ${model.confidenceLevel.toFixed(2)} < ${WEIGHTING_DOCTRINE_CONFIDENCE_GATE}. ` +
      `TruthScore ${rawScore.compositeScore}/100 remains PROVISIONAL. ` +
      `Collect ${Math.ceil((WEIGHTING_DOCTRINE_CONFIDENCE_GATE - model.confidenceLevel) * 10)} more sessions to meet gate.`;

  return {
    contractVersion: WEIGHTING_DOCTRINE_VERSION,
    outcome,
    confidenceLevel: model.confidenceLevel,
    confidenceGateRequired: WEIGHTING_DOCTRINE_CONFIDENCE_GATE,
    confidenceGateMet,
    truthScore: {
      ...rawScore,
      isProvisional: !confidenceGateMet,
    },
    doctrineNote,
    runtimeScoringAuthorized: false,
  };
}
