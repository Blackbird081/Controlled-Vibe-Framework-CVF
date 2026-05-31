import { describe, expect, it } from "vitest";
import {
  ADAPTATION_POLICY_ENGINE_VERSION,
  checkA1RiskBudget,
  checkA2ConfidenceGating,
  checkA3MultiSignal,
  checkA4Cooldown,
  checkA5TieredAuthority,
  checkA6Rollback,
  checkAdaptationPolicy,
  type AgentAuthorityTier,
} from "../src/index";

describe("CVF Learning Plane Foundation", () => {
  // ─── APE-1 — A1 Risk Budget ───────────────────────────────────────────────

  describe("APE-1 A1 — checkA1RiskBudget", () => {
    it("returns PASS when all percentages within limits", () => {
      const r = checkA1RiskBudget({ proposedRoleChangePct: 5, proposedSpawnPct: 3, proposedRetirementPct: 2 });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A1_RISK_BUDGET");
      expect(r.runtimeAdaptationAuthorized).toBe(false);
    });

    it("returns BLOCK when role changes exceed 10%", () => {
      const r = checkA1RiskBudget({ proposedRoleChangePct: 15, proposedSpawnPct: 2, proposedRetirementPct: 2 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("15%");
    });

    it("returns BLOCK when spawns exceed 5%", () => {
      const r = checkA1RiskBudget({ proposedRoleChangePct: 5, proposedSpawnPct: 8, proposedRetirementPct: 2 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("8%");
    });

    it("returns BLOCK when retirements exceed 5%", () => {
      const r = checkA1RiskBudget({ proposedRoleChangePct: 5, proposedSpawnPct: 3, proposedRetirementPct: 7 });
      expect(r.disposition).toBe("BLOCK");
    });

    it("returns PASS at exact limits", () => {
      const r = checkA1RiskBudget({ proposedRoleChangePct: 10, proposedSpawnPct: 5, proposedRetirementPct: 5 });
      expect(r.disposition).toBe("PASS");
    });
  });

  // ─── APE-1 — A2 Confidence Gating ────────────────────────────────────────

  describe("APE-1 A2 — checkA2ConfidenceGating", () => {
    it("returns PASS when confidence meets default threshold", () => {
      const r = checkA2ConfidenceGating({ score: 0.9, confidence: 0.8 });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A2_CONFIDENCE_GATING");
    });

    it("returns BLOCK when confidence below default threshold 0.7", () => {
      const r = checkA2ConfidenceGating({ score: 0.95, confidence: 0.5 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("0.5");
    });

    it("respects custom confidenceThreshold", () => {
      const r = checkA2ConfidenceGating({ score: 0.9, confidence: 0.6, confidenceThreshold: 0.5 });
      expect(r.disposition).toBe("PASS");
    });

    it("blocks high score with low confidence — no exception for high scores", () => {
      const r = checkA2ConfidenceGating({ score: 1.0, confidence: 0.3 });
      expect(r.disposition).toBe("BLOCK");
    });

    it("always sets runtimeAdaptationAuthorized to false", () => {
      const r = checkA2ConfidenceGating({ score: 0.9, confidence: 0.8 });
      expect(r.runtimeAdaptationAuthorized).toBe(false);
    });
  });

  // ─── APE-1 — A3 Multi-Signal ──────────────────────────────────────────────

  describe("APE-1 A3 — checkA3MultiSignal", () => {
    it("returns PASS with sufficient signals and tasks", () => {
      const r = checkA3MultiSignal({ signalCount: 5, taskCount: 10 });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A3_MULTI_SIGNAL");
    });

    it("returns BLOCK when signal count below minimum 3", () => {
      const r = checkA3MultiSignal({ signalCount: 2, taskCount: 10 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("2 signal");
    });

    it("returns BLOCK when task count below minimum 5", () => {
      const r = checkA3MultiSignal({ signalCount: 4, taskCount: 3 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("3 task");
    });

    it("respects custom minimums", () => {
      const r = checkA3MultiSignal({ signalCount: 2, taskCount: 3, minSignals: 2, minTasks: 3 });
      expect(r.disposition).toBe("PASS");
    });
  });

  // ─── APE-1 — A4 Cooldown ─────────────────────────────────────────────────

  describe("APE-1 A4 — checkA4Cooldown", () => {
    it("returns PASS when not in cooldown and sufficient executions", () => {
      const r = checkA4Cooldown({ inCooldown: false, executionsSinceLastChange: 15 });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A4_COOLDOWN");
    });

    it("returns BLOCK when explicitly in cooldown", () => {
      const r = checkA4Cooldown({ inCooldown: true, executionsSinceLastChange: 5 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("cooldown");
    });

    it("returns ADVISORY when not in cooldown but under execution minimum", () => {
      const r = checkA4Cooldown({ inCooldown: false, executionsSinceLastChange: 4 });
      expect(r.disposition).toBe("ADVISORY");
      expect(r.reason).toContain("4/10");
    });

    it("respects custom minExecutionsRequired", () => {
      const r = checkA4Cooldown({ inCooldown: false, executionsSinceLastChange: 3, minExecutionsRequired: 3 });
      expect(r.disposition).toBe("PASS");
    });
  });

  // ─── APE-1 — A5 Tiered Authority ─────────────────────────────────────────

  describe("APE-1 A5 — checkA5TieredAuthority", () => {
    it("returns PASS for standard tier transition with sufficient evidence", () => {
      const r = checkA5TieredAuthority({ currentTier: 1, proposedTier: 2 });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A5_TIERED_AUTHORITY");
    });

    it("blocks Tier 3 demotion without sufficient failures", () => {
      const r = checkA5TieredAuthority({ currentTier: 3, proposedTier: 2, confirmedFailures: 1, failureTimePeriodsCount: 1 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("Tier 3");
    });

    it("allows Tier 3 demotion with ≥3 failures across ≥2 periods", () => {
      const r = checkA5TieredAuthority({ currentTier: 3, proposedTier: 2, confirmedFailures: 4, failureTimePeriodsCount: 3 });
      expect(r.disposition).toBe("PASS");
    });

    it("blocks Tier 0 fast promotion without sustained evidence", () => {
      const r = checkA5TieredAuthority({ currentTier: 0, proposedTier: 1, sustainedEvidenceCount: 5 });
      expect(r.disposition).toBe("BLOCK");
      expect(r.reason).toContain("Tier 0");
    });

    it("allows Tier 0 promotion with ≥10 sustained evidence", () => {
      const r = checkA5TieredAuthority({ currentTier: 0, proposedTier: 1, sustainedEvidenceCount: 12 });
      expect(r.disposition).toBe("PASS");
    });

    it("always sets runtimeAdaptationAuthorized to false", () => {
      const r = checkA5TieredAuthority({ currentTier: 1, proposedTier: 2 });
      expect(r.runtimeAdaptationAuthorized).toBe(false);
    });
  });

  // ─── APE-1 — A6 Rollback ─────────────────────────────────────────────────

  describe("APE-1 A6 — checkA6Rollback", () => {
    it("returns PASS when no rollback triggers", () => {
      const r = checkA6Rollback({ obfOverallSignal: "OK", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false });
      expect(r.disposition).toBe("PASS");
      expect(r.constraintId).toBe("A6_ROLLBACK");
    });

    it("returns ADVISORY when OFB-1 overallSignal is ESCALATE", () => {
      const r = checkA6Rollback({ obfOverallSignal: "ESCALATE", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false });
      expect(r.disposition).toBe("ADVISORY");
      expect(r.reason).toContain("ESCALATE");
    });

    it("returns ADVISORY when performance degraded after adaptation", () => {
      const r = checkA6Rollback({ performanceDegradedAfterAdaptation: true, unexpectedFailureSpike: false });
      expect(r.disposition).toBe("ADVISORY");
      expect(r.reason).toContain("performance degraded");
    });

    it("returns ADVISORY when unexpected failure spike", () => {
      const r = checkA6Rollback({ performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: true });
      expect(r.disposition).toBe("ADVISORY");
      expect(r.reason).toContain("failure spike");
    });

    it("always sets runtimeAdaptationAuthorized to false", () => {
      const r = checkA6Rollback({ performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false });
      expect(r.runtimeAdaptationAuthorized).toBe(false);
    });
  });

  // ─── APE-1 — Composite checkAdaptationPolicy ─────────────────────────────

  describe("APE-1 — checkAdaptationPolicy (composite)", () => {
    const passingInput = {
      a1: { proposedRoleChangePct: 5, proposedSpawnPct: 2, proposedRetirementPct: 2 },
      a2: { score: 0.8, confidence: 0.9 },
      a3: { signalCount: 5, taskCount: 8 },
      a4: { inCooldown: false, executionsSinceLastChange: 15 },
      a5: { currentTier: 1 as AgentAuthorityTier, proposedTier: 2 as AgentAuthorityTier },
      a6: { obfOverallSignal: "OK" as const, performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
    };

    it("returns overall PASS when all constraints pass", () => {
      const r = checkAdaptationPolicy(passingInput);
      expect(r.overallDisposition).toBe("PASS");
      expect(r.blockedConstraints).toHaveLength(0);
      expect(r.advisoryConstraints).toHaveLength(0);
      expect(r.activationPrerequisiteSatisfied).toBe(true);
    });

    it("returns overall BLOCK when any constraint is BLOCK", () => {
      const r = checkAdaptationPolicy({
        ...passingInput,
        a1: { proposedRoleChangePct: 50, proposedSpawnPct: 2, proposedRetirementPct: 2 },
      });
      expect(r.overallDisposition).toBe("BLOCK");
      expect(r.blockedConstraints).toContain("A1_RISK_BUDGET");
      expect(r.activationPrerequisiteSatisfied).toBe(false);
    });

    it("returns overall ADVISORY when advisory but no BLOCK", () => {
      const r = checkAdaptationPolicy({
        ...passingInput,
        a6: { obfOverallSignal: "ESCALATE", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
      });
      expect(r.overallDisposition).toBe("ADVISORY");
      expect(r.advisoryConstraints).toContain("A6_ROLLBACK");
      expect(r.activationPrerequisiteSatisfied).toBe(true);
    });

    it("BLOCK takes precedence over ADVISORY", () => {
      const r = checkAdaptationPolicy({
        ...passingInput,
        a1: { proposedRoleChangePct: 50, proposedSpawnPct: 2, proposedRetirementPct: 2 },
        a6: { obfOverallSignal: "ESCALATE", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
      });
      expect(r.overallDisposition).toBe("BLOCK");
    });

    it("returns 6 constraint results", () => {
      const r = checkAdaptationPolicy(passingInput);
      expect(r.constraints).toHaveLength(6);
    });

    it("contractVersion matches ADAPTATION_POLICY_ENGINE_VERSION", () => {
      const r = checkAdaptationPolicy(passingInput);
      expect(r.contractVersion).toBe(ADAPTATION_POLICY_ENGINE_VERSION);
      expect(r.contractVersion).toBe("cvf.adaptationPolicyEngine.ape1.v1");
    });

    it("runtimeAdaptationAuthorized is always false", () => {
      const r = checkAdaptationPolicy(passingInput);
      expect(r.runtimeAdaptationAuthorized).toBe(false);
      r.constraints.forEach((c) => expect(c.runtimeAdaptationAuthorized).toBe(false));
    });
  });
});
