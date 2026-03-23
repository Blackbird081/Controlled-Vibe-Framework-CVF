/**
 * CVF v1.7 Controlled Intelligence — Lessons Registry Dedicated Tests (W6-T51)
 * ==============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   detectConflict (conflict.detector.ts):
 *     - no existing lessons → no conflicts
 *     - different category same description → no conflict
 *     - same category + identical description + different version → EXACT conflict
 *     - same category + high keyword overlap → SIMILAR conflict
 *     - same rootCause across different categories → ROOT-CAUSE conflict
 *   signLesson / verifyLesson / signAndAttach / verifySignedLesson (lesson.signing.ts):
 *     - signLesson returns 8-char hex string
 *     - same lesson → same signature (deterministic)
 *     - different field → different signature
 *     - verifyLesson: correct sig → true, wrong sig → false
 *     - signAndAttach: _signature field present
 *     - verifySignedLesson: signed→valid, unsigned→invalid, tampered→invalid
 *   registerRuleVersion / getRuleHistory (rule.versioning.ts):
 *     - registered versions appear in getRuleHistory for that ruleId
 *     - getRuleHistory for unknown ruleId → empty
 *     - previousVersion preserved in history
 *     - multiple rules don't cross-pollinate
 *   registerLesson / getActiveLessons / deactivateLesson (lesson.store.ts):
 *     - active lessons returned, inactive excluded
 *     - deactivateLesson removes lesson from active set
 */

import { beforeAll, describe, it, expect } from 'vitest';

import { detectConflict } from './conflict.detector.js';
import { signLesson, verifyLesson, signAndAttach, verifySignedLesson } from './lesson.signing.js';
import { registerRuleVersion, getRuleHistory } from './rule.versioning.js';
import { registerLesson, getActiveLessons, deactivateLesson } from './lesson.store.js';
import type { Lesson } from './lesson.schema.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-001',
    version: '1.0',
    category: 'REASONING',
    description: 'Avoid recursive reasoning loops',
    active: true,
    createdAt: 1000,
    severity: 'medium',
    rootCause: 'unbounded recursion',
    preventionRule: 'limit depth to 3',
    riskLevel: 'R2',
    ...overrides,
  };
}

// ─── File-level setup ─────────────────────────────────────────────────────────
// Use timestamp-based unique IDs to avoid disk persistence collisions across
// test runs (lesson.store writes to cvf_lessons.json and loads at module init).

const _ts = Date.now();
const ID_L1 = `store-L1-${_ts}`;
const ID_L2 = `store-L2-${_ts}`;
const ID_L3 = `store-L3-${_ts}`;

beforeAll(() => {
  // lesson.store: 2 active, 1 inactive (unique IDs per test run)
  registerLesson(makeLesson({ id: ID_L1, active: true }));
  registerLesson(makeLesson({ id: ID_L2, category: 'RISK', active: true }));
  registerLesson(makeLesson({ id: ID_L3, category: 'POLICY', active: false }));

  // rule.versioning: rule-A has 2 versions, rule-B has 1
  registerRuleVersion('rule-A', '1.0');
  registerRuleVersion('rule-A', '1.1', '1.0');
  registerRuleVersion('rule-B', '2.0');
});

// ─── detectConflict ───────────────────────────────────────────────────────────

describe('detectConflict', () => {
  it('no existing lessons → no conflicts', () => {
    const result = detectConflict(makeLesson(), []);
    expect(result).toHaveLength(0);
  });

  it('different category, different rootCause → no conflict', () => {
    const existing = makeLesson({ id: 'e1', category: 'RISK', version: '0.9', rootCause: 'different-root' });
    const newLesson = makeLesson({ id: 'n1', category: 'REASONING', rootCause: 'another-root' });
    const result = detectConflict(newLesson, [existing]);
    expect(result).toHaveLength(0);
  });

  it('same category + identical description + different version → EXACT conflict', () => {
    const existing = makeLesson({ id: 'e2', category: 'REASONING', version: '0.9' });
    const newLesson = makeLesson({ id: 'n2', category: 'REASONING', version: '1.0' });
    const result = detectConflict(newLesson, [existing]);
    expect(result.some((c) => c.includes('EXACT'))).toBe(true);
  });

  it('same category + high keyword overlap → SIMILAR conflict', () => {
    const existing = makeLesson({
      id: 'e3',
      version: '0.8',
      description: 'Avoid recursive reasoning loops in agent',
    });
    const newLesson = makeLesson({
      id: 'n3',
      version: '1.0',
      description: 'Avoid recursive reasoning loops in system',
    });
    const result = detectConflict(newLesson, [existing]);
    expect(result.some((c) => c.includes('SIMILAR') || c.includes('EXACT'))).toBe(true);
  });

  it('same rootCause across different categories → ROOT-CAUSE conflict', () => {
    const existing = makeLesson({
      id: 'e4',
      category: 'RISK',
      description: 'Risk analysis needed',
      rootCause: 'unbounded recursion',
    });
    const newLesson = makeLesson({
      id: 'n4',
      category: 'REASONING',
      description: 'Check reasoning depth',
      rootCause: 'unbounded recursion',
    });
    const result = detectConflict(newLesson, [existing]);
    expect(result.some((c) => c.includes('ROOT-CAUSE'))).toBe(true);
  });

  it('no matching conflicts → empty array', () => {
    const existing = makeLesson({
      id: 'e5',
      category: 'ROLE',
      description: 'Role assignment validation',
      rootCause: 'invalid role',
    });
    const newLesson = makeLesson({
      id: 'n5',
      category: 'REASONING',
      description: 'Different topic entirely',
      rootCause: 'completely different cause',
    });
    const result = detectConflict(newLesson, [existing]);
    expect(result).toHaveLength(0);
  });
});

