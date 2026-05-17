import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('/api/pricing', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.MODEL_PRICING_JSON;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('returns default pricing when env is not set', async () => {
        const res = await GET();
        const data = await res.json();
        expect(data.source).toBe('default');
        expect(data.pricing).toHaveProperty('gpt-4o');
    });

    it('merges pricing from environment json', async () => {
        process.env.MODEL_PRICING_JSON = JSON.stringify({
            'gpt-4o': { input: 1, output: 2 },
            'custom-model': { input: 0.5, output: 0.7 },
        });

        const res = await GET();
        const data = await res.json();
        expect(data.source).toBe('env');
        expect(data.pricing['gpt-4o']).toEqual({ input: 1, output: 2 });
        expect(data.pricing['custom-model']).toEqual({ input: 0.5, output: 0.7 });
    });

    it('falls back to default when env json is invalid', async () => {
        process.env.MODEL_PRICING_JSON = '{invalid';
        const res = await GET();
        const data = await res.json();
        expect(data.source).toBe('default');
        expect(data.pricing).toHaveProperty('gpt-4o');
    });
});
