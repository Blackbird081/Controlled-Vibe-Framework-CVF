// Text Encoding Exception: preserve the exact Vietnamese synthetic live counterexample.
const nativeProbe = vi.hoisted(() => vi.fn());
const nativeInvoke = vi.hoisted(() => vi.fn());
vi.mock('cvf-model-gateway', async () => {
 const actual = await vi.importActual<typeof import('cvf-model-gateway')>('cvf-model-gateway');
 return { ...actual, probeClaudeCliSubscription: nativeProbe, createClaudeCliExecutionAdapter: () => ({ providerId: 'claude', execute: nativeInvoke }) };
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const auth = vi.hoisted(() => vi.fn());
const provenance = vi.hoisted(() => vi.fn());
// Journal call probe: records call order and detects two journal calls inside one macrotask.
const journalProbe = vi.hoisted(() => ({
    events: [] as string[],
    violations: [] as string[],
    marker: null as { fired: boolean } | null,
}));
const enforcement = vi.hoisted(() => vi.fn());
const quota = vi.hoisted(() => vi.fn());
const audit = vi.hoisted(() => vi.fn());
const cost = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: auth,
    resolveVerifiedSessionProvenance: provenance,
    withSessionAuditPayload: (_session: unknown, payload: unknown) => payload,
}));
vi.mock('@/lib/server/canonical-web-lineage', async () => {
    const actual = await vi.importActual<typeof import('@/lib/server/canonical-web-lineage')>('@/lib/server/canonical-web-lineage');
    // After each journal call a setImmediate marker is queued. The next journal call must find that marker already fired,
    // which is only true when the caller yielded a real macrotask in between.
    function probed<A extends unknown[], R>(name: string, operation: (...args: A) => R): (...args: A) => R {
        return (...args: A): R => {
            if (journalProbe.marker && !journalProbe.marker.fired) {
                journalProbe.violations.push(`${name} ran in the same macrotask as the previous journal call`);
            }
            journalProbe.events.push(name);
            const result = operation(...args);
            const marker = { fired: false };
            journalProbe.marker = marker;
            setImmediate(() => {
                marker.fired = true;
            });
            return result;
        };
    }
    return {
        ...actual,
        reserve: probed('reserve', actual.reserve),
        settle: probed('settle', actual.settle),
        finalize: probed('finalize', actual.finalize),
    };
});
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: enforcement }));
vi.mock('@/lib/quota-guard', () => ({ checkTeamQuota: quota, hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false) }));
vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return { ...actual, appendAuditEvent: audit, appendCostEvent: cost };
});

import { NextResponse } from 'next/server';
import { POST } from './route';
import { resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { _testOnlyResetReplayLedger, computeServiceRequestSignature } from '@/lib/service-token-auth';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { MaoFileRunStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store';
import { controlOperation } from '@/lib/server/canonical-web-admission-control';
import {
    LINEAGE_CONFIG_ENV,
    _testOnlySetStoreHooks,
    parseLineageConfig,
    provisionTenantMetadata,
    readLineage,
    readTenantCapacity,
    resolveSessionIdentity,
    reserve as probedReserve,
    settle as probedSettle,
    type LineageConfig,
} from '@/lib/server/canonical-web-lineage';

const originalEnv = { ...process.env };
const output = '## Governed Response\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.';
const body = (extra: Record<string, unknown> = {}) => ({
    templateId: 'strategy_analysis',
    templateName: 'Strategy',
    intent: 'Analyze the market',
    inputs: { topic: 'SMB market', context: 'Compare market opportunities for SMBs' },
    provider: 'alibaba',
    model: 'qwen-plus-character',
    ...extra,
});
const request = (data: Record<string, unknown>) => new Request('http://localhost/api/execute', { method: 'POST', body: JSON.stringify(data) });
const verifiedProvenance = { qualified: true as const, userId: 'canonical-user', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'subject-1', expiresAt: Date.now() + 3600000 };
const journalDirs: string[] = [];
const nodeRequire = createRequire(path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts'));
let journalConfig: LineageConfig;

/** Creates an initialized dedicated journal in a temp directory and points the server configuration at it. */
function openJournal(activeSlots = 5, withService = false): LineageConfig {
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-lineage-'));
    journalDirs.push(directory);
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const raw = JSON.stringify({
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-route-test',
        tenants: [{ tenantId: 'org-1', activeSlots, archiveSlots: 5 }, ...(withService ? [{ tenantId: 'org-2', activeSlots, archiveSlots: 5 }] : [])],
        ...(withService ? { servicePrincipal: { principalId: 'service-test', tenantId: 'org-2' } } : {}),
    });
    const parsed = parseLineageConfig(raw);
    if (!parsed.ok) throw new Error(`journal config ${parsed.reason}`);
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    process.env[LINEAGE_CONFIG_ENV] = raw;
    return parsed.config;
}
function readJournal(config: LineageConfig, canonicalId: string) {
    const identity = resolveSessionIdentity(config, { qualified: true, userId: 'canonical-user', orgId: 'org-1', teamId: 'team-1' });
    if (!identity.ok) throw new Error('identity');
    return readLineage(config, identity.value, canonicalId);
}
/** Throws after the Nth committed transaction (lost acknowledgement gives COMMIT_UNKNOWN for that operation). */
function loseAcknowledgementOnCommit(commitNumber: number): void {
    let commits = 0;
    _testOnlySetStoreHooks({
        afterCommit() {
            commits += 1;
            if (commits === commitNumber) throw new Error('LOST_ACK');
        },
    });
}
const respond = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }), { status: 200 });

const strictCapCounterexample = "## What This Document Is For\nHướng dẫn nhân viên kho mới nhận một lô hàng đúng quy trình.\n\n## Step-By-Step Procedure\n1. Đối chiếu phiếu giao với đơn mua hàng.\n2. Kiểm tra kỹ số lượng và tình trạng thực tế của hàng hóa.\n3. Ký nhận và nhập liệu vào hệ thống (nếu phát hiện hàng lỗi, bắt buộc chụp ảnh và báo bộ phận mua hàng trong ngày).\n\n## Final Handoff Acceptance Checklist\n- [ ] Đã đối chiếu chính xác phiếu giao và đơn mua.\n- [ ] Đã kiểm đếm đủ số lượng và tình trạng bao bì.\n- [ ] Đã hoàn tất ký nhận và cập nhật vào phần mềm.\n- [ ] Đã xử lý đúng quy định cho các trường hợp hàng lỗi.";
const strictDoc = { templateId: "documentation", templateName: "Documentation", intent: "Write a warehouse procedure", inputs: { subject: "Viết quy trình nhận hàng 3 bước, dưới 100 từ", currentNotes: "Quy trình dưới 100 từ; hàng lỗi phải chụp ảnh và báo mua hàng trong ngày", readerGoal: "Nhân viên kho mới" }, cvfRiskLevel: "R1" };