// ─── lesson.signing ───────────────────────────────────────────────────────────

describe('signLesson', () => {
  it('returns 8-char hex string', () => {
    const sig = signLesson(makeLesson());
    expect(sig).toMatch(/^[0-9a-f]{8}$/);
  });

  it('same lesson → same signature (deterministic)', () => {
    const lesson = makeLesson();
    expect(signLesson(lesson)).toBe(signLesson(lesson));
  });

  it('different description → different signature', () => {
    const a = makeLesson({ description: 'Description alpha' });
    const b = makeLesson({ description: 'Description beta' });
    expect(signLesson(a)).not.toBe(signLesson(b));
  });

  it('different id → different signature', () => {
    const a = makeLesson({ id: 'lesson-111' });
    const b = makeLesson({ id: 'lesson-222' });
    expect(signLesson(a)).not.toBe(signLesson(b));
  });
});

describe('verifyLesson', () => {
  it('correct signature → true', () => {
    const lesson = makeLesson();
    const sig = signLesson(lesson);
    expect(verifyLesson(lesson, sig)).toBe(true);
  });

  it('wrong signature → false', () => {
    const lesson = makeLesson();
    expect(verifyLesson(lesson, 'deadbeef')).toBe(false);
  });
});

describe('signAndAttach', () => {
  it('result has _signature field', () => {
    const signed = signAndAttach(makeLesson());
    expect(signed._signature).toBeDefined();
    expect(typeof signed._signature).toBe('string');
  });

  it('original fields preserved', () => {
    const lesson = makeLesson({ id: 'test-id' });
    const signed = signAndAttach(lesson);
    expect(signed.id).toBe('test-id');
  });
});

describe('verifySignedLesson', () => {
  it('correctly signed lesson → valid=true', () => {
    const signed = signAndAttach(makeLesson());
    const result = verifySignedLesson(signed);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('no _signature → valid=false with reason', () => {
    const lesson = makeLesson();
    const result = verifySignedLesson(lesson);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unsigned');
  });

  it('tampered content → valid=false with mismatch reason', () => {
    const signed = signAndAttach(makeLesson());
    const tampered = { ...signed, description: 'tampered description' };
    const result = verifySignedLesson(tampered);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('mismatch');
  });
});

// ─── rule.versioning ─────────────────────────────────────────────────────────

describe('rule.versioning', () => {
  it('getRuleHistory("rule-A") → 2 entries', () => {
    expect(getRuleHistory('rule-A')).toHaveLength(2);
  });

  it('getRuleHistory("rule-B") → 1 entry', () => {
    expect(getRuleHistory('rule-B')).toHaveLength(1);
  });

  it('getRuleHistory for unknown rule → empty', () => {
    expect(getRuleHistory('rule-UNKNOWN')).toHaveLength(0);
  });

  it('previousVersion preserved in history', () => {
    const history = getRuleHistory('rule-A');
    const v11 = history.find((r) => r.version === '1.1');
    expect(v11!.previousVersion).toBe('1.0');
  });

  it('rule-B history does not include rule-A entries', () => {
    const histB = getRuleHistory('rule-B');
    expect(histB.every((r) => r.ruleId === 'rule-B')).toBe(true);
  });
});

// ─── lesson.store ─────────────────────────────────────────────────────────────

describe('lesson.store', () => {
  it('getActiveLessons returns only active lessons (2 of 3)', () => {
    const active = getActiveLessons();
    expect(active.length).toBeGreaterThanOrEqual(2);
    expect(active.every((l) => l.active)).toBe(true);
  });

  it('inactive lesson (ID_L3) not in getActiveLessons', () => {
    const active = getActiveLessons();
    expect(active.find((l) => l.id === ID_L3)).toBeUndefined();
  });

  it('deactivateLesson removes lesson from active set', () => {
    deactivateLesson(ID_L2);
    const after = getActiveLessons();
    expect(after.find((l) => l.id === ID_L2)).toBeUndefined();
  });
});
