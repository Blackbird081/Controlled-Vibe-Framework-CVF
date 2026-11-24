// Text Encoding Exception: the word-limit case reuses the exact Vietnamese counterexample from the strict-cap suites.
// W3 hermetic V1 rehearsal: the operator's five-step scenario on the REAL route handlers, a REAL temp SQLite lineage journal and
// scripted provider responses. State carries across the steps of one lane, as in one real user session. Fetch is always stubbed.
const nativeProbe = vi.hoisted(() => vi.fn());
const nativeInvoke = vi.hoisted(() => vi.fn());
vi.mock('cvf-model-gateway', async () => {
 const actual = await vi.importActual<typeof import('cvf-model-gateway')>('cvf-model-gateway');
 return { ...actual, probeClaudeCliSubscription: nativeProbe, createClaudeCliExecutionAdapter: () => ({ providerId: 'claude', execute: nativeInvoke }) };
});
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const auth = vi.hoisted(() => vi.fn());
const provenance = vi.hoisted(() => vi.fn());
const enforcement = vi.hoisted(() => vi.fn());
const quota = vi.hoisted(() => vi.fn());
const audit = vi.hoisted(() => vi.fn());
const cost = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: auth,
    resolveVerifiedSessionProvenance: provenance,
    withSessionAuditPayload: (_session: unknown, payload: unknown) => payload,
}));
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: enforcement }));
vi.mock('@/lib/quota-guard', () => ({ checkTeamQuota: quota, hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false) }));
vi.mock('@/lib/control-plane-events', async () => {
    const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
    return { ...actual, appendAuditEvent: audit, appendCostEvent: cost };
});

import { POST } from './route';
import { POST as controlPOST } from './control/route';
import { getRateLimiter, resetRateLimitStoresForTest } from '@/lib/rate-limit';
import { _testOnlyResetReplayLedger } from '@/lib/service-token-auth';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import { LINEAGE_CONFIG_ENV, parseLineageConfig, provisionTenantMetadata, readLineage, resolveSessionIdentity, type LineageConfig } from '@/lib/server/canonical-web-lineage';
import { useExecutionStore } from '@/lib/store';
import { buildEvidenceSnapshot } from '@/lib/execution-continuity';
import { createReceiptArchive, restoreReceiptArchive } from '@/lib/execution-receipt-archive';
import { generateDeliverablePack, serializePackToMarkdown } from '@/lib/deliverable-pack';
import { readWordLimitRefusal, wordLimitRefusalMessage } from '@/lib/output-validation-refusal';
import { readPartialOutput, summarizeRolePlan } from '@/components/ProcessingScreen.partial-output';
import type { Execution } from '@/types';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

const originalEnv = { ...process.env };
const HELD_MIN_AGE_MS = 300000;
const verifiedProvenance = { qualified: true as const, userId: 'canonical-user', orgId: 'org-1', teamId: 'team-1', role: 'admin', oauthProvider: 'github', oauthSubject: 'subject-1', expiresAt: Date.now() + 3600000 };
const respond = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }), { status: 200 });
const longText = (tag: string) => `## ${tag}\n\nThis response provides a structured recommendation with enough detail to satisfy output validation requirements.\n\n1. Review the request context carefully.\n2. Apply the governed execution plan.\n3. Return a concise, safe outcome for the operator.`;
const PASS = JSON.stringify({ verdict: 'PASS', findings: [] });
const strictCapCounterexample = "## What This Document Is For\nHướng dẫn nhân viên kho mới nhận một lô hàng đúng quy trình.\n\n## Step-By-Step Procedure\n1. Đối chiếu phiếu giao với đơn mua hàng.\n2. Kiểm tra kỹ số lượng và tình trạng thực tế của hàng hóa.\n3. Ký nhận và nhập liệu vào hệ thống (nếu phát hiện hàng lỗi, bắt buộc chụp ảnh và báo bộ phận mua hàng trong ngày).\n\n## Final Handoff Acceptance Checklist\n- [ ] Đã đối chiếu chính xác phiếu giao và đơn mua.\n- [ ] Đã kiểm đếm đủ số lượng và tình trạng bao bì.\n- [ ] Đã hoàn tất ký nhận và cập nhật vào phần mềm.\n- [ ] Đã xử lý đúng quy định cho các trường hợp hàng lỗi.";
const strictDoc = { templateId: 'documentation', templateName: 'Documentation', intent: 'Write a warehouse procedure', inputs: { subject: 'Viết quy trình nhận hàng 3 bước, dưới 100 từ', currentNotes: 'Quy trình dưới 100 từ; hàng lỗi phải chụp ảnh và báo mua hàng trong ngày', readerGoal: 'Nhân viên kho mới' }, cvfRiskLevel: 'R1' };
const strategyInputs = { topic: 'SMB market', context: 'Compare market opportunities for SMBs' };
const baseBody = (extra: Record<string, unknown> = {}) => ({
    templateId: 'strategy_analysis',
    templateName: 'Strategy',
    intent: 'Analyze the market',
    inputs: strategyInputs,
    provider: 'alibaba',
    model: 'qwen-plus-character',
    cvfRiskLevel: 'R1',
    ...extra,
});
const executeRequest = (data: Record<string, unknown>) => new Request('http://localhost/api/execute', { method: 'POST', body: JSON.stringify(data) });
const CLAUDE_ENV = { CVF_CLAUDE_EXECUTION_MODE: 'subscription_cli', CVF_CLAUDE_CLI_PATH: '/fixture/claude.exe', CVF_CLAUDE_CLI_SHA256: 'a'.repeat(64) };

