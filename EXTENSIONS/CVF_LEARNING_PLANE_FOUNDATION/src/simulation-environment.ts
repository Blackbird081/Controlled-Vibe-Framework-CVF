import {
  runCalibrationSession,
  type CalibrationSessionInput,
  type CalibrationSessionResult,
} from "./truth-model-calibration.js";
import {
  createReputationSignalContract,
  type ReputationSignalInput,
} from "./reputation.signal.contract.js";
import {
  computeRoutingAdvisory,
  type RoutingAdvisoryResult,
} from "./reputation-routing-advisory.js";
import type { AdaptationPolicyInput } from "./adaptation-policy-engine.js";
import type { AgentAuthorityTier } from "./adaptation-policy-engine.js";
import type { PatternInsight } from "./pattern.detection.contract.js";
import type { FeedbackLedger } from "./feedback.ledger.contract.js";
import type { EvaluationResult } from "./evaluation.engine.contract.js";
import type { GovernanceSignal } from "./governance.signal.contract.js";

export const SIMULATION_ENVIRONMENT_VERSION =
  "cvf.simulationEnvironment.se1.v1";

export type SimulationVerdict = "VALIDATED" | "DEGRADED" | "BLOCKED";

export interface SimulationScenario {
  scenarioId: string;
  description: string;
  calibrationInput: CalibrationSessionInput;
  reputationInput: ReputationSignalInput;
}

export interface SimulationStepResult {
  step: "CALIBRATION" | "REPUTATION" | "ROUTING";
  disposition: string;
  summary: string;
}

export interface SimulationValidationResult {
  contractVersion: typeof SIMULATION_ENVIRONMENT_VERSION;
  scenarioId: string;
  verdict: SimulationVerdict;
  steps: SimulationStepResult[];
  calibrationResult: CalibrationSessionResult;
  routingAdvisory: RoutingAdvisoryResult;
  pipelineCoherent: boolean;
  advisoryNote: string;
  /** Always false — dry-run only, no live execution */
  runtimeSimulationAuthorized: false;
}

export interface SimulationEnvironmentDependencies {
  now?: () => string;
}

/**
 * Runs the full Learning Plane pipeline (APE-1 → TM1 → RM1) in dry-run mode
 * against a fixed deterministic scenario. Validates that the pipeline executes
 * coherently without live execution.
 *
 * LHW17 T3 Step 8 — "Simulation Environment validated."
 *
 * runtimeSimulationAuthorized is always false.
 */
export function runSimulation(
  scenario: SimulationScenario,
  deps: SimulationEnvironmentDependencies = {},
): SimulationValidationResult {
  const fixedNow = deps.now ?? (() => "2026-05-31T00:00:00.000Z");
  const steps: SimulationStepResult[] = [];

  // Step 1: Calibration (APE-1 preflight → TM1)
  const calibrationResult = runCalibrationSession(scenario.calibrationInput, { now: fixedNow });
  steps.push({
    step: "CALIBRATION",
    disposition: calibrationResult.disposition,
    summary: `Calibration ${calibrationResult.disposition}: phase=${calibrationResult.phase}, score=${calibrationResult.truthScore?.compositeScore ?? "N/A"}/100`,
  });

  // Step 2: Reputation scoring (RM1 prerequisite)
  const reputationContract = createReputationSignalContract({ now: fixedNow });
  const reputationSignal = reputationContract.compute(scenario.reputationInput);
  steps.push({
    step: "REPUTATION",
    disposition: reputationSignal.reputationClass,
    summary: `Reputation ${reputationSignal.reputationClass}: score=${reputationSignal.compositeReputationScore}/100`,
  });

  // Step 3: Routing advisory (RM1)
  const routingAdvisory = computeRoutingAdvisory(reputationSignal);
  steps.push({
    step: "ROUTING",
    disposition: routingAdvisory.disposition,
    summary: `Routing ${routingAdvisory.disposition}: r2Review=${routingAdvisory.r2ReviewRecommended}`,
  });

  // Determine verdict
  const pipelineCoherent =
    calibrationResult.disposition !== "BLOCK" &&
    routingAdvisory.disposition !== "DEFER";

  const verdict: SimulationVerdict =
    calibrationResult.disposition === "BLOCK"
      ? "BLOCKED"
      : routingAdvisory.disposition === "DEFER" ||
        calibrationResult.disposition === "ADVISORY" ||
        routingAdvisory.disposition === "CAUTION"
      ? "DEGRADED"
      : "VALIDATED";

  const advisoryNote =
    `Simulation ${verdict} for scenario '${scenario.scenarioId}'. ` +
    `Pipeline coherent: ${pipelineCoherent}. ` +
    steps.map((s) => `${s.step}=${s.disposition}`).join(" → ");

  return {
    contractVersion: SIMULATION_ENVIRONMENT_VERSION,
    scenarioId: scenario.scenarioId,
    verdict,
    steps,
    calibrationResult,
    routingAdvisory,
    pipelineCoherent,
    advisoryNote,
    runtimeSimulationAuthorized: false,
  };
}

