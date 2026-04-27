/**
 * CVF Intent Router — Clarification Extension
 * ============================================
 * W124-T1 CP1
 *
 * Extends the W122 intent-router with a bounded clarification loop.
 * When routing confidence is weak, this module generates 1–2 targeted
 * clarification questions to improve confidence before falling back to
 * guided browse.
 *
 * Hard contracts (GC-018 W124-T1):
 *   - Max clarification depth = 2 (CLARIFICATION_DEPTH_LIMIT constant)
 *   - Only 'weak_confidence' fallback reason is eligible for clarification
 *   - 'unsupported_language' and 'empty_input' always route to browse
 *   - Trusted routing subset stays wizard-family only (delegated to intent-router)
 *   - No parallel detector; clarification enriches original input and re-routes
 *   - Feature flag NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP controls activation
 *
 * @module lib/intent-router-clarification
 */

import { routeIntent, type IntentRouteResult, type IntentRouteFallback } from '@/lib/intent-router';

export const CLARIFICATION_DEPTH_LIMIT = 2;

export type RecoveryMode = 'clarify' | 'browse' | 'route';

export interface ClarificationTurn {
  question: string;
  options: string[];
  answer?: string;
}

export interface ClarificationState {
  originalInput: string;
  depth: number;
  history: ClarificationTurn[];
}

export interface ClarificationResult {
  recoveryMode: RecoveryMode;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
  routeResult?: IntentRouteResult;
  browseReason?: string;
  depth: number;
}

/**
 * Phase-level disambiguation question (depth 0).
 * Grounded in the phase already detected by intent-detector.
 */
const PHASE_QUESTION = 'What best describes what you are trying to do right now?';
const PHASE_OPTIONS = [
  'Research or explore a topic (find information, compare options)',
  'Plan or design something (outline, strategy, architecture)',
  'Build or create something (write content, code, or a document)',
  'Review or audit something (quality check, security review)',
];

/**
 * Scope disambiguation question (depth 1).
 * Grounded in the risk level already detected.
 */
const SCOPE_QUESTION = 'Who will use the output of this work?';
const SCOPE_OPTIONS = [
  'Just me or my internal team (low-stakes, exploratory)',
  'Customers or external stakeholders (higher impact, needs care)',
  'A live product or public system (production-level quality needed)',
];

/**
 * Map a user's phase answer back to searchable keywords for re-routing.
 */
const PHASE_ANSWER_KEYWORDS: Record<number, string> = {
  0: 'research explore analyze market',
  1: 'design plan strategy outline blueprint',
  2: 'build create write generate content',
  3: 'review audit security check validate',
};

/**
 * Map a user's scope answer back to risk-signal keywords for re-routing.
 */
const SCOPE_ANSWER_KEYWORDS: Record<number, string> = {
  0: 'internal simple explore',
  1: 'customer stakeholder proposal',
  2: 'production deploy security critical',
};

/**
 * Returns true when the clarification loop feature flag is enabled.
 */
export function isClarificationLoopEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP === 'true';
}

/**
 * Determine whether a weak-confidence fallback is eligible for clarification.
 *
 * browse-only cases: unsupported_language, empty_input
 * clarification-eligible: weak_confidence (VN/EN input with no template match)
 */
export function isClarificationEligible(fallback: IntentRouteFallback): boolean {
  return fallback.reason === 'weak_confidence';
}

/**
 * Build the enriched input string by combining the original user input with
 * the answers collected so far. This allows the W122 router to re-classify
 * with higher confidence.
 */
export function buildEnrichedInput(state: ClarificationState): string {
  const answerKeywords = state.history
    .map((turn, i) => {
      if (turn.answer === undefined) return '';
      const answerIndex = turn.options.indexOf(turn.answer);
      if (answerIndex < 0) return turn.answer;
      if (i === 0) return PHASE_ANSWER_KEYWORDS[answerIndex] ?? turn.answer;
      if (i === 1) return SCOPE_ANSWER_KEYWORDS[answerIndex] ?? turn.answer;
      return turn.answer;
    })
    .filter(Boolean)
    .join(' ');

  return [state.originalInput, answerKeywords].filter(Boolean).join(' ');
}

/**
 * Generate the next clarification question given the current depth.
 * Returns null when depth limit is reached.
 */
