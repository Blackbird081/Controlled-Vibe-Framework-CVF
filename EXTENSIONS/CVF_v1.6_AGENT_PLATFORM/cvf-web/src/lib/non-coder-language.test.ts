/**
 * Non-Coder Language Adapter — Tests
 * Track 2: Friendly language for non-coder users
 */

import { describe, test, expect } from 'vitest';
import {
  getFriendlyRiskLabel,
  getFriendlyPhaseLabel,
  getFriendlyEnforcementLabel,
  humanizeError,
  getFriendlyQualityLabel,
  getFriendlyQualityHint,
  isNonCoderMode,
  setNonCoderMode,
} from './non-coder-language';

// ═══════════════════════════════════════════════════════════════════════
// Risk Labels
// ═══════════════════════════════════════════════════════════════════════

describe('getFriendlyRiskLabel', () => {
  test('R0 shows green safe', () => {
    const r = getFriendlyRiskLabel('R0', 'en');
    expect(r.color).toBe('green');
    expect(r.emoji).toBe('🟢');
    expect(r.label).toBe('Safe');
  });

  test('R0 Vietnamese', () => {
    const r = getFriendlyRiskLabel('R0', 'vi');
    expect(r.label).toBe('An toàn');
  });

  test('R1 shows yellow', () => {
    expect(getFriendlyRiskLabel('R1', 'en').color).toBe('yellow');
  });

  test('R2 shows orange', () => {
    expect(getFriendlyRiskLabel('R2', 'en').color).toBe('orange');
  });

  test('R3 shows red', () => {
    expect(getFriendlyRiskLabel('R3', 'en').color).toBe('red');
  });

  test('unknown defaults to R0', () => {
    expect(getFriendlyRiskLabel('UNKNOWN', 'en').color).toBe('green');
  });

  test('handles lowercase input', () => {
    expect(getFriendlyRiskLabel('r2', 'en').color).toBe('orange');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Phase Labels
// ═══════════════════════════════════════════════════════════════════════

describe('getFriendlyPhaseLabel', () => {
  test('BUILD shows working on it', () => {
    const r = getFriendlyPhaseLabel('BUILD', 'en');
    expect(r.label).toBe('Working on it');
    expect(r.emoji).toBe('🔨');
  });

  test('DISCOVERY Vietnamese', () => {
    const r = getFriendlyPhaseLabel('DISCOVERY', 'vi');
    expect(r.label).toBe('Tìm hiểu yêu cầu');
  });

  test('Phase A alias maps to DISCOVERY', () => {
    expect(getFriendlyPhaseLabel('Phase A', 'en').label).toBe('Understanding your needs');
  });

  test('C alias maps to BUILD', () => {
    expect(getFriendlyPhaseLabel('C', 'en').label).toBe('Working on it');
  });

  test('D alias maps to REVIEW', () => {
    expect(getFriendlyPhaseLabel('D', 'en').label).toBe('Quality check');
  });

  test('unknown defaults to BUILD', () => {
    expect(getFriendlyPhaseLabel('UNKNOWN', 'en').label).toBe('Working on it');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Enforcement Labels
// ═══════════════════════════════════════════════════════════════════════

describe('getFriendlyEnforcementLabel', () => {
  test('ALLOW is invisible', () => {
    const r = getFriendlyEnforcementLabel('ALLOW', 'en');
    expect(r.visible).toBe(false);
    expect(r.label).toBe('');
  });

  test('BLOCK shows adjusting', () => {
    const r = getFriendlyEnforcementLabel('BLOCK', 'en');
    expect(r.visible).toBe(true);
    expect(r.label).toBe('Adjusting');
  });

  test('CLARIFY shows more details needed', () => {
    const r = getFriendlyEnforcementLabel('CLARIFY', 'en');
    expect(r.visible).toBe(true);
    expect(r.label).toContain('details');
  });

  test('NEEDS_APPROVAL shows quick check', () => {
    const r = getFriendlyEnforcementLabel('NEEDS_APPROVAL', 'en');
    expect(r.visible).toBe(true);
  });

  test('ESCALATE shows confirmation needed', () => {
    const r = getFriendlyEnforcementLabel('ESCALATE', 'vi');
    expect(r.visible).toBe(true);
    expect(r.label).toBe('Cần xác nhận');
  });

  test('unknown defaults to ALLOW (invisible)', () => {
    expect(getFriendlyEnforcementLabel('UNKNOWN', 'en').visible).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Error Humanization
// ═══════════════════════════════════════════════════════════════════════

describe('humanizeError', () => {
  test('budget exceeded', () => {
    const r = humanizeError('Budget exceeded', 'en');
    expect(r).toContain('efficient');
  });

  test('budget exceeded Vietnamese', () => {
    const r = humanizeError('Budget exceeded', 'vi');
    expect(r).toContain('hiệu quả');
  });

  test('CVF policy block', () => {
    const r = humanizeError('Execution blocked by CVF policy.', 'en');
    expect(r).toContain('information');
  });

  test('spec clarification', () => {
    const r = humanizeError('Spec needs clarification before execution.', 'en');
    expect(r).toContain('details');
  });

  test('safety filters', () => {
    const r = humanizeError('Request blocked by safety filters.', 'en');
    expect(r).toContain('rephrase');
  });

  test('rate limit', () => {
    const r = humanizeError('Too many requests. Please slow down.', 'en');
    expect(r).toContain('moment');
  });

  test('approval required', () => {
    const r = humanizeError('Human approval required before execution.', 'en');
    expect(r).toContain('check');
  });

  test('unauthorized', () => {
    const r = humanizeError('Unauthorized: please login.', 'en');
    expect(r).toContain('log in');
  });

  test('API key not configured', () => {
    const r = humanizeError('API key not configured for provider: openai.', 'en');
    expect(r).toContain('Settings');
  });

  test('unknown error gets generic fallback', () => {
    const r = humanizeError('Some random error XYZ', 'en');
    expect(r).toContain('try again');
  });

  test('unknown error Vietnamese fallback', () => {
    const r = humanizeError('Some random error', 'vi');
    expect(r).toContain('thử lại');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Quality Labels
// ═══════════════════════════════════════════════════════════════════════

describe('getFriendlyQualityLabel', () => {
  test('score 95 shows excellent', () => {
    const r = getFriendlyQualityLabel(95, 'en');
    expect(r.emoji).toBe('⭐');
    expect(r.color).toBe('green');
    expect(r.label).toContain('Excellent');
  });

  test('score 80 shows good', () => {
    const r = getFriendlyQualityLabel(80, 'en');
    expect(r.emoji).toBe('✅');
    expect(r.label).toContain('Good');
  });

  test('score 65 shows decent', () => {
    const r = getFriendlyQualityLabel(65, 'en');
    expect(r.emoji).toBe('💡');
    expect(r.label).toContain('Decent');
  });

  test('score 40 shows improving', () => {
    const r = getFriendlyQualityLabel(40, 'en');
    expect(r.emoji).toBe('🔄');
  });

  test('score 90 boundary is excellent', () => {
    expect(getFriendlyQualityLabel(90, 'en').emoji).toBe('⭐');
  });

  test('score 75 boundary is good', () => {
    expect(getFriendlyQualityLabel(75, 'en').emoji).toBe('✅');
  });

  test('score 60 boundary is decent', () => {
    expect(getFriendlyQualityLabel(60, 'en').emoji).toBe('💡');
  });

  test('Vietnamese labels', () => {
    expect(getFriendlyQualityLabel(95, 'vi').label).toContain('Xuất sắc');
    expect(getFriendlyQualityLabel(80, 'vi').label).toContain('Tốt');
  });
});

describe('getFriendlyQualityHint', () => {
  test('excellent hint', () => {
    expect(getFriendlyQualityHint('excellent', 'en').emoji).toBe('⭐');
  });

  test('good hint', () => {
    expect(getFriendlyQualityHint('good', 'en').emoji).toBe('✅');
  });

  test('decent hint', () => {
    expect(getFriendlyQualityHint('decent', 'en').emoji).toBe('💡');
  });

  test('needs_improvement hint', () => {
    expect(getFriendlyQualityHint('needs_improvement', 'en').emoji).toBe('🔄');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Non-Coder Mode
// ═══════════════════════════════════════════════════════════════════════

describe('isNonCoderMode / setNonCoderMode', () => {
  test('defaults to true', () => {
    expect(isNonCoderMode()).toBe(true);
  });

  test('can be toggled', () => {
    setNonCoderMode(false);
    expect(isNonCoderMode()).toBe(false);
    setNonCoderMode(true);
    expect(isNonCoderMode()).toBe(true);
  });
});
