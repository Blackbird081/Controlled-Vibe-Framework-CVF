import { describe, expect, it } from "vitest";
import {
  SIMULATION_ENVIRONMENT_VERSION,
  runSimulation,
  SIMULATION_SCENARIO_HEALTHY,
  type SimulationScenario,
} from "../src/index";
import type { AgentAuthorityTier } from "../src/index";
import type { FeedbackLedger, EvaluationResult, GovernanceSignal, TruthScore } from "../src/index";

const FIXED_NOW = "2026-05-31T00:00:00.000Z";

const healthyLedger: FeedbackLedger = {
  ledgerId: "t-ledger-1", compiledAt: FIXED_NOW, records: [],
  acceptCount: 9, retryCount: 0, escalateCount: 0, rejectCount: 1, totalRecords: 10, ledgerHash: "h1",
};
const passEval: EvaluationResult = {
  resultId: "t-eval-1", evaluatedAt: FIXED_NOW, sourceTruthModelId: "m1",
  sourceTruthModelVersion: 1, verdict: "PASS", severity: "NONE", confidenceLevel: 0.9,
  rationale: "pass", evaluationHash: "he1",
};
const noActionGov: GovernanceSignal = {
  signalId: "t-gov-1", issuedAt: FIXED_NOW, sourceAssessmentId: "a1",
  sourceOverallStatus: "ok", signalType: "NO_ACTION", urgency: "NORMAL",
  recommendation: "proceed", signalHash: "hg1",
};
const strongScore: TruthScore = {
  scoreId: "t-score-1", scoredAt: FIXED_NOW, sourceTruthModelId: "m1",
  sourceTruthModelVersion: 1, compositeScore: 90, scoreClass: "STRONG",
  dimensions: { confidenceScore: 20, healthScore: 25, trajectoryScore: 25, patternScore: 20 },
  rationale: "strong", scoreHash: "hs1",
};

const passingPolicy = {
  a1: { proposedRoleChangePct: 5, proposedSpawnPct: 2, proposedRetirementPct: 2 },
  a2: { score: 0.8, confidence: 0.9 },
  a3: { signalCount: 5, taskCount: 8 },
  a4: { inCooldown: false, executionsSinceLastChange: 15 },
  a5: { currentTier: 1 as AgentAuthorityTier, proposedTier: 2 as AgentAuthorityTier },
  a6: { obfOverallSignal: "OK" as const, performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
};

const healthyScenario: SimulationScenario = {
  scenarioId: "test-healthy",
  description: "healthy",
  calibrationInput: {
    sessionId: "sim-healthy",
    insights: [],
    adaptationPolicyInput: passingPolicy,
  },
  reputationInput: {
    agentId: "sim-agent-1",
    truthScore: strongScore,
    feedbackLedger: healthyLedger,
    evaluationResult: passEval,
    governanceSignal: noActionGov,
  },
};

describe("CVF Learning Plane Foundation", () => {
  describe("SE1 — runSimulation", () => {
    it("VALIDATED on healthy scenario", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.verdict).toBe("VALIDATED");
      expect(r.pipelineCoherent).toBe(true);
    });

    it("BLOCKED when APE-1 preflight fails", () => {
      const blocked: SimulationScenario = {
        ...healthyScenario, scenarioId: "test-blocked",
        calibrationInput: {
          ...healthyScenario.calibrationInput,
          adaptationPolicyInput: {
            ...passingPolicy,
            a1: { proposedRoleChangePct: 99, proposedSpawnPct: 2, proposedRetirementPct: 2 },
          },
        },
      };
      const r = runSimulation(blocked, { now: () => FIXED_NOW });
      expect(r.verdict).toBe("BLOCKED");
      expect(r.pipelineCoherent).toBe(false);
      expect(r.calibrationResult.truthModel).toBeNull();
    });

    it("DEGRADED when routing is DEFER (UNTRUSTED agent)", () => {
      const untrustedScore: TruthScore = { ...strongScore, compositeScore: 0, scoreClass: "INSUFFICIENT" };
      const failEval: EvaluationResult = { ...passEval, verdict: "FAIL", severity: "HIGH" };
      const escalateGov: GovernanceSignal = { ...noActionGov, signalType: "ESCALATE" };
      const zeroLedger: FeedbackLedger = { ...healthyLedger, acceptCount: 0, rejectCount: 10 };
      const degraded: SimulationScenario = {
        ...healthyScenario, scenarioId: "test-degraded",
        reputationInput: {
          agentId: "sim-agent-untrusted",
          truthScore: untrustedScore,
          feedbackLedger: zeroLedger,
          evaluationResult: failEval,
          governanceSignal: escalateGov,
        },
      };
      const r = runSimulation(degraded, { now: () => FIXED_NOW });
      expect(["DEGRADED", "BLOCKED"]).toContain(r.verdict);
    });

    it("returns 3 steps: CALIBRATION, REPUTATION, ROUTING", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.steps).toHaveLength(3);
      expect(r.steps.map((s) => s.step)).toEqual(["CALIBRATION", "REPUTATION", "ROUTING"]);
    });

    it("runtimeSimulationAuthorized is always false", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.runtimeSimulationAuthorized).toBe(false);
    });

    it("contractVersion matches SIMULATION_ENVIRONMENT_VERSION", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.contractVersion).toBe(SIMULATION_ENVIRONMENT_VERSION);
      expect(r.contractVersion).toBe("cvf.simulationEnvironment.se1.v1");
    });

    it("scenarioId is preserved in result", () => {
      const r = runSimulation({ ...healthyScenario, scenarioId: "my-scenario-99" }, { now: () => FIXED_NOW });
      expect(r.scenarioId).toBe("my-scenario-99");
    });

    it("advisoryNote is non-empty", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.advisoryNote.length).toBeGreaterThan(0);
    });

    it("SIMULATION_SCENARIO_HEALTHY built-in scenario passes validation", () => {
      const r = runSimulation(SIMULATION_SCENARIO_HEALTHY, { now: () => FIXED_NOW });
      expect(r.verdict).toBe("VALIDATED");
      expect(r.pipelineCoherent).toBe(true);
    });

    it("calibrationResult and routingAdvisory are included in result", () => {
      const r = runSimulation(healthyScenario, { now: () => FIXED_NOW });
      expect(r.calibrationResult).toBeDefined();
      expect(r.routingAdvisory).toBeDefined();
    });
  });
});
