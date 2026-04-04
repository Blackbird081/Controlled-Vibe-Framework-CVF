/**
 * CVF Guard Contract — Action Intent Dedicated Tests (W6-T38)
 * ============================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   READ_ONLY_ACTIONS / MODIFY_ACTIONS constants:
 *     - READ_ONLY_ACTIONS is a non-empty array of strings
 *     - MODIFY_ACTIONS is a non-empty array of strings
 *     - known read-only actions present (read, analyze, review, audit, list)
 *     - known modify actions present (create, write, delete, deploy, commit)
 *   tokenizeAction(action):
 *     - lowercase conversion
 *     - trim whitespace
 *     - split on non-alphanumeric separators (space, underscore, hyphen)
 *     - empty string → []
 *     - single token → [token]
 *   isPhaseTransitionAction(action):
 *     - "phase_transition_to_BUILD" → true
 *     - "PHASE_TRANSITION_TO_REVIEW" → true (case-insensitive)
 *     - "phase_transition_to_" (empty target) → true
 *     - "build" → false
 *     - "write" → false
 *   hasModifyIntent(action):
 *     - phase_transition action → false (override)
 *     - "write" → true
 *     - "read" → false
 *     - "create_file" → true (token match)
 *     - "analyze_code" → false
 *     - compound with modify token → true
 *     - empty string → false
 *   isReadOnlyAction(action):
 *     - phase_transition action → true (override)
 *     - "read" → true
 *     - "write" → false
 *     - "analyze_code" → true
 *     - "modify" → false
 *     - compound with modify token → false
 *     - empty string → false (no tokens → false)
 *     - unknown action with no recognized tokens → false
 */

import { describe, it, expect } from 'vitest';

import {
  READ_ONLY_ACTIONS,
  MODIFY_ACTIONS,
  tokenizeAction,
  isPhaseTransitionAction,
  hasModifyIntent,
  isReadOnlyAction,
} from './action-intent';

// ─── Constants ────────────────────────────────────────────────────────────────

describe('READ_ONLY_ACTIONS', () => {
  it('is a non-empty array', () => {
    expect(READ_ONLY_ACTIONS.length).toBeGreaterThan(0);
  });

  it('contains known read-only action tokens', () => {
    expect(READ_ONLY_ACTIONS).toContain('read');
    expect(READ_ONLY_ACTIONS).toContain('analyze');
    expect(READ_ONLY_ACTIONS).toContain('review');
    expect(READ_ONLY_ACTIONS).toContain('audit');
    expect(READ_ONLY_ACTIONS).toContain('list');
    expect(READ_ONLY_ACTIONS).toContain('explore');
  });
});

describe('MODIFY_ACTIONS', () => {
  it('is a non-empty array', () => {
    expect(MODIFY_ACTIONS.length).toBeGreaterThan(0);
  });

  it('contains known modify action tokens', () => {
    expect(MODIFY_ACTIONS).toContain('create');
    expect(MODIFY_ACTIONS).toContain('write');
    expect(MODIFY_ACTIONS).toContain('delete');
    expect(MODIFY_ACTIONS).toContain('deploy');
    expect(MODIFY_ACTIONS).toContain('commit');
    expect(MODIFY_ACTIONS).toContain('edit');
  });
});

// ─── tokenizeAction ───────────────────────────────────────────────────────────

describe('tokenizeAction', () => {
  it('empty string → []', () => {
    expect(tokenizeAction('')).toEqual([]);
  });

  it('single lowercase token → [token]', () => {
    expect(tokenizeAction('read')).toEqual(['read']);
  });

  it('converts to lowercase', () => {
    expect(tokenizeAction('READ')).toEqual(['read']);
  });

  it('trims leading/trailing whitespace', () => {
    expect(tokenizeAction('  write  ')).toEqual(['write']);
  });

  it('splits on underscore separator', () => {
    expect(tokenizeAction('create_file')).toEqual(['create', 'file']);
  });

  it('splits on hyphen separator', () => {
    expect(tokenizeAction('analyze-code')).toEqual(['analyze', 'code']);
  });

  it('splits on space separator', () => {
    expect(tokenizeAction('read file')).toEqual(['read', 'file']);
  });

  it('mixed separators split into all tokens', () => {
    const tokens = tokenizeAction('phase_transition_to_BUILD');
    expect(tokens).toContain('phase');
    expect(tokens).toContain('transition');
    expect(tokens).toContain('to');
    expect(tokens).toContain('build');
  });

  it('filters empty segments from consecutive separators', () => {
    const tokens = tokenizeAction('read__file');
    expect(tokens).not.toContain('');
    expect(tokens).toContain('read');
    expect(tokens).toContain('file');
  });
});

