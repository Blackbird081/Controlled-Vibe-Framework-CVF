/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkBudget, estimateCost } from './budget';

describe('budget', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('checkBudget', () => {
        it('returns true when prompt is within default limit (8000 tokens)', () => {
            // 8000 tokens * 4 chars = 32000 chars
            const prompt = 'a'.repeat(31000);
            expect(checkBudget(prompt)).toBe(true);
        });

        it('returns false when prompt exceeds default limit', () => {
            // 8001+ tokens = 32004+ chars
            const prompt = 'a'.repeat(33000);
            expect(checkBudget(prompt)).toBe(false);
        });

        it('respects CVF_MAX_TOKENS env var', () => {
            process.env.CVF_MAX_TOKENS = '100';
            const shortPrompt = 'a'.repeat(399); // 99.75 tokens -> ceil = 100 -> equal to limit
            expect(checkBudget(shortPrompt)).toBe(true);

            const longPrompt = 'a'.repeat(401); // 101 tokens -> exceeds
            expect(checkBudget(longPrompt)).toBe(false);
        });

        it('returns true for empty prompt', () => {
            expect(checkBudget('')).toBe(true);
        });

        it('handles exactly at the boundary', () => {
            process.env.CVF_MAX_TOKENS = '10';
            const exact = 'a'.repeat(40); // exactly 10 tokens
            expect(checkBudget(exact)).toBe(true);

            const over = 'a'.repeat(41); // 11 tokens
            expect(checkBudget(over)).toBe(false);
        });
    });

    describe('estimateCost', () => {
        it('calculates cost for known model', () => {
            const cost = estimateCost('gpt-4o', 'Hello world!');
            expect(cost).toBeGreaterThan(0);
            expect(typeof cost).toBe('number');
        });

        it('falls back to gpt-4o-mini pricing for unknown model', () => {
            const costUnknown = estimateCost('unknown-model-xyz', 'test prompt');
            const costMini = estimateCost('gpt-4o-mini', 'test prompt');
            expect(costUnknown).toBe(costMini);
        });

        it('returns 0 for empty prompt', () => {
            // ceil(0/4) = 0 tokens -> 0 cost
            const cost = estimateCost('gpt-4o', '');
            expect(cost).toBe(0);
        });

        it('scales with prompt length', () => {
            const shortCost = estimateCost('gpt-4o', 'hi');
            const longCost = estimateCost('gpt-4o', 'a'.repeat(10000));
            expect(longCost).toBeGreaterThan(shortCost);
        });

        it('calculates cost proportional to token count', () => {
            const prompt = 'a'.repeat(4000); // 1000 tokens
            const cost = estimateCost('gpt-4o-mini', prompt);
            // gpt-4o-mini input is 0.15 per 1M tokens
            // 1000 / 1_000_000 * 0.15 = 0.00015
            expect(cost).toBeCloseTo(0.00015, 6);
        });
    });
});
