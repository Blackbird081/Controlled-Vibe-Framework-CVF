// Text Encoding Exception: Vietnamese data fixtures verify UTF-8 fidelity and accepted user input.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { computeServiceRequestSignature } from '@/lib/service-token-auth';

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
    withSessionAuditPayload: (
        session: {
            impersonation?: {
                realActorId: string;
                sessionId: string;
                impersonatedUserId: string;
            };
        } | null | undefined,
        payload?: Record<string, unknown>,
    ) => {
        const nextPayload = { ...(payload ?? {}) };
        if (session?.impersonation) {
            nextPayload.impersonatedBy = session.impersonation.realActorId;
            nextPayload.impersonationSessionId = session.impersonation.sessionId;
            nextPayload.realActorId = session.impersonation.realActorId;
            nextPayload.impersonatedActorId = session.impersonation.impersonatedUserId;
        }
        return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
    },
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
import { getApprovalStore } from '../approvals/store';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

// The route authorizes through authorizeRouteGovernanceProof, which requires a
// signed service token (token + timestamp + HMAC over the exact body). A bare
// token header is correctly rejected with 401.
function makeSignedServiceRequest(body: Record<string, unknown>, token = 'svc'): Request {
    const bodyText = JSON.stringify(body);
    const timestamp = String(Date.now());
    return new Request('http://localhost/api/execute', {
        method: 'POST',
        body: bodyText,
        headers: {
            'x-cvf-service-token': token,
            'x-cvf-service-timestamp': timestamp,
            'x-cvf-service-signature': computeServiceRequestSignature(token, timestamp, bodyText),
        },
    });
}

describe('/api/execute', () => {
    const originalEnv = {
        ...process.env,
        CVF_RATE_LIMIT: '10000',
        CVF_PROVIDER_QUOTA_PER_MIN: '10000',
    };
    const validOutput = '## Governed Response\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.';
    let tempDir = '';

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-execute-route-'));
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset().mockResolvedValue({ id: 'test-audit-event-id' });
        appendCostEventMock.mockReset();
        getApprovalStore().clear();
        resetRateLimitStoresForTest();
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
        delete process.env.DEFAULT_AI_PROVIDER;
        delete process.env.CVF_SESSION_SECRET;
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
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it.each<Record<string, unknown>>([
        { inputs: ['text'] }, { inputs: 'text' }, { inputs: 42 }, { inputs: null },
        { inputs: { idea: { nested: 'text' } } }, { inputs: { idea: ['text'] } },
        { templateName: 42 }, { intent: { text: 'Analyze' } }, { intent: '   ' },
        { model: {} }, { provider: [] }, { imageBase64: true }, { imageUrl: {} },
        { cvfRiskLevel: 1 }, { skillPreflightPassed: 'true' },
        { skillIds: 'skill-a' }, { skillIds: [42] }, { fileScope: [null] },
        { aifMemoryReinjection: [] }, { aifMemoryReinjection: { enabled: 'true' } },
        { aifMemoryReinjection: { policy: [] } }, { aifMemoryReinjection: { memory: {} } },
        { aifMemoryReinjection: { memory: [null] } }, { aifMemoryReinjection: { memory: [{ summary: 42 }] } },
        { aifMemoryReinjection: { policy: { actorAuthorized: 'true' } } },
        { durableMemory: [] }, { durableMemory: { enabled: true, scope: 42 } },
        { durableMemory: { maxResults: 'three' } }, { durableMemory: { policy: false } },
        { durableMemoryWrite: { enabled: 'true' } }, { durableMemoryWrite: { maxSummaryLength: [] } },
        { aiCommit: [] }, { aiCommit: { agentId: 42 } }, { aiCommit: { timestamp: 'now' } },
        { verticalIntegrationChain: { threadId: [] } }, { verticalIntegrationChain: { turnIndex: 'one' } },

    ])('rejects malformed execute shape before downstream processing %#', async patch => {
        process.env.ALIBABA_API_KEY = 'ali-key';
        process.env.CVF_SERVICE_TOKEN = 'svc';
        executeAIMock.mockResolvedValue({ success: true, output: validOutput, provider: 'alibaba', model: 'qwen3.8-flash' });
        const response = await POST(makeSignedServiceRequest({ templateName: 'Strategy', intent: 'Analyze', inputs: { goal: 'Test' }, provider: 'alibaba', ...patch }) as never);
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.diagnostic).toMatchObject({ stage: 'request_validation', class: 'invalid_input' });
        expect(executeAIMock).not.toHaveBeenCalled();
        expect(evaluateEnforcementMock).not.toHaveBeenCalled();
        expect(appendCostEventMock).not.toHaveBeenCalled();
    });

    it('rejects malformed UTF-8 before auth, enforcement, provider and cost', async () => {
        const bytes = new TextEncoder().encode(JSON.stringify({ templateName: 'test', inputs: {}, intent: '~' }));
        bytes[bytes.indexOf(126)] = 255;
        const request = new Request('http://localhost/api/execute', { method: 'POST', body: bytes });
        expect((await POST(request as never)).status).toBe(400);
        expect(verifySessionCookieMock).not.toHaveBeenCalled();
        expect(evaluateEnforcementMock).not.toHaveBeenCalled();
        expect(executeAIMock).not.toHaveBeenCalled();
        expect(appendCostEventMock).not.toHaveBeenCalled();
    });
    it('retains existing scalar input normalization and Vietnamese text', async () => {
        process.env.ALIBABA_API_KEY = 'ali-key';
        process.env.CVF_SERVICE_TOKEN = 'svc';
        executeAIMock.mockResolvedValue({ success: true, output: validOutput, provider: 'alibaba', model: 'qwen3.8-flash' });
        const response = await POST(makeSignedServiceRequest({ templateName: 'Strategy', intent: 'Phân tích lịch trực', inputs: { goal: '  Đặt lịch  ', count: 30, enabled: false, optional: null }, provider: 'alibaba' }) as never);
        expect(response.status).toBe(200);
        expect((await response.json()).success).toBe(true);
        expect(executeAIMock).toHaveBeenCalledOnce();
        const prompt = executeAIMock.mock.calls[0][2] as string;
        expect(prompt).toContain('Đặt lịch');
        expect(prompt).toContain('30');
        expect(prompt).toContain('false');
    });

    it.each([null, [], 42, 'text'])('rejects authenticated non-object root %# before downstream processing', async payload => {
        process.env.CVF_SERVICE_TOKEN = 'svc';
        const response = await POST(makeSignedServiceRequest(payload as unknown as Record<string, unknown>) as never);
        expect(response.status).toBe(400);
        expect((await response.json()).diagnostic?.class).toBe('invalid_input');
        expect(executeAIMock).not.toHaveBeenCalled();
        expect(evaluateEnforcementMock).not.toHaveBeenCalled();
    });

});