export function buildNextQuestion(depth: number): { question: string; options: string[] } | null {
  if (depth === 0) return { question: PHASE_QUESTION, options: PHASE_OPTIONS };
  if (depth === 1) return { question: SCOPE_QUESTION, options: SCOPE_OPTIONS };
  return null;
}

/**
 * Entry point: given a weak-confidence IntentRouteResult, determine the
 * next clarification action.
 *
 * Call this when routeIntent() returns confidence === 'weak'.
 */
export function startClarification(
  weakResult: IntentRouteResult
): ClarificationResult {
  if (!weakResult.fallback) {
    return {
      recoveryMode: 'browse',
      browseReason: 'No fallback signal available. Please browse the skill library.',
      depth: 0,
    };
  }

  if (!isClarificationEligible(weakResult.fallback)) {
    return {
      recoveryMode: 'browse',
      browseReason:
        weakResult.fallback.reason === 'unsupported_language'
          ? 'Please describe your goal in Vietnamese or English so CVF can route you correctly.'
          : 'Please describe what you want to achieve so CVF can find the right path for you.',
      depth: 0,
    };
  }

  const next = buildNextQuestion(0);
  if (!next) {
    return {
      recoveryMode: 'browse',
      browseReason: 'Could not generate a clarification question. Please browse the skill library.',
      depth: 0,
    };
  }

  return {
    recoveryMode: 'clarify',
    clarificationQuestion: next.question,
    clarificationOptions: next.options,
    depth: 0,
  };
}

/**
 * Submit an answer to the current clarification question and advance the loop.
 *
 * @param state  Current clarification state (mutable copy — caller owns it)
 * @param answer The option text the user selected
 * @returns      Next ClarificationResult — may be 'clarify', 'route', or 'browse'
 */
export function submitClarificationAnswer(
  state: ClarificationState,
  answer: string
): ClarificationResult {
  const currentTurn = state.history[state.depth];
  if (currentTurn) {
    currentTurn.answer = answer;
  }

  const newDepth = state.depth + 1;

  // Attempt re-routing with enriched input
  const enriched = buildEnrichedInput({ ...state, depth: newDepth });

  // Temporarily override flag check — the router checks INTENT_FIRST flag,
  // but clarification always routes via the same underlying logic.
  // We call routeIntent with the flag already known to be true at this point
  // (clarification loop is only active when INTENT_FIRST_FRONT_DOOR is also on).
  const rerouted = routeIntent(enriched);

  if (rerouted && rerouted.confidence === 'strong') {
    return {
      recoveryMode: 'route',
      routeResult: rerouted,
      depth: newDepth,
    };
  }

  // Still weak — ask next question if depth allows
  if (newDepth < CLARIFICATION_DEPTH_LIMIT) {
    const next = buildNextQuestion(newDepth);
    if (next) {
      return {
        recoveryMode: 'clarify',
        clarificationQuestion: next.question,
        clarificationOptions: next.options,
        depth: newDepth,
      };
    }
  }

  // Depth limit reached or no question available — guided browse
  return {
    recoveryMode: 'browse',
    browseReason:
      'CVF could not confidently match your goal to a governed starter path after clarification. Browse the skill library to find the closest fit, or try describing your goal differently.',
    depth: newDepth,
  };
}

/**
 * Build a fresh ClarificationState for a new session.
 */
export function buildClarificationState(originalInput: string): ClarificationState {
  return {
    originalInput,
    depth: 0,
    history: [
      { question: PHASE_QUESTION, options: PHASE_OPTIONS },
    ],
  };
}

/**
 * Advance the state by one turn (push next question into history).
 * Returns a new state object (immutable update pattern).
 */
export function advanceClarificationState(
  state: ClarificationState,
  answer: string
): ClarificationState {
  const updatedHistory = state.history.map((turn, i) =>
    i === state.depth ? { ...turn, answer } : turn
  );
  const nextDepth = state.depth + 1;
  const nextQuestion = buildNextQuestion(nextDepth);
  const nextHistory =
    nextQuestion && nextDepth < CLARIFICATION_DEPTH_LIMIT
      ? [...updatedHistory, { question: nextQuestion.question, options: nextQuestion.options }]
      : updatedHistory;
  return {
    ...state,
    depth: nextDepth,
    history: nextHistory,
  };
}
