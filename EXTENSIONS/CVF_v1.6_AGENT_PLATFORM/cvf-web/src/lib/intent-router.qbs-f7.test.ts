import { describe, expect, it, beforeEach } from 'vitest';
import { routeIntent } from './intent-router';
import { startClarification } from './intent-router-clarification';

const F7_PROMPTS = [
  'Make my app better',
  'Fix the errors',
  'Set up AI for my business',
  'Review this plan',
  'Deploy it now',
  'Use the best model',
];

describe('QBS F7 ambiguous non-coder routing', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = 'true';
    process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP = 'true';
  });

  it('does not guess a governed target for the bounded F7 ambiguous prompt set', () => {
    for (const prompt of F7_PROMPTS) {
      const result = routeIntent(prompt);
      expect(result?.confidence).toBe('weak');
      expect(result?.recommendedTemplateId).toBeNull();
      expect(result?.fallback?.reason).toBe('weak_confidence');
    }
  });

  it('starts the clarification loop for the bounded F7 ambiguous prompt set', () => {
    for (const prompt of F7_PROMPTS) {
      const result = routeIntent(prompt);
      expect(result).not.toBeNull();
      const clarification = startClarification(result!);
      expect(clarification.recoveryMode).toBe('clarify');
      expect(clarification.clarificationQuestion).toBeTruthy();
      expect(clarification.clarificationOptions?.length).toBeGreaterThan(0);
    }
  });
});
