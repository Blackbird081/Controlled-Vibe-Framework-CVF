/**
 * CVF v1.8.1 Adaptive Observability Runtime — Pure Logic Dedicated Tests (W6-T41)
 * =================================================================================
 * GC-023: dedicated file — never merge into v1.8.1.test.ts.
 *
 * Coverage:
 *   computeRisk (governance/adaptive/risk.engine.ts):
 *     - all zero inputs → score=0, severity='low'
 *     - score > 80 → severity='critical'
 *     - score > 60 → severity='high'
 *     - score > 40 → severity='medium'
 *     - score ≤ 40 → severity='low'
 *     - modelShift=true → +10 to score
 *     - cancelRate * 0.25 contribution
 *     - securityFlags * 0.2 contribution
 *   derivePolicy (governance/adaptive/policy.deriver.ts):
 *     - score >= 80 → 'block'
 *     - score >= 60 → 'throttle'
 *     - score >= 40 → 'strict_mode'
 *     - score < 40 → 'normal'
 *     - boundary values: exactly 80, 60, 40, 39
 *   calculateCost (observability/cost.calculator.ts):
 *     - unknown model → 0
 *     - known model (claude-3.5) → tokens * (inputPer1K/1000)
 *     - zero tokens → 0
 *   analyzeSatisfaction (observability/satisfaction.analyzer.ts):
 *     - "không" → 'correction'
 *     - "sửa lại" → 'correction'
 *     - "quên" → 'follow_up'
 *     - "thiếu" → 'follow_up'
 *     - "cảm ơn" → 'satisfied'
 *     - "ok" → 'satisfied'
 *     - unrecognized → 'neutral'
 *   assignABVersion (observability/ab.testing.engine.ts):
 *     - deterministic: same sessionId always returns same version
 *     - even charcode sum → versionA
 *     - odd charcode sum → versionB
 */

import { describe, it, expect } from 'vitest';

import { computeRisk } from '../governance/adaptive/risk.engine.js';
import { derivePolicy } from '../governance/adaptive/policy.deriver.js';
import { calculateCost } from '../observability/cost.calculator.js';
import { analyzeSatisfaction } from '../observability/satisfaction.analyzer.js';
import { assignABVersion } from '../observability/ab.testing.engine.js';

// ─── computeRisk ──────────────────────────────────────────────────────────────

describe('computeRisk', () => {
  it('all zero inputs → score=0, severity=low', () => {
    const result = computeRisk({ cancelRate: 0, correctionRate: 0, tokenSpike: 0, modelShift: false, securityFlags: 0 });
    expect(result.value).toBe(0);
    expect(result.severity).toBe('low');
  });

  it('score > 80 → severity=critical', () => {
    // securityFlags=400 → 400*0.2=80 + cancelRate=25→25*0.25=6.25 → >80
    const result = computeRisk({ cancelRate: 25, correctionRate: 0, tokenSpike: 0, modelShift: false, securityFlags: 400 });
    expect(result.severity).toBe('critical');
    expect(result.value).toBeGreaterThan(80);
  });

  it('score > 60 ≤ 80 → severity=high', () => {
    // cancelRate=200→50, correctionRate=40→10, rest=0 → 60 exactly, need >60
    // cancelRate=220→55, correctionRate=40→10 → 65
    const result = computeRisk({ cancelRate: 220, correctionRate: 40, tokenSpike: 0, modelShift: false, securityFlags: 0 });
    expect(result.severity).toBe('high');
    expect(result.value).toBeGreaterThan(60);
  });

  it('score > 40 ≤ 60 → severity=medium', () => {
    // cancelRate=100→25, correctionRate=60→15, rest=0 → 40 exactly; +modelShift+10=50
    const result = computeRisk({ cancelRate: 100, correctionRate: 60, tokenSpike: 0, modelShift: true, securityFlags: 0 });
    expect(result.severity).toBe('medium');
    expect(result.value).toBeGreaterThan(40);
  });

  it('score ≤ 40 → severity=low', () => {
    const result = computeRisk({ cancelRate: 40, correctionRate: 40, tokenSpike: 0, modelShift: false, securityFlags: 0 });
    // 40*0.25=10, 40*0.25=10 → 20 → low
    expect(result.severity).toBe('low');
    expect(result.value).toBeLessThanOrEqual(40);
  });

  it('modelShift=true adds 10 to score', () => {
    const without = computeRisk({ cancelRate: 0, correctionRate: 0, tokenSpike: 0, modelShift: false, securityFlags: 0 });
    const with_ = computeRisk({ cancelRate: 0, correctionRate: 0, tokenSpike: 0, modelShift: true, securityFlags: 0 });
    expect(with_.value - without.value).toBe(10);
  });

  it('cancelRate * 0.25 contributes to score', () => {
    const result = computeRisk({ cancelRate: 100, correctionRate: 0, tokenSpike: 0, modelShift: false, securityFlags: 0 });
    expect(result.value).toBeCloseTo(25);
  });

  it('securityFlags * 0.2 contributes to score', () => {
    const result = computeRisk({ cancelRate: 0, correctionRate: 0, tokenSpike: 0, modelShift: false, securityFlags: 100 });
    expect(result.value).toBeCloseTo(20);
  });
});