type Lane = 'DIRECT' | 'ROLE_PLAN' | 'SINGLE_WORKER';
type Scripted = string | Error;
type RunRecord = { label: string; canonicalId: string; disposition: string | null; active: boolean };
const journalDirs: string[] = [];

function openJournal(activeSlots = 100): LineageConfig {
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-v1-rehearsal-'));
    journalDirs.push(directory);
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const raw = JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: 'cvf-web-lineage-v1-rehearsal', tenants: [{ tenantId: 'org-1', activeSlots, archiveSlots: 100 }] });
    const parsed = parseLineageConfig(raw);
    if (!parsed.ok) throw new Error(`journal config ${parsed.reason}`);
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    process.env[LINEAGE_CONFIG_ENV] = raw;
    return parsed.config;
}

function baseEnvironment() {
    process.env = { ...originalEnv, NODE_ENV: 'test', ALIBABA_API_KEY: 'fixture-key', CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: '1', CVF_ALIBABA_FREE_QUOTA_ONLY: '1', CVF_PROVIDER_QUOTA_PER_MIN: '10000', CVF_RATE_LIMIT: '10000' };
    delete process.env.CVF_CLAUDE_EXECUTION_MODE;
    delete process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN;
    delete process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER;
    nativeProbe.mockReset().mockResolvedValue({ state: 'available', checkedAt: '2026-11-13T00:00:00Z', executionSurface: 'claude_cli_subscription' });
    nativeInvoke.mockReset();
    auth.mockReset().mockResolvedValue({ userId: 'canonical-user', user: 'canonical-user', role: 'admin', orgId: 'org-1', teamId: 'team-1', expiresAt: Date.now() + 3600000 });
    provenance.mockReset().mockResolvedValue(verifiedProvenance);
    enforcement.mockReset().mockReturnValue({ status: 'ALLOW', reasons: [], riskGate: { status: 'ALLOW', riskLevel: 'R1' } });
    quota.mockReset().mockResolvedValue({ exceeded: false, currentUSD: 0, softCapUSD: 0, hardCapUSD: 0, overrideActive: false });
    audit.mockReset().mockResolvedValue({ id: 'fixture-audit' });
    cost.mockReset().mockResolvedValue({ id: 'fixture-cost' });
    resetRateLimitStoresForTest();
    _testOnlyResetReplayLedger();
}

