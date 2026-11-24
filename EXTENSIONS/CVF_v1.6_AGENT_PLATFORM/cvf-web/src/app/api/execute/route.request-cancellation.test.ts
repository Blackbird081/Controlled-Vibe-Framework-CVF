import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const executeAIMock = vi.hoisted(() => vi.fn());
const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());
const appendAuditEventMock = vi.hoisted(() => vi.fn());
const finalResponseHook = vi.hoisted(() => vi.fn());
const provenanceMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai', () => ({ executeAI: executeAIMock, CVF_SYSTEM_PROMPT: 'BASE_SYSTEM_PROMPT' }));
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: evaluateEnforcementMock }));
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
    resolveVerifiedSessionProvenance: provenanceMock,
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
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    LINEAGE_CONFIG_ENV,
    _testOnlySetStoreHooks,
    parseLineageConfig,
    provisionTenantMetadata,
    readLineage,
    readTenantCapacity,
    resolveSessionIdentity,
    type LineageConfig,
} from '@/lib/server/canonical-web-lineage';

const body = {
    templateId: 'documentation', templateName: 'Documentation',
    intent: 'Analyze synthetic documentation needs',
    inputs: { topic: 'Synthetic guide', audience: 'Operators', scope: 'Basic workflow' },
    provider: 'alibaba', model: 'qwen-plus-character',
};
const request = (signal: AbortSignal) => new Request('http://localhost/api/execute', {
    method: 'POST', body: JSON.stringify(body), signal,
});
const validOutput = '## Governed Response\n\nThis structured synthetic recommendation has enough detail for output validation.\n\n1. Review context.\n2. Apply plan.\n3. Provide next steps.';
const respond = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }), { status: 200 });
const journalDirs: string[] = [];
let journalConfig: LineageConfig;

/** Initialized dedicated journal in a temp directory; the server configuration points at it. */
function openJournal(): LineageConfig {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'cvf-cancel-lineage-'));
    journalDirs.push(directory);
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const raw = JSON.stringify({
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-cancel-test',
        tenants: [{ tenantId: 'org-1', activeSlots: 5, archiveSlots: 5 }],
    });
    const parsed = parseLineageConfig(raw);
    if (!parsed.ok) throw new Error(`journal config ${parsed.reason}`);
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    process.env[LINEAGE_CONFIG_ENV] = raw;
    return parsed.config;
}
function readJournal(canonicalId: string) {
    const identity = resolveSessionIdentity(journalConfig, { qualified: true, userId: 'synthetic-user', orgId: 'org-1', teamId: 'team-1' });
    if (!identity.ok) throw new Error('identity');
    return readLineage(journalConfig, identity.value, canonicalId);
}

