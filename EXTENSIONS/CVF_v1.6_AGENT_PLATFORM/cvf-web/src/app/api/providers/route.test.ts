import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('/api/providers', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.CVF_OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.DASHSCOPE_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        delete process.env.CVF_BENCHMARK_DEEPSEEK_KEY;
        delete process.env.CVF_DEEPSEEK_API_KEY;
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

    it('treats OpenAI compatibility aliases as configured without exposing key values', async () => {
        process.env.CVF_OPENAI_API_KEY = 'openai-alias-key';

        const res = await GET();
        const data = await res.json();
        const openai = data.providers.find((p: { provider: string }) => p.provider === 'openai');

        expect(data.anyConfigured).toBe(true);
        expect(openai.configured).toBe(true);
        expect(openai.model).toBe('gpt-4o-mini');
        expect(openai.keySourceName).toBe('CVF_OPENAI_API_KEY');
        expect(openai.readiness).toBe('live_task_ready');
        expect(JSON.stringify(openai)).not.toContain('openai-alias-key');
    });

    it('treats Alibaba compatibility aliases as configured', async () => {
        process.env.CVF_BENCHMARK_ALIBABA_KEY = 'ali-benchmark-key';

        const res = await GET();
        const data = await res.json();
        const alibaba = data.providers.find((p: { provider: string }) => p.provider === 'alibaba');

        expect(data.anyConfigured).toBe(true);
        expect(alibaba.configured).toBe(true);
        expect(alibaba.keySourceName).toBe('CVF_BENCHMARK_ALIBABA_KEY');
        expect(alibaba.readiness).toBe('live_task_ready');
        expect(JSON.stringify(alibaba)).not.toContain('ali-benchmark-key');
    });

    it('reports DeepSeek as configured when its API key is present', async () => {
        process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test-key';

        const res = await GET();
        const data = await res.json();
        const deepseek = data.providers.find((p: { provider: string }) => p.provider === 'deepseek');

        expect(data.anyConfigured).toBe(true);
        expect(deepseek.configured).toBe(true);
        expect(deepseek.model).toBe('deepseek-chat');
        expect(deepseek.keySourceName).toBe('DEEPSEEK_API_KEY');
    });

    it('returns UNCONFIGURED lane status when no key is present', async () => {
        const res = await GET();
        const data = await res.json();
        for (const p of data.providers) {
            expect(p.laneStatus).toBe('UNCONFIGURED');
            expect(p.keySourceName).toBeNull();
            expect(p.readiness).toBe('not_configured');
        }
    });

    it('returns EXPERIMENTAL lane status for Alibaba when configured (fresh live proof pending, not certified)', async () => {
        process.env.ALIBABA_API_KEY = 'ali-key';

        const res = await GET();
        const data = await res.json();
        const alibaba = data.providers.find((p: { provider: string }) => p.provider === 'alibaba');

        expect(alibaba.laneStatus).toBe('EXPERIMENTAL');
    });

    it('returns CERTIFIED lane status for DeepSeek when configured', async () => {
        process.env.DEEPSEEK_API_KEY = 'ds-key';

        const res = await GET();
        const data = await res.json();
        const deepseek = data.providers.find((p: { provider: string }) => p.provider === 'deepseek');

        expect(deepseek.laneStatus).toBe('CERTIFIED');
    });

    it('returns EXPERIMENTAL lane status for OpenAI when configured (historical receipts do not reverse R65 Option B)', async () => {
        process.env.OPENAI_API_KEY = 'openai-key';

        const res = await GET();
        const data = await res.json();
        const openai = data.providers.find((p: { provider: string }) => p.provider === 'openai');

        expect(openai.laneStatus).toBe('EXPERIMENTAL');
    });

    it('proves configured readiness does not imply certified status for any provider', async () => {
        process.env.ALIBABA_API_KEY = 'ali-key';
        process.env.OPENAI_API_KEY = 'openai-key';
        process.env.DEEPSEEK_API_KEY = 'ds-key';
        process.env.GOOGLE_AI_API_KEY = 'gemini-key';
        process.env.ANTHROPIC_API_KEY = 'claude-key';
        process.env.OPENROUTER_API_KEY = 'openrouter-key';

        const res = await GET();
        const data = await res.json();

        for (const p of data.providers as Array<{ provider: string; configured: boolean; laneStatus: string; readiness: string }>) {
            expect(p.configured).toBe(true);
            expect(p.readiness).toBe('live_task_ready');
            if (p.provider !== 'deepseek') {
                expect(p.laneStatus).not.toBe('CERTIFIED');
            }
        }

        const deepseek = data.providers.find((p: { provider: string }) => p.provider === 'deepseek');
        expect(deepseek.laneStatus).toBe('CERTIFIED');

        const openrouter = data.providers.find((p: { provider: string }) => p.provider === 'openrouter');
        expect(openrouter.laneStatus).toBe('EXPERIMENTAL');
    });
});
