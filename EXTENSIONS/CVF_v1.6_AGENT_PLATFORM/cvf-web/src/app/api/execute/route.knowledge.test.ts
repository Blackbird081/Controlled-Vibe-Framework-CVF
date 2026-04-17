/**
 * W101-T1 — Knowledge-Native Execute Path Integration
 * Route integration tests: verifies that knowledgeContext is extracted from
 * the request body, used to build an enriched system prompt, and passed to
 * executeAI via the systemPrompt option.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
    executeAI: executeAIMock,
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

const KNOWLEDGE_CONTEXT = 'Domain fact: Bubble.io is cloud-only. For offline apps use Python/Electron.';

describe('/api/execute — W101-T1 knowledge context injection', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        process.env = { ...originalEnv };
        process.env.OPENAI_API_KEY = 'openai-test-key';
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;
        verifySessionCookieMock.mockResolvedValue({
            user: 'tester',
            role: 'admin',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('calls executeAI WITHOUT systemPrompt override when knowledgeContext is absent', async () => {
        executeAIMock.mockResolvedValue({
            success: true,
            output: 'response without context',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: { targetMarket: 'SMBs' },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(executeAIMock.mock.calls[0][3]).toEqual({ model: undefined });
        expect(data.knowledgeInjection).toEqual({ injected: false, contextLength: 0 });
    });

    it('calls executeAI WITH enriched systemPrompt when knowledgeContext is provided', async () => {
        executeAIMock.mockResolvedValue({
            success: true,
            output: 'response with context',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: { targetMarket: 'SMBs' },
                provider: 'openai',
                knowledgeContext: KNOWLEDGE_CONTEXT,
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);

        const options = executeAIMock.mock.calls[0][3] as Record<string, unknown>;
        expect(typeof options.systemPrompt).toBe('string');
        expect(options.systemPrompt as string).toContain('BASE_SYSTEM_PROMPT');
        expect(options.systemPrompt as string).toContain('GOVERNED KNOWLEDGE CONTEXT');
        expect(options.systemPrompt as string).toContain('Bubble.io is cloud-only');
    });

    it('response includes knowledgeInjection metadata with injected=true when context provided', async () => {
        executeAIMock.mockResolvedValue({
            success: true,
            output: 'response with context',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: { targetMarket: 'SMBs' },
                provider: 'openai',
                knowledgeContext: KNOWLEDGE_CONTEXT,
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(data.knowledgeInjection.injected).toBe(true);
        expect(data.knowledgeInjection.contextLength).toBe(KNOWLEDGE_CONTEXT.length);
    });

    it('treats whitespace-only knowledgeContext as absent (no injection)', async () => {
        executeAIMock.mockResolvedValue({
            success: true,
            output: 'response',
            provider: 'openai',
            model: 'gpt-4o',
        });

        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze the market',
                inputs: { targetMarket: 'SMBs' },
                provider: 'openai',
                knowledgeContext: '   ',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(executeAIMock.mock.calls[0][3]).toEqual({ model: undefined });
        expect(data.knowledgeInjection.injected).toBe(false);
    });
});
