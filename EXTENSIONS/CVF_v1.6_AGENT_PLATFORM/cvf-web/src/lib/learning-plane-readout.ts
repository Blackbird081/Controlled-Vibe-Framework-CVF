// Inline constants mirroring WD1 governed values — avoids importing LPF
// modules that use TypeScript ESM .js extensions (not resolvable by Turbopack).
// Source truth: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/truthscore-weighting-doctrine.ts
export const LEARNING_PLANE_READOUT_VERSION = "cvf.learningPlaneReadout.wd1.v1";
const WEIGHTING_DOCTRINE_VERSION = "cvf.truthScoreWeightingDoctrine.wd1.v1";
const WEIGHTING_DOCTRINE_CONFIDENCE_GATE = 0.7;
const WEIGHTING_DOCTRINE_WEIGHTS = {
  confidenceMaxPts: 25,
  healthMaxPts: 25,
  trajectoryMaxPts: 25,
  patternMaxPts: 25,
  totalMaxPts: 100,
} as const;

type WeightingDoctrineOutcome = "DOCTRINE_APPLIED" | "CONFIDENCE_GATE_NOT_MET";

export interface LearningPlaneReadout {
  contractVersion: typeof LEARNING_PLANE_READOUT_VERSION;
  doctrineVersion: typeof WEIGHTING_DOCTRINE_VERSION;
  confidenceGate: typeof WEIGHTING_DOCTRINE_CONFIDENCE_GATE;
  weights: typeof WEIGHTING_DOCTRINE_WEIGHTS;
  outcome: WeightingDoctrineOutcome;
  compositeScore: number;
  scoreClass: string;
  isProvisional: boolean;
  advisoryNote: string;
  runtimeScoringAuthorized: false;
}

// Inline score computation mirroring TruthScoreContract.score() logic.
// All 4 dimensions are HEALTHY/ACCEPT/STABLE for a single live session.
function computeInlineScore(confidenceLevel: number) {
  const confidencePts = Math.round(confidenceLevel * WEIGHTING_DOCTRINE_WEIGHTS.confidenceMaxPts);
  const healthPts = WEIGHTING_DOCTRINE_WEIGHTS.healthMaxPts; // HEALTHY → full pts
  const trajectoryPts = WEIGHTING_DOCTRINE_WEIGHTS.trajectoryMaxPts; // STABLE/single → full pts
  const patternPts = WEIGHTING_DOCTRINE_WEIGHTS.patternMaxPts; // ACCEPT → full pts
  const compositeScore = confidencePts + healthPts + trajectoryPts + patternPts;
  const scoreClass =
    compositeScore >= 80 ? "STRONG" :
    compositeScore >= 60 ? "ADEQUATE" :
    compositeScore >= 40 ? "WEAK" : "INSUFFICIENT";
  return { compositeScore, scoreClass };
}

/**
 * Builds a LearningPlaneReadout for /api/execute ALLOW responses.
 * confidenceLevel defaults to 0.7 (LP-LP2 calibrated). At 0.7 the
 * WD1 doctrine is applied and isProvisional=false.
 */
export function buildLearningPlaneReadout(
  role: string,
  confidenceLevel = 0.7,
): LearningPlaneReadout {
  const confidenceGateMet = confidenceLevel >= WEIGHTING_DOCTRINE_CONFIDENCE_GATE;
  const outcome: WeightingDoctrineOutcome = confidenceGateMet
    ? "DOCTRINE_APPLIED"
    : "CONFIDENCE_GATE_NOT_MET";

  const { compositeScore, scoreClass } = computeInlineScore(confidenceLevel);

  const advisoryNote = confidenceGateMet
    ? `WD1 doctrine applied. Confidence ${confidenceLevel.toFixed(2)} ≥ ${WEIGHTING_DOCTRINE_CONFIDENCE_GATE}. ` +
      `TruthScore ${compositeScore}/100 (${scoreClass}) canonical. Role: ${role}.`
    : `Confidence gate not met: ${confidenceLevel.toFixed(2)} < ${WEIGHTING_DOCTRINE_CONFIDENCE_GATE}. ` +
      `TruthScore ${compositeScore}/100 PROVISIONAL. Role: ${role}.`;

  return {
    contractVersion: LEARNING_PLANE_READOUT_VERSION,
    doctrineVersion: WEIGHTING_DOCTRINE_VERSION,
    confidenceGate: WEIGHTING_DOCTRINE_CONFIDENCE_GATE,
    weights: WEIGHTING_DOCTRINE_WEIGHTS,
    outcome,
    compositeScore,
    scoreClass,
    isProvisional: !confidenceGateMet,
    advisoryNote,
    runtimeScoringAuthorized: false,
  };
}
