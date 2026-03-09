/**
 * Tests for Smart Onboarding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPersonaQuestions,
  buildPersonaProfile,
  getMaxRiskForAutonomy,
  getDefaultRedLines,
  mergeRedLines,
  checkRedLine,
  PersonalDictionary,
  completeOnboarding,
  PERSONA_QUESTIONS,
} from './smart-onboarding.js';

describe('Persona Alignment (M7.4.1)', () => {
  describe('getPersonaQuestions', () => {
    it('returns all questions', () => {
      const q = getPersonaQuestions();
      expect(q.length).toBe(PERSONA_QUESTIONS.length);
    });

    it('each question has bilingual text', () => {
      for (const q of getPersonaQuestions()) {
        expect(q.question).toBeDefined();
        expect(q.questionVi).toBeDefined();
      }
    });

    it('each question has options', () => {
      for (const q of getPersonaQuestions()) {
        expect(q.options.length).toBeGreaterThan(0);
      }
    });

    it('options have bilingual labels', () => {
      for (const q of getPersonaQuestions()) {
        for (const o of q.options) {
          expect(o.label).toBeDefined();
          expect(o.labelVi).toBeDefined();
          expect(o.value).toBeDefined();
        }
      }
    });
  });

  describe('buildPersonaProfile', () => {
    it('builds guardian profile', () => {
      const p = buildPersonaProfile({ autonomy: 'guardian', risk: 'R0', language: 'en', explanations: 'brief' });
      expect(p.autonomyLevel).toBe('guardian');
      expect(p.riskTolerance).toBe('R0');
      expect(p.confirmBeforeAction).toBe(true);
    });

    it('builds autopilot profile', () => {
      const p = buildPersonaProfile({ autonomy: 'autopilot', risk: 'R2', language: 'vi', explanations: 'detailed' });
      expect(p.autonomyLevel).toBe('autopilot');
      expect(p.riskTolerance).toBe('R2');
      expect(p.confirmBeforeAction).toBe(false);
      expect(p.verboseExplanations).toBe(true);
      expect(p.preferredLanguage).toBe('vi');
    });

    it('defaults to balanced', () => {
      const p = buildPersonaProfile({});
      expect(p.autonomyLevel).toBe('balanced');
      expect(p.riskTolerance).toBe('R1');
    });

    it('guardian and balanced require confirmation', () => {
      expect(buildPersonaProfile({ autonomy: 'guardian' }).confirmBeforeAction).toBe(true);
      expect(buildPersonaProfile({ autonomy: 'balanced' }).confirmBeforeAction).toBe(true);
      expect(buildPersonaProfile({ autonomy: 'copilot' }).confirmBeforeAction).toBe(false);
      expect(buildPersonaProfile({ autonomy: 'autopilot' }).confirmBeforeAction).toBe(false);
    });
  });

  describe('getMaxRiskForAutonomy', () => {
    it('guardian = R0', () => expect(getMaxRiskForAutonomy('guardian')).toBe('R0'));
    it('balanced = R1', () => expect(getMaxRiskForAutonomy('balanced')).toBe('R1'));
    it('copilot = R2', () => expect(getMaxRiskForAutonomy('copilot')).toBe('R2'));
    it('autopilot = R2', () => expect(getMaxRiskForAutonomy('autopilot')).toBe('R2'));
  });
});

describe('Red Lines (M7.4.2)', () => {
  describe('getDefaultRedLines', () => {
    it('returns default config', () => {
      const rl = getDefaultRedLines();
      expect(rl.hitlTriggers.length).toBeGreaterThan(0);
      expect(rl.forbiddenActions.length).toBeGreaterThan(0);
      expect(rl.requireApprovalFor.length).toBeGreaterThan(0);
    });
  });

  describe('mergeRedLines', () => {
    it('merges custom triggers', () => {
      const base = getDefaultRedLines();
      const merged = mergeRedLines(base, { hitlTriggers: ['custom_trigger'] });
      expect(merged.hitlTriggers).toContain('custom_trigger');
      expect(merged.hitlTriggers).toContain('deploy');
    });

    it('deduplicates', () => {
      const base = getDefaultRedLines();
      const merged = mergeRedLines(base, { hitlTriggers: ['deploy'] });
      const deployCount = merged.hitlTriggers.filter((t) => t === 'deploy').length;
      expect(deployCount).toBe(1);
    });

    it('merges whitelist', () => {
      const base = getDefaultRedLines();
      const merged = mergeRedLines(base, { dataAccessWhitelist: ['/data/safe'] });
      expect(merged.dataAccessWhitelist).toContain('/data/safe');
    });
  });

  describe('checkRedLine', () => {
    it('blocks forbidden actions', () => {
      const rl = getDefaultRedLines();
      const result = checkRedLine('delete_production_data now', rl);
      expect(result.allowed).toBe(false);
      expect(result.triggersHITL).toBe(true);
    });

    it('allows safe actions', () => {
      const rl = getDefaultRedLines();
      const result = checkRedLine('write code', rl);
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it('requires approval for deploy', () => {
      const rl = getDefaultRedLines();
      const result = checkRedLine('deploy to staging', rl);
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });

    it('triggers HITL for payment', () => {
      const rl = getDefaultRedLines();
      const result = checkRedLine('process payment of $100', rl);
      expect(result.triggersHITL).toBe(true);
    });

    it('returns reason for forbidden', () => {
      const rl = getDefaultRedLines();
      const result = checkRedLine('share_credentials with team', rl);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('forbidden');
    });
  });
});

describe('Personal Dictionary (M7.4.3)', () => {
  let dict: PersonalDictionary;

  beforeEach(() => {
    dict = new PersonalDictionary();
  });

  it('adds and looks up entry', () => {
    dict.add({ term: 'sếp', meaning: 'Anh Nam', category: 'person', aliases: ['boss'] });
    expect(dict.lookup('sếp')?.meaning).toBe('Anh Nam');
  });

  it('looks up by alias', () => {
    dict.add({ term: 'sếp', meaning: 'Anh Nam', category: 'person', aliases: ['boss'] });
    expect(dict.lookup('boss')?.meaning).toBe('Anh Nam');
  });

  it('case-insensitive lookup', () => {
    dict.add({ term: 'Sếp', meaning: 'Anh Nam', category: 'person', aliases: [] });
    expect(dict.lookup('sếp')).toBeDefined();
  });

  it('resolves text', () => {
    dict.add({ term: 'sếp', meaning: 'Anh Nam', category: 'person', aliases: [] });
    dict.add({ term: 'báo cáo', meaning: 'weekly sales report', category: 'document', aliases: [] });
    const resolved = dict.resolve('Gửi báo cáo cho sếp');
    expect(resolved).toContain('Anh Nam');
    expect(resolved).toContain('weekly sales report');
  });

  it('gets all entries (deduplicated)', () => {
    dict.add({ term: 'a', meaning: 'A', category: 'custom', aliases: ['aa'] });
    dict.add({ term: 'b', meaning: 'B', category: 'custom', aliases: [] });
    expect(dict.getAll()).toHaveLength(2);
  });

  it('counts entries', () => {
    dict.add({ term: 'a', meaning: 'A', category: 'custom', aliases: [] });
    dict.add({ term: 'b', meaning: 'B', category: 'custom', aliases: [] });
    expect(dict.count()).toBe(2);
  });

  it('removes entry and aliases', () => {
    dict.add({ term: 'sếp', meaning: 'Anh Nam', category: 'person', aliases: ['boss'] });
    expect(dict.remove('sếp')).toBe(true);
    expect(dict.lookup('sếp')).toBeUndefined();
    expect(dict.lookup('boss')).toBeUndefined();
  });

  it('returns false removing non-existent', () => {
    expect(dict.remove('nope')).toBe(false);
  });
});

describe('completeOnboarding', () => {
  it('creates full onboarding result', () => {
    const result = completeOnboarding(
      { autonomy: 'balanced', risk: 'R1', language: 'vi', explanations: 'detailed' },
      { hitlTriggers: ['custom'] },
      [{ term: 'sếp', meaning: 'Anh Nam', category: 'person', aliases: [] }],
    );
    expect(result.persona.autonomyLevel).toBe('balanced');
    expect(result.redLines.hitlTriggers).toContain('custom');
    expect(result.dictionary).toHaveLength(1);
    expect(result.completedAt).toBeDefined();
  });

  it('works with minimal input', () => {
    const result = completeOnboarding({});
    expect(result.persona.autonomyLevel).toBe('balanced');
    expect(result.redLines.forbiddenActions.length).toBeGreaterThan(0);
    expect(result.dictionary).toHaveLength(0);
  });
});
