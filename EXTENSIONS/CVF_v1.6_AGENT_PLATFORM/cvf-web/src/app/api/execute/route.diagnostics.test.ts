import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({
    executeAI: executeAIMock,
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('@/lib/quota-guard', () => ({
    checkTeamQuota: checkTeamQuotaMock,
    hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return {
        ...actual,
        appendAuditEvent: appendAuditEventMock,
        appendCostEvent: appendCostEventMock,
    };
});

import { POST } from './route';

describe('/api/execute diagnostics', () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-route-diagnostics-'));
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset();
        appendCostEventMock.mockReset();
        evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
        checkTeamQuotaMock.mockResolvedValue({
            exceeded: false,
            currentUSD: 0,
            softCapUSD: 0,
            hardCapUSD: 0,
            overrideActive: false,
        });
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
        delete process.env.ALIBABA_API_KEY;
        delete process.env.DASHSCOPE_API_KEY;
        delete process.env.CVF_BENCHMARK_ALIBABA_KEY;
        delete process.env.CVF_ALIBABA_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        process.env.CVF_FALSE_POSITIVE_REPORTS_PATH = path.join(tempDir, 'false-positive-events.jsonl');
        verifySessionCookieMock.mockResolvedValue({
            userId: 'user-tester',
            user: 'tester',
            role: 'admin',
            orgId: 'org-1',
            teamId: 'team-1',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
    });

    afterEach(async () => {
        process.env = { ...originalEnv };
        if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it('returns V3 diagnostic fields for invalid input', async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({ templateName: 'T', inputs: {} }),
        }) as never);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.diagnostic).toMatchObject({
            contractVersion: 'cvf.executionDiagnostic.v1',
            stage: 'request_validation',
            class: 'invalid_input',
            userAction: 'revise_request',
        });
    });

    it('returns V3 diagnostic when provider routing denies execution', async () => {
        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze',
                inputs: { goal: 'Test' },
                provider: 'openai',
            }),
        }) as never);
        const data = await res.json();
        expect(res.status).toBe(403);
        expect(data.diagnostic).toMatchObject({
            contractVersion: 'cvf.executionDiagnostic.v1',
            stage: 'routing',
            class: 'routing_denied',
            provider: 'openai',
            model: 'router-denied',
            userAction: 'lower_risk_or_change_provider',
            retryable: false,
        });
        expect(executeAIMock).not.toHaveBeenCalled();
    });

    it('preserves provider diagnostics on failed execution responses', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        executeAIMock.mockResolvedValue({
            success: false,
            error: 'timeout',
            provider: 'openai',
            model: 'gpt-4o',
            diagnostic: {
                contractVersion: 'cvf.executionDiagnostic.v1',
                stage: 'provider',
                class: 'provider_timeout',
                retryable: true,
                userAction: 'wait_and_retry',
                safeMessage: 'The provider call exceeded the configured timeout.',
                provider: 'openai',
                model: 'gpt-4o',
                latencyMs: 60001,
            },
        });

        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateName: 'Strategy',
                intent: 'Analyze',
                inputs: { goal: 'Test' },
                provider: 'openai',
            }),
        }) as never);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.diagnostic).toMatchObject({
            stage: 'provider',
            class: 'provider_timeout',
            userAction: 'wait_and_retry',
            receiptId: data.governanceEvidenceReceipt.receiptId,
            traceId: data.governanceEvidenceReceipt.envelopeId,
        });
    });
});