/** Scripted provider transport: every call consumes the next item (a fresh Response each time); an unscripted call fails the test. */
function scriptProvider(...items: Scripted[]) {
    const queue = [...items];
    const fetch = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => {
        const next = queue.shift();
        if (next === undefined) throw new Error('UNSCRIPTED_PROVIDER_CALL');
        if (next instanceof Error) throw next;
        return respond(next);
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
}

/** Same transport, but the first provider call stays in flight until the gate opens (a request that is still running). */
function scriptGatedProvider(gate: Promise<void>, ...items: Scripted[]) {
    const queue = [...items];
    let first = true;
    const fetch = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => {
        if (first) {
            first = false;
            await gate;
        }
        const next = queue.shift();
        if (next === undefined) throw new Error('UNSCRIPTED_PROVIDER_CALL');
        if (next instanceof Error) throw next;
        return respond(next);
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
}

async function waitForProviderCall(fetch: ReturnType<typeof scriptProvider>) {
    for (let n = 0; n < 2000 && fetch.mock.calls.length === 0; n++) await new Promise(resolve => setTimeout(resolve, 1));
    expect(fetch.mock.calls.length).toBeGreaterThan(0);
}

/** What the user is shown for a refusal: the same precedence ProcessingScreen uses (classified diagnostic first, else the route error). */
function visibleReason(data: Record<string, unknown>): string {
    const diagnostic = data.diagnostic as { safeMessage?: string } | undefined;
    return String(diagnostic?.safeMessage ?? data.error ?? '');
}

/** Client-side history entry built exactly as ProcessingScreen and the home page build it from the route response. */
async function recordClientExecution(id: string, input: Record<string, string>, intent: string, data: Record<string, unknown>) {
    const store = useExecutionStore.getState();
    store.addExecution({ id, templateId: 'strategy_analysis', templateName: 'Strategy', category: 'business', input, intent, status: 'processing', createdAt: new Date() });
    const rolePlan = summarizeRolePlan(data.maoRolePlan);
    const baseReceipt = data.governanceEvidenceReceipt as GovernanceEvidenceReceipt | undefined;
    const receipt = baseReceipt && rolePlan ? { ...baseReceipt, rolePlan } : baseReceipt;
    if (data.success && typeof data.output === 'string' && data.output) {
        const snap = buildEvidenceSnapshot(receipt as Record<string, unknown> | undefined);
        store.updateExecution(id, { status: 'completed', output: data.output, qualityScore: 8.2, completedAt: new Date(), ...(snap ? { evidenceReceiptSnapshot: snap } : {}) });
        if (receipt) {
            const archive = await createReceiptArchive(id, data.output, receipt);
            if (archive) useExecutionStore.getState().updateExecution(id, { savedReceiptArchive: archive });
        }
    } else {
        store.updateExecution(id, { status: 'failed' });
    }
    return { execution: useExecutionStore.getState().getExecutionById(id) as Execution, receipt };
}

function defineLane(lane: Lane) {
    const roleCalls = lane === 'ROLE_PLAN' ? 2 : 1;
    const withReview = (text: string): Scripted[] => (lane === 'ROLE_PLAN' ? [text, PASS] : [text]);
    const runs: RunRecord[] = [];
    const clientIds: string[] = [];
    let config: LineageConfig;
    let execCounter = 0;
    const draft = (tag: string) => longText(`${lane} ${tag}`);

    const owner = () => {
        const resolved = resolveSessionIdentity(config, verifiedProvenance);
        if (!resolved.ok) throw new Error('identity');
        return resolved.value;
    };
    const control = async (data: Record<string, unknown>) => {
        const response = await controlPOST(new Request('http://localhost/api/execute/control', { method: 'POST', body: JSON.stringify(data) }) as never);
        return { status: response.status, body: await response.json() };
    };
    const status = async () => {
        const result = await control({ action: 'status' });
        expect(result.status).toBe(200);
        return result.body.control;
    };
    const releaseHeld = async () => {
        const current = await status();
        return control({ action: 'release_held', expectedRevision: current.revision, canonicalId: current.execution.canonicalId });
    };
    /** One user request: POST, read the owner status like the status panel does, and add the attempt to the client history. */
    async function send(label: string, extra: Record<string, unknown> = {}) {
        const body = baseBody(extra);
        const response = await POST(executeRequest(body) as never);
        const data = await response.json();
        const current = await status();
        const canonicalId: string = current.execution?.canonicalId ?? '';
        const entry: RunRecord = { label, canonicalId, disposition: current.execution?.terminalDisposition ?? null, active: Boolean(current.execution?.active) };
        const known = runs.some(run => run.canonicalId === canonicalId);
        if (canonicalId && !known) runs.push(entry);
        const id = `exec-${lane}-${++execCounter}`;
        clientIds.push(id);
        const client = await recordClientExecution(id, body.inputs as Record<string, string>, String(body.intent), data);
        return { response, data, status: current, entry, ...client };
    }
    const exhaustQuota = async (count: number) => {
        for (let i = 0; i < count; i++) await getRateLimiter().consumeProviderAttempt('session', 'canonical-user', 'alibaba:qwen-plus-character');
    };
    const quotaLimit = lane === 'ROLE_PLAN' ? 4 : 1;
    // A held direct attempt is already finalized as FAILED with its pending provider ordinal still unconfirmed; a held MAO attempt stays open.
    const heldDisposition = lane === 'DIRECT' ? 'FAILED' : null;
    const heldState = lane === 'DIRECT' ? 'FINALIZED' : 'OPEN';
    /** The held outcome, aged past the owner-release floor with a fake Date only. */
    async function holdAndRelease(label: string) {
        const held = await status();
        expect(held.execution).toMatchObject({ active: true, continuationHold: true, providerContact: 'POSSIBLE_OR_OBSERVED', pendingOrdinals: 1, terminalDisposition: heldDisposition });
        const heldAt = Date.parse(held.execution.updatedAt);
        expect(held.releasableAt).toBe(new Date(heldAt + HELD_MIN_AGE_MS).toISOString());
        vi.useFakeTimers({ toFake: ['Date'] });
        try {
            vi.setSystemTime(heldAt + HELD_MIN_AGE_MS - 1);
            const early = await releaseHeld();
            expect(early.status).toBe(409);
            expect(early.body).toMatchObject({ success: false, code: 'RELEASE_TOO_EARLY', releasableAt: new Date(heldAt + HELD_MIN_AGE_MS).toISOString() });
            vi.setSystemTime(heldAt + HELD_MIN_AGE_MS);
            const released = await releaseHeld();
            expect(released.status, `${label} release`).toBe(200);
            expect(released.body.control.heldRelease.count).toBeGreaterThanOrEqual(1);
            expect(released.body.control.execution.canonicalId).toBe(held.execution.canonicalId);
        } finally {
            vi.useRealTimers();
        }
        return held.execution.canonicalId as string;
    }

    describe(`V1 rehearsal lane ${lane}`, () => {
        beforeAll(() => {
            baseEnvironment();
            if (lane !== 'DIRECT') {
                const directory = mkdtempSync(path.join(tmpdir(), 'cvf-v1-rehearsal-run-'));
                journalDirs.push(directory);
                process.env.CVF_MAO_DURABLE_RUN_PATH = directory;
                if (lane === 'ROLE_PLAN') process.env.CVF_WEB_CANONICAL_MAO_ROLE_PLAN = '1';
                else process.env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER = '1';
            }
            useExecutionStore.setState({ executions: [], currentExecution: null });
            config = openJournal();
        });
        afterAll(() => {
            vi.useRealTimers();
            process.env = { ...originalEnv };
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
            while (journalDirs.length) rmSync(journalDirs.pop()!, { recursive: true, force: true });
        });

        it('step 1: a signed-in request returns a result with a receipt and a readable export pack', async () => {
            const text = draft('first');
            const fetch = scriptProvider(...withReview(text));
            const result = await send('first');
            expect(result.response.status).toBe(200);
            expect(result.data).toMatchObject({ success: true, output: text, provider: 'alibaba', model: 'qwen-plus-character' });
            expect(fetch).toHaveBeenCalledTimes(roleCalls);
            expect(result.status).toMatchObject({ state: 'OPEN', execution: { state: 'FINALIZED', active: false, terminalDisposition: 'COMPLETED', continuationHold: false, pendingOrdinals: 0 } });
            expect(result.data.governanceEvidenceReceipt).toMatchObject({ decision: 'ALLOW', provider: 'alibaba', model: 'qwen-plus-character', evidenceMode: 'live' });
            expect(result.data.governanceEvidenceReceipt.canonicalExecutionId).toBe(result.status.execution.canonicalId);
            expect(result.execution).toMatchObject({ status: 'completed', output: text });
            expect(result.execution.savedReceiptArchive).toBeDefined();
            const pack = generateDeliverablePack(result.execution, result.receipt);
            const markdown = serializePackToMarkdown(pack);
            expect(markdown).toContain(text);
            expect(markdown).toContain('- **Decision**: ALLOW');
            expect(markdown).toContain('- **Provider**: alibaba');
            expect(markdown).toContain(`- **Receipt id**: ${result.receipt!.receiptId}`);
            expect(markdown).toContain('- **Receipt available**: yes');
            expect(markdown).toContain(`Execution: ${result.execution.id}`);
            expect(pack.artifactVerification.status).not.toBe('FAIL');
            if (lane === 'ROLE_PLAN') {
                expect(markdown).toContain('## Role Plan Review');
                expect(markdown).toContain('- **Reviewer verdict (draft)**: PASS');
            } else {
                expect(markdown).not.toContain('## Role Plan Review');
            }
        });

        it('step 2a: status shows the running attempt, a second request is held off, and the status settles when it finishes', async () => {
            let open!: () => void;
            const gate = new Promise<void>(resolve => { open = resolve; });
            const text = draft('running');
            const fetch = scriptGatedProvider(gate, ...withReview(text));
            const pending = POST(executeRequest(baseBody()) as never);
            await waitForProviderCall(fetch);
            const running = await status();
            expect(running.state).toBe('OPEN');
            expect(running.execution).toMatchObject({ state: 'OPEN', active: true, pendingOrdinals: 1, terminalDisposition: null, providerContact: 'POSSIBLE_OR_OBSERVED' });
            const callsWhileRunning = fetch.mock.calls.length;
            const second = await POST(executeRequest(baseBody()) as never);
            const secondData = await second.json();
            expect(second.status).toBe(409);
            expect(secondData.code).toBe('ADMISSION_CONFLICT');
            expect(visibleReason(secondData)).toContain('No provider call was made');
            expect(fetch.mock.calls.length).toBe(callsWhileRunning);
            open();
            const response = await pending;
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data).toMatchObject({ success: true, output: text });
            const settled = await status();
            expect(settled.execution).toMatchObject({ canonicalId: running.execution.canonicalId, state: 'FINALIZED', active: false, terminalDisposition: 'COMPLETED' });
            runs.push({ label: 'running', canonicalId: settled.execution.canonicalId, disposition: 'COMPLETED', active: false });
            const id = `exec-${lane}-${++execCounter}`;
            clientIds.push(id);
            const client = await recordClientExecution(id, strategyInputs, 'Analyze the market', data);
            expect(client.execution.status).toBe('completed');
        });

        it('step 2b: Stop refuses a new request without a provider call, Resume with a stale revision is refused, then Resume works', async () => {
            const before = await status();
            expect(before.state).toBe('OPEN');
            const stopped = await control({ action: 'stop' });
            expect(stopped.status).toBe(200);
            expect(stopped.body.control).toMatchObject({ state: 'STOPPED', revision: before.revision + 1 });
            const fetch = scriptProvider();
            const refused = await send('refused-while-stopped');
            expect(refused.response.status).toBe(409);
            expect(refused.data).toMatchObject({ success: false, code: 'ADMISSION_STOPPED' });
            expect(visibleReason(refused.data)).toContain('stopped');
            expect(fetch).not.toHaveBeenCalled();
            expect(refused.execution.status).toBe('failed');
            expect(refused.status).toMatchObject({ state: 'STOPPED', execution: { canonicalId: before.execution.canonicalId, terminalDisposition: 'COMPLETED' } });
            const stale = await control({ action: 'resume', expectedRevision: before.revision });
            expect(stale.status).toBe(409);
            expect(stale.body.code).toBe('ADMISSION_CONFLICT');
            const resumed = await control({ action: 'resume', expectedRevision: before.revision + 1 });
            expect(resumed.status).toBe(200);
            expect(resumed.body.control.state).toBe('OPEN');
            const text = draft('after-resume');
            const next = scriptProvider(...withReview(text));
            const accepted = await send('after-resume');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(roleCalls);
        });

        it('step 2c: pressing Stop while a request runs blocks later admission and never locks the owner out', async () => {
            let open!: () => void;
            const gate = new Promise<void>(resolve => { open = resolve; });
            const fetch = scriptGatedProvider(gate, ...withReview(draft('stop-mid-run')));
            const pending = POST(executeRequest(baseBody()) as never);
            await waitForProviderCall(fetch);
            const stopped = await control({ action: 'stop' });
            expect(stopped.status).toBe(200);
            expect(stopped.body.control.state).toBe('STOPPED');
            open();
            const response = await pending;
            const data = await response.json();
            const after = await status();
            if (lane === 'ROLE_PLAN') {
                // The reviewer step is a new admission, so Stop refuses it; the draft call already made is on record.
                expect(response.status).toBe(409);
                expect(data).toMatchObject({ success: false, code: 'ADMISSION_STOPPED' });
                expect(visibleReason(data).length).toBeGreaterThan(0);
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(after.execution).toMatchObject({ active: false, terminalDisposition: 'FAILED' });
                // The draft that was already paid for is kept as an unreviewed partial output, not lost.
                expect(data.partialOutput).toEqual({ text: draft('stop-mid-run'), fromStep: 'draft', reviewed: false });
                expect(readPartialOutput(data.partialOutput)).not.toBeNull();
            } else {
                // The single provider call was admitted before Stop, so it completes; only later requests are refused.
                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(after.execution).toMatchObject({ active: false, terminalDisposition: 'COMPLETED' });
            }
            runs.push({ label: 'stop-mid-run', canonicalId: after.execution.canonicalId, disposition: after.execution.terminalDisposition, active: false });
            const blocked = await send('blocked-after-stop');
            expect(blocked.response.status).toBe(409);
            expect(blocked.data.code).toBe('ADMISSION_STOPPED');
            const resumed = await control({ action: 'resume', expectedRevision: (await status()).revision });
            expect(resumed.status).toBe(200);
            scriptProvider(...withReview(draft('after-stop-resume')));
            const accepted = await send('after-stop-resume');
            expect(accepted.response.status).toBe(200);
        });

        it('step 3a: an exhausted provider quota is refused with the reason, nothing is held, and a new request works', async () => {
            // A fresh rate window, as after the user waited a minute; the earlier requests of this session must not count.
            resetRateLimitStoresForTest();
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = String(quotaLimit);
            await exhaustQuota(quotaLimit);
            const fetch = scriptProvider();
            const denied = await send('quota-denied');
            expect(denied.response.status).toBe(429);
            expect(Number(denied.response.headers.get('Retry-After'))).toBeGreaterThan(0);
            expect(denied.data.success).toBe(false);
            expect(visibleReason(denied.data)).toBe('The request was rate limited.');
            expect(denied.data.diagnostic).toMatchObject({ class: 'rate_limited', retryable: true, userAction: 'wait_and_retry' });
            expect(String(denied.data.error)).toContain('quota exceeded');
            expect(fetch).not.toHaveBeenCalled();
            expect(denied.status).toMatchObject({ state: 'OPEN', execution: { active: false, terminalDisposition: 'DENIED', providerContact: 'NOT_OBSERVED', continuationHold: false } });
            expect(denied.execution.status).toBe('failed');
            process.env.CVF_PROVIDER_QUOTA_PER_MIN = '10000';
            resetRateLimitStoresForTest();
            const text = draft('after-quota');
            const next = scriptProvider(...withReview(text));
            const accepted = await send('after-quota');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(roleCalls);
        });

        it('step 3a2: the per-minute request limit is refused with its reason before any journal record or provider call, and clears after the window', async () => {
            resetRateLimitStoresForTest();
            process.env.CVF_RATE_LIMIT = '1';
            const before = await status();
            await getRateLimiter().consume(executeRequest(baseBody()) as never, 'canonical-user', 'alibaba');
            const fetch = scriptProvider();
            const limited = await send('request-rate-limit');
            expect(limited.response.status).toBe(429);
            expect(Number(limited.response.headers.get('Retry-After'))).toBeGreaterThan(0);
            expect(limited.data).toMatchObject({ success: false, error: 'Too many requests. Please slow down.' });
            // Same classified reason as the provider-attempt gate, with the server wait the UI turns into a localized message.
            expect(limited.data.diagnostic).toMatchObject({ stage: 'rate_limit', class: 'rate_limited', httpStatus: 429 });
            expect(limited.data.retryAfterSeconds).toBe(Number(limited.response.headers.get('Retry-After')));
            expect(visibleReason(limited.data)).toBe('The request was rate limited.');
            expect(fetch).not.toHaveBeenCalled();
            expect(limited.execution.status).toBe('failed');
            expect(limited.status.execution.canonicalId).toBe(before.execution.canonicalId);
            expect(limited.status.state).toBe('OPEN');
            process.env.CVF_RATE_LIMIT = '10000';
            resetRateLimitStoresForTest();
            const text = draft('after-rate-limit');
            const next = scriptProvider(...withReview(text));
            const accepted = await send('after-rate-limit');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(roleCalls);
        });

        it('step 3b: a documentation request over its stated word cap is refused 422 with the measured count and limit, and the owner is not locked', async () => {
            const fetch = scriptProvider(...withReview(strictCapCounterexample));
            const refused = await send('word-cap', strictDoc);
            expect(refused.response.status).toBe(422);
            expect(refused.data).toMatchObject({ success: false, automaticRetryAllowed: false });
            expect(refused.data.output).toBeUndefined();
            expect(fetch).toHaveBeenCalledTimes(roleCalls);
            expect(refused.data.outputValidation).toMatchObject({ retryAttempts: 0, issues: expect.arrayContaining(['WORD_LIMIT_EXCEEDED']), wordLimit: { observed: 114, limit: 99 } });
            // The refusal text is only shown by the client when the response carries a classified diagnostic.
            expect(refused.data.diagnostic).toBeDefined();
            const refusal = readWordLimitRefusal(refused.data.outputValidation);
            expect(refusal).toEqual({ observed: 114, limit: 99 });
            expect(wordLimitRefusalMessage(refusal!, false)).toContain('114 words');
            expect(wordLimitRefusalMessage(refusal!, false)).toContain('99-word limit');
            expect(wordLimitRefusalMessage(refusal!, true)).toContain('114 từ');
            expect(refused.execution.status).toBe('failed');
            expect(refused.execution.output).toBeUndefined();
            expect(refused.status).toMatchObject({ state: 'OPEN', execution: { active: false, terminalDisposition: 'VALIDATION_FAILED', continuationHold: false } });
            const text = draft('after-word-cap');
            const next = scriptProvider(...withReview(text));
            const accepted = await send('after-word-cap');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(roleCalls);
        });

        it('step 3c: a lost connection with an unknown outcome is held, shown in status, blocks a new request and is released by the owner after the age floor', async () => {
            let lostTransport: ReturnType<typeof scriptProvider>;
            let adapterFault: { mockRestore: () => void } | undefined;
            if (lane === 'DIRECT') {
                // A direct provider network error is classified as a definite FAILED attempt (see the next case); an unknown direct outcome is a lost acknowledgement.
                const gateway = await import('cvf-model-gateway');
                adapterFault = vi.spyOn(gateway.CanonicalExecutionAdapter.prototype, 'execute').mockImplementation(async () => { throw new Error('fixture_lost_connection'); });
                lostTransport = scriptProvider();
            } else {
                lostTransport = scriptProvider(new TypeError('fetch failed'));
            }
            const lost = await send('lost-connection');
            adapterFault?.mockRestore();
            expect(lost.response.status).toBeGreaterThanOrEqual(500);
            expect(lost.data.success).toBe(false);
            expect(lost.data.output).toBeUndefined();
            expect(visibleReason(lost.data).length).toBeGreaterThan(0);
            expect(lost.execution.status).toBe('failed');
            if (lane !== 'DIRECT') {
                expect(lost.response.status).toBe(503);
                expect(lost.data.code).toBe('MAO_OUTCOME_UNKNOWN');
                expect(visibleReason(lost.data)).toContain('Do not resend automatically');
                expect(lostTransport).toHaveBeenCalledTimes(1);
            }
            const callsAtHold = lostTransport.mock.calls.length;
            const blocked = await send('blocked-by-held');
            expect(blocked.response.status).toBe(409);
            expect(blocked.data).toMatchObject({ success: false, code: 'ADMISSION_CONFLICT' });
            expect(lostTransport.mock.calls.length).toBe(callsAtHold);
            expect(blocked.status.execution.canonicalId).toBe(lost.status.execution.canonicalId);
            const heldId = await holdAndRelease('lost-connection');
            expect(heldId).toBe(lost.status.execution.canonicalId);
            const afterRelease = await status();
            expect(afterRelease.heldRelease.count).toBeGreaterThanOrEqual(1);
            const text = draft('after-release');
            const next = scriptProvider(...withReview(text));
            const accepted = await send('after-release');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(roleCalls);
            expect(accepted.status.execution.canonicalId).not.toBe(heldId);
            expect(accepted.status.execution).toMatchObject({ active: false, terminalDisposition: 'COMPLETED' });
        });

        it('step 3d: a network error that the gateway classifies as definite is shown with its reason and does not lock the owner', async () => {
            if (lane !== 'DIRECT') return;
            // Observation (see W3 return, DEFECTS): on the direct lane the same transport fault is finalized FAILED and does not hold the owner,
            // while the MAO lanes hold it (step 3c). The diagnostic still tells the user not to retry without new evidence.
            const lostTransport = scriptProvider(new TypeError('fetch failed'));
            const failed = await send('network-error');
            expect(lostTransport).toHaveBeenCalledTimes(1);
            expect(failed.data.success).toBe(false);
            expect(failed.data.output).toBeUndefined();
            expect(failed.data.diagnostic).toMatchObject({ class: 'network_error', stage: 'provider' });
            expect(visibleReason(failed.data)).toBe('A network error interrupted execution.');
            expect(failed.status).toMatchObject({ state: 'OPEN', execution: { active: false, terminalDisposition: 'FAILED', continuationHold: false } });
            const text = draft('after-network-error');
            const next = scriptProvider(text);
            const accepted = await send('after-network-error');
            expect(accepted.response.status).toBe(200);
            expect(accepted.data.output).toBe(text);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('step 4a: switching alibaba -> openai runs on the OpenAI endpoint with its own receipt and pack, then switching back works', async () => {
            process.env.OPENAI_API_KEY = 'sk-fixture-openai-key-do-not-emit';
            const openAiText = draft('openai');
            const openAiFetch = scriptProvider(...withReview(openAiText));
            const viaOpenAi = await send('openai', { provider: 'openai', model: undefined });
            expect(viaOpenAi.response.status).toBe(200);
            expect(viaOpenAi.data).toMatchObject({ success: true, output: openAiText, provider: 'openai' });
            expect(openAiFetch).toHaveBeenCalledTimes(roleCalls);
            for (const call of openAiFetch.mock.calls) expect(String(call[0])).toBe('https://api.openai.com/v1/chat/completions');
            expect(JSON.stringify(viaOpenAi.data)).not.toContain('sk-fixture-openai-key-do-not-emit');
            expect(viaOpenAi.receipt).toMatchObject({ provider: 'openai', decision: 'ALLOW', canonicalExecutionId: viaOpenAi.status.execution.canonicalId });
            expect(viaOpenAi.execution.evidenceReceiptSnapshot).toMatchObject({ provider: 'openai', receiptId: viaOpenAi.receipt!.receiptId });
            const markdown = serializePackToMarkdown(generateDeliverablePack(viaOpenAi.execution, viaOpenAi.receipt));
            expect(markdown).toContain(openAiText);
            expect(markdown).toContain('- **Provider**: openai');
            const alibabaText = draft('alibaba-again');
            const alibabaFetch = scriptProvider(...withReview(alibabaText));
            const back = await send('alibaba-again');
            expect(back.response.status).toBe(200);
            expect(back.data).toMatchObject({ success: true, output: alibabaText, provider: 'alibaba' });
            for (const call of alibabaFetch.mock.calls) expect(String(call[0])).not.toContain('api.openai.com');
            expect(back.status.execution.canonicalId).not.toBe(viaOpenAi.status.execution.canonicalId);
        });

        it('step 4b: the single-worker lane also runs on the Claude subscription, and a native quota limit is held and owner-released', async () => {
            if (lane !== 'SINGLE_WORKER') return;
            Object.assign(process.env, CLAUDE_ENV);
            const claudeText = draft('claude');
            nativeInvoke.mockReset().mockResolvedValue({ text: claudeText, executionSurface: 'claude_cli_subscription', nativeProcessState: 'started', observedModelId: 'fixture-observed-model' });
            const fetch = scriptProvider();
            const viaClaude = await send('claude', { provider: 'claude', model: 'sonnet' });
            expect(viaClaude.response.status).toBe(200);
            expect(viaClaude.data).toMatchObject({ success: true, output: claudeText, provider: 'claude', model: 'sonnet' });
            expect(viaClaude.data.canonicalGateway).toMatchObject({ executionSurface: 'claude_cli_subscription', observedModelId: 'fixture-observed-model' });
            expect(nativeInvoke).toHaveBeenCalledTimes(1);
            expect(fetch).not.toHaveBeenCalled();
            expect(viaClaude.execution.evidenceReceiptSnapshot).toMatchObject({ provider: 'claude' });
            const markdown = serializePackToMarkdown(generateDeliverablePack(viaClaude.execution, viaClaude.receipt));
            expect(markdown).toContain(claudeText);
            expect(markdown).toContain('- **Provider**: claude');
            const { ProviderExecutionError } = await import('cvf-model-gateway');
            nativeInvoke.mockReset().mockRejectedValue(new ProviderExecutionError('quota_locked', { executionSurface: 'claude_cli_subscription', nativeProcessState: 'started' }));
            const limited = await send('claude-quota-locked', { provider: 'claude', model: 'sonnet' });
            expect(limited.response.status).toBe(503);
            expect(limited.data).toMatchObject({ success: false, code: 'MAO_OUTCOME_UNKNOWN' });
            expect(limited.data.output).toBeUndefined();
            expect(limited.data.diagnostic).toMatchObject({ retryable: false, userAction: 'do_not_retry_without_new_evidence', executionSurface: 'claude_cli_subscription' });
            expect(visibleReason(limited.data).length).toBeGreaterThan(0);
            expect(JSON.stringify(limited.data)).not.toMatch(/check_api_key|API key/);
            expect(limited.status.execution).toMatchObject({ active: true, continuationHold: true });
            const heldId = await holdAndRelease('claude-quota-locked');
            expect(heldId).toBe(limited.status.execution.canonicalId);
            delete process.env.CVF_CLAUDE_EXECUTION_MODE;
            const text = draft('alibaba-after-claude');
            const next = scriptProvider(text);
            const back = await send('alibaba-after-claude');
            expect(back.response.status).toBe(200);
            expect(back.data).toMatchObject({ output: text, provider: 'alibaba' });
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('step 5: reopening history shows the evidence of every run above, from the client history and from the owner journal', async () => {
            const executions = useExecutionStore.getState().executions;
            expect(executions.map(execution => execution.id).sort()).toEqual([...clientIds].sort());
            const completed = executions.filter(execution => execution.status === 'completed');
            const failed = executions.filter(execution => execution.status === 'failed');
            expect(completed.length).toBeGreaterThanOrEqual(6);
            expect(failed.length).toBeGreaterThanOrEqual(5);
            for (const execution of failed) expect(execution.output).toBeUndefined();
            // Cold reopen: only the persisted JSON is used, as after a browser restart.
            const persisted = JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}').state.executions as Array<Record<string, unknown>>;
            expect(persisted.map(execution => execution.id).sort()).toEqual([...clientIds].sort());
            const providers = new Set<string>();
            for (const stored of persisted.filter(execution => execution.status === 'completed')) {
                const snapshot = stored.evidenceReceiptSnapshot as { receiptId?: string; provider?: string; model?: string };
                const restored = await restoreReceiptArchive(stored.savedReceiptArchive, String(stored.id), String(stored.output), snapshot);
                expect(restored, `receipt archive of ${stored.id}`).toBeDefined();
                expect(restored!.receiptId).toBe(snapshot.receiptId);
                expect(restored!.provider).toBe(snapshot.provider);
                providers.add(String(restored!.provider));
                const reopened = generateDeliverablePack({ ...(stored as unknown as Execution), createdAt: new Date(String(stored.createdAt)) }, restored);
                const markdown = serializePackToMarkdown(reopened);
                expect(markdown).toContain(String(stored.output));
                expect(markdown).toContain(`- **Receipt id**: ${snapshot.receiptId}`);
                expect(markdown).toContain('- **Receipt available**: yes');
            }
            expect(providers).toContain('alibaba');
            expect(providers).toContain('openai');
            if (lane === 'SINGLE_WORKER') expect(providers).toContain('claude');
            // The owner journal still holds one distinct record per attempt that reached admission, with its terminal evidence.
            expect(new Set(runs.map(run => run.canonicalId)).size).toBe(runs.length);
            const dispositions = new Map<string, number>();
            for (const run of runs) {
                const view = readLineage(config, owner(), run.canonicalId);
                expect(view.ok, `journal record of ${run.label}`).toBe(true);
                if (!view.ok) continue;
                if (run.active) {
                    expect(view.value.state).toBe(heldState);
                    expect(view.value.history[0].state).toBe('PORT_PENDING');
                    dispositions.set('HELD', (dispositions.get('HELD') ?? 0) + 1);
                } else {
                    expect(view.value.state).toBe('FINALIZED');
                    expect(view.value.terminal?.disposition).toBe(run.disposition);
                    dispositions.set(String(run.disposition), (dispositions.get(String(run.disposition)) ?? 0) + 1);
                }
            }
            expect(dispositions.get('COMPLETED')).toBeGreaterThanOrEqual(6);
            expect(dispositions.get('DENIED')).toBe(1);
            expect(dispositions.get('VALIDATION_FAILED')).toBe(1);
            expect(dispositions.get('HELD')).toBe(lane === 'SINGLE_WORKER' ? 2 : 1);
            const final = await status();
            expect(final.state).toBe('OPEN');
            expect(final.heldRelease.count).toBe(lane === 'SINGLE_WORKER' ? 2 : 1);
            expect(final.execution).toMatchObject({ active: false, terminalDisposition: 'COMPLETED' });
        });
    });
}

defineLane('DIRECT');
defineLane('ROLE_PLAN');
defineLane('SINGLE_WORKER');

describe('V1 rehearsal journal capacity', () => {
    beforeAll(() => {
        baseEnvironment();
        useExecutionStore.setState({ executions: [], currentExecution: null });
    });
    afterAll(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        while (journalDirs.length) rmSync(journalDirs.pop()!, { recursive: true, force: true });
    });

    it('a tenant whose active slots are used up is refused with its reason and no provider call; a provisioned tenant keeps working', async () => {
        openJournal(2);
        for (let i = 0; i < 2; i++) {
            scriptProvider(longText(`capacity ${i}`));
            expect((await POST(executeRequest(baseBody()) as never)).status).toBe(200);
        }
        const fetch = scriptProvider(longText('capacity refused'));
        const refused = await POST(executeRequest(baseBody()) as never);
        const data = await refused.json();
        expect(refused.status).toBe(429);
        expect(data).toMatchObject({ success: false, code: 'JOURNAL_TENANT_CAPACITY' });
        expect(String(data.error)).toContain('No provider call was made');
        expect(fetch).not.toHaveBeenCalled();
    });
});
