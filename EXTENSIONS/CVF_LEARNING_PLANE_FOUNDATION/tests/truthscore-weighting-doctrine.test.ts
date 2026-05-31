import { describe, expect, it } from "vitest";
import {
  WEIGHTING_DOCTRINE_VERSION,
  WEIGHTING_DOCTRINE_CONFIDENCE_GATE,
  WEIGHTING_DOCTRINE_WEIGHTS,
  applyWeightingDoctrine,
} from "../src/index";
import { TruthModelContract } from "../src/truth.model.contract";
import type { PatternInsight } from "../src/index";

const FIXED_NOW = "2026-05-31T00:00:00.000Z";

function makeInsight(id: string): PatternInsight {
  return {
    insightId: id,
    analyzedAt: FIXED_NOW,
    sourceLedgerId: `ledger-${id}`,
    dominantPattern: "ACCEPT",
    acceptRate: 1.0,
    retryRate: 0,
    escalateRate: 0,
    rejectRate: 0,
    healthSignal: "HEALTHY",
    summary: `Insight ${id} — live ALLOW session`,
    insightHash: `hash-${id}`,
  };
}

function buildModel(insightCount: number) {
  const insights = Array.from({ length: insightCount }, (_, i) =>
    makeInsight(`i${i + 1}`)
  );
  return new TruthModelContract({ now: () => FIXED_NOW }).build(insights);
}

describe("CVF Learning Plane Foundation", () => {
  describe("WD1 — applyWeightingDoctrine", () => {
    it("DOCTRINE_APPLIED when confidence ≥ 0.7 (7+ insights)", () => {
      const model = buildModel(7); // confidence = min(7/10, 1.0) = 0.7
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.outcome).toBe("DOCTRINE_APPLIED");
      expect(r.confidenceGateMet).toBe(true);
      expect(r.truthScore.isProvisional).toBe(false);
    });

    it("CONFIDENCE_GATE_NOT_MET when confidence < 0.7 (1 insight)", () => {
      const model = buildModel(1); // confidence = 0.1
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.outcome).toBe("CONFIDENCE_GATE_NOT_MET");
      expect(r.confidenceGateMet).toBe(false);
      expect(r.truthScore.isProvisional).toBe(true);
    });

    it("DOCTRINE_APPLIED when confidence = 1.0 (10+ insights)", () => {
      const model = buildModel(10); // confidence = min(10/10, 1.0) = 1.0
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.outcome).toBe("DOCTRINE_APPLIED");
      expect(r.truthScore.isProvisional).toBe(false);
    });

    it("exactly at gate boundary (7 insights → confidence=0.7)", () => {
      const model = buildModel(7);
      expect(model.confidenceLevel).toBe(0.7);
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.outcome).toBe("DOCTRINE_APPLIED");
    });

    it("just below gate (6 insights → confidence=0.6)", () => {
      const model = buildModel(6);
      expect(model.confidenceLevel).toBe(0.6);
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.outcome).toBe("CONFIDENCE_GATE_NOT_MET");
      expect(r.truthScore.isProvisional).toBe(true);
    });

    it("runtimeScoringAuthorized is always false", () => {
      const pass = applyWeightingDoctrine(buildModel(7), { now: () => FIXED_NOW });
      const fail = applyWeightingDoctrine(buildModel(1), { now: () => FIXED_NOW });
      expect(pass.runtimeScoringAuthorized).toBe(false);
      expect(fail.runtimeScoringAuthorized).toBe(false);
    });

    it("contractVersion matches WEIGHTING_DOCTRINE_VERSION", () => {
      const r = applyWeightingDoctrine(buildModel(7), { now: () => FIXED_NOW });
      expect(r.contractVersion).toBe(WEIGHTING_DOCTRINE_VERSION);
      expect(r.contractVersion).toBe("cvf.truthScoreWeightingDoctrine.wd1.v1");
    });

    it("confidenceGateRequired matches WEIGHTING_DOCTRINE_CONFIDENCE_GATE", () => {
      const r = applyWeightingDoctrine(buildModel(7), { now: () => FIXED_NOW });
      expect(r.confidenceGateRequired).toBe(WEIGHTING_DOCTRINE_CONFIDENCE_GATE);
      expect(r.confidenceGateRequired).toBe(0.7);
    });

    it("WEIGHTING_DOCTRINE_WEIGHTS total is 100", () => {
      expect(
        WEIGHTING_DOCTRINE_WEIGHTS.confidenceMaxPts +
          WEIGHTING_DOCTRINE_WEIGHTS.healthMaxPts +
          WEIGHTING_DOCTRINE_WEIGHTS.trajectoryMaxPts +
          WEIGHTING_DOCTRINE_WEIGHTS.patternMaxPts
      ).toBe(WEIGHTING_DOCTRINE_WEIGHTS.totalMaxPts);
      expect(WEIGHTING_DOCTRINE_WEIGHTS.totalMaxPts).toBe(100);
    });

    it("doctrineNote is non-empty and contextual", () => {
      const applied = applyWeightingDoctrine(buildModel(7), { now: () => FIXED_NOW });
      const notMet = applyWeightingDoctrine(buildModel(1), { now: () => FIXED_NOW });
      expect(applied.doctrineNote).toContain("DOCTRINE_APPLIED".toLowerCase().replace("_"," ") || "doctrine applied");
      expect(notMet.doctrineNote).toContain("PROVISIONAL");
      expect(applied.doctrineNote.length).toBeGreaterThan(0);
      expect(notMet.doctrineNote.length).toBeGreaterThan(0);
    });

    it("truthScore compositeScore is preserved from TruthScoreContract", () => {
      const model = buildModel(7);
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      // 7 insights ACCEPT/HEALTHY/STABLE: confidence=0.7->18, health=25, traj=18, pattern=25 = 86
      expect(r.truthScore.compositeScore).toBe(86);
      expect(r.truthScore.scoreClass).toBe("STRONG");
    });

    it("confidenceLevel is preserved from TruthModel", () => {
      const model = buildModel(7);
      const r = applyWeightingDoctrine(model, { now: () => FIXED_NOW });
      expect(r.confidenceLevel).toBe(0.7);
    });
  });
});
