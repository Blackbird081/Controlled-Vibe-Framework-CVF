import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const executeAIMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
    executeAI: executeAIMock,
}));

import { POST } from './route';

describe('/api/execute', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        executeAIMock.mockReset();
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('returns 400 when required fields are missing', async () => {
        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({ templateName: 'T', inputs: {} }),
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/Missing required fields/);
    });

    it('returns 400 when provider key is not configured', async () => {
        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze',
                inputs: { goal: 'Test' },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.provider).toBe('openai');
        expect(data.error).toMatch(/API key not configured/);
    });

    it('executes AI and returns response when configured', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        executeAIMock.mockResolvedValue({
            success: true,
            output: 'ok',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: { targetMarket: 'SMBs', emptyField: '' },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(executeAIMock).toHaveBeenCalledTimes(1);

        const prompt = executeAIMock.mock.calls[0][2] as string;
        expect(prompt).toContain('## Task: Strategy');
        expect(prompt).toContain('### User Intent');
        expect(prompt).toContain('Analyze the market');
        expect(prompt).toContain('Target Market');
        expect(prompt).not.toContain('Empty Field');
    });

    it('returns 500 when execution throws', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        executeAIMock.mockRejectedValue(new Error('boom'));

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze',
                inputs: { goal: 'Test' },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('boom');
    });
});
