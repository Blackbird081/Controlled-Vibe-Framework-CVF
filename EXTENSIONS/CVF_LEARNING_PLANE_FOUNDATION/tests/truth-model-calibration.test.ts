import { describe, expect, it } from "vitest";
import {
  TRUTH_MODEL_CALIBRATION_VERSION,
  runCalibrationSession,
  type CalibrationSessionInput,
} from "../src/index";
import type { PatternInsight } from "../src/index";
import type { AgentAuthorityTier } from "../src/index";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInsight(id: string, health: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY"): PatternInsight {
  return {
    insightId: id,
    analyzedAt: "2026-05-31T00:00:00.000Z",
    sourceLedgerId: `ledger-${id}`,
    dominantPattern: health === "HEALTHY" ? "ACCEPT" : health === "DEGRADED" ? "MONITOR" : "ESCALATE",
    acceptRate: health === "HEALTHY" ? 0.9 : 0.3,
    retryRate: 0.05,
    escalateRate: health === "CRITICAL" ? 0.7 : 0.05,
    rejectRate: 0,
    healthSignal: health,
    summary: `Pattern insight ${id}`,
    insightHash: `hash-${id}`,
  };
}

const passingPolicy = {
  a1: { proposedRoleChangePct: 5, proposedSpawnPct: 2, proposedRetirementPct: 2 },
  a2: { score: 0.8, confidence: 0.9 },
  a3: { signalCount: 5, taskCount: 8 },
  a4: { inCooldown: false, executionsSinceLastChange: 15 },
  a5: { currentTier: 1 as AgentAuthorityTier, proposedTier: 2 as AgentAuthorityTier },
  a6: { obfOverallSignal: "OK" as const, performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
};

function makeInput(overrides: Partial<CalibrationSessionInput> = {}): CalibrationSessionInput {
  return {
    sessionId: "session-test-001",
    insights: [makeInsight("i1"), makeInsight("i2"), makeInsight("i3")],
    adaptationPolicyInput: passingPolicy,
    ...overrides,
  };
}

// ─── TM1 — Truth Model Calibration ───────────────────────────────────────────

describe("CVF Learning Plane Foundation", () => {
  describe("TM1 — runCalibrationSession", () => {
    it("returns PASS disposition when all APE-1 checks pass and insights present", () => {
      const r = runCalibrationSession(makeInput());
      expect(r.disposition).toBe("PASS");
      expect(r.phase).toBe("COMPLETE");
      expect(r.truthModel).not.toBeNull();
      expect(r.truthScore).not.toBeNull();
    });

    it("returns BLOCK when APE-1 A1 is violated", () => {
      const input = makeInput({
        adaptationPolicyInput: {
          ...passingPolicy,
          a1: { proposedRoleChangePct: 50, proposedSpawnPct: 2, proposedRetirementPct: 2 },
        },
      });
      const r = runCalibrationSession(input);
      expect(r.disposition).toBe("BLOCK");
      expect(r.phase).toBe("PREFLIGHT_CHECK");
      expect(r.truthModel).toBeNull();
      expect(r.truthScore).toBeNull();
      expect(r.preflightBlockedConstraints).toContain("A1_RISK_BUDGET");
    });

    it("returns BLOCK when APE-1 A2 confidence is too low", () => {
      const input = makeInput({
        adaptationPolicyInput: {
          ...passingPolicy,
          a2: { score: 0.9, confidence: 0.1 },
        },
      });
      const r = runCalibrationSession(input);
      expect(r.disposition).toBe("BLOCK");
      expect(r.preflightBlockedConstraints).toContain("A2_CONFIDENCE_GATING");
    });

    it("returns ADVISORY when APE-1 A6 rollback trigger fires but no BLOCK", () => {
      const input = makeInput({
        adaptationPolicyInput: {
          ...passingPolicy,
          a6: { obfOverallSignal: "ESCALATE", performanceDegradedAfterAdaptation: false, unexpectedFailureSpike: false },
        },
      });
      const r = runCalibrationSession(input);
      expect(r.disposition).toBe("ADVISORY");
      expect(r.phase).toBe("COMPLETE");
      expect(r.truthModel).not.toBeNull();
      expect(r.truthScore).not.toBeNull();
      expect(r.preflightDisposition).toBe("ADVISORY");
    });

    it("isProvisional is always true", () => {
      const pass = runCalibrationSession(makeInput());
      const blocked = runCalibrationSession(makeInput({
        adaptationPolicyInput: { ...passingPolicy, a1: { proposedRoleChangePct: 99, proposedSpawnPct: 2, proposedRetirementPct: 2 } },
      }));
      expect(pass.isProvisional).toBe(true);
      expect(blocked.isProvisional).toBe(true);
    });

    it("runtimeCalibrationAuthorized is always false", () => {
      const r = runCalibrationSession(makeInput());
      expect(r.runtimeCalibrationAuthorized).toBe(false);
    });

    it("contractVersion matches TRUTH_MODEL_CALIBRATION_VERSION", () => {
      const r = runCalibrationSession(makeInput());
      expect(r.contractVersion).toBe(TRUTH_MODEL_CALIBRATION_VERSION);
      expect(r.contractVersion).toBe("cvf.truthModelCalibration.tm1.v1");
    });

    it("sessionId is preserved in result", () => {
      const r = runCalibrationSession(makeInput({ sessionId: "my-session-42" }));
      expect(r.sessionId).toBe("my-session-42");
    });

    it("builds truthModel from insights — 3 HEALTHY insights → STRONG or ADEQUATE score", () => {
      const r = runCalibrationSession(makeInput());
      expect(r.truthScore!.compositeScore).toBeGreaterThan(50);
      expect(["STRONG", "ADEQUATE"]).toContain(r.truthScore!.scoreClass);
    });

    it("builds truthModel from empty insights — INSUFFICIENT score", () => {
      const r = runCalibrationSession(makeInput({ insights: [] }));
      expect(r.disposition).toBe("PASS");
      expect(r.truthScore!.scoreClass).toBe("INSUFFICIENT");
    });

    it("advisoryNote is non-empty for all dispositions", () => {
      const pass = runCalibrationSession(makeInput());
      const blocked = runCalibrationSession(makeInput({
        adaptationPolicyInput: { ...passingPolicy, a1: { proposedRoleChangePct: 99, proposedSpawnPct: 2, proposedRetirementPct: 2 } },
      }));
      expect(pass.advisoryNote.length).toBeGreaterThan(0);
      expect(blocked.advisoryNote.length).toBeGreaterThan(0);
    });

    it("BLOCK result has empty preflightBlockedConstraints in pass, populated in block", () => {
      const pass = runCalibrationSession(makeInput());
      expect(pass.preflightBlockedConstraints).toHaveLength(0);

      const blocked = runCalibrationSession(makeInput({
        adaptationPolicyInput: {
          ...passingPolicy,
          a1: { proposedRoleChangePct: 99, proposedSpawnPct: 2, proposedRetirementPct: 2 },
          a3: { signalCount: 0, taskCount: 0 },
        },
      }));
      expect(blocked.preflightBlockedConstraints.length).toBeGreaterThan(0);
    });

    it("deterministic: same input produces same truthScore hash", () => {
      const fixedNow = "2026-05-31T12:00:00.000Z";
      const r1 = runCalibrationSession(makeInput(), { now: () => fixedNow });
      const r2 = runCalibrationSession(makeInput(), { now: () => fixedNow });
      expect(r1.truthScore!.scoreHash).toBe(r2.truthScore!.scoreHash);
    });
  });
});
