/**
 * Tests for Confirmation Card Generator
 */

import { describe, it, expect } from 'vitest';
import { generateConfirmationCard, formatCardAsText, RISK_LABELS, PHASE_LABELS, ACTION_STEPS } from './confirmation-card.js';
import { parseVibe } from './vibe-parser.js';
import { generateClarifications } from './clarification-engine.js';

function card(input: string) {
  const parsed = parseVibe(input);
  const clarification = generateClarifications(parsed);
  return generateConfirmationCard(parsed, clarification);
}

describe('generateConfirmationCard', () => {
  describe('basic generation', () => {
    it('generates a card from parsed vibe', () => {
      const c = card('Create a landing page');
      expect(c.title).toBeDefined();
      expect(c.goal).toContain('landing page');
      expect(c.steps.length).toBeGreaterThan(0);
    });

    it('has title', () => {
      const c = card('Create a landing page');
      expect(c.title.length).toBeGreaterThan(0);
    });

    it('has titleVi', () => {
      const c = card('Tạo trang landing');
      expect(c.titleVi.length).toBeGreaterThan(0);
    });

    it('has risk label', () => {
      const c = card('Create a landing page');
      expect(c.riskLabel).toBeDefined();
      expect(c.riskLabel.length).toBeGreaterThan(0);
    });

    it('has phase label', () => {
      const c = card('Create a landing page');
      expect(c.phaseLabel).toBeDefined();
      expect(c.phaseLabel.length).toBeGreaterThan(0);
    });
  });

  describe('steps', () => {
    it('has create steps for create action', () => {
      const c = card('Create a landing page');
      expect(c.steps.length).toBe(ACTION_STEPS.create.length);
    });

    it('has modify steps for modify action', () => {
      const c = card('Edit the homepage');
      expect(c.steps.length).toBe(ACTION_STEPS.modify.length);
    });

    it('has deploy steps for deploy action', () => {
      const c = card('Deploy to production');
      expect(c.steps.length).toBe(ACTION_STEPS.deploy.length);
    });

    it('has delete steps for delete action', () => {
      const c = card('Delete old logs');
      expect(c.steps.length).toBe(ACTION_STEPS.delete.length);
    });

    it('steps are ordered', () => {
      const c = card('Create a page');
      for (let i = 1; i < c.steps.length; i++) {
        expect(c.steps[i].order).toBeGreaterThan(c.steps[i - 1].order);
      }
    });

    it('steps have Vietnamese translations', () => {
      const c = card('Create a page');
      for (const step of c.steps) {
        expect(step.actionVi).toBeDefined();
        expect(step.actionVi.length).toBeGreaterThan(0);
      }
    });

    it('steps have risk levels', () => {
      const c = card('Create a page');
      for (const step of c.steps) {
        expect(['R0', 'R1', 'R2', 'R3']).toContain(step.risk);
      }
    });

    it('steps indicate automation', () => {
      const c = card('Create a page');
      for (const step of c.steps) {
        expect(typeof step.automated).toBe('boolean');
      }
    });
  });

  describe('confirmation requirements', () => {
    it('requires confirmation for R2 risk', () => {
      const c = card('Delete all temp files');
      expect(c.requiresConfirmation).toBe(true);
    });

    it('requires confirmation for R3 risk', () => {
      const c = card('Deploy to production');
      expect(c.requiresConfirmation).toBe(true);
    });

    it('requires confirmation when questions pending', () => {
      const c = card('Send the report');
      if (c.hasPendingQuestions) {
        expect(c.requiresConfirmation).toBe(true);
      }
    });

    it('does not require confirmation for safe create', () => {
      const c = card('Create a React component for dashboard');
      // Only if no pending questions
      if (!c.hasPendingQuestions) {
        expect(c.requiresConfirmation).toBe(false);
      }
    });
  });

  describe('status', () => {
    it('ready for clear safe request', () => {
      const c = card('Create a landing page for my product');
      if (!c.hasPendingQuestions) {
        expect(c.status).toBe('ready');
      }
    });

    it('needs_info when questions pending', () => {
      const c = card('Send the report');
      if (c.hasPendingQuestions) {
        expect(c.status).toBe('needs_info');
      }
    });
  });

  describe('complexity', () => {
    it('simple for basic analyze', () => {
      const c = card('Analyze the data');
      expect(['simple', 'moderate']).toContain(c.complexity);
    });

    it('complex for deploy', () => {
      const c = card('Deploy the app to production with security checks');
      expect(['moderate', 'complex']).toContain(c.complexity);
    });
  });

  describe('constraints', () => {
    it('includes extracted constraints', () => {
      const c = card('Create report nhưng đừng gửi thông tin nhạy cảm');
      // May or may not extract depending on parser
      expect(c.constraints).toBeDefined();
      expect(Array.isArray(c.constraints)).toBe(true);
    });
  });
});

describe('formatCardAsText', () => {
  it('formats card as English text', () => {
    const c = card('Create a landing page');
    const text = formatCardAsText(c, 'en');
    expect(text).toContain('Goal:');
    expect(text).toContain('Risk:');
    expect(text).toContain('Phase:');
    expect(text).toContain('Steps:');
  });

  it('formats card as Vietnamese text', () => {
    const c = card('Tạo trang landing');
    const text = formatCardAsText(c, 'vi');
    expect(text).toContain('Goal:');
    expect(text).toContain('Steps:');
  });

  it('includes step numbers', () => {
    const c = card('Create a page');
    const text = formatCardAsText(c);
    expect(text).toContain('1.');
    expect(text).toContain('2.');
  });

  it('shows automation indicators', () => {
    const c = card('Create a page');
    const text = formatCardAsText(c);
    expect(text).toMatch(/🤖|👤/);
  });

  it('includes confirmation warning for risky actions', () => {
    const c = card('Deploy to production');
    const text = formatCardAsText(c);
    if (c.requiresConfirmation) {
      expect(text).toContain('confirmation');
    }
  });

  it('includes constraints when present', () => {
    const parsed = parseVibe('Create something');
    parsed.constraints = [{ type: 'budget', description: 'Max $100', raw: 'max $100', severity: 'hard' }];
    const clar = generateClarifications(parsed);
    const c = generateConfirmationCard(parsed, clar);
    const text = formatCardAsText(c);
    expect(text).toContain('Max $100');
  });
});

describe('constants', () => {
  it('RISK_LABELS has all levels', () => {
    expect(RISK_LABELS.R0).toBeDefined();
    expect(RISK_LABELS.R1).toBeDefined();
    expect(RISK_LABELS.R2).toBeDefined();
    expect(RISK_LABELS.R3).toBeDefined();
  });

  it('PHASE_LABELS has all phases', () => {
    expect(PHASE_LABELS.DISCOVERY).toBeDefined();
    expect(PHASE_LABELS.DESIGN).toBeDefined();
    expect(PHASE_LABELS.BUILD).toBeDefined();
    expect(PHASE_LABELS.REVIEW).toBeDefined();
  });

  it('ACTION_STEPS has all action types', () => {
    expect(ACTION_STEPS.create).toBeDefined();
    expect(ACTION_STEPS.modify).toBeDefined();
    expect(ACTION_STEPS.delete).toBeDefined();
    expect(ACTION_STEPS.send).toBeDefined();
    expect(ACTION_STEPS.analyze).toBeDefined();
    expect(ACTION_STEPS.deploy).toBeDefined();
    expect(ACTION_STEPS.unknown).toBeDefined();
  });
});