// ─── Built-in default scenarios ──────────────────────────────────────────────

const FIXED_NOW = "2026-05-31T00:00:00.000Z";

const defaultPolicy: AdaptationPolicyInput = {
  a1: { proposedRoleChangePct: 5, proposedSpawnPct: 2, proposedRetirementPct: 2 },
  a2: { score: 0.8, confidence: 0.9 },
  a3: { signalCount: 5, taskCount: 8 },
  a4: { inCooldown: false, executionsSinceLastChange: 15 },
  a5: { currentTier: 1 as AgentAuthorityTier, proposedTier: 2 as AgentAuthorityTier },
  a6: { obfOverallSignal: "OK", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
};

const healthyInsight: PatternInsight = {
  insightId: "sim-insight-1",
  analyzedAt: FIXED_NOW,
  sourceLedgerId: "sim-ledger-1",
  dominantPattern: "ACCEPT",
  acceptRate: 0.9,
  retryRate: 0.05,
  escalateRate: 0.05,
  rejectRate: 0,
  healthSignal: "HEALTHY",
  summary: "Simulation healthy insight",
  insightHash: "sim-hash-1",
};

const healthyLedger: FeedbackLedger = {
  ledgerId: "sim-ledger-1",
  compiledAt: FIXED_NOW,
  records: [],
  acceptCount: 9,
  retryCount: 0,
  escalateCount: 0,
  rejectCount: 1,
  totalRecords: 10,
  ledgerHash: "sim-ledger-hash",
};

const healthyEval: EvaluationResult = {
  resultId: "sim-eval-1",
  evaluatedAt: FIXED_NOW,
  sourceTruthModelId: "sim-model-1",
  sourceTruthModelVersion: 1,
  verdict: "PASS",
  severity: "NONE",
  confidenceLevel: 0.9,
  rationale: "Simulation pass",
  evaluationHash: "sim-eval-hash",
};

const healthyGovSignal: GovernanceSignal = {
  signalId: "sim-gov-1",
  issuedAt: FIXED_NOW,
  sourceAssessmentId: "sim-assessment-1",
  sourceOverallStatus: "ok",
  signalType: "NO_ACTION",
  urgency: "NORMAL",
  recommendation: "Proceed",
  signalHash: "sim-gov-hash",
};

/** Standard healthy scenario for SE1 validation. */
export const SIMULATION_SCENARIO_HEALTHY: SimulationScenario = {
  scenarioId: "se1-healthy-baseline",
  description: "Healthy agent: TRUSTED reputation, PASS calibration, PROCEED routing",
  calibrationInput: {
    sessionId: "sim-session-healthy",
    insights: [healthyInsight, { ...healthyInsight, insightId: "sim-insight-2", insightHash: "sim-hash-2" }],
    adaptationPolicyInput: defaultPolicy,
  },
  reputationInput: {
    agentId: "sim-agent-healthy",
    truthScore: {
      scoreId: "sim-score-1",
      scoredAt: FIXED_NOW,
      sourceTruthModelId: "sim-model-1",
      sourceTruthModelVersion: 1,
      compositeScore: 90,
      scoreClass: "STRONG",
      dimensions: { confidenceScore: 20, healthScore: 25, trajectoryScore: 25, patternScore: 20 },
      rationale: "Simulation strong score",
      scoreHash: "sim-score-hash",
    },
    feedbackLedger: healthyLedger,
    evaluationResult: healthyEval,
    governanceSignal: healthyGovSignal,
  },
};
