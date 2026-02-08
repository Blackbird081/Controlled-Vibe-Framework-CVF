import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('/api/providers', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('returns not configured when no API keys are set', async () => {
        const res = await GET();
        const data = await res.json();
        expect(data.anyConfigured).toBe(false);
        expect(data.defaultProvider).toBe('openai');
        expect(data.message).toMatch(/No providers configured/i);
    });

    it('returns configured providers and default provider', async () => {
        process.env.OPENAI_API_KEY = 'ok';
        process.env.DEFAULT_AI_PROVIDER = 'gemini';

        const res = await GET();
        const data = await res.json();
        expect(data.anyConfigured).toBe(true);
        expect(data.defaultProvider).toBe('gemini');
        const openai = data.providers.find((p: { provider: string }) => p.provider === 'openai');
        expect(openai.configured).toBe(true);
    });
});
