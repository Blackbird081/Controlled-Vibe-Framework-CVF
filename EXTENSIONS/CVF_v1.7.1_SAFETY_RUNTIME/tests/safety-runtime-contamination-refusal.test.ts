/**
 * CVF v1.7.1 Safety Runtime — Contamination Guard & Refusal Policy Dedicated Tests (W6-T65)
 * ===========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 contracts):
 *   kernel/03_contamination_guard/risk_scorer.ts:
 *     RiskScorer.scoreText — self_harm/legal/financial/no-risk keywords
 *     RiskScorer.score — empty flags → R0; multi-flag avg scoring
 *   kernel/03_contamination_guard/assumption_tracker.ts:
 *     AssumptionTracker.track — implicit_assumption/confidence_uncertainty/both/clean
 *   kernel/03_contamination_guard/drift_detector.ts:
 *     DriftDetector.detect — no-drift; domain_drift; risk_jump; combined
 *   kernel/03_contamination_guard/risk_propagation_engine.ts:
 *     RiskPropagationEngine.propagate — baseline passthrough; +assumption escalates;
 *     +drift escalates; both escalate capped at R4
 *   kernel/04_refusal_router/refusal_policy_registry.ts:
 *     RefusalPolicyRegistry.get — v1 profile; unknown version throws
 *     RefusalPolicyRegistry.latestVersion — returns 'v1'
 *   kernel/04_refusal_router/refusal_policy.ts:
 *     RefusalPolicy.decide — R0→allow; R3→needs_approval; R4→block;
 *     R4+FREEZE→needs_approval; R2+drift→clarify; R2 no-signal→allow
 */

import { describe, it, expect } from 'vitest';

import { RiskScorer } from '../kernel-architecture/kernel/03_contamination_guard/risk_scorer';
import { AssumptionTracker } from '../kernel-architecture/kernel/03_contamination_guard/assumption_tracker';
import { DriftDetector } from '../kernel-architecture/kernel/03_contamination_guard/drift_detector';
import { RiskPropagationEngine } from '../kernel-architecture/kernel/03_contamination_guard/risk_propagation_engine';
import { RefusalPolicyRegistry } from '../kernel-architecture/kernel/04_refusal_router/refusal_policy_registry';
import { RefusalPolicy } from '../kernel-architecture/kernel/04_refusal_router/refusal_policy';

// ─── RiskScorer ───────────────────────────────────────────────────────────────

