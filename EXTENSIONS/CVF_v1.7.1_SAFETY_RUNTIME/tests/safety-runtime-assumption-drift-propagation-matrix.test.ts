/**
 * CVF v1.7.1 Safety Runtime — AssumptionTracker, DriftDetector,
 * RiskPropagationEngine & Risk Matrix Tests (W6-T83)
 * ===========================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 contracts):
 *   kernel/03_contamination_guard/assumption_tracker.ts:
 *     AssumptionTracker.track — clean text→[]; "assuming"→implicit_assumption;
 *       "not sure"→confidence_uncertainty; both patterns→both tags
 *   kernel/03_contamination_guard/drift_detector.ts:
 *     DriftDetector.detect — matching domains+no-prior→detected=false;
 *       domain-mismatch→domain_drift; risk-jump≥2→risk_jump; both→both reasons
 *   kernel/03_contamination_guard/risk_propagation_engine.ts:
 *     RiskPropagationEngine.propagate — no-signals→unchanged; assumption→+1 level;
 *       drift→+1 level; both→+2 level; R4 capped; score formula
 *   kernel/03_contamination_guard/risk.matrix.ts:
 *     DefaultRiskMatrix — highest-risk categories correct; ordering sanity
 */

import { describe, it, expect } from 'vitest';

import { AssumptionTracker } from '../kernel-architecture/kernel/03_contamination_guard/assumption_tracker';
import { DriftDetector } from '../kernel-architecture/kernel/03_contamination_guard/drift_detector';
import { RiskPropagationEngine } from '../kernel-architecture/kernel/03_contamination_guard/risk_propagation_engine';
import { DefaultRiskMatrix } from '../kernel-architecture/kernel/03_contamination_guard/risk.matrix';
import type { RiskAssessment } from '../kernel-architecture/kernel/03_contamination_guard/risk.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    level: 'low',
    cvfRiskLevel: 'R0',
    score: 0,
    reasons: [],
    ...overrides,
  };
}

// ─── AssumptionTracker ────────────────────────────────────────────────────────

describe('AssumptionTracker.track', () => {
  const tracker = new AssumptionTracker();

  it('clean text → empty array (no assumptions)', () => {
    expect(tracker.track('analyze the data and provide results')).toEqual([]);
  });

  it('"assuming" in text → ["implicit_assumption"]', () => {
    const tags = tracker.track('Assuming the data is correct, I will proceed');
    expect(tags).toContain('implicit_assumption');
  });

  it('"i assume" in text → ["implicit_assumption"]', () => {
    const tags = tracker.track('I assume this is the right approach');
    expect(tags).toContain('implicit_assumption');
  });

  it('"not sure" in text → ["confidence_uncertainty"]', () => {
    const tags = tracker.track("I'm not sure about the exact output");
    expect(tags).toContain('confidence_uncertainty');
  });

  it('both patterns → both tags', () => {
    const tags = tracker.track("Assuming it works, but I'm not sure");
    expect(tags).toContain('implicit_assumption');
    expect(tags).toContain('confidence_uncertainty');
  });
});

// ─── DriftDetector ────────────────────────────────────────────────────────────

describe('DriftDetector.detect', () => {
  const detector = new DriftDetector();

  it('matching domains + no previousRisk → detected=false', () => {
    const signal = detector.detect({
      declaredDomain: 'analytical',
      classifiedDomain: 'analytical',
      currentRisk: 'R1',
    });
    expect(signal.detected).toBe(false);
    expect(signal.reasons).toHaveLength(0);
  });

  it('domain mismatch → detected=true with domain_drift reason', () => {
    const signal = detector.detect({
      declaredDomain: 'analytical',
      classifiedDomain: 'creative',
      currentRisk: 'R1',
    });
    expect(signal.detected).toBe(true);
    expect(signal.reasons).toContain('domain_drift');
  });

  it('risk jump ≥ 2 levels → detected=true with risk_jump reason', () => {
    const signal = detector.detect({
      declaredDomain: 'analytical',
      classifiedDomain: 'analytical',
      previousRisk: 'R0',
      currentRisk: 'R2', // jump of 2
    });
    expect(signal.detected).toBe(true);
    expect(signal.reasons).toContain('risk_jump');
  });

  it('risk jump of 1 → NOT a jump (not detected by risk_jump)', () => {
    const signal = detector.detect({
      declaredDomain: 'analytical',
      classifiedDomain: 'analytical',
      previousRisk: 'R1',
      currentRisk: 'R2', // jump of 1 — below threshold
    });
    expect(signal.reasons).not.toContain('risk_jump');
  });

  it('domain mismatch + risk jump → both reasons', () => {
    const signal = detector.detect({
      declaredDomain: 'analytical',
      classifiedDomain: 'creative',
      previousRisk: 'R0',
      currentRisk: 'R3',
    });
    expect(signal.detected).toBe(true);
    expect(signal.reasons).toContain('domain_drift');
    expect(signal.reasons).toContain('risk_jump');
  });
});

// ─── RiskPropagationEngine ────────────────────────────────────────────────────

describe('RiskPropagationEngine.propagate', () => {
  const engine = new RiskPropagationEngine();

  it('no assumptions + no drift → level and score unchanged', () => {
    const base = makeAssessment({ cvfRiskLevel: 'R1', score: 20 });
    const result = engine.propagate(base, [], false);
    expect(result.cvfRiskLevel).toBe('R1');
    expect(result.score).toBe(20);
  });

  it('1 assumption → level +1 (R0→R1), score +5', () => {
    const base = makeAssessment({ cvfRiskLevel: 'R0', score: 0 });
    const result = engine.propagate(base, ['implicit_assumption'], false);
    expect(result.cvfRiskLevel).toBe('R1');
    expect(result.score).toBe(5);
  });

  it('drift only → level +1 (R1→R2), score +10, reasons includes "drift_detected"', () => {
    const base = makeAssessment({ cvfRiskLevel: 'R1', score: 10 });
    const result = engine.propagate(base, [], true);
    expect(result.cvfRiskLevel).toBe('R2');
    expect(result.score).toBe(20);
    expect(result.reasons).toContain('drift_detected');
    expect(result.driftDetected).toBe(true);
  });

  it('assumption + drift → level +2 (R0→R2), score +15', () => {
    const base = makeAssessment({ cvfRiskLevel: 'R0', score: 0 });
    const result = engine.propagate(base, ['implicit_assumption'], true);
    expect(result.cvfRiskLevel).toBe('R2');
    expect(result.score).toBe(15);
  });

  it('already R4 + drift → stays at R4 (capped)', () => {
    const base = makeAssessment({ cvfRiskLevel: 'R4', level: 'critical', score: 90 });
    const result = engine.propagate(base, ['assumption'], true);
    expect(result.cvfRiskLevel).toBe('R4');
    expect(result.level).toBe('critical');
  });
});

// ─── DefaultRiskMatrix ────────────────────────────────────────────────────────

describe('DefaultRiskMatrix', () => {
  it('self_harm and weapons are highest risk (95)', () => {
    expect(DefaultRiskMatrix.self_harm).toBe(95);
    expect(DefaultRiskMatrix.weapons).toBe(95);
  });

  it('medical is lower risk than self_harm', () => {
    expect(DefaultRiskMatrix.medical).toBeLessThan(DefaultRiskMatrix.self_harm);
    expect(DefaultRiskMatrix.medical).toBe(80);
  });

  it('misinformation is the lowest category (60)', () => {
    expect(DefaultRiskMatrix.misinformation).toBe(60);
    const values = Object.values(DefaultRiskMatrix);
    expect(Math.min(...values)).toBe(60);
  });
});