// ─── isPhaseTransitionAction ──────────────────────────────────────────────────

describe('isPhaseTransitionAction', () => {
  it('"phase_transition_to_BUILD" → true', () => {
    expect(isPhaseTransitionAction('phase_transition_to_BUILD')).toBe(true);
  });

  it('"PHASE_TRANSITION_TO_REVIEW" → true (case-insensitive)', () => {
    expect(isPhaseTransitionAction('PHASE_TRANSITION_TO_REVIEW')).toBe(true);
  });

  it('"phase_transition_to_FREEZE" → true', () => {
    expect(isPhaseTransitionAction('phase_transition_to_FREEZE')).toBe(true);
  });

  it('"phase_transition_to_" (empty target) → true', () => {
    expect(isPhaseTransitionAction('phase_transition_to_')).toBe(true);
  });

  it('"build" → false', () => {
    expect(isPhaseTransitionAction('build')).toBe(false);
  });

  it('"write" → false', () => {
    expect(isPhaseTransitionAction('write')).toBe(false);
  });

  it('"phase_check" → false (does not start with phase_transition_to_)', () => {
    expect(isPhaseTransitionAction('phase_check')).toBe(false);
  });
});

// ─── hasModifyIntent ──────────────────────────────────────────────────────────

describe('hasModifyIntent', () => {
  it('phase_transition action → false (override)', () => {
    expect(hasModifyIntent('phase_transition_to_BUILD')).toBe(false);
  });

  it('"write" → true', () => {
    expect(hasModifyIntent('write')).toBe(true);
  });

  it('"read" → false', () => {
    expect(hasModifyIntent('read')).toBe(false);
  });

  it('"create_file" → true (create token matches)', () => {
    expect(hasModifyIntent('create_file')).toBe(true);
  });

  it('"analyze_code" → false (no modify token)', () => {
    expect(hasModifyIntent('analyze_code')).toBe(false);
  });

  it('"review_and_delete" → true (delete is modify token)', () => {
    expect(hasModifyIntent('review_and_delete')).toBe(true);
  });

  it('empty string → false', () => {
    expect(hasModifyIntent('')).toBe(false);
  });

  it('"deploy_staging" → true (deploy is modify token)', () => {
    expect(hasModifyIntent('deploy_staging')).toBe(true);
  });

  it('"commit_changes" → true (commit is modify token)', () => {
    expect(hasModifyIntent('commit_changes')).toBe(true);
  });
});

// ─── isReadOnlyAction ─────────────────────────────────────────────────────────

describe('isReadOnlyAction', () => {
  it('phase_transition action → true (override)', () => {
    expect(isReadOnlyAction('phase_transition_to_BUILD')).toBe(true);
  });

  it('"read" → true', () => {
    expect(isReadOnlyAction('read')).toBe(true);
  });

  it('"write" → false', () => {
    expect(isReadOnlyAction('write')).toBe(false);
  });

  it('"analyze_code" → true (analyze token matches)', () => {
    expect(isReadOnlyAction('analyze_code')).toBe(true);
  });

  it('"modify" → false', () => {
    expect(isReadOnlyAction('modify')).toBe(false);
  });

  it('"read_and_write" → false (modify token present → false takes priority)', () => {
    expect(isReadOnlyAction('read_and_write')).toBe(false);
  });

  it('empty string → false (no tokens → cannot classify as read-only)', () => {
    expect(isReadOnlyAction('')).toBe(false);
  });

  it('"unknown_xyz" → false (no recognized token)', () => {
    expect(isReadOnlyAction('unknown_xyz')).toBe(false);
  });

  it('"list_files" → true (list token matches)', () => {
    expect(isReadOnlyAction('list_files')).toBe(true);
  });

  it('"audit_log" → true (audit token matches)', () => {
    expect(isReadOnlyAction('audit_log')).toBe(true);
  });

  it('"review_and_approve" → false (approve is modify token)', () => {
    expect(isReadOnlyAction('review_and_approve')).toBe(false);
  });
});
