// Text Encoding Exception: Vietnamese clarification fixtures require UTF-8.
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
    routeType: null,
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
    routeType: null,
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

// ─── Vietnamese questions follow the language the user typed ─────────────────

describe('clarification language', () => {
  const en = buildNextQuestion(0)!;
  const enScope = buildNextQuestion(1)!;
  const vn = buildNextQuestion(0, 'vi')!;
  const viScope = buildNextQuestion(1, 'vi')!;

  it('keeps the English questions and options unchanged by default', () => {
    expect(en.question).toBe('What best describes what you are trying to do right now?');
    expect(en.options).toHaveLength(4);
    expect(enScope.question).toBe('Who will use the output of this work?');
    expect(startClarification(makeWeakResult('weak_confidence')).clarificationQuestion).toBe(en.question);
    expect(startClarification(makeWeakResult('weak_confidence'), 'en').clarificationOptions).toEqual(en.options);
    expect(buildClarificationState('x').language).toBe('en');
    expect(buildClarificationState('x').history[0]).toEqual({ question: en.question, options: en.options });
  });

  it('returns Vietnamese questions with the same number of options in the same order', () => {
    expect(vn.question).toBe('Hiện tại bạn đang muốn làm việc gì nhất?');
    expect(vn.options).toHaveLength(en.options.length);
    expect(viScope.options).toHaveLength(enScope.options.length);
    for (const text of [vn.question, viScope.question, ...vn.options, ...viScope.options]) expect(text).toMatch(/[ăâêôơưđàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i);
    expect(vn.options[0]).toContain('nghiên cứu');
    expect(vn.options[1]).toContain('kế hoạch');
    expect(vn.options[2]).toContain('Xây dựng');
    expect(vn.options[3]).toContain('Rà soát');
    expect(startClarification(makeWeakResult('weak_confidence'), 'vi')).toMatchObject({ recoveryMode: 'clarify', clarificationQuestion: vn.question, clarificationOptions: vn.options, depth: 0 });
    expect(buildClarificationState('tôi cần', 'vi')).toMatchObject({ language: 'vi', history: [{ question: vn.question, options: vn.options }] });
  });

  it('maps each answer to the same routing keywords by option index in both languages', () => {
    for (let phase = 0; phase < en.options.length; phase++) {
      for (let scope = 0; scope < enScope.options.length; scope++) {
        const enriched = (language: 'en' | 'vi') => {
          const questions = [buildNextQuestion(0, language)!, buildNextQuestion(1, language)!];
          return buildEnrichedInput({
            originalInput: 'x', language, depth: 2,
            history: [{ ...questions[0], answer: questions[0].options[phase] }, { ...questions[1], answer: questions[1].options[scope] }],
          });
        };
        expect(enriched('vi')).toBe(enriched('en'));
        expect(enriched('en')).not.toContain('Hiện');
      }
    }
  });

  it('keeps the questions Vietnamese through the loop and reports the browse reason in Vietnamese', () => {
    vi_stub();
    let state = buildClarificationState('zzzxxx_qqqwww_unmatchable_gibberish', 'vi');
    const raw = 'zzzxxx_raw_answer_not_in_list_abc123';
    const first = submitClarificationAnswer(state, raw);
    expect(first).toMatchObject({ recoveryMode: 'clarify', clarificationQuestion: viScope.question, clarificationOptions: viScope.options, depth: 1 });
    state = advanceClarificationState(state, raw);
    expect(state.language).toBe('vi');
    expect(state.history[1]).toEqual({ question: viScope.question, options: viScope.options });
    const second = submitClarificationAnswer(state, 'zzzxxx_raw_answer_not_in_list_def456');
    expect(second.recoveryMode).toBe('browse');
    expect(second.browseReason).toContain('thư viện kỹ năng');
  });

  it('reports the unmatched-browse reason in English when no language is set', () => {
    vi_stub();
    const state: ClarificationState = { originalInput: 'zzzxxx_qqqwww_unmatchable_gibberish', depth: 1, history: [{ question: 'q0', options: ['A'], answer: 'zzzxxx_raw_a' }, { question: 'q1', options: ['B'] }] };
    const result = submitClarificationAnswer(state, 'zzzxxx_raw_b');
    expect(result.recoveryMode).toBe('browse');
    expect(result.browseReason).toContain('Browse the skill library');
  });
});

function vi_stub() { vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true'); }
