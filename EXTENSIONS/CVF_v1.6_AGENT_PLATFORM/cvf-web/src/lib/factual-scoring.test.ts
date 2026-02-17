import { describe, it, expect } from 'vitest';
import { calculateFactualScore } from './factual-scoring';

describe('calculateFactualScore', () => {
    it('returns high score when response aligns with context', () => {
        const context = 'App requirements include user authentication, role management, and audit logging.';
        const response = 'The solution should implement user authentication, role management, and audit logging.';
        const result = calculateFactualScore(response, context);
        expect(result.score).toBeGreaterThanOrEqual(65);
        expect(result.risk).toBe('low');
    });

    it('returns low score when response drifts from context', () => {
        const context = 'Build a CLI tool for log parsing with JSON output.';
        const response = 'Design a mobile app with AR features and payment processing.';
        const result = calculateFactualScore(response, context);
        expect(result.score).toBeLessThan(50);
        expect(result.risk).toBe('high');
    });

    // ---- Uncovered: empty inputs (lines 24-29) ----
    it('returns zero score when context is empty', () => {
        const result = calculateFactualScore('some response text here', '');
        expect(result.score).toBe(0);
        expect(result.risk).toBe('high');
        expect(result.contextTokens).toBe(0);
        expect(result.notes).toContain('No reliable context or response tokens to validate.');
    });

    it('returns zero score when response is empty', () => {
        const result = calculateFactualScore('', 'some context text here');
        expect(result.score).toBe(0);
        expect(result.risk).toBe('high');
        expect(result.responseTokens).toBe(0);
    });

    it('returns zero score when both inputs are empty', () => {
        const result = calculateFactualScore('', '');
        expect(result.score).toBe(0);
        expect(result.overlap).toBe(0);
    });

    it('handles whitespace-only input as empty', () => {
        const result = calculateFactualScore('   ', '   ');
        expect(result.score).toBe(0);
        expect(result.risk).toBe('high');
    });

    it('handles input with only stopwords', () => {
        const result = calculateFactualScore('the and for with from', 'this that have has was');
        expect(result.score).toBe(0);
        expect(result.risk).toBe('high');
    });

    // ---- Uncovered: notes branches (lines 69-76) ----
    it('adds low coverage note when coverage < 0.3', () => {
        // Large context, small overlap → low coverage
        const context = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango';
        const response = 'alpha bravo unique1 unique2 unique3 unique4 unique5 unique6';
        const result = calculateFactualScore(response, context);
        expect(result.notes).toContain('Low coverage of provided context.');
    });

    it('adds ungrounded note when alignment < 0.3', () => {
        // Small context, response has many unique tokens → low alignment
        const context = 'alpha bravo charlie';
        const response = 'alpha unique1 unique2 unique3 unique4 unique5 unique6 unique7 unique8 unique9 unique10';
        const result = calculateFactualScore(response, context);
        expect(result.notes).toContain('Response contains many tokens not grounded in context.');
    });

    it('returns medium risk for scores between 45 and 64', () => {
        // 6 context tokens, 5 response tokens, 3 overlap
        // coverage=3/6=0.5, alignment=3/5=0.6, jaccard=3/8=0.375
        // score = round((0.25+0.18+0.075)*100) = 51 → medium
        const context = 'alpha bravo charlie delta echo foxtrot';
        const response = 'alpha bravo charlie unique1 unique2';
        const result = calculateFactualScore(response, context);
        expect(result.score).toBeGreaterThanOrEqual(45);
        expect(result.score).toBeLessThan(65);
        expect(result.risk).toBe('medium');
    });
});
