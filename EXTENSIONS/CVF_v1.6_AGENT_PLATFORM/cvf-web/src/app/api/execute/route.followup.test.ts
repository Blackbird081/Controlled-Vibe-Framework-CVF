import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
    executeAI: executeAIMock,
    CVF_SYSTEM_PROMPT: '',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    withSessionAuditPayload: (session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined, payload?: Record<string, unknown>) => {
        const nextPayload = { ...(payload ?? {}) };
        if (session?.impersonation) {
            nextPayload.impersonatedBy = session.impersonation.realActorId;
            nextPayload.impersonationSessionId = session.impersonation.sessionId;
        }
        return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
    },
}));

import { POST } from './route';

// W97-T1: Follow-up prompt threading integration tests
describe('/api/execute — follow-up prompt threading (W97-T1)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        delete process.env.DEFAULT_AI_PROVIDER;
        delete process.env.CVF_SESSION_SECRET;
        process.env.OPENAI_API_KEY = 'test-key';
        verifySessionCookieMock.mockResolvedValue({
            user: 'tester',
            role: 'admin',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        executeAIMock.mockResolvedValue({
            success: true,
            output: '## Follow-up Response\n\nThis is structured output.\n\n### Key Points\n\n1. Point one.\n2. Point two.\n3. Point three.',
            model: 'gpt-4o',
            provider: 'openai',
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('appends _previousOutput as context block and does not expose it as a visible input field', async () => {
        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Basic Analysis',
                intent: 'Analyze this governance topic in depth',
                inputs: {
                    topic: 'AI governance',
                    _previousOutput: 'Original AI output here.',
                },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);

        // prompt is the 3rd argument: executeAI(provider, apiKey, prompt, options)
        const capturedPrompt: string = executeAIMock.mock.calls[0][2];
        expect(capturedPrompt).toContain('Previous Output (for context)');
        expect(capturedPrompt).toContain('Original AI output here.');
        expect(capturedPrompt).not.toMatch(/\*\*\s*previous[_ ]output\s*[:\*]/i);
    });

    it('skips underscore keys in the visible Input Data section', async () => {
        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Review Task',
                intent: 'Review and analyze the following content',
                inputs: {
                    description: 'Improve code quality',
                    _previousOutput: 'Some prior answer.',
                    _internalMeta: 'should-be-hidden',
                },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        expect(res.status).toBe(200);

        const capturedPrompt: string = executeAIMock.mock.calls[0][2];
        expect(capturedPrompt).toContain('**Description:**');
        expect(capturedPrompt).not.toContain('_internalMeta');
        expect(capturedPrompt).not.toContain('Internal Meta');
    });

    it('produces a clean prompt (no context block) when _previousOutput is absent', async () => {
        const req = new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Simple Task',
                intent: 'Analyze this topic for governance compliance',
                inputs: {
                    subject: 'Governance review',
                },
                provider: 'openai',
            }),
        });

        const res = await POST(req as never);
        expect(res.status).toBe(200);

        const capturedPrompt: string = executeAIMock.mock.calls[0][2];
        expect(capturedPrompt).not.toContain('Previous Output');
        expect(capturedPrompt).not.toContain('follow-up or refinement');
    });
});
