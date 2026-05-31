import { describe, expect, it } from 'vitest';
import { buildLearningPlaneReadout, LEARNING_PLANE_READOUT_VERSION } from './learning-plane-readout';

describe('buildLearningPlaneReadout', () => {
  it('returns DOCTRINE_APPLIED and isProvisional=false at confidence=0.7', () => {
    const r = buildLearningPlaneReadout('OPERATOR', 0.7);
    expect(r.outcome).toBe('DOCTRINE_APPLIED');
    expect(r.isProvisional).toBe(false);
    expect(r.runtimeScoringAuthorized).toBe(false);
  });

  it('returns CONFIDENCE_GATE_NOT_MET and isProvisional=true below gate', () => {
    const r = buildLearningPlaneReadout('OPERATOR', 0.3);
    expect(r.outcome).toBe('CONFIDENCE_GATE_NOT_MET');
    expect(r.isProvisional).toBe(true);
  });

  it('defaults to confidence=0.7 (LP-LP2 calibrated value)', () => {
    const r = buildLearningPlaneReadout('OPERATOR');
    expect(r.outcome).toBe('DOCTRINE_APPLIED');
    expect(r.isProvisional).toBe(false);
  });

  it('contractVersion matches LEARNING_PLANE_READOUT_VERSION', () => {
    const r = buildLearningPlaneReadout('OPERATOR');
    expect(r.contractVersion).toBe(LEARNING_PLANE_READOUT_VERSION);
    expect(r.contractVersion).toBe('cvf.learningPlaneReadout.wd1.v1');
  });

  it('weights total = 100', () => {
    const r = buildLearningPlaneReadout('OPERATOR');
    expect(r.weights.totalMaxPts).toBe(100);
  });

  it('confidenceGate = 0.7', () => {
    const r = buildLearningPlaneReadout('OPERATOR');
    expect(r.confidenceGate).toBe(0.7);
  });

  it('advisoryNote is non-empty', () => {
    const r = buildLearningPlaneReadout('OPERATOR');
    expect(r.advisoryNote.length).toBeGreaterThan(0);
  });

  it('compositeScore > 0 for healthy single-session insight', () => {
    const r = buildLearningPlaneReadout('BUILDER', 0.7);
    expect(r.compositeScore).toBeGreaterThan(0);
  });
});