describe('isolated canonical route candidate', () => {
    beforeEach(() => {
        process.env = { ...originalEnv, NODE_ENV: 'test', ALIBABA_API_KEY: 'fixture-key', CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: '1', CVF_ALIBABA_FREE_QUOTA_ONLY: '1', CVF_PROVIDER_QUOTA_PER_MIN: '10000', CVF_RATE_LIMIT: '10000' };
        delete process.env.CVF_CLAUDE_EXECUTION_MODE;
        nativeProbe.mockReset().mockResolvedValue({ state: 'available', checkedAt: '2026-11-13T00:00:00Z', executionSurface: 'claude_cli_subscription' });
        nativeInvoke.mockReset().mockResolvedValue({ text: output, executionSurface: 'claude_cli_subscription', nativeProcessState: 'started', observedModelId: 'fixture-observed-model' });
        auth.mockReset().mockResolvedValue({ userId: 'canonical-user', user: 'canonical-user', role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 3600000 });
        provenance.mockReset().mockResolvedValue(verifiedProvenance);
        journalProbe.events.length = 0;
        journalProbe.violations.length = 0;
        journalProbe.marker = null;
        journalConfig = openJournal();
        enforcement.mockReset().mockReturnValue({ status: 'ALLOW', reasons: [] });
        quota.mockReset().mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
        audit.mockReset().mockResolvedValue({ id: 'fixture-audit' });
        cost.mockReset().mockResolvedValue({ id: 'fixture-cost' });
        resetRateLimitStoresForTest();
        _testOnlyResetReplayLedger();
    });
    afterEach(() => {
        _testOnlySetStoreHooks(undefined);
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        while (journalDirs.length) rmSync(journalDirs.pop()!, { recursive: true, force: true });
    });

    it.each(['direct', 'single-worker'])('refuses the exact strict-cap counterexample on %s without retry or a held envelope', async lane => {
        delete process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN;
        delete process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER;
        if (lane === 'single-worker') {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-cap-single-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
        }
        const fetch = vi.fn().mockResolvedValue(respond(strictCapCounterexample)); vi.stubGlobal('fetch', fetch);
        const response = await POST(request(body(strictDoc)) as never); const data = await response.json();
        expect(response.status).toBe(422); expect(data.success).toBe(false); expect(data.output).toBeUndefined();
        expect(fetch).toHaveBeenCalledTimes(1); expect(data.automaticRetryAllowed).toBe(false);
        expect(data.outputValidation).toMatchObject({ retryAttempts: 0, wordLimit: { observed: 114, limit: 99 } });
        const stored = readJournal(journalConfig, data.governanceEnvelope.envelopeId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'VALIDATION_FAILED' } });
        expect(data.canonicalLineage.history).toHaveLength(1);
        expect(data.canonicalLineage.history[0].state).toBe('SETTLED');
    });
    it('does not apply a documentation word maximum to a non-documentation template', async () => {
        const fetch = vi.fn().mockResolvedValue(respond(strictCapCounterexample)); vi.stubGlobal('fetch', fetch);
        const response = await POST(request(body({ inputs: { targetMarket: 'SMBs', subject: 'Viết quy trình nhận hàng 3 bước, dưới 100 từ' } })) as never);
        const data = await response.json();
        expect(response.status).toBe(200); expect(data.success).toBe(true); expect(data.output).toBe(strictCapCounterexample);
        expect(data.outputValidation?.wordLimit).toBeUndefined();
        expect(data.outputValidation?.issues ?? []).not.toContain('WORD_LIMIT_EXCEEDED');
    });
    it('keeps exhausted RETRY validation as EXHAUSTED with the retry wording', async () => {
        const fetch = vi.fn().mockImplementation(async () => respond('Too short.')); vi.stubGlobal('fetch', fetch);
        const response = await POST(request(body()) as never); const data = await response.json();
        expect(response.status).toBe(422); expect(data.output).toBeUndefined();
        expect(data.error).toBe('Generated response failed output validation after retry attempts.');
        expect(data.automaticRetryAllowed).toBeUndefined();
        expect(data.outputValidation.issues).toContain('TOO_SHORT');
        expect(fetch.mock.calls.length).toBeGreaterThan(1);
        const stored = readJournal(journalConfig, data.governanceEnvelope.envelopeId);
        expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'EXHAUSTED' } });
    });
    it.each([
        ['HTML intent', { htmlPilotIntent: { operationKey: 'x' } }],
        ['HTML template', { templateId: 'web_build_handoff' }],
        ['image URL', { imageUrl: ' https://example.invalid/image ' }],
        ['image bytes', { imageBase64: 'eA==' }],
        ['unsupported provider (gemini)', { provider: 'gemini' }],
        ['unsupported provider (deepseek)', { provider: 'deepseek' }],
        ['OpenAI image URL', { provider: 'openai', imageUrl: 'https://example.invalid/image' }],
        ['OpenAI vision flag', { provider: 'openai', vision: true }],
        ['OpenAI HTML intent', { provider: 'openai', htmlPilotIntent: { operationKey: 'x' } }],
        ['OpenAI HTML template', { provider: 'openai', templateId: 'web_build_handoff' }],
    ])('rejects %s before provider transport', async (_name, extra) => {
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body(extra)) as never);
        expect(res.status).toBe(403);
        expect((await res.json()).error).toBe('This route supports Alibaba, OpenAI and Claude subscription text requests only.');
        expect(fetch).not.toHaveBeenCalled();
        expect(enforcement).not.toHaveBeenCalled();
    });

    it('performs authentication and shape validation before profile admission', async () => {
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        auth.mockResolvedValueOnce(null);
        const unauthenticated = await POST(request(body({ templateId: 'web_build_handoff' })) as never);
        expect(unauthenticated.status).toBe(401);
        const malformed = await POST(request(body({ templateId: 'web_build_handoff', inputs: [] })) as never);
        expect(malformed.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a non-Alibaba router selection after the early profile check', async () => {
        const router = await import('@/lib/ai/provider-router-adapter');
        const original = router.routeWebProvider;
        vi.spyOn(router, 'routeWebProvider').mockImplementation(input => ({ ...original(input), decision: 'ALLOW', selectedProvider: 'openai' }));
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body()) as never);
        expect(res.status).toBe(403);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('honors a knowledge rejection before any canonical provider call', async () => {
        const knowledge = await import('./route-context-selection');
        const rejection = vi.spyOn(knowledge, 'sot3RejectionResponse').mockReturnValue(NextResponse.json({ success: false, error: 'fixture knowledge denial' }, { status: 409 }));
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body()) as never);
        expect(res.status).toBe(409);
        expect(rejection).toHaveBeenCalledOnce();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('passes the DLP-filtered prompt to the fixture transport', async () => {
        const dlp = await import('@/lib/dlp-filter');
        vi.spyOn(dlp, 'applyDLPFilter').mockImplementation(async text => ({ redacted: text.replaceAll('fixture-private-token', '[REDACTED]'), matches: [], wasRedacted: text.includes('fixture-private-token') }));
        const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: output }, finish_reason: 'stop' }] }), { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body({ inputs: { targetMarket: 'fixture-private-token' } })) as never);
        expect(res.status).toBe(200);
        expect(fetch).toHaveBeenCalledOnce();
        const payload = String(fetch.mock.calls[0][1].body);
        expect(payload).toContain('[REDACTED]');
        expect(payload).not.toContain('fixture-private-token');
    });

    it('returns quota failure and receipt without provider transport', async () => {
        process.env.CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED = '0';
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body()) as never);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('quota_locked');
        expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('B1 returns quota_locked without provider transport for the default model after its free-quota expiry date', async () => {
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse('2027-02-10T00:00:00.000Z'));
        try {
            const res = await POST(request(body()) as never);
            const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.canonicalGateway.providerDiagnostic.code).toBe('quota_locked');
            expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
            expect(fetch).not.toHaveBeenCalled();
        } finally { vi.useRealTimers(); }
    });

    it('retains a safe canonical receipt when cancellation occurs during transport', async () => {
        const controller = new AbortController();
        const fetch = vi.fn().mockImplementation(async () => { controller.abort('fixture-private-reason'); throw new TypeError('aborted'); });
        vi.stubGlobal('fetch', fetch);
        const req = new Request('http://localhost/api/execute', { method: 'POST', body: JSON.stringify(body()), signal: controller.signal });
        const res = await POST(req as never);
        const data = await res.json();
        expect(res.status).toBe(499);
        expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.canonicalGateway.canonicalExecutionId);
        expect(data.canonicalGateway.providerDiagnostic.code).toBe('request_cancelled');
        expect(data.providerAttemptReconciliation.providerCallCount).toBe(1);
        expect(JSON.stringify(data)).not.toContain('fixture-private-reason');
    });

    it('uses the same admitted canonical port on a validation retry', async () => {
        const fetch = vi.fn().mockResolvedValueOnce(respond('short')).mockResolvedValueOnce(respond(output));
        vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(data.providerAttemptReconciliation).toMatchObject({ admittedAttemptCount: 2, providerCallCount: 2, retryCount: 1 });
        expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
        expect(data.canonicalGateway.materialContextManifest.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
    });

    it('runs the real canonical port once and keeps unknown actual usage separate from telemetry estimates', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: output }, finish_reason: 'stop' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', fetch);
        const res = await POST(request(body()) as never);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(data.success).toBe(true);
        expect(data.usage).toBeUndefined();
        expect(data.canonicalGateway.usageProvenance).toBe('unknown');
        expect(data.canonicalGateway.actualUsage).toBeUndefined();
        expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
        expect(data.canonicalGateway.materialContextManifest.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
        expect(data.governanceEvidenceReceipt.runtimeTelemetry.tokenUsageProvenance).toBe('estimated_or_mixed');
        expect(typeof data.governanceEvidenceReceipt.runtimeTelemetry.tokenUsage.totalTokens).toBe('number');
    });
    describe('OpenAI through the same canonical Gateway path', () => {
        const secret = 'sk-fixture-openai-key-do-not-emit';
        const openAiBody = (extra: Record<string, unknown> = {}) => body({ provider: 'openai', model: undefined, ...extra });
        const meetingNotes = {
            templateId: 'meeting_notes',
            templateName: 'Meeting Notes',
            intent: 'Summarize discussion notes',
            inputs: { meeting_topic: 'Weekly planning', raw_notes: 'Agree the agenda for next week.' },
        };
        const usageReply = (text: string) => new Response(JSON.stringify({
            choices: [{ message: { content: text }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 111, completion_tokens: 222, total_tokens: 333 },
        }), { status: 200 });
        beforeEach(() => { process.env.OPENAI_API_KEY = secret; });

        it('runs once through the Gateway to the admitted OpenAI endpoint with provider-reported usage and one settled history entry', async () => {
            const fetch = vi.fn().mockResolvedValue(usageReply(output)); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody(meetingNotes)) as never); const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.success).toBe(true); expect(data.provider).toBe('openai'); expect(data.output).toBe(output);
            expect(fetch).toHaveBeenCalledTimes(1);
            const [url, init] = fetch.mock.calls[0];
            expect(url).toBe('https://api.openai.com/v1/chat/completions');
            expect(init.redirect).toBe('error'); expect(init.headers.Authorization).toBe(`Bearer ${secret}`);
            expect(JSON.parse(String(init.body))).toMatchObject({ model: 'gpt-6-luna', max_completion_tokens: 4096, reasoning_effort: 'none' });
            // Usage and provenance come only from the provider response.
            expect(data.usage).toEqual({ inputTokens: 111, outputTokens: 222, totalTokens: 333 });
            expect(data.canonicalGateway.usageProvenance).toBe('provider_reported_partial_or_complete');
            expect(data.canonicalGateway.receipt.providerId).toBe('openai');
            expect(data.canonicalGateway.receipt.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'finalize']);
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(data.canonicalLineage.history[0]).toMatchObject({ ordinal: 1, state: 'SETTLED', durable: true });
            expect(JSON.stringify(data)).not.toContain(secret);
            const stored = readJournal(journalConfig, data.governanceEnvelope.envelopeId);
            expect(JSON.stringify(stored)).not.toContain(secret);
            expect(stored.ok && stored.value.terminal?.refs).toMatchObject({ guard: expect.stringMatching(/^guard:allow:/), sot3: 'sot3:none:no_knowledge_retrieval' });
        });

        it('keeps provider-reported usage in the strict word-limit refusal', async () => {
            const fetch = vi.fn().mockResolvedValue(usageReply(strictCapCounterexample)); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody(strictDoc)) as never); const data = await res.json();
            expect(res.status).toBe(422); expect(data.output).toBeUndefined(); expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.usage).toEqual({ inputTokens: 111, outputTokens: 222, totalTokens: 333 });
            expect(data.outputValidation.wordLimit).toMatchObject({ observed: 114, limit: 99 });
        });

        it('reports an unavailable usage as unknown instead of inventing it', async () => {
            const fetch = vi.fn().mockResolvedValue(respond(output)); vi.stubGlobal('fetch', fetch);
            const data = await (await POST(request(openAiBody()) as never)).json();
            expect(data.success).toBe(true);
            expect(data.usage).toBeUndefined();
            expect(data.canonicalGateway.usageProvenance).toBe('unknown');
        });

        it('honors an explicit model and reasoning-family token parameter', async () => {
            // gpt-5 is outside the default allowlist; the server operator opts in explicitly.
            process.env.CVF_OPENAI_ALLOWED_MODELS = 'gpt-5-mini';
            const fetch = vi.fn().mockResolvedValue(respond(output)); vi.stubGlobal('fetch', fetch);
            expect((await POST(request(openAiBody({ ...meetingNotes, model: 'gpt-5-mini' })) as never)).status).toBe(200);
            const sent = JSON.parse(String(fetch.mock.calls[0][1].body));
            expect(sent.model).toBe('gpt-5-mini'); expect(sent).toHaveProperty('max_completion_tokens', 4096);
            expect(sent).not.toHaveProperty('max_tokens'); expect(sent).not.toHaveProperty('temperature');
        });

        it('refuses a request for OpenAI without a server key and never routes to another provider or the network', async () => {
            delete process.env.OPENAI_API_KEY;
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody()) as never); const data = await res.json();
            expect(res.status).toBe(400);
            expect(data.error).toMatch(/API key not configured for provider: openai/);
            expect(data.provider).toBe('openai');
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
        });

        it('B1 denies an OPENAI_BASE_URL outside the admitted OpenAI host with destination_denied and no network call', async () => {
            process.env.OPENAI_BASE_URL = 'https://attacker.example/v1';
            const fetch = vi.fn().mockResolvedValue(usageReply(output)); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody()) as never); const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.canonicalGateway.providerDiagnostic.code).toBe('destination_denied');
            expect(fetch).not.toHaveBeenCalled();
            expect(JSON.stringify(data)).not.toContain(secret);
        });

        it('rejects a router selection that substitutes another provider for the requested OpenAI provider', async () => {
            const router = await import('@/lib/ai/provider-router-adapter');
            const original = router.routeWebProvider;
            vi.spyOn(router, 'routeWebProvider').mockImplementation(input => ({ ...original(input), decision: 'ALLOW', selectedProvider: 'alibaba' }));
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody()) as never);
            expect(res.status).toBe(403); expect((await res.json()).code).toBe('ROUTED_PROVIDER_MISMATCH'); expect(fetch).not.toHaveBeenCalled();
        });

        // Each paid-provider failure must be classified from its closed code + HTTP status, never as a generic retryable error.
        it.each([
            ['401 bad key', 401, { error: { code: 'invalid_api_key' } }, { code: 'provider_http_error', httpStatus: 401 }, { class: 'invalid_api_key', retryable: false, userAction: 'check_api_key' }],
            ['403 forbidden', 403, { error: { code: 'forbidden' } }, { code: 'provider_http_error', httpStatus: 403 }, { class: 'invalid_api_key', retryable: false, userAction: 'check_api_key' }],
            ['429 rate limit', 429, { error: { code: 'rate_limit_exceeded' } }, { code: 'provider_http_error', httpStatus: 429 }, { class: 'rate_limited', retryable: true, userAction: 'wait_and_retry' }],
            ['429 insufficient quota', 429, { error: { code: 'insufficient_quota' } }, { code: 'quota_locked', httpStatus: 429 }, { class: 'insufficient_balance', retryable: false, userAction: 'top_up_or_check_quota' }],
            ['404 unknown model', 404, { error: { code: 'model_not_found' } }, { code: 'provider_http_error', httpStatus: 404 }, { class: 'model_unavailable', retryable: false, userAction: 'change_model' }],
            ['400 bad request', 400, { error: { code: 'invalid_request_error' } }, { code: 'provider_http_error', httpStatus: 400 }, { class: 'provider_http_error', retryable: false, userAction: 'do_not_retry_without_new_evidence' }],
            ['500 server error', 500, { error: { code: 'server_error' } }, { code: 'provider_http_error', httpStatus: 500 }, { class: 'provider_http_error', retryable: true, userAction: 'wait_and_retry' }],
        ])('keeps a provider HTTP failure typed, settled and secret-free: %s', async (_name, status, payload, gateway, diagnostic) => {
            const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...payload, echo: secret }), { status })); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody()) as never); const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.canonicalGateway.providerDiagnostic).toMatchObject(gateway);
            expect(data.diagnostic).toMatchObject({ stage: 'provider', httpStatus: status, ...diagnostic });
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(JSON.stringify(data)).not.toContain(secret);
            expect(data.canonicalLineage.history).toHaveLength(1);
        });

        it('classifies a finish_reason length answer as a non-retryable incomplete output and keeps provider usage', async () => {
            const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: output }, finish_reason: 'length' }], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } }), { status: 200 })); vi.stubGlobal('fetch', fetch);
            const data = await (await POST(request(openAiBody()) as never)).json();
            expect(data.success).toBe(false);
            expect(data.canonicalGateway.providerDiagnostic).toMatchObject({ code: 'output_incomplete' });
            expect(data.diagnostic).toMatchObject({ class: 'provider_parse_error', retryable: false, userAction: 'revise_request' });
            expect(data.usage).toEqual({ inputTokens: 3, outputTokens: 4, totalTokens: 7 });
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('classifies a provider deadline as a retryable timeout', async () => {
            process.env.CVF_AI_PROVIDER_TIMEOUT_MS = '1000';
            const fetch = vi.fn().mockImplementation((_url: string, init: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
                init.signal.addEventListener('abort', () => reject(new TypeError('aborted')));
            }));
            vi.stubGlobal('fetch', fetch);
            const data = await (await POST(request(openAiBody()) as never)).json();
            expect(data.success).toBe(false);
            expect(data.canonicalGateway.providerDiagnostic.code).toBe('provider_timeout');
            expect(data.diagnostic).toMatchObject({ class: 'provider_timeout', retryable: true, userAction: 'wait_and_retry' });
            expect(fetch).toHaveBeenCalledTimes(1);
        }, 15000);

        it('returns a provider-neutral, secret-free MAO failure for OpenAI (no native-subscription wording)', async () => {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-mao-openai-fail-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
            const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'invalid_api_key', echo: secret } }), { status: 401 })); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody({ cvfRiskLevel: 'R1' })) as never); const data = await res.json();
            expect(res.status).toBe(503);
            expect(data.provider).toBe('openai'); expect(data.automaticRetryAllowed).toBe(false); expect(data.output).toBeUndefined();
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(JSON.stringify(data)).not.toMatch(/native|subscription|claude/i);
            expect(JSON.stringify(data)).not.toContain(secret);
        });

        it.each([
            ['401 bad key', 401, { error: { code: 'invalid_api_key' } }, { class: 'invalid_api_key', retryable: false, userAction: 'check_api_key', httpStatus: 401 }],
            ['429 insufficient quota', 429, { error: { code: 'insufficient_quota' } }, { class: 'insufficient_balance', retryable: false, userAction: 'top_up_or_check_quota', httpStatus: 429 }],
            ['429 rate limit (retryable class forced to no-retry)', 429, { error: { code: 'rate_limit_exceeded' } }, { class: 'rate_limited', retryable: false, userAction: 'do_not_retry_without_new_evidence', httpStatus: 429 }],
        ])('projects the same typed diagnostic for an OpenAI MAO provider failure: %s', async (_name, status, payload, diagnostic) => {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-mao-openai-typed-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
            const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...payload, echo: secret }), { status })); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody({ cvfRiskLevel: 'R1' })) as never); const data = await res.json();
            expect(res.status).toBe(503); expect(data.code).toBe('MAO_OUTCOME_UNKNOWN');
            expect(data.diagnostic).toMatchObject({ stage: 'provider', provider: 'openai', ...diagnostic });
            expect(data.output).toBeUndefined(); expect(data.automaticRetryAllowed).toBe(false); expect(fetch).toHaveBeenCalledTimes(1);
            expect(JSON.stringify(data)).not.toContain(secret); expect(JSON.stringify(data)).not.toMatch(/native|subscription|claude/i);
        });

        it('projects a typed timeout diagnostic as non-retryable for an OpenAI MAO provider failure (outcome unknown)', async () => {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1'; process.env.CVF_AI_PROVIDER_TIMEOUT_MS = '1000';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-mao-openai-timeout-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
            const fetch = vi.fn().mockImplementation((_url: string, init: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
                init.signal.addEventListener('abort', () => reject(new TypeError('aborted')));
            }));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody({ cvfRiskLevel: 'R1' })) as never); const data = await res.json();
            expect(res.status).toBe(503); expect(data.code).toBe('MAO_OUTCOME_UNKNOWN'); expect(data.output).toBeUndefined();
            expect(data.diagnostic).toMatchObject({ stage: 'provider', provider: 'openai', class: 'provider_timeout', retryable: false, userAction: 'do_not_retry_without_new_evidence' });
            expect(data.automaticRetryAllowed).toBe(false); expect(fetch).toHaveBeenCalledTimes(1);
        }, 15000);

        it('applies owner Stop before any OpenAI provider entry', async () => {
            const identity = resolveSessionIdentity(journalConfig, verifiedProvenance); if (!identity.ok) throw Error('identity');
            expect(controlOperation(journalConfig, identity.value, { action: 'stop' }).ok).toBe(true);
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody()) as never);
            expect(res.status).toBe(409); expect((await res.json()).code).toBe('ADMISSION_STOPPED'); expect(fetch).not.toHaveBeenCalled();
        });

        it('uses the same admitted port on an OpenAI validation retry (two provider calls, two ordinals)', async () => {
            const fetch = vi.fn().mockResolvedValueOnce(respond('short')).mockResolvedValueOnce(respond(output)); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody({ intent: 'Analyze the market in depth' })) as never); const data = await res.json();
            expect(res.status).toBe(200); expect(fetch).toHaveBeenCalledTimes(2);
            expect(data.providerAttemptReconciliation).toMatchObject({ admittedAttemptCount: 2, providerCallCount: 2, retryCount: 1 });
            expect(data.canonicalLineage.history.map((entry: { ordinal: number }) => entry.ordinal)).toEqual([1, 2]);
        });

        it('runs OpenAI through the single MAO worker with the same ordinal-1 reservation', async () => {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-mao-openai-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
            const fetch = vi.fn().mockResolvedValue(usageReply(output)); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(openAiBody({ cvfRiskLevel: 'R1' })) as never); const data = await res.json();
            expect(res.status).toBe(200); expect(data.output).toBe(output); expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.maoExecution).toMatchObject({ canonicalExecutionId: data.canonicalGateway.canonicalExecutionId, state: 'succeeded' });
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(data.provider).toBe('openai');
        });
    });

    describe('opt-in single native MAO worker', () => {
        function enable() {
            process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const directory = mkdtempSync(path.join(tmpdir(), 'cvf-route-mao-')); journalDirs.push(directory);
            process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
            return directory;
        }
        it('returns the actual canonical AI output and safe durable MAO references through the final mapper', async () => {
            const directory = enable(); const fetch = vi.fn().mockResolvedValue(respond(output)); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(200); expect(data.output).toBe(output); expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.maoExecution).toMatchObject({ canonicalExecutionId: data.canonicalGateway.canonicalExecutionId, state: 'succeeded' });
            expect(Object.keys(data.maoExecution).sort()).toEqual(['attemptId', 'canonicalExecutionId', 'invocationId', 'state', 'taskGraphId', 'taskId']);
            const run = await new MaoFileRunStore(directory).resumeRun(data.maoExecution.taskGraphId);
            expect(run.ok && run.events.at(-1)).toMatchObject({ resultingState: 'succeeded' });
            expect(data.canonicalLineage.history).toHaveLength(1);
        });
        it('does not run output-validation retries or another worker when the selected output is short', async () => {
            enable(); const fetch = vi.fn().mockResolvedValue(respond('short')); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(422); expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.maoExecution.state).toBe('succeeded'); expect(data.maoExecution.canonicalExecutionId).toBe(data.canonicalGateway.canonicalExecutionId);
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(data.providerAttemptReconciliation.providerCallCount).toBe(1);
        });
        it('mode on without a durable path refuses before reservation or actual provider entry', async () => {
            enable(); delete process.env.CVF_MAO_DURABLE_RUN_PATH; const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(503); expect(data.code).toBe('MAO_NOT_READY'); expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
        });
        it.each(['R2', 'R3'])('refuses actual enforcement %s despite a lower body risk without downgrade', async riskLevel => {
            enable(); enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel } });
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never);
            expect(response.status).toBe(503); expect((await response.json()).code).toBe('MAO_RISK_DENIED'); expect(fetch).not.toHaveBeenCalled(); expect(journalProbe.events).toEqual([]);
        });
        it('does not lower a higher risk inferred from request content', async () => {
            enable(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1', intent: 'Analyze the market. Risk level R3.' })) as never);
            expect(response.status).toBe(400);
            expect(await response.json()).toMatchObject({
                success: false,
                model: 'guard-blocked',
                governanceEnvelope: { phase: 'INTAKE', riskLevel: 'R3' },
                guardResult: { results: expect.arrayContaining([expect.objectContaining({ guardId: 'risk_gate', decision: 'ESCALATE' })]) },
            });
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
        });
        it('unknown actual provider result returns no AI output and preserves a pending Web attempt', async () => {
            enable(); const fetch = vi.fn().mockRejectedValue(Error('fixture transport lost')); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(503); expect(data.code).toBe('MAO_OUTCOME_UNKNOWN'); expect(data.output).toBeUndefined(); expect(data.automaticRetryAllowed).toBe(false);
            expect(fetch).toHaveBeenCalledTimes(1); const state = readJournal(journalConfig, data.canonicalId);
            expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING'); expect(journalProbe.events).toEqual(['reserve']);
            expect(data.diagnostic).toBeUndefined();
        });
        it.each([
            ['401 bad key', 401, { class: 'invalid_api_key', retryable: false, userAction: 'check_api_key', httpStatus: 401 }],
            ['429 rate limit', 429, { class: 'rate_limited', retryable: false, userAction: 'do_not_retry_without_new_evidence', httpStatus: 429 }],
        ])('projects the typed diagnostic for an Alibaba MAO provider failure without payload or retry: %s', async (_name, status, diagnostic) => {
            const secret = 'sk-fixture-alibaba-key-do-not-emit'; enable();
            const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'fixture' }, echo: secret }), { status })); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(503); expect(data.code).toBe('MAO_OUTCOME_UNKNOWN'); expect(data.output).toBeUndefined(); expect(data.automaticRetryAllowed).toBe(false);
            expect(data.diagnostic).toMatchObject({ stage: 'provider', provider: 'alibaba', ...diagnostic });
            expect(fetch).toHaveBeenCalledTimes(1); expect(JSON.stringify(data)).not.toContain(secret);
            const state = readJournal(journalConfig, data.canonicalId);
            expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING');
        });
        it('Stop denies the selected worker before any graph or provider creation', async () => {
            enable(); const identity = resolveSessionIdentity(journalConfig, verifiedProvenance); if (!identity.ok) throw Error('identity');
            expect(controlOperation(journalConfig, identity.value, { action: 'stop' }).ok).toBe(true);
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ cvfRiskLevel: 'R1' })) as never);
            expect(response.status).toBe(409); expect((await response.json()).code).toBe('ADMISSION_STOPPED'); expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('attempt lineage journal integration', () => {
        const marker = 'UNIQUE-FIXTURE-OUTPUT-MARKER-7731';
        const markedOutput = `${output}\n\n${marker}`;

        it('records one reserve, settle and finalize for an initial success with one RECORDED history entry', async () => {
            const fetch = vi.fn().mockResolvedValue(respond(markedOutput));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(res.headers.get('Retry-After')).toBeNull();
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'finalize']);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.canonicalLineage).toMatchObject({ canonicalId: data.governanceEnvelope.envelopeId, recordingStatus: 'RECORDED', automaticRetryAllowed: false });
            expect(data.canonicalLineage.notice).toContain('No automatic resend');
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(data.canonicalLineage.history[0]).toMatchObject({ ordinal: 1, state: 'SETTLED', durable: true });
            expect(data.canonicalGateway.canonicalExecutionId).toBe(data.governanceEnvelope.envelopeId);
            const stored = readJournal(journalConfig, data.governanceEnvelope.envelopeId);
            expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', recordingStatus: 'CONFIRMED', terminal: { disposition: 'COMPLETED' } });
            expect(journalProbe.events.filter(event => event === 'settle')).toHaveLength(fetch.mock.calls.length);
            // The journal stores only allowlisted fields, never model text.
            expect(JSON.stringify(stored)).not.toContain(marker);
            // Route wiring: finalize received the real Guard decision and the declared SOT3 non-applicability (no knowledge in this scenario).
            expect(stored.ok && stored.value.terminal?.refs).toMatchObject({ guard: expect.stringMatching(/^guard:allow:[0-9a-f]{24}$/), sot3: 'sot3:none:no_knowledge_retrieval' });
            expect(stored.ok && stored.value.terminal?.gaps).not.toContain('GUARD_NOT_RECORDED');
            expect(stored.ok && stored.value.terminal?.gaps).not.toContain('SOT3_NOT_RECORDED');
        });

        it('keeps ordered history with distinct ordinals and one canonical id across a validation retry', async () => {
            const fetch = vi.fn().mockResolvedValueOnce(respond('short')).mockResolvedValueOnce(respond(output));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'reserve', 'settle', 'finalize']);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(data.canonicalLineage.history.map((entry: { ordinal: number }) => entry.ordinal)).toEqual([1, 2]);
            expect(data.canonicalLineage.canonicalId).toBe(data.governanceEnvelope.envelopeId);
            expect(data.canonicalLineage.recordingStatus).toBe('RECORDED');
            const stored = readJournal(journalConfig, data.governanceEnvelope.envelopeId);
            expect(stored.ok && stored.value.history.map(entry => entry.ordinal)).toEqual([1, 2]);
            expect(journalProbe.events.filter(event => event === 'settle')).toHaveLength(fetch.mock.calls.length);
        });

        it('preserves prior history when retry safety screening denies the retry', async () => {
            const safety = await import('@/lib/safety-workflow-chain');
            const original = safety.runSafetyWorkflowChain;
            let screenings = 0;
            vi.spyOn(safety, 'runSafetyWorkflowChain').mockImplementation(text => {
                screenings += 1;
                const result = original(text);
                return screenings > 1 ? { ...result, blocked: true } : result;
            });
            const fetch = vi.fn().mockResolvedValue(respond('short'));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
            const data = await res.json();
            expect(res.status).toBe(400);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.error).toContain('Safety screening blocked the validation retry');
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(data.canonicalGateway.canonicalExecutionId).toBe(data.canonicalLineage.canonicalId);
            const stored = readJournal(journalConfig, data.canonicalLineage.canonicalId);
            expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'DENIED' } });
        });

        it('returns 503 JOURNAL_NOT_READY before the port when the journal is not configured', async () => {
            delete process.env[LINEAGE_CONFIG_ENV];
            const fetch = vi.fn();
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            const data = await res.json();
            expect(res.status).toBe(503);
            expect(data).toMatchObject({ success: false, code: 'JOURNAL_NOT_READY' });
            expect(res.headers.get('Retry-After')).toBeNull();
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
        });

        it('returns 503 JOURNAL_NOT_READY before the port for unqualified provenance and for an unconfigured tenant', async () => {
            const fetch = vi.fn();
            vi.stubGlobal('fetch', fetch);
            provenance.mockResolvedValue({ qualified: false, reason: 'DEVELOPMENT_FALLBACK' });
            const unqualified = await POST(request(body()) as never);
            expect(unqualified.status).toBe(503);
            expect((await unqualified.json()).code).toBe('JOURNAL_NOT_READY');
            provenance.mockResolvedValue({ ...verifiedProvenance, orgId: 'org-not-configured' });
            const foreign = await POST(request(body()) as never);
            expect(foreign.status).toBe(503);
            expect((await foreign.json()).code).toBe('JOURNAL_NOT_READY');
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
        });

        function signedServiceRequest(timestampMs: number = Date.now()) {
            const token = 'fixture-service-token';
            const data = JSON.stringify(body());
            const timestamp = String(timestampMs);
            process.env.CVF_SERVICE_TOKEN = token;
            return new Request('http://localhost/api/execute', { method: 'POST', body: data, headers: {
                'x-cvf-service-token': token,
                'x-cvf-service-timestamp': timestamp,
                'x-cvf-service-signature': computeServiceRequestSignature(token, timestamp, data),
            } });
        }

        it('rejects an unqualified session even when a valid service credential is present', async () => {
            journalConfig = openJournal(5, true);
            provenance.mockResolvedValue({ qualified: false, reason: 'IMPERSONATED' });
            const beforeSession = readTenantCapacity(journalConfig, 'org-1');
            const beforeService = readTenantCapacity(journalConfig, 'org-2');
            const fetch = vi.fn();
            vi.stubGlobal('fetch', fetch);
            const res = await POST(signedServiceRequest() as never);
            expect(res.status).toBe(503);
            expect((await res.json()).code).toBe('JOURNAL_NOT_READY');
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual([]);
            expect(readTenantCapacity(journalConfig, 'org-1')).toEqual(beforeSession);
            expect(readTenantCapacity(journalConfig, 'org-2')).toEqual(beforeService);
        });

        it.each([
            ['absent session', false, 'org-2', 'org-1'],
            ['qualified session', true, 'org-1', 'org-2'],
        ])('uses the correct tenant with %s and a valid service credential', async (_label, hasSession, usedTenant, untouchedTenant) => {
            journalConfig = openJournal(5, true);
            if (!hasSession) auth.mockResolvedValue(null);
            const untouched = readTenantCapacity(journalConfig, untouchedTenant);
            const fetch = vi.fn().mockResolvedValue(respond(output));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(signedServiceRequest() as never);
            expect(res.status).toBe(200);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'finalize']);
            const capacity = readTenantCapacity(journalConfig, usedTenant);
            expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 1 });
            expect(readTenantCapacity(journalConfig, untouchedTenant)).toEqual(untouched);
        });

        it('B1 returns 503 JOURNAL_NOT_READY before the port when the lineage config revision was bumped after provisioning', async () => {
            // Config drift: the journal was provisioned at revision 1; the server configuration now says revision 2.
            process.env[LINEAGE_CONFIG_ENV] = JSON.stringify({ ...JSON.parse(process.env[LINEAGE_CONFIG_ENV]!), revision: 2 });
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            expect(res.status).toBe(503);
            expect(await res.json()).toMatchObject({ success: false, code: 'JOURNAL_NOT_READY' });
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual(['reserve']); // the journal reserve itself refused (CONFIG_DRIFT); settle and finalize never ran
        });

        it('B1 refuses a signed service request older than the 5-minute signature window with 401 and no provider call', async () => {
            journalConfig = openJournal(5, true); auth.mockResolvedValue(null);
            const fetch = vi.fn().mockResolvedValue(respond(output)); vi.stubGlobal('fetch', fetch);
            const stale = await POST(signedServiceRequest(Date.now() - 6 * 60 * 1000) as never);
            expect(stale.status).toBe(401);
            expect((await stale.json()).error).toMatch(/invalid service token or signature/);
            expect(fetch).not.toHaveBeenCalled(); expect(journalProbe.events).toEqual([]);
            // Positive control: the same credential with a fresh timestamp is admitted, so the refusal was the age alone.
            expect((await POST(signedServiceRequest() as never)).status).toBe(200);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('B1 refuses an identical signed service request sent twice: the second is 401 and the provider is called once', async () => {
            // The replay ledger is process-local (in memory, capped, cleared on restart, not shared across processes); this proves
            // replay refusal inside one process only.
            journalConfig = openJournal(5, true); auth.mockResolvedValue(null);
            const fetch = vi.fn().mockResolvedValue(respond(output)); vi.stubGlobal('fetch', fetch);
            const timestamp = Date.now();
            const first = await POST(signedServiceRequest(timestamp) as never);
            expect(first.status).toBe(200);
            const replay = await POST(signedServiceRequest(timestamp) as never);
            expect(replay.status).toBe(401);
            expect((await replay.json()).error).toMatch(/invalid service token or signature/);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'finalize']);
        });

        it('B1 returns 503 ADMISSION_CAPACITY for the 33rd owner once 32 owner controls exist, with no provider call', async () => {
            for (let i = 0; i < 32; i++) {
                const identity = resolveSessionIdentity(journalConfig, { qualified: true, userId: `owner-${i}`, orgId: 'org-1', teamId: 'team-1' });
                if (!identity.ok) throw new Error('identity');
                const stopped = controlOperation(journalConfig, identity.value, { action: 'stop' });
                expect(stopped.ok).toBe(true);
            }
            const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            expect(res.status).toBe(503);
            expect(await res.json()).toMatchObject({ success: false, code: 'ADMISSION_CAPACITY' });
            expect(fetch).not.toHaveBeenCalled();
            expect(journalProbe.events).toEqual(['reserve']);
            const capacity = readTenantCapacity(journalConfig, 'org-1');
            expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 0 });
        });

        it('returns 503 JOURNAL_NOT_READY before the port when the initialized database is gone', async () => {
            rmSync(journalConfig.directory, { recursive: true, force: true });
            const fetch = vi.fn();
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            expect(res.status).toBe(503);
            expect((await res.json()).code).toBe('JOURNAL_NOT_READY');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('returns 429 JOURNAL_TENANT_CAPACITY before the port once the tenant allocation is exhausted', async () => {
            journalConfig = openJournal(1);
            const fetch = vi.fn().mockResolvedValue(respond(output));
            vi.stubGlobal('fetch', fetch);
            expect((await POST(request(body()) as never)).status).toBe(200);
            expect(fetch).toHaveBeenCalledTimes(1);
            const exhausted = await POST(request(body()) as never);
            const data = await exhausted.json();
            expect(exhausted.status).toBe(429);
            expect(data).toMatchObject({ success: false, code: 'JOURNAL_TENANT_CAPACITY' });
            expect(exhausted.headers.get('Retry-After')).toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1);
            const capacity = readTenantCapacity(journalConfig, 'org-1');
            expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 1, activeSlots: 1 });
        });

        it('returns 503 JOURNAL_UNAVAILABLE without entering the port when the reserve transaction fails', async () => {
            _testOnlySetStoreHooks({ afterAcquire() { throw new Error('IO_FAILURE'); } });
            const fetch = vi.fn();
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body()) as never);
            expect(res.status).toBe(503);
            expect((await res.json()).code).toBe('JOURNAL_UNAVAILABLE');
            expect(res.headers.get('Retry-After')).toBeNull();
            expect(fetch).not.toHaveBeenCalled();
        });

        it('returns 503 JOURNAL_BUSY without entering the port while another process holds the write lock', async () => {
            const Database = nodeRequire('better-sqlite3') as new (file: string) => { exec(sql: string): void; close(): void };
            const holder = new Database(path.join(journalConfig.directory, 'cvf-keyvalue-store.sqlite'));
            holder.exec('BEGIN IMMEDIATE');
            try {
                const fetch = vi.fn();
                vi.stubGlobal('fetch', fetch);
                const res = await POST(request(body()) as never);
                expect(res.status).toBe(503);
                expect((await res.json()).code).toBe('JOURNAL_BUSY');
                expect(res.headers.get('Retry-After')).toBeNull();
                expect(fetch).not.toHaveBeenCalled();
            } finally {
                holder.exec('ROLLBACK');
                holder.close();
            }
        });

        it('keeps prior history and returns a 503 when the retry reserve fails, without entering the port again', async () => {
            let acquisitions = 0;
            _testOnlySetStoreHooks({
                afterAcquire() {
                    acquisitions += 1;
                    // Acquisitions: reserve 1, provider-call gate 2, settle 3, retry reserve 4 (gate added by the held-release slice 8223fe6aa).
                    if (acquisitions === 4) throw new Error('IO_FAILURE');
                },
            });
            const fetch = vi.fn().mockResolvedValue(respond('short'));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
            const data = await res.json();
            expect(res.status).toBe(503);
            expect(data.code).toBe('JOURNAL_UNAVAILABLE');
            expect(res.headers.get('Retry-After')).toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(data.canonicalLineage.history).toHaveLength(1);
            expect(JSON.stringify(data)).not.toContain('short');
            const stored = readJournal(journalConfig, data.canonicalLineage.canonicalId);
            expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', terminal: { disposition: 'FAILED' } });
        });

        it.each([
            // Commits: reserve 1, provider-call gate 2, settle 3, finalize 4 (gate added by the held-release slice 8223fe6aa).
            ['settle', 3],
            ['finalize', 4],
        ])('answers a failed or ambiguous %s with 503 JOURNAL_SETTLEMENT_UNCERTAIN and suppresses all AI output', async (_name, failingCommit) => {
            loseAcknowledgementOnCommit(failingCommit);
            // A validation-failing first answer would normally trigger a retry; the failure must stop that.
            const fetch = vi.fn().mockResolvedValue(respond(failingCommit === 3 ? `short ${marker}` : markedOutput));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
            const data = await res.json();
            expect(res.status).toBe(503);
            expect(res.headers.get('Retry-After')).toBeNull();
            expect(data).toMatchObject({
                success: false, code: 'JOURNAL_SETTLEMENT_UNCERTAIN', recordingStatus: 'UNCONFIRMED',
                providerContact: 'POSSIBLE_OR_OBSERVED', automaticRetryAllowed: false,
            });
            expect(typeof data.canonicalId).toBe('string');
            expect(data.error).toContain('may have completed and charged');
            expect(data.error).toContain('resubmitting may duplicate');
            expect(data.canonicalLineage).toMatchObject({ canonicalId: data.canonicalId, recordingStatus: 'UNCONFIRMED', durable: false });
            expect(data.canonicalLineage.history.every((entry: { durable: boolean }) => entry.durable === false)).toBe(true);
            for (const forbidden of ['output', 'result', 'content', 'payload', 'canonicalGateway', 'governanceEvidenceReceipt']) {
                expect(JSON.stringify(data)).not.toContain(`"${forbidden}"`);
            }
            expect(JSON.stringify(data)).not.toContain(marker);
            expect(JSON.stringify(data)).not.toContain('Governed Response');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('does not deduplicate a manual resubmit: a new request gets a new envelope and both are recorded', async () => {
            const fetch = vi.fn().mockResolvedValue(respond(output));
            vi.stubGlobal('fetch', fetch);
            const first = await (await POST(request(body()) as never)).json();
            const second = await (await POST(request(body()) as never)).json();
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(first.canonicalLineage.canonicalId).not.toBe(second.canonicalLineage.canonicalId);
            for (const data of [first, second]) {
                const stored = readJournal(journalConfig, data.canonicalLineage.canonicalId);
                expect(stored.ok && stored.value).toMatchObject({ state: 'FINALIZED', recordingStatus: 'CONFIRMED' });
            }
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'finalize', 'reserve', 'settle', 'finalize']);
        });

        it('never runs two journal calls in the same macrotask (yield between every pair)', async () => {
            // A failing first answer forces a second ordinal: settle then reserve, settle then finalize.
            const fetch = vi.fn().mockResolvedValueOnce(respond('short')).mockResolvedValueOnce(respond(output));
            vi.stubGlobal('fetch', fetch);
            const res = await POST(request(body({ intent: 'Analyze the market in depth' })) as never);
            expect(res.status).toBe(200);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(journalProbe.events).toEqual(['reserve', 'settle', 'reserve', 'settle', 'finalize']);
            expect(journalProbe.violations).toEqual([]);
        });

        it('probe control: two journal calls issued in one macrotask are reported as a violation', () => {
            const identity = resolveSessionIdentity(journalConfig, { qualified: true, userId: 'canonical-user', orgId: 'org-1', teamId: 'team-1' });
            if (!identity.ok) throw new Error('identity');
            const ref = { canonicalId: 'probe-control', contractRevision: 'contract-1', sourceRevision: 'src-1' };
            probedReserve(journalConfig, identity.value, ref);
            probedSettle(journalConfig, identity.value, ref, 1, { attemptOutcome: 'unknown' });
            expect(journalProbe.violations).toEqual(['settle ran in the same macrotask as the previous journal call']);
        });
    });
    describe('selected subscription native route', () => {
        function nativeMode() {
            process.env.CVF_CLAUDE_EXECUTION_MODE = 'subscription_cli'; process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            const dir = mkdtempSync(path.join(tmpdir(), 'web-native-fixture-')); journalDirs.push(dir); process.env.CVF_MAO_DURABLE_RUN_PATH = dir;
            process.env.CVF_CLAUDE_CLI_PATH = '/fixture/claude.exe'; process.env.CVF_CLAUDE_CLI_SHA256 = 'a'.repeat(64);
            enforcement.mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
        }
        it('uses one actual fixture adapter through MAO and Gateway, no API key or Alibaba fallback', async () => {
            nativeMode(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
            const response = await POST(request(body({ provider: 'claude', model: 'sonnet', cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(200); expect(data.provider).toBe('claude'); expect(data.model).toBe('sonnet');
            expect(data.canonicalGateway).toMatchObject({ executionSurface: 'claude_cli_subscription', observedModelId: 'fixture-observed-model' });
            expect(data.maoExecution.state).toBe('succeeded'); expect(nativeInvoke).toHaveBeenCalledTimes(1); expect(fetch).not.toHaveBeenCalled();
            const deadlines = nativeProbe.mock.calls.map(call => call[0].deadlineMonotonicMs); expect(new Set(deadlines).size).toBe(1);
        });
        it('rejects stale API model before auth probe or inference and requires MAO', async () => {
            nativeMode(); const response = await POST(request(body({ provider: 'claude', model: 'claude-sonnet-4-20250514' })) as never);
            expect(response.status).toBe(400); expect(nativeProbe).not.toHaveBeenCalled(); expect(nativeInvoke).not.toHaveBeenCalled();
            delete process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER;
            expect((await POST(request(body({ provider: 'claude', model: 'sonnet' })) as never)).status).toBe(503); expect(nativeInvoke).not.toHaveBeenCalled();
        });
        it('unknown native readiness cannot fall back to configured Alibaba', async () => {
            nativeMode(); nativeProbe.mockResolvedValue({ state: 'unknown' });
            expect((await POST(request(body({ provider: 'claude', model: 'sonnet', cvfRiskLevel: 'R1' })) as never)).status).toBe(503); expect(nativeInvoke).not.toHaveBeenCalled();
        });
        it.each(['quota_locked', 'credential_unavailable', 'provider_timeout'] as const)('actual %s error stays pending with no output/retry/API-key guidance', async code => {
            nativeMode(); const { ProviderExecutionError } = await import('cvf-model-gateway');
            nativeInvoke.mockRejectedValue(new ProviderExecutionError(code, { executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' }));
            const response = await POST(request(body({ provider: 'claude', model: 'sonnet', cvfRiskLevel: 'R1' })) as never); const data = await response.json();
            expect(response.status).toBe(503); expect(data.code).toBe('MAO_OUTCOME_UNKNOWN'); expect(data.output).toBeUndefined();
            expect(data.diagnostic).toMatchObject({ retryable: false, userAction: 'do_not_retry_without_new_evidence', executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' });
            expect(JSON.stringify(data)).not.toMatch(/wait_and_retry|check_api_key|API key|payload|output/); expect(nativeInvoke).toHaveBeenCalledTimes(1);
            const state = readJournal(journalConfig, data.canonicalId); expect(state.ok && state.value.history[0].state).toBe('PORT_PENDING');
        });
    });

});
