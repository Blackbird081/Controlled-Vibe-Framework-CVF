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
});
