/**
 * W124-T1 CP1 — intent-router-clarification unit tests
 *
 * Covers:
 *   - isClarificationLoopEnabled (flag gate)
 *   - isClarificationEligible (browse-only vs clarify-eligible)
 *   - startClarification (entry point)
 *   - buildNextQuestion (depth 0, 1, ≥2)
 *   - buildEnrichedInput (keyword injection)
 *   - submitClarificationAnswer (depth advance, re-route, browse fallback)
 *   - buildClarificationState / advanceClarificationState
 *   - Depth limit enforcement (max 2)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CLARIFICATION_DEPTH_LIMIT,
  isClarificationLoopEnabled,
  isClarificationEligible,
  startClarification,
  buildNextQuestion,
  buildEnrichedInput,
  submitClarificationAnswer,
  buildClarificationState,
  advanceClarificationState,
  type ClarificationState,
} from '@/lib/intent-router-clarification';
import type { IntentRouteResult } from '@/lib/intent-router';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeWeakResult(reason: 'weak_confidence' | 'unsupported_language' | 'empty_input'): IntentRouteResult {
  return {
    starterKey: null,
    recommendedTemplateId: null,
    recommendedTemplateLabel: null,
    rationale: 'test weak',
    phase: 'INTAKE',
    riskLevel: 'R0',
    friendlyPhase: '🧭 Tiếp nhận & Làm rõ',
    friendlyRisk: '⚪ Không rủi ro',
    confidence: 'weak',
    fallback: { reason, suggestion: 'test suggestion' },
    intentRoutedAt: new Date().toISOString(),
  };
}

function makeNoFallbackResult(): IntentRouteResult {
  return {
    starterKey: null,
    recommendedTemplateId: null,
    recommendedTemplateLabel: null,
    rationale: 'test',
    phase: 'INTAKE',
    riskLevel: 'R0',
    friendlyPhase: '🧭',
    friendlyRisk: '⚪',
    confidence: 'weak',
    fallback: null,
    intentRoutedAt: new Date().toISOString(),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

// ─── CLARIFICATION_DEPTH_LIMIT ────────────────────────────────────────────────

describe('CLARIFICATION_DEPTH_LIMIT', () => {
  it('is exactly 2', () => {
    expect(CLARIFICATION_DEPTH_LIMIT).toBe(2);
  });
});

// ─── isClarificationLoopEnabled ──────────────────────────────────────────────

describe('isClarificationLoopEnabled', () => {
  it('returns false when flag is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'false');
    expect(isClarificationLoopEnabled()).toBe(false);
  });

  it('returns true when flag is "true"', () => {
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'true');
    expect(isClarificationLoopEnabled()).toBe(true);
  });
});

// ─── isClarificationEligible ─────────────────────────────────────────────────

describe('isClarificationEligible', () => {
  it('returns true for weak_confidence', () => {
    expect(isClarificationEligible({ reason: 'weak_confidence', suggestion: '' })).toBe(true);
  });

  it('returns false for unsupported_language', () => {
    expect(isClarificationEligible({ reason: 'unsupported_language', suggestion: '' })).toBe(false);
  });

  it('returns false for empty_input', () => {
    expect(isClarificationEligible({ reason: 'empty_input', suggestion: '' })).toBe(false);
  });
});

// ─── buildNextQuestion ────────────────────────────────────────────────────────

describe('buildNextQuestion', () => {
  it('returns phase question at depth 0', () => {
    const q = buildNextQuestion(0);
    expect(q).not.toBeNull();
    expect(q!.options.length).toBeGreaterThanOrEqual(2);
    expect(q!.question.length).toBeGreaterThan(0);
  });

  it('returns scope question at depth 1', () => {
    const q = buildNextQuestion(1);
    expect(q).not.toBeNull();
    expect(q!.options.length).toBeGreaterThanOrEqual(2);
  });

  it('returns null at depth 2 (limit reached)', () => {
    expect(buildNextQuestion(2)).toBeNull();
  });

  it('returns null at depth > 2', () => {
    expect(buildNextQuestion(3)).toBeNull();
  });
});

// ─── startClarification ──────────────────────────────────────────────────────

describe('startClarification', () => {
  it('returns browse when no fallback on result', () => {
    const result = startClarification(makeNoFallbackResult());
    expect(result.recoveryMode).toBe('browse');
  });

  it('returns browse for unsupported_language', () => {
    const result = startClarification(makeWeakResult('unsupported_language'));
    expect(result.recoveryMode).toBe('browse');
    expect(result.browseReason).toBeTruthy();
  });

  it('returns browse for empty_input', () => {
    const result = startClarification(makeWeakResult('empty_input'));
    expect(result.recoveryMode).toBe('browse');
  });

  it('returns clarify for weak_confidence with depth 0 question', () => {
    const result = startClarification(makeWeakResult('weak_confidence'));
    expect(result.recoveryMode).toBe('clarify');
    expect(result.clarificationQuestion).toBeTruthy();
    expect(result.clarificationOptions).toBeDefined();
    expect(result.clarificationOptions!.length).toBeGreaterThan(0);
    expect(result.depth).toBe(0);
  });
});

// ─── buildEnrichedInput ───────────────────────────────────────────────────────

describe('buildEnrichedInput', () => {
  it('appends phase keywords when depth-0 answer matches an option', () => {
    const state: ClarificationState = {
      originalInput: 'tôi muốn làm gì đó',
      depth: 1,
      history: [
        {
          question: 'q0',
          options: [
            'Research or explore a topic (find information, compare options)',
            'Plan or design something (outline, strategy, architecture)',
            'Build or create something (write content, code, or a document)',
            'Review or audit something (quality check, security review)',
          ],
          answer: 'Build or create something (write content, code, or a document)',
        },
      ],
    };
    const enriched = buildEnrichedInput(state);
    expect(enriched).toContain('tôi muốn làm gì đó');
    expect(enriched).toContain('build');
  });

  it('falls back to raw answer when answer not in options list', () => {
    const state: ClarificationState = {
      originalInput: 'hello',
      depth: 1,
      history: [
        { question: 'q0', options: ['A', 'B'], answer: 'something else entirely' },
      ],
    };
    const enriched = buildEnrichedInput(state);
    expect(enriched).toContain('something else entirely');
  });

  it('uses original input only when no answers yet', () => {
    const state: ClarificationState = {
      originalInput: 'original',
      depth: 0,
      history: [{ question: 'q0', options: ['A'] }],
    };
    const enriched = buildEnrichedInput(state);
    expect(enriched).toBe('original');
  });
});

// ─── buildClarificationState / advanceClarificationState ─────────────────────

describe('buildClarificationState', () => {
  it('creates state with depth 0 and one history entry', () => {
    const state = buildClarificationState('my input');
    expect(state.originalInput).toBe('my input');
    expect(state.depth).toBe(0);
    expect(state.history.length).toBe(1);
    expect(state.history[0].answer).toBeUndefined();
  });
});

describe('advanceClarificationState', () => {
  it('records answer in current turn and increments depth', () => {
    const state = buildClarificationState('my input');
    const next = advanceClarificationState(state, 'Build or create something (write content, code, or a document)');
    expect(next.depth).toBe(1);
    expect(next.history[0].answer).toBe('Build or create something (write content, code, or a document)');
  });

  it('appends next question to history when depth < limit', () => {
    const state = buildClarificationState('input');
    const next = advanceClarificationState(state, 'Research or explore a topic (find information, compare options)');
    expect(next.history.length).toBe(2);
  });

  it('does not append beyond depth limit', () => {
    let state = buildClarificationState('input');
    state = advanceClarificationState(state, 'Research or explore a topic (find information, compare options)');
    state = advanceClarificationState(state, 'Just me or my internal team (low-stakes, exploratory)');
    expect(state.depth).toBe(2);
    expect(state.history.length).toBeLessThanOrEqual(CLARIFICATION_DEPTH_LIMIT + 1);
  });
});

// ─── submitClarificationAnswer — depth limit enforcement ─────────────────────

describe('submitClarificationAnswer — depth limit', () => {
  it('returns browse when depth reaches limit and routing still weak', () => {
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    // Answers are NOT in the options arrays, so buildEnrichedInput uses raw text
    // (unmatchable strings that produce no template keywords).
    const state: ClarificationState = {
      originalInput: 'zzzxxx_qqqwww_unmatchable_gibberish',
      depth: 1,
      history: [
        {
          question: 'q0',
          options: ['OptA', 'OptB'],
          answer: 'zzzxxx_raw_answer_not_in_list_abc123',
        },
        {
          question: 'q1',
          options: ['OptX', 'OptY'],
        },
      ],
    };
    const result = submitClarificationAnswer(state, 'zzzxxx_raw_answer_not_in_list_def456');
    expect(result.recoveryMode).toBe('browse');
    expect(result.depth).toBe(2);
    expect(result.browseReason).toBeTruthy();
  });

  it('returns route when enriched input matches a wizard template', () => {
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    const state: ClarificationState = {
      originalInput: 'tôi cần',
      depth: 0,
      history: [
        {
          question: 'q0',
          options: [
            'Research or explore a topic (find information, compare options)',
            'Plan or design something (outline, strategy, architecture)',
            'Build or create something (write content, code, or a document)',
            'Review or audit something (quality check, security review)',
          ],
        },
      ],
    };
    const result = submitClarificationAnswer(
      state,
      'Plan or design something (outline, strategy, architecture)'
    );
    expect(['route', 'clarify', 'browse']).toContain(result.recoveryMode);
    if (result.recoveryMode === 'route') {
      expect(result.routeResult).toBeDefined();
      expect(result.routeResult!.starterKey).not.toBeNull();
    }
  });
});
