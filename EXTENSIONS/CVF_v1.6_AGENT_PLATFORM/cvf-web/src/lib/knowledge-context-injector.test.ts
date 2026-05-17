/**
 * W101-T1 — Knowledge-Native Execute Path Integration
 * Unit tests for knowledge-context-injector.ts
 */
import { describe, it, expect } from 'vitest';
import { buildKnowledgeSystemPrompt, hasKnowledgeContext } from './knowledge-context-injector';

const BASE_PROMPT = 'You are a helpful assistant.';
const CONTEXT = 'Domain fact: Bubble.io is a cloud-only platform. For offline apps, use Python or Electron.';

describe('hasKnowledgeContext', () => {
    it('returns true for a non-empty string', () => {
        expect(hasKnowledgeContext(CONTEXT)).toBe(true);
    });

    it('returns false for undefined', () => {
        expect(hasKnowledgeContext(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(hasKnowledgeContext('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
        expect(hasKnowledgeContext('   ')).toBe(false);
    });
});

describe('buildKnowledgeSystemPrompt', () => {
    it('returns base prompt unchanged when context is empty', () => {
        expect(buildKnowledgeSystemPrompt(BASE_PROMPT, '')).toBe(BASE_PROMPT);
    });

    it('returns base prompt unchanged when context is whitespace only', () => {
        expect(buildKnowledgeSystemPrompt(BASE_PROMPT, '   ')).toBe(BASE_PROMPT);
    });

    it('appends a GOVERNED KNOWLEDGE CONTEXT block when context is non-empty', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result).toContain(BASE_PROMPT);
        expect(result).toContain('GOVERNED KNOWLEDGE CONTEXT');
        expect(result).toContain(CONTEXT);
    });

    it('enriched prompt starts with the base prompt', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result.startsWith(BASE_PROMPT)).toBe(true);
    });

    it('enriched prompt is longer than base prompt', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result.length).toBeGreaterThan(BASE_PROMPT.length);
    });

    it('enriched prompt contains the context content verbatim', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result).toContain('Bubble.io is a cloud-only platform');
        expect(result).toContain('Python or Electron');
    });

    it('trims whitespace from context before injecting', () => {
        const paddedContext = '   ' + CONTEXT + '   ';
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, paddedContext);
        expect(result).toContain(CONTEXT.trim());
    });

    it('context block includes a section separator', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result).toContain('---');
    });

    it('context block includes governance precedence instruction', () => {
        const result = buildKnowledgeSystemPrompt(BASE_PROMPT, CONTEXT);
        expect(result).toContain('takes precedence');
    });
});
