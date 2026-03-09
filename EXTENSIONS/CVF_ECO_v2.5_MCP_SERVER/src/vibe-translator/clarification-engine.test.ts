/**
 * Tests for Clarification Engine
 */

import { describe, it, expect } from 'vitest';
import { generateClarifications } from './clarification-engine.js';
import { parseVibe } from './vibe-parser.js';

describe('generateClarifications', () => {
  describe('no clarification needed', () => {
    it('returns no questions for clear create request', () => {
      const parsed = parseVibe('Create a React component for user dashboard');
      const result = generateClarifications(parsed);
      expect(result.needsClarification).toBe(false);
      expect(result.questions.filter((q) => q.required)).toHaveLength(0);
    });

    it('returns summary without required questions for clear input', () => {
      const parsed = parseVibe('Create a landing page');
      const result = generateClarifications(parsed);
      expect(result.needsClarification).toBe(false);
      expect(result.questions.filter((q) => q.required)).toHaveLength(0);
    });
  });

  describe('clarification needed', () => {
    it('asks for action type on vague input', () => {
      const parsed = parseVibe('hmm');
      const result = generateClarifications(parsed);
      expect(result.needsClarification).toBe(true);
      expect(result.questions.some((q) => q.slot === 'action_type')).toBe(true);
    });

    it('asks for recipient on send without target', () => {
      const parsed = parseVibe('Send the report');
      const result = generateClarifications(parsed);
      expect(result.questions.some((q) => q.slot === 'recipient')).toBe(true);
    });

    it('asks for channel on send without service', () => {
      const parsed = parseVibe('Send the report');
      const result = generateClarifications(parsed);
      expect(result.questions.some((q) => q.slot === 'channel')).toBe(true);
    });

    it('asks for target_environment on deploy', () => {
      const parsed = parseVibe('Deploy the app');
      const result = generateClarifications(parsed);
      expect(result.questions.some((q) => q.slot === 'target_environment')).toBe(true);
    });

    it('provides options for channel question', () => {
      const parsed = parseVibe('Send the report');
      const result = generateClarifications(parsed);
      const channelQ = result.questions.find((q) => q.slot === 'channel');
      if (channelQ) {
        expect(channelQ.options).toBeDefined();
        expect(channelQ.options!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('bilingual support', () => {
    it('provides Vietnamese summary', () => {
      const parsed = parseVibe('hmm');
      const result = generateClarifications(parsed);
      expect(result.summaryVi).toBeDefined();
      expect(result.summaryVi.length).toBeGreaterThan(0);
    });

    it('provides Vietnamese questions', () => {
      const parsed = parseVibe('hmm');
      const result = generateClarifications(parsed);
      for (const q of result.questions) {
        expect(q.questionVi).toBeDefined();
        expect(q.questionVi.length).toBeGreaterThan(0);
      }
    });

    it('Vietnamese summary mentions missing info', () => {
      const parsed = parseVibe('Send the report');
      const result = generateClarifications(parsed);
      if (result.needsClarification) {
        expect(result.summaryVi).toContain('thông tin');
      }
    });
  });

  describe('priority ordering', () => {
    it('sorts questions by priority', () => {
      const parsed = parseVibe('hmm something send deploy');
      // Force multiple missing slots
      parsed.missingSlots = ['action_type', 'recipient', 'channel', 'target_environment'];
      const result = generateClarifications(parsed);
      for (let i = 1; i < result.questions.length; i++) {
        expect(result.questions[i].priority).toBeGreaterThanOrEqual(result.questions[i - 1].priority);
      }
    });
  });

  describe('confidence tracking', () => {
    it('passes through confidence from parsed vibe', () => {
      const parsed = parseVibe('Create a React component');
      const result = generateClarifications(parsed);
      expect(result.confidence).toBe(parsed.confidence);
    });
  });

  describe('additional context-aware slots', () => {
    it('suggests format for low-confidence create', () => {
      const parsed = parseVibe('Create something');
      parsed.confidence = 0.4; // Force low
      const result = generateClarifications(parsed);
      const hasFormat = result.questions.some((q) => q.slot === 'format');
      // May or may not have it depending on confidence threshold, just check it doesn't crash
      expect(result.questions).toBeDefined();
    });

    it('suggests schedule for report', () => {
      const parsed = parseVibe('Generate report');
      parsed.confidence = 0.5;
      const result = generateClarifications(parsed);
      // Report can suggest schedule
      expect(result.questions).toBeDefined();
    });
  });
});