describe('RiskScorer', () => {
  const scorer = new RiskScorer();

  it('scoreText with "suicide" → self_harm flag → R4 critical (score 95)', () => {
    const result = scorer.scoreText('I want to commit suicide');
    expect(result.cvfRiskLevel).toBe('R4');
    expect(result.level).toBe('critical');
    expect(result.score).toBe(95);
    expect(result.reasons).toContain('self_harm');
  });

  it('scoreText with "lawsuit" → legal flag → R3 high (score 75)', () => {
    const result = scorer.scoreText('I need legal advice about a lawsuit');
    expect(result.cvfRiskLevel).toBe('R3');
    expect(result.level).toBe('high');
    expect(result.score).toBe(75);
    expect(result.reasons).toContain('legal');
  });

  it('scoreText with "invest" → financial flag → R2 medium (score 70)', () => {
    const result = scorer.scoreText('I want to start a trading strategy');
    expect(result.cvfRiskLevel).toBe('R2');
    expect(result.level).toBe('medium');
    expect(result.score).toBe(70);
    expect(result.reasons).toContain('financial');
  });

  it('scoreText with no risk keywords → R0 low (score 0)', () => {
    const result = scorer.scoreText('What is the weather today?');
    expect(result.cvfRiskLevel).toBe('R0');
    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('score([]) → R0 with score 0 and empty reasons', () => {
    const result = scorer.score([]);
    expect(result.cvfRiskLevel).toBe('R0');
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('score([self_harm, legal]) → avg (95+75)/2=85 → R3 high', () => {
    const result = scorer.score(['self_harm', 'legal']);
    expect(result.cvfRiskLevel).toBe('R3');
    expect(result.level).toBe('high');
    expect(result.score).toBe(85);
    expect(result.reasons).toEqual(['self_harm', 'legal']);
  });
});

// ─── AssumptionTracker ────────────────────────────────────────────────────────

describe('AssumptionTracker', () => {
  const tracker = new AssumptionTracker();

  it('"I assume" text → returns [implicit_assumption]', () => {
    const result = tracker.track('I assume this will work correctly');
    expect(result).toContain('implicit_assumption');
    expect(result).not.toContain('confidence_uncertainty');
  });

  it('"can\'t guarantee" text → returns [confidence_uncertainty]', () => {
    const result = tracker.track("I can't guarantee this is accurate");
    expect(result).toContain('confidence_uncertainty');
    expect(result).not.toContain('implicit_assumption');
  });

  it('text with both patterns → returns both flags', () => {
    const result = tracker.track("I assume this is right but can't guarantee it");
    expect(result).toContain('implicit_assumption');
    expect(result).toContain('confidence_uncertainty');
  });

  it('clean text with no assumption patterns → returns empty array', () => {
    const result = tracker.track('The sky is blue and water is wet');
    expect(result).toHaveLength(0);
  });
});

// ─── DriftDetector ───────────────────────────────────────────────────────────

describe('DriftDetector', () => {
  const detector = new DriftDetector();

  it('same domain, no previous risk → no drift detected', () => {
    const result = detector.detect({
      declaredDomain: 'informational',
      classifiedDomain: 'informational',
      currentRisk: 'R1',
    });
    expect(result.detected).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('domain mismatch → domain_drift detected', () => {
    const result = detector.detect({
      declaredDomain: 'informational',
      classifiedDomain: 'creative',
      currentRisk: 'R1',
    });
    expect(result.detected).toBe(true);
    expect(result.reasons).toContain('domain_drift');
  });

  it('risk jump of >=2 levels (R0→R2) → risk_jump detected', () => {
    const result = detector.detect({
      declaredDomain: 'informational',
      classifiedDomain: 'informational',
      previousRisk: 'R0',
      currentRisk: 'R2',
    });
    expect(result.detected).toBe(true);
    expect(result.reasons).toContain('risk_jump');
  });

  it('domain mismatch + risk jump → both reasons in result', () => {
    const result = detector.detect({
      declaredDomain: 'informational',
      classifiedDomain: 'creative',
      previousRisk: 'R0',
      currentRisk: 'R3',
    });
    expect(result.detected).toBe(true);
    expect(result.reasons).toContain('domain_drift');
    expect(result.reasons).toContain('risk_jump');
  });
});

// ─── RiskPropagationEngine ───────────────────────────────────────────────────

describe('RiskPropagationEngine', () => {
  const engine = new RiskPropagationEngine();

  const baseR0 = { level: 'low' as const, cvfRiskLevel: 'R0' as const, score: 0, reasons: [] };
  const baseR2 = { level: 'medium' as const, cvfRiskLevel: 'R2' as const, score: 55, reasons: ['financial'] };

  it('base R0, no assumptions, no drift → passthrough R0', () => {
    const result = engine.propagate(baseR0, [], false);
    expect(result.cvfRiskLevel).toBe('R0');
    expect(result.score).toBe(0);
    expect(result.driftDetected).toBe(false);
    expect(result.assumptions).toHaveLength(0);
  });

  it('base R0, with 1 assumption → escalates to R1', () => {
    const result = engine.propagate(baseR0, ['implicit_assumption'], false);
    expect(result.cvfRiskLevel).toBe('R1');
    expect(result.score).toBe(5);
    expect(result.reasons).toContain('implicit_assumption');
  });

  it('base R0, drift detected → escalates to R1', () => {
    const result = engine.propagate(baseR0, [], true);
    expect(result.cvfRiskLevel).toBe('R1');
    expect(result.score).toBe(10);
    expect(result.driftDetected).toBe(true);
    expect(result.reasons).toContain('drift_detected');
  });

  it('base R2, assumptions + drift → escalates to R4', () => {
    const result = engine.propagate(baseR2, ['implicit_assumption'], true);
    expect(result.cvfRiskLevel).toBe('R4');
    expect(result.level).toBe('critical');
    expect(result.reasons).toContain('financial');
    expect(result.reasons).toContain('implicit_assumption');
    expect(result.reasons).toContain('drift_detected');
  });
});

// ─── RefusalPolicyRegistry ───────────────────────────────────────────────────

describe('RefusalPolicyRegistry', () => {
  const registry = new RefusalPolicyRegistry();

  it('latestVersion() → "v1"', () => {
    expect(registry.latestVersion()).toBe('v1');
  });

  it('get("v1") → returns policy profile with R0=allow, R4=block', () => {
    const profile = registry.get('v1');
    expect(profile.version).toBe('v1');
    expect(profile.baselineByRisk.R0).toBe('allow');
    expect(profile.baselineByRisk.R4).toBe('block');
    expect(profile.clarifyOnSignalsAtR2).toBe(true);
    expect(profile.freezeR4Action).toBe('needs_approval');
  });

  it('get("unknown") → throws "Unknown refusal policy version: unknown"', () => {
    expect(() => registry.get('unknown')).toThrow('Unknown refusal policy version: unknown');
  });
});

// ─── RefusalPolicy ───────────────────────────────────────────────────────────

describe('RefusalPolicy', () => {
  it('R0 → "allow"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R0')).toBe('allow');
  });

  it('R3 → "needs_approval"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R3')).toBe('needs_approval');
  });

  it('R4 (no context) → "block"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R4')).toBe('block');
  });

  it('R4 + phase=FREEZE → "needs_approval"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R4', { phase: 'FREEZE' })).toBe('needs_approval');
  });

  it('R2 + driftDetected=true → "clarify"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R2', { driftDetected: true })).toBe('clarify');
  });

  it('R2 + no drift/clarification signal → baseline "allow"', () => {
    const policy = new RefusalPolicy();
    expect(policy.decide('R2')).toBe('allow');
  });
});
