import {
  type AdaptationPolicyInput,
  checkAdaptationPolicy,
  type AdaptationCheckDisposition,
} from "./adaptation-policy-engine.js";
import { TruthModelContract } from "./truth.model.contract.js";
import { TruthScoreContract } from "./truth.score.contract.js";
import type { TruthModel } from "./truth.model.contract.js";
import type { TruthScore } from "./truth.score.contract.js";
import type { PatternInsight } from "./pattern.detection.contract.js";

export const TRUTH_MODEL_CALIBRATION_VERSION =
  "cvf.truthModelCalibration.tm1.v1";

export type CalibrationDisposition = "PASS" | "BLOCK" | "ADVISORY";

export type CalibrationPhase =
  | "PREFLIGHT_CHECK"
  | "MODEL_BUILD"
  | "SCORE_COMPUTE"
  | "COMPLETE";

export interface CalibrationSessionInput {
  sessionId: string;
  insights: PatternInsight[];
  adaptationPolicyInput: AdaptationPolicyInput;
}

export interface CalibrationSessionResult {
  contractVersion: typeof TRUTH_MODEL_CALIBRATION_VERSION;
  sessionId: string;
  phase: CalibrationPhase;
  disposition: CalibrationDisposition;
  /** TruthModel built from insights — null if preflight blocked */
  truthModel: TruthModel | null;
  /** TruthScore computed from model — null if model not built */
  truthScore: TruthScore | null;
  /** Always true in TM1 — no fixed weighting doctrine yet */
  isProvisional: true;
  preflightDisposition: AdaptationCheckDisposition;
  preflightBlockedConstraints: string[];
  advisoryNote: string;
  runtimeCalibrationAuthorized: false;
}

export interface TruthModelCalibrationDependencies {
  now?: () => string;
}

/**
 * Runs a governed Truth Model calibration session (LHW17 T3 Step 6).
 *
 * Pre-flight: runs APE-1 A1-A6 adaptation policy check.
 * - If any constraint BLOCKs → returns BLOCK, no model built.
 * - If any constraint is ADVISORY → model built but disposition=ADVISORY.
 * - If all PASS → model built and scored, disposition=PASS.
 *
 * TruthScore is always PROVISIONAL (isProvisional: true) — no fixed weighting
 * doctrine per 2026-04-12 decision section 3.7.
 * runtimeCalibrationAuthorized is always false.
 */
export function runCalibrationSession(
  input: CalibrationSessionInput,
  deps: TruthModelCalibrationDependencies = {},
): CalibrationSessionResult {
  const preflightResult = checkAdaptationPolicy(input.adaptationPolicyInput);

  if (preflightResult.overallDisposition === "BLOCK") {
    return {
      contractVersion: TRUTH_MODEL_CALIBRATION_VERSION,
      sessionId: input.sessionId,
      phase: "PREFLIGHT_CHECK",
      disposition: "BLOCK",
      truthModel: null,
      truthScore: null,
      isProvisional: true,
      preflightDisposition: "BLOCK",
      preflightBlockedConstraints: preflightResult.blockedConstraints,
      advisoryNote: `Calibration blocked by A1-A6 preflight: ${preflightResult.blockedConstraints.join(", ")}.`,
      runtimeCalibrationAuthorized: false,
    };
  }

  const modelContract = new TruthModelContract({ now: deps.now });
  const truthModel = modelContract.build(input.insights);

  const scoreContract = new TruthScoreContract({ now: deps.now });
  const truthScore = scoreContract.score(truthModel);

  const disposition: CalibrationDisposition =
    preflightResult.overallDisposition === "ADVISORY" ? "ADVISORY" : "PASS";

  const advisoryNote =
    disposition === "ADVISORY"
      ? `Calibration completed with advisory constraints: ${preflightResult.advisoryConstraints.join(", ")}. TruthScore=${truthScore.compositeScore}/100 (${truthScore.scoreClass}) — PROVISIONAL.`
      : `Calibration completed. TruthScore=${truthScore.compositeScore}/100 (${truthScore.scoreClass}) — PROVISIONAL. No fixed weighting doctrine active.`;

  return {
    contractVersion: TRUTH_MODEL_CALIBRATION_VERSION,
    sessionId: input.sessionId,
    phase: "COMPLETE",
    disposition,
    truthModel,
    truthScore,
    isProvisional: true,
    preflightDisposition: preflightResult.overallDisposition,
    preflightBlockedConstraints: [],
    advisoryNote,
    runtimeCalibrationAuthorized: false,
  };
}
