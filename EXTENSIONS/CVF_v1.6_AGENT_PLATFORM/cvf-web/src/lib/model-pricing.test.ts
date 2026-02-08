import { describe, it, expect } from 'vitest';
import { calculateTokenCost, DEFAULT_FALLBACK_PRICING, DEFAULT_MODEL_PRICING } from './model-pricing';

describe('model-pricing', () => {
    it('calculates cost using default pricing', () => {
        const cost = calculateTokenCost('gpt-4o', 1_000_000, 1_000_000);
        const expected = DEFAULT_MODEL_PRICING['gpt-4o'].input + DEFAULT_MODEL_PRICING['gpt-4o'].output;
        expect(cost).toBeCloseTo(expected, 6);
    });

    it('uses fallback pricing for unknown models', () => {
        const cost = calculateTokenCost('unknown-model', 1_000_000, 1_000_000);
        const expected = DEFAULT_FALLBACK_PRICING.input + DEFAULT_FALLBACK_PRICING.output;
        expect(cost).toBeCloseTo(expected, 6);
    });

    it('respects custom pricing overrides', () => {
        const customPricing = {
            ...DEFAULT_MODEL_PRICING,
            'custom-model': { input: 5, output: 10 },
        };
        const cost = calculateTokenCost('custom-model', 2_000_000, 500_000, customPricing);
        const expected = (2_000_000 / 1_000_000) * 5 + (500_000 / 1_000_000) * 10;
        expect(cost).toBeCloseTo(expected, 6);
    });
});