// ─── derivePolicy ─────────────────────────────────────────────────────────────

describe('derivePolicy', () => {
  it('score >= 80 → block', () => {
    expect(derivePolicy(80)).toBe('block');
    expect(derivePolicy(100)).toBe('block');
  });

  it('score exactly 80 → block', () => {
    expect(derivePolicy(80)).toBe('block');
  });

  it('score >= 60 and < 80 → throttle', () => {
    expect(derivePolicy(60)).toBe('throttle');
    expect(derivePolicy(79)).toBe('throttle');
  });

  it('score exactly 60 → throttle', () => {
    expect(derivePolicy(60)).toBe('throttle');
  });

  it('score >= 40 and < 60 → strict_mode', () => {
    expect(derivePolicy(40)).toBe('strict_mode');
    expect(derivePolicy(59)).toBe('strict_mode');
  });

  it('score exactly 40 → strict_mode', () => {
    expect(derivePolicy(40)).toBe('strict_mode');
  });

  it('score < 40 → normal', () => {
    expect(derivePolicy(0)).toBe('normal');
    expect(derivePolicy(39)).toBe('normal');
  });
});

// ─── calculateCost ────────────────────────────────────────────────────────────

describe('calculateCost', () => {
  it('unknown model → returns 0', () => {
    expect(calculateCost('gpt-unknown', 1000)).toBe(0);
  });

  it('zero tokens → returns 0', () => {
    expect(calculateCost('claude-3.5', 0)).toBe(0);
  });

  it('known model (claude-3.5) → tokens * (inputPer1K/1000)', () => {
    // inputPer1K=0.003 → per token = 0.000003
    // 1000 tokens → 0.003
    const cost = calculateCost('claude-3.5', 1000);
    expect(cost).toBeCloseTo(0.003);
  });

  it('calculateCost scales linearly with tokens', () => {
    const cost500 = calculateCost('claude-3.5', 500);
    const cost1000 = calculateCost('claude-3.5', 1000);
    expect(cost1000).toBeCloseTo(cost500 * 2);
  });
});

// ─── analyzeSatisfaction ──────────────────────────────────────────────────────

describe('analyzeSatisfaction', () => {
  it('"không" → correction', () => {
    expect(analyzeSatisfaction('không đúng rồi')).toBe('correction');
  });

  it('"sửa lại" → correction', () => {
    expect(analyzeSatisfaction('hãy sửa lại đi')).toBe('correction');
  });

  it('"quên" → follow_up', () => {
    expect(analyzeSatisfaction('bạn quên mất điều này')).toBe('follow_up');
  });

  it('"thiếu" → follow_up', () => {
    expect(analyzeSatisfaction('còn thiếu phần này')).toBe('follow_up');
  });

  it('"cảm ơn" → satisfied', () => {
    expect(analyzeSatisfaction('cảm ơn bạn nhiều')).toBe('satisfied');
  });

  it('"ok" → satisfied', () => {
    expect(analyzeSatisfaction('ok được rồi')).toBe('satisfied');
  });

  it('unrecognized message → neutral', () => {
    expect(analyzeSatisfaction('hello world')).toBe('neutral');
  });

  it('empty string → neutral', () => {
    expect(analyzeSatisfaction('')).toBe('neutral');
  });
});

// ─── assignABVersion ─────────────────────────────────────────────────────────

describe('assignABVersion', () => {
  it('deterministic: same sessionId always returns same version', () => {
    const v1 = assignABVersion('session-123', 'A', 'B');
    const v2 = assignABVersion('session-123', 'A', 'B');
    expect(v1).toBe(v2);
  });

  it('even charcode sum → versionA', () => {
    // "a" = 97 (odd), "b" = 98 (even), "ab" = 195 (odd), "aa" = 194 (even) → vA
    const result = assignABVersion('aa', 'VersionA', 'VersionB');
    expect(result).toBe('VersionA');
  });

  it('odd charcode sum → versionB', () => {
    // "a" = 97 (odd) → versionB
    const result = assignABVersion('a', 'VersionA', 'VersionB');
    expect(result).toBe('VersionB');
  });

  it('accepts custom version labels', () => {
    const v = assignABVersion('test', 'control', 'experimental');
    expect(['control', 'experimental']).toContain(v);
  });
});