describe('selected Alibaba route cancellation', () => {
    const originalEnv = process.env;
    let tempDir = '';
    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-cancel-route-'));
        process.env = { ...originalEnv, CVF_RATE_LIMIT: '10000', CVF_PROVIDER_QUOTA_PER_MIN: '10000',
            DASHSCOPE_API_KEY: 'test-key', CVF_FALSE_POSITIVE_REPORTS_PATH: path.join(tempDir, 'events.jsonl'),
            CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: '1', CVF_ALIBABA_FREE_QUOTA_ONLY: '1' };
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
        provenanceMock.mockReset().mockResolvedValue({ qualified: true, userId: 'synthetic-user', orgId: 'org-1', teamId: 'team-1',
            role: 'admin', oauthProvider: 'github', oauthSubject: 'subject-1', expiresAt: Date.now() + 3600000 });
        journalConfig = openJournal();
    });
    afterEach(async () => {
        _testOnlySetStoreHooks(undefined);
        vi.unstubAllGlobals();
        while (journalDirs.length) rmSync(journalDirs.pop()!, { recursive: true, force: true });
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
        // Cancellation before the port: no ordinal is reserved and nothing is recorded or finalized.
        const capacity = readTenantCapacity(journalConfig, 'org-1');
        expect(capacity.ok && capacity.value.activeUsed).toBe(0);
        expect(data.canonicalLineage).toBeUndefined();
    });

    it('stops a late provider success and does not publish an output or receipt', async () => {
        // The selected route reaches the provider through the canonical port (fetch), not through executeAI.
        let complete!: (value: Response) => void;
        const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>(resolve => { complete = resolve; }));
        vi.stubGlobal('fetch', fetchMock);
        const incoming = new AbortController();
        const req = request(incoming.signal);
        const pending = POST(req as never);
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
        incoming.abort('private reason');
        complete(respond('late synthetic output'));
        const response = await pending;
        const data = await response.json();
        expect(response.status).toBe(499);
        expect(data.providerAttemptReconciliation).toMatchObject({ admittedAttemptCount: 1, providerCallCount: 1, reconciles: true });
        expect(data.output).toBeUndefined();
        expect(data.governanceEvidenceReceipt).toBeUndefined();
        expect(JSON.stringify(data)).not.toContain('private reason');
        expect(JSON.stringify(data)).not.toContain('late synthetic output');
        // Cancellation after the ordinal was reserved: the settled ordinal stays recorded and the envelope is finalized CANCELLED.
        expect(data.canonicalLineage).toMatchObject({ recordingStatus: 'RECORDED' });
        expect(data.canonicalLineage.history).toHaveLength(1);
        const stored = readJournal(data.canonicalLineage.canonicalId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'CANCELLED' } });
    });

    it('suppresses a normal response completed after cancellation during final async work', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(validOutput)));
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
        // Cancellation after the port result: history is retained and finalized as CANCELLED.
        expect(data.canonicalLineage.history).toHaveLength(1);
        expect(data.canonicalLineage.recordingStatus).toBe('RECORDED');
        const stored = readJournal(data.canonicalLineage.canonicalId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'CANCELLED' } });
        expect(JSON.stringify(data)).not.toContain('late output');
    });

    it('does not reserve a retry ordinal when the request is cancelled after the first port result', async () => {
        const incoming = new AbortController();
        const fetchMock = vi.fn().mockImplementation(async () => {
            // A validation-failing answer would normally trigger a retry; the client leaves first.
            const answer = respond('short');
            incoming.abort('private reason');
            return answer;
        });
        vi.stubGlobal('fetch', fetchMock);
        const response = await POST(request(incoming.signal) as never);
        const data = await response.json();
        expect(response.status).toBe(499);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(data.canonicalLineage.history).toHaveLength(1);
        const stored = readJournal(data.canonicalLineage.canonicalId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'CANCELLED' } });
        expect(stored.ok && stored.value.history).toHaveLength(1);
        expect(JSON.stringify(data)).not.toContain('private reason');
    });

    it('retains history and finalizes FAILED when an outer exception follows the initial result', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(validOutput)));
        finalResponseHook.mockImplementation(() => {
            throw new Error('synthetic projection failure');
        });
        const response = await POST(request(new AbortController().signal) as never);
        const data = await response.json();
        expect(response.status).toBe(500);
        expect(data.error).toBe('synthetic projection failure');
        expect(data.canonicalLineage.history).toHaveLength(1);
        expect(data.canonicalLineage.recordingStatus).toBe('RECORDED');
        const stored = readJournal(data.canonicalLineage.canonicalId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'FAILED' } });
        expect(JSON.stringify(data)).not.toContain('Governed Response');
    });

    it('returns the 503 uncertainty contract when finalization also fails after an outer exception', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(validOutput)));
        finalResponseHook.mockImplementation(() => {
            throw new Error('synthetic projection failure');
        });
        // Commit 1 reserve, commit 2 settle, commit 3 finalize (acknowledgement lost).
        let commits = 0;
        _testOnlySetStoreHooks({
            afterCommit() {
                commits += 1;
                if (commits === 3) throw new Error('LOST_ACK');
            },
        });
        const response = await POST(request(new AbortController().signal) as never);
        const data = await response.json();
        expect(response.status).toBe(503);
        expect(response.headers.get('Retry-After')).toBeNull();
        expect(data).toMatchObject({ success: false, code: 'JOURNAL_SETTLEMENT_UNCERTAIN', recordingStatus: 'UNCONFIRMED',
            providerContact: 'POSSIBLE_OR_OBSERVED', automaticRetryAllowed: false });
        expect(data.canonicalLineage.durable).toBe(false);
        expect(JSON.stringify(data)).not.toContain('Governed Response');
    });
});
