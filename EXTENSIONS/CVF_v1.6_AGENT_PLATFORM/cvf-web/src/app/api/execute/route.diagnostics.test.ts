import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const providerSpy = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const appendCostEventMock = vi.hoisted(() => vi.fn());
let auditEventSequence = 0;

vi.mock('@/lib/ai', () => ({
    CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT',
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    resolveVerifiedSessionProvenance: async () => ({ qualified: true, userId: 'user-tester', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'route-test-subject', expiresAt: 4102444800000 }),
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
import { useCanonicalRouteHarness } from '@/test/canonical-route-test-support';

describe('/api/execute diagnostics', () => {
    const originalEnv = { ...process.env };
    let tempDir = '';

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-route-diagnostics-'));
        providerSpy.mockReset();
        evaluateEnforcementMock.mockReset();
        verifySessionCookieMock.mockReset();
        checkTeamQuotaMock.mockReset();
        appendAuditEventMock.mockReset();
        auditEventSequence = 0;
        appendAuditEventMock.mockImplementation(async () => ({
            id: `diagnostics-audit-${++auditEventSequence}`,
        }));
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
        delete process.env.CVF_OPENAI_API_KEY;
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
        // Canonical path: a configured provider is denied by the governance router when its risk cap excludes the request (no silent fallback).
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_PROVIDER_RISK_CAP_OPENAI = 'R0';
        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateId: 'meeting_notes', templateName: 'Strategy',
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
        expect(providerSpy).not.toHaveBeenCalled();
    });

    it('preserves provider diagnostics on failed execution responses', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        // Scripted transport failure: the Gateway adapter maps HTTP 500 to a closed, secret-safe provider diagnostic.
        providerSpy.mockResolvedValue({ success: false });

        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
                templateId: 'meeting_notes', templateName: 'Strategy',
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
            class: 'provider_http_error',
            retryable: true,
            userAction: 'wait_and_retry',
            httpStatus: 500,
            receiptId: data.governanceEvidenceReceipt.receiptId,
            traceId: data.governanceEvidenceReceipt.envelopeId,
        });
        expect(data.canonicalGateway.providerDiagnostic).toMatchObject({ code: 'provider_http_error', httpStatus: 500 });
        expect(JSON.stringify(data)).not.toContain('test-key');
    });

    it('reports a provider deadline as a retryable provider_timeout', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.CVF_AI_PROVIDER_TIMEOUT_MS = '1000';
        // The transport double never answers; the Gateway deadline (the 1s minimum) aborts the call.
        providerSpy.mockImplementation((_provider, _key, _prompt, options: { signal?: AbortSignal }) => new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => reject(new TypeError('aborted')));
        }));

        const res = await POST(new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({ templateId: 'meeting_notes', templateName: 'Strategy', intent: 'Analyze', inputs: { goal: 'Test' }, provider: 'openai' }),
        }) as never);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('provider_timeout');
        expect(data.diagnostic).toMatchObject({ stage: 'provider', class: 'provider_timeout', retryable: true, userAction: 'wait_and_retry' });
        expect(providerSpy).toHaveBeenCalledTimes(1);
    }, 15000);

  // Canonical Gateway harness: lineage journal + provider transport double (replaces the removed executeAI mock).
  useCanonicalRouteHarness(providerSpy);
});
