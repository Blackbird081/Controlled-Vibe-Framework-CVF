import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const finalResponseHook = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({ executeAI: executeAIMock, CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT' }));
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: evaluateEnforcementMock }));
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));
vi.mock('@/lib/quota-guard', () => ({ checkTeamQuota: checkTeamQuotaMock, hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false) }));
vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return { ...actual, appendAuditEvent: appendAuditEventMock, appendCostEvent: vi.fn() };
});
vi.mock('./route-final-response', async () => {
    const actual = await vi.importActual<typeof import('./route-final-response')>('./route-final-response');
    return { ...actual, buildExecuteFinalResponse: (params: Parameters<typeof actual.buildExecuteFinalResponse>[0]) =>
        finalResponseHook.getMockImplementation() ? finalResponseHook(params) : actual.buildExecuteFinalResponse(params) };
});

import { POST } from './route';
import { getApprovalStore } from '../approvals/store';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';

const body = {
    templateId: 'documentation', templateName: 'Documentation',
    intent: 'Analyze synthetic documentation needs',
    inputs: { topic: 'Synthetic guide', audience: 'Operators', scope: 'Basic workflow' },
    provider: 'alibaba', model: 'qwen-flash',
};
const request = (signal: AbortSignal) => new Request('http://localhost/api/execute', {
    method: 'POST', body: JSON.stringify(body), signal,
});

describe('selected Alibaba route cancellation', () => {
    const originalEnv = process.env;
    let tempDir = '';
    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-cancel-route-'));
        process.env = { ...originalEnv, CVF_RATE_LIMIT: '10000', CVF_PROVIDER_QUOTA_PER_MIN: '10000',
            DASHSCOPE_API_KEY: 'test-key', CVF_FALSE_POSITIVE_REPORTS_PATH: path.join(tempDir, 'events.jsonl') };
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        getApprovalStore().clear();
        resetRateLimitStoresForTest();
        executeAIMock.mockReset();
        evaluateEnforcementMock.mockReset().mockReturnValue({ status: 'ALLOW', reasons: [] });
        verifySessionCookieMock.mockReset().mockResolvedValue({ userId: 'synthetic-user', user: 'synthetic',
            role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 3600000 });
        checkTeamQuotaMock.mockReset().mockResolvedValue({ exceeded: false, currentUSD: 0,
            softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
        appendAuditEventMock.mockReset().mockResolvedValue({ id: 'synthetic-event' });
        finalResponseHook.mockReset();
    });
    afterEach(async () => {
        process.env = originalEnv;
        if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it('preaborted selected request has no provider call and a fixed 499 diagnostic', async () => {
        const incoming = new AbortController();
        const req = request(incoming.signal);
        incoming.abort('private reason');
        const response = await POST(req as never);
        const data = await response.json();
        expect(response.status).toBe(499);
        expect(data).toMatchObject({ success: false, diagnostic: { class: 'request_cancelled', retryable: false, userAction: 'none' },
            providerAttemptReconciliation: { admittedAttemptCount: 0, providerCallCount: 0 } });
        expect(executeAIMock).not.toHaveBeenCalled();
        expect(JSON.stringify(data)).not.toContain('private reason');
    });

    it('stops a late provider success and does not publish an output or receipt', async () => {
        let complete!: (value: unknown) => void;
        executeAIMock.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
        const incoming = new AbortController();
        const req = request(incoming.signal);
        const pending = POST(req as never);
        await vi.waitFor(() => expect(executeAIMock).toHaveBeenCalledTimes(1));
        expect(executeAIMock.mock.calls[0][3].signal).toBe(req.signal);
        incoming.abort('private reason');
        complete({ success: true, output: 'late synthetic output', provider: 'alibaba', model: 'qwen-flash' });
        const response = await pending;
        const data = await response.json();
        expect(response.status).toBe(499);
        expect(data.providerAttemptReconciliation).toMatchObject({ admittedAttemptCount: 1, providerCallCount: 1, reconciles: true });
        expect(data.output).toBeUndefined();
        expect(data.governanceEvidenceReceipt).toBeUndefined();
        expect(JSON.stringify(data)).not.toContain('private reason');
    });

    it('suppresses a normal response completed after cancellation during final async work', async () => {
        const validOutput = '## Governed Response\n\nThis structured synthetic recommendation has enough detail for output validation.\n\n1. Review context.\n2. Apply plan.\n3. Provide next steps.';
        executeAIMock.mockResolvedValue({ success: true, output: validOutput, provider: 'alibaba', model: 'qwen-flash' });
        let complete!: (value: Response) => void;
        finalResponseHook.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
        const incoming = new AbortController();
        const pending = POST(request(incoming.signal) as never);
        await vi.waitFor(() => expect(finalResponseHook).toHaveBeenCalledTimes(1));
        incoming.abort('private reason');
        complete(Response.json({ success: true, output: 'late output', governanceEvidenceReceipt: { receiptId: 'late' } }));
        const response = await pending;
        const data = await response.json();
        expect(response.status).toBe(499);
        expect(data).toMatchObject({ success: false, diagnostic: { class: 'request_cancelled' } });
        expect(data.output).toBeUndefined();
        expect(data.governanceEvidenceReceipt).toBeUndefined();
    });
});
