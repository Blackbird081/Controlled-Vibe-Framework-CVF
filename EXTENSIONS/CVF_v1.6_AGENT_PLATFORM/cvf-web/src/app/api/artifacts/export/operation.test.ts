import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtifactExportRequest } from '@/components/ArtifactExportPanel';
import { useHtmlBuildAttempts, type HtmlJobReference } from '@/components/useHtmlBuildAttempts';
import type { ControlledEvaluateRequest, ControlledInvoker } from '@/lib/artifacts-receipt-operation-contract';
import type { DraftRequest } from '@/lib/html-draft-recovery-contract';
import { JOB_EFFECTS } from '@/lib/html-job-contract';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import { createReceiptOperationFixtureProfile } from '@/lib/server/receipt-operation-profile';
import { runControlledBranch, type BranchSeams, type RenderedExport } from './operation-branch';
import { POST } from './route';

const state = vi.hoisted(() => ({ operation: { posture: 'UNDECLARED' } as unknown, session: null as unknown }));
vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn(async () => state.session) }));
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: vi.fn() }));
vi.mock('@/lib/server/receipt-operation-profile', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/server/receipt-operation-profile')>();
  return { ...actual, resolveReceiptOperation: vi.fn(() => state.operation) };
});
const actualProfile = vi.importActual<typeof import('@/lib/server/receipt-operation-profile')>('@/lib/server/receipt-operation-profile');

const ROOTS = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-binding-repair-20261019', 'worker', 'roots');
const hex = (text: string) => createHash('sha256').update(text).digest('hex');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const BODY = { title: 'Review', sourcePath: 'docs/p.md', sourceContent: '# Source\n\nSynthetic fixture content.', memoryClass: 'FULL_RECORD' as const,
  status: 'DRAFT', claimBoundary: 'Local synthetic fixture only.', receiptAnchor: 'receipt-anchor' };
const SOURCE = 'ncr-synthetic-op-1';
const JOB = '123e4567-e89b-42d3-a456-426614174001';
const JOB2 = '123e4567-e89b-42d3-a456-426614174002';
const T0 = new Date('2026-10-19T01:00:00.000Z');
const ACTION: Record<string, string> = { ALLOW: 'ALLOW', DENY: 'BLOCK' };
const goodSession = (over: Record<string, unknown> = {}) => ({ authMode: 'session', expiresAt: Date.now() + 3_600_000, ...owner, role: 'owner', ...over });
const fetchMock = vi.fn();

async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
function engine(request: ControlledEvaluateRequest, decision = 'ALLOW') {
  return { success: true, data: {
    report: { request_summary: { request_id: request.request_id, artifact_id: request.artifact_id }, decision_analysis: { final_decision: decision },
      report_metadata: { generated_at: '2026-10-19T01:00:01.000Z' }, cvf_risk_level: 'R1', cvf_enforcement: { action: ACTION[decision] }, integrity: { has_ledger_reference: true } },
    execution_record: { final_decision: decision, ledger_attached: true } } };
}
function fixture(root: string, respond: (request: ControlledEvaluateRequest) => unknown = request => engine(request)) {
  const calls: ControlledEvaluateRequest[] = [];
  const invoker: ControlledInvoker = async request => { calls.push(request); return respond(request); };
  const profile = createReceiptOperationFixtureProfile({ root, endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', invoker, timeoutMs: 3000 });
  return { profile, calls, store: new HtmlDraftSnapshotStore(profile.store) };
}
const createJob = (store: HtmlDraftSnapshotStore, jobId = JOB, request: DraftRequest = { ...BODY }, sourceRecordId = SOURCE, who = owner) =>
  store.createJob({ jobId, sourceRecordId, goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }], expectedOutput: 'HTML', allowedEffects: JOB_EFFECTS, request }, who);
const selectors = (job = JOB, source = SOURCE) => ({ 'X-CVF-Job-Id': job, 'X-CVF-Source-Record-Id': source });
const post = (body: unknown, headers: Record<string, string> = {}, origin = 'http://localhost') => POST(new NextRequest('http://localhost/api/artifacts/export', {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers }, body: JSON.stringify(body) }));

const PROFILE_ENV = ['CVF_NCR_DRAFT_PROFILE', 'CVF_NCR_HTML_JOB_PROFILE', 'CVF_NCR_DRAFT_ROOT', 'CVF_NCR_DRAFT_RUN_ID', 'CVF_NCR_RECEIPT_OPERATION_PROFILE'] as const;
const priorEnv = new Map<string, string | undefined>();
beforeEach(() => {
  for (const key of PROFILE_ENV) { priorEnv.set(key, process.env[key]); delete process.env[key]; }
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  state.session = goodSession();
  state.operation = { posture: 'UNDECLARED' };
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const key of PROFILE_ENV) { const prior = priorEnv.get(key); if (prior === undefined) delete process.env[key]; else process.env[key] = prior; }
});

describe('PH/REQ-INTEGRATION actual POST with the controlled injected branch', () => {
  it('runs the first Build with owner-scoped job and hash, no saved version, one injected send and no legacy fetch or token read', async () => {
    const root = await newRoot('post-first');
    const { profile, calls, store } = fixture(root);
    expect(await createJob(store)).toBe('SAVED');
    state.operation = { posture: 'CONTROLLED', profile };
    const getVersion = vi.spyOn(HtmlDraftSnapshotStore.prototype, 'getVersion');
    const tokenReads = vi.fn(() => 'unused');
    const realProcess = process;
    const env = new Proxy(realProcess.env, { get(target, key) { if (key === 'CVF_SERVICE_TOKEN') return tokenReads(); return Reflect.get(target, key); } });
    vi.stubGlobal('process', Object.assign(Object.create(realProcess), { env }));
    const response = await post(BODY, selectors());
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ cvf_phase: 'REVIEW', cvf_risk_level: 'R1', artifact_id: 'receipt-anchor' });
    expect(payload.data).toMatchObject({ governanceReceiptStatus: 'PRESENT', governanceState: 'DRAFT_UNACCEPTED', receiptAnchor: 'receipt-anchor',
      governanceReceipt: { decision: 'ALLOW', riskLevel: 'R1' }, governanceReceiptAttemptId: calls[0].request_id });
    expect(payload.data.html).toContain('DRAFT / UNACCEPTED');
    expect(payload.operation).toMatchObject({ outcome: 'RECEIPT_VERIFIED', reused: false, sends: 1, persisted: true });
    expect(payload.routeGovernanceProof).toBeUndefined();
    expect(getVersion).not.toHaveBeenCalled();
    getVersion.mockRestore();
    expect(tokenReads).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('answers a repeated or re-minted Build for a different render with reference-only ALREADY_PROCESSED and no second send', async () => {
    const root = await newRoot('post-repeat');
    const { profile, calls, store } = fixture(root);
    await createJob(store);
    state.operation = { posture: 'CONTROLLED', profile };
    expect((await post(BODY, selectors())).status).toBe(200);
    vi.setSystemTime(new Date(T0.getTime() + 300_000));
    await createJob(store, JOB2);
    for (const headers of [selectors(), selectors(JOB2)]) {
      const response = await post(BODY, headers);
      const text = await response.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      expect(response.status).toBe(409);
      expect(payload).toMatchObject({ success: false, error: 'ALREADY_PROCESSED', operation: { state: 'OUTCOME', outcome: 'RECEIPT_VERIFIED' } });
      expect(payload.data).toBeUndefined();
      expect(text).not.toMatch(/<html|doctype|governanceReceipt|"receiptId"|html"/i);
      vi.setSystemTime(new Date(Date.now() + 60_000));
    }
    expect(calls).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('reuses an exact identical immutable target through the branch with zero sends and refuses any changed target, job or config', async () => {
    const root = await newRoot('branch-reuse');
    const { profile, calls, store } = fixture(root);
    await createJob(store);
    await createJob(store, JOB2);
    const fixed: RenderedExport = { html: '<!doctype html><p>fixed target</p>', generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: hex('fixed'),
      filename: 'review.html', receiptAnchor: 'receipt-anchor', verification: [{ label: 'x', passed: true }] };
    const seams = (rendered: RenderedExport): BranchSeams => ({ render: () => rendered,
      compose: (r, projection) => ({ html: r.html, governanceReceiptStatus: projection.status, ...(projection.receipt ? { governanceReceipt: projection.receipt } : {}) }) });
    const args = (rendered: RenderedExport, job = JOB) => ({ headers: new Headers(selectors(job)), owner, fields: { ...BODY }, profile, seams: seams(rendered) });
    const first = await runControlledBranch(args(fixed));
    expect(first.status).toBe(200);
    const again = await runControlledBranch(args(fixed));
    expect(again.status).toBe(200);
    expect(again.body.operation).toMatchObject({ reused: true, sends: 0, outcome: 'RECEIPT_VERIFIED' });
    expect(again.body.data).toEqual(first.body.data);
    expect(calls).toHaveLength(1);
    for (const changed of [args({ ...fixed, html: '<!doctype html><p>new render</p>' }), args({ ...fixed, generatedAt: '2026-10-19T02:00:00.000Z' }), args(fixed, JOB2)]) {
      const refused = await runControlledBranch(changed);
      expect(refused.status).toBe(409);
      expect(refused.body).toMatchObject({ success: false, error: 'ALREADY_PROCESSED' });
      expect(refused.body.data).toBeUndefined();
    }
    const otherProfile = createReceiptOperationFixtureProfile({ root, endpointId: 'synthetic-endpoint-2', storeId: 'synthetic-store-1', invoker: profile.invoker });
    expect((await runControlledBranch({ ...args(fixed), profile: otherProfile })).status).toBe(409);
    expect(calls).toHaveLength(1);
  });
  it('records a timed-out injected send as unknown, never as a receipt, and refuses the repeat', async () => {
    const root = await newRoot('post-timeout');
    const calls: number[] = [];
    const invoker: ControlledInvoker = async () => { calls.push(1); return new Promise(() => undefined); };
    const profile = createReceiptOperationFixtureProfile({ root, endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', invoker, timeoutMs: 400 });
    await createJob(new HtmlDraftSnapshotStore(profile.store));
    state.operation = { posture: 'CONTROLLED', profile };
    const response = await post(BODY, selectors());
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({ governanceReceiptStatus: 'TIMED_OUT', governanceState: 'DRAFT_UNACCEPTED' });
    expect(payload.data.governanceReceipt).toBeUndefined();
    expect(payload.operation).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', sends: 1 });
    vi.setSystemTime(new Date(T0.getTime() + 60_000));
    expect((await post(BODY, selectors())).status).toBe(409);
    expect(calls).toHaveLength(1);
  });
});

async function controlledFixture(label: string) {
  const root = await newRoot(label);
  const made = fixture(root);
  state.operation = { posture: 'CONTROLLED', profile: made.profile };
  return { ...made, root };
}

describe('PA/REQ-INTEGRATION selectors, session and forged input deny with zero sends', () => {
  const controlled = controlledFixture;
  it.each([
    ['partial job only', { 'X-CVF-Job-Id': JOB }, 400, 'SELECTOR_INVALID'],
    ['partial source only', { 'X-CVF-Source-Record-Id': SOURCE }, 400, 'SELECTOR_INVALID'],
    ['malformed job id', selectors('../unsafe'), 400, 'SELECTOR_INVALID'],
    ['non-synthetic source', selectors(JOB, 'evt_1'), 400, 'SELECTOR_INVALID'],
    ['comma-conflicting job ids', selectors(`${JOB}, ${JOB2}`), 400, 'SELECTOR_INVALID'],
    ['comma-conflicting source ids', selectors(JOB, `${SOURCE},${SOURCE}x`), 400, 'SELECTOR_INVALID'],
    ['empty values', selectors('', ''), 400, 'SELECTOR_INVALID'],
    ['no selectors', {}, 400, 'SELECTOR_REQUIRED'],
  ])('denies %s before reading a job or sending', async (_label, headers, status, reason) => {
    const { calls, root } = await controlled('post-selector');
    const response = await post(BODY, headers as Record<string, string>);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ success: false, error: 'RECEIPT_OPERATION_DENIED', reason });
    expect(calls).toHaveLength(0);
    expect(await fs.readdir(root)).toEqual([]);
  });
  it('denies a missing job, a mismatching request hash and a foreign owner before admission', async () => {
    const { calls, store, root } = await controlled('post-job');
    const missing = await post(BODY, selectors());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: 'JOB_NOT_FOUND' });
    await createJob(store, JOB, { ...BODY, title: 'A different request' });
    const mismatch = await post(BODY, selectors());
    expect(mismatch.status).toBe(409);
    expect(await mismatch.json()).toMatchObject({ error: 'JOB_REQUEST_MISMATCH' });
    await createJob(store, JOB2);
    state.session = goodSession({ userId: 'u2' });
    expect((await post(BODY, selectors(JOB2))).status).toBe(404);
    expect(calls).toHaveLength(0);
    for (const entry of await fs.readdir(root)) expect(await fs.readdir(path.join(root, entry))).not.toContain('operations');
  });
  it('denies a break-glass, non-session, unauthenticated, expired or cross-origin request and a forged permit field', async () => {
    const { calls, store } = await controlled('post-auth');
    await createJob(store);
    for (const session of [goodSession({ realUserId: 'admin' }), goodSession({ impersonation: true }), goodSession({ authMode: 'service_token' }),
      goodSession({ expiresAt: Date.now() - 1 }), goodSession({ userId: 'bad id' })]) {
      state.session = session;
      expect((await post(BODY, selectors())).status).toBe(403);
    }
    state.session = NextResponse.json({ success: false }, { status: 401 });
    expect((await post(BODY, selectors())).status).toBe(401);
    state.session = goodSession();
    expect((await post(BODY, selectors(), 'http://foreign')).status).toBe(403);
    const forged = await post({ ...BODY, permit: 'allow-one-send' }, { ...selectors(), 'X-CVF-Permit': 'allow-one-send' });
    expect(forged.status).toBe(400);
    expect(await forged.json()).toMatchObject({ error: 'Unknown artifact export field.' });
    expect((await post({ ...BODY, sourceContent: 'OPENAI_API_KEY=hidden-value' }, selectors())).status).toBe(400);
    expect(calls).toHaveLength(0);
    expect((await post(BODY, { ...selectors(), 'X-CVF-Permit': 'ignored' })).status).toBe(200);
    expect(calls).toHaveLength(1);
  });
  it('denies an expired job before admission and maps changed content or another actor to different keys sent once each', async () => {
    const { calls, store } = await controlled('post-expired');
    const expiredJob = '123e4567-e89b-42d3-a456-426614174004';
    await createJob(store, expiredJob);
    const changed = { ...BODY, sourceContent: '# Changed source\n\nAnother synthetic fixture content.' };
    const actorJob = '123e4567-e89b-42d3-a456-426614174003';
    await createJob(store, JOB, { ...BODY }, 'ncr-synthetic-op-2');
    await createJob(store, JOB2, { ...changed }, 'ncr-synthetic-op-2');
    await createJob(store, actorJob, { ...BODY }, 'ncr-synthetic-op-2', { ...owner, userId: 'u2' });
    expect((await post(BODY, selectors(JOB, 'ncr-synthetic-op-2'))).status).toBe(200);
    expect((await post(changed, selectors(JOB2, 'ncr-synthetic-op-2'))).status).toBe(200);
    state.session = goodSession({ userId: 'u2' });
    expect((await post(BODY, selectors(actorJob, 'ncr-synthetic-op-2'))).status).toBe(200);
    expect(calls).toHaveLength(3);
    expect(new Set(calls.map(call => call.request_id)).size).toBe(3);
    vi.setSystemTime(new Date(T0.getTime() + 25 * 3_600_000));
    state.session = goodSession();
    const expired = await post(BODY, selectors(expiredJob));
    expect(expired.status).toBe(404);
    expect(await expired.json()).toMatchObject({ error: 'JOB_NOT_FOUND' });
    expect(calls).toHaveLength(3);
  });
  it.each([
    ['disabled', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'DISABLED' }, 'DISABLED'],
    ['disabled beside enabling variables', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'DISABLED', CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC' }, 'DISABLED'],
    ['invalid', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'ENABLED' }, 'INVALID_SELECTOR'],
    ['empty', { CVF_NCR_RECEIPT_OPERATION_PROFILE: '' }, 'INVALID_SELECTOR'],
    ['comma conflict', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'LOCAL_SYNTHETIC,DISABLED' }, 'INVALID_SELECTOR'],
    ['held activation', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'INJECTED_SYNTHETIC_RECEIPT' }, 'ACTIVATION_HELD_UNSUPPORTED'],
    ['production', { CVF_NCR_RECEIPT_OPERATION_PROFILE: 'LOCAL_SYNTHETIC', NODE_ENV: 'production' }, 'PRODUCTION_DENIED'],
  ])('denies a declared %s posture through the real resolver with no legacy fallback', async (_label, env, reason) => {
    const actual = await actualProfile;
    state.operation = actual.resolveReceiptOperation(env);
    for (const headers of [{}, selectors()]) {
      const response = await post(BODY, headers);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ success: false, error: 'RECEIPT_OPERATION_DENIED', reason });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('denies selectors with no valid profile and a declared local posture without a local job profile', async () => {
    state.operation = { posture: 'UNDECLARED' };
    const response = await post(BODY, selectors());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ reason: 'SELECTORS_WITHOUT_PROFILE' });
    state.operation = { posture: 'LOCAL_SYNTHETIC' };
    const local = await post(BODY);
    expect(local.status).toBe(403);
    expect(await local.json()).toMatchObject({ reason: 'LOCAL_PROFILE_UNAVAILABLE' });
    state.operation = { posture: 'UNDECLARED' };
    const bare = await post(BODY);
    expect(bare.status).toBe(403);
    expect(await bare.json()).toMatchObject({ reason: 'POSTURE_UNDECLARED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('PA/REQ-INTEGRATION posture resolver and route decision', () => {
  it('maps every environment value to a deny or a non-receipt posture and never to a controlled receipt profile', async () => {
    const actual = await actualProfile;
    const label = (env: Record<string, string | undefined>) => { const p = actual.resolveReceiptOperation(env); return p.posture === 'DENY' ? `DENY:${p.reason}` : p.posture; };
    const key = 'CVF_NCR_RECEIPT_OPERATION_PROFILE';
    expect(label({})).toBe('UNDECLARED');
    expect(label({ NODE_ENV: 'production' })).toBe('UNDECLARED');
    expect(label({ [key]: 'LOCAL_SYNTHETIC' })).toBe('LOCAL_SYNTHETIC');
    expect(label({ [key]: 'LEGACY_COMPATIBILITY_ONLY' })).toBe('LEGACY_COMPATIBILITY_ONLY');
    expect(label({ [key]: 'LEGACY_COMPATIBILITY_ONLY', NODE_ENV: 'production' })).toBe('DENY:PRODUCTION_DENIED');
    expect(label({ [key]: 'DISABLED' })).toBe('DENY:DISABLED');
    expect(label({ [key]: 'DISABLED', NODE_ENV: 'production' })).toBe('DENY:PRODUCTION_DENIED');
    for (const value of ['', 'local_synthetic', ' LOCAL_SYNTHETIC', 'LOCAL_SYNTHETIC,DISABLED', 'true', '1', 'CONTROLLED', 'INJECTED_SYNTHETIC_RECEIPT ',
      'legacy_compatibility_only', ' LEGACY_COMPATIBILITY_ONLY', 'LEGACY_COMPATIBILITY_ONLY ', 'LEGACY_COMPATIBILITY_ONLY,DISABLED', 'LEGACY']) {
      expect(label({ [key]: value }), value).toMatch(/^DENY:/);
    }
    for (const value of [undefined, '', 'LOCAL_SYNTHETIC', 'DISABLED', 'INJECTED_SYNTHETIC_RECEIPT', 'CONTROLLED_RECEIPT', 'LEGACY_COMPATIBILITY_ONLY']) {
      expect(actual.resolveReceiptOperation({ [key]: value, CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC' }).posture).not.toBe('CONTROLLED');
    }
  });
  it('decides routes without ever falling back from a deny to legacy', async () => {
    const actual = await actualProfile;
    const decide = (posture: Parameters<typeof actual.decideReceiptOperationRoute>[0]['posture'], selectorsKind: 'NONE' | 'VALID' | 'INVALID', local: boolean) =>
      actual.decideReceiptOperationRoute({ posture, selectors: selectorsKind, localProfilePresent: local });
    expect(decide({ posture: 'UNDECLARED' }, 'NONE', false)).toEqual({ route: 'DENY', reason: 'POSTURE_UNDECLARED', status: 403 });
    expect(decide({ posture: 'UNDECLARED' }, 'NONE', true)).toEqual({ route: 'LOCAL_ONLY' });
    expect(decide({ posture: 'UNDECLARED' }, 'VALID', true)).toEqual({ route: 'LOCAL_ONLY' });
    expect(decide({ posture: 'UNDECLARED' }, 'VALID', false)).toMatchObject({ route: 'DENY', status: 403, reason: 'SELECTORS_WITHOUT_PROFILE' });
    expect(decide({ posture: 'UNDECLARED' }, 'INVALID', false)).toMatchObject({ route: 'DENY', status: 400 });
    expect(decide({ posture: 'UNDECLARED' }, 'INVALID', true)).toMatchObject({ route: 'DENY', status: 400 });
    expect(decide({ posture: 'LOCAL_SYNTHETIC' }, 'NONE', true)).toEqual({ route: 'LOCAL_ONLY' });
    expect(decide({ posture: 'LOCAL_SYNTHETIC' }, 'NONE', false)).toMatchObject({ route: 'DENY' });
    const legacy = { posture: 'LEGACY_COMPATIBILITY_ONLY' } as const;
    expect(decide(legacy, 'NONE', false)).toEqual({ route: 'LEGACY' });
    expect(decide(legacy, 'NONE', true)).toEqual({ route: 'DENY', reason: 'LEGACY_PROFILE_CONFLICT', status: 403 });
    expect(decide(legacy, 'VALID', false)).toEqual({ route: 'DENY', reason: 'LEGACY_SELECTORS_CONFLICT', status: 403 });
    expect(decide(legacy, 'VALID', true)).toMatchObject({ route: 'DENY', status: 403 });
    for (const local of [true, false]) expect(decide(legacy, 'INVALID', local)).toMatchObject({ route: 'DENY', status: 400, reason: 'SELECTOR_INVALID' });
    for (const unknown of [{ posture: 'MYSTERY' }, { posture: 'legacy_compatibility_only' }, {}, null]) {
      for (const local of [true, false]) expect(decide(unknown as never, 'NONE', local), JSON.stringify(unknown)).toMatchObject({ route: 'DENY' });
    }
    for (const selectorKind of ['NONE', 'VALID', 'INVALID'] as const) {
      for (const local of [true, false]) expect(decide({ posture: 'DENY', reason: 'DISABLED' }, selectorKind, local)).toMatchObject({ route: 'DENY', reason: 'DISABLED' });
    }
  });
  it('builds the controlled profile only through the typed factory and rejects non-synthetic or unsafe input', async () => {
    const root = await newRoot('profile-factory');
    const invoker: ControlledInvoker = async () => ({});
    const profile = createReceiptOperationFixtureProfile({ root, endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', invoker });
    expect(profile).toMatchObject({ kind: 'INJECTED_SYNTHETIC_RECEIPT_FIXTURE', effect: 'INJECTED_SYNTHETIC_RECEIPT', identityTrust: 'DECLARED_UNATTESTED',
      production: false, sourcePrefix: 'ncr-synthetic-', timeoutMs: 4000, lookup: null });
    expect(JOB_EFFECTS as readonly string[]).not.toContain(profile.effect);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(profile.store).toEqual({ kind: 'local-synthetic', root, production: false, jobDecisions: true, receiptOperations: true });
    for (const bad of [
      { root: 'relative/path' }, { root: path.parse(root).root }, { root: `${root}${path.sep}.` }, { endpointId: 'https://real.example' }, { storeId: 'prod-store' },
      { timeoutMs: 0 }, { timeoutMs: 30_001 }, { invoker: 'fetch' as never }, { lookup: 'x' as never },
    ]) {
      expect(() => createReceiptOperationFixtureProfile({ root, endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', invoker, ...bad })).toThrow('FIXTURE_PROFILE_INVALID');
    }
  });
});

describe('LR2/REQ-POSTURE absence denies and the explicit server value is the only way to the retained legacy helper', () => {
  const key = 'CVF_NCR_RECEIPT_OPERATION_PROFILE';
  const outcome = async (headers: Record<string, string> = {}) => { const response = await post(BODY, headers); return [response.status, (await response.json()).reason]; };
  it('denies DISABLED, then keeps denying after the selector or any enabling variable is removed, also through a fresh resolver, with zero sends', async () => {
    const actual = await actualProfile;
    const { calls, root } = await controlledFixture('post-absence');
    state.operation = actual.resolveReceiptOperation({ [key]: 'DISABLED' });
    expect([await outcome(), await outcome(selectors())]).toEqual([[403, 'DISABLED'], [403, 'DISABLED']]);
    for (const env of [{}, { NODE_ENV: 'development' }, { CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_ROOT: root }]) {
      state.operation = actual.resolveReceiptOperation(env);
      expect([await outcome(), await outcome(selectors())], JSON.stringify(env)).toEqual([[403, 'POSTURE_UNDECLARED'], [403, 'SELECTORS_WITHOUT_PROFILE']]);
    }
    expect([calls.length, fetchMock.mock.calls.length, await fs.readdir(root)]).toEqual([0, 0, []]);
  });
  it('reaches the retained legacy helper only through the explicit value, and denies it with job selectors, a local profile, malformed values or production', async () => {
    const actual = await actualProfile;
    state.operation = actual.resolveReceiptOperation({ [key]: 'LEGACY_COMPATIBILITY_ONLY' });
    expect(state.operation).toEqual({ posture: 'LEGACY_COMPATIBILITY_ONLY' });
    expect(await (await post(BODY)).json()).not.toMatchObject({ error: 'RECEIPT_OPERATION_DENIED' });
    expect(await outcome(selectors())).toEqual([403, 'LEGACY_SELECTORS_CONFLICT']);
    expect(await outcome({ 'X-CVF-Job-Id': JOB })).toEqual([400, 'SELECTOR_INVALID']);
    const root = await newRoot('post-legacy-conflict');
    await fs.writeFile(path.join(root, '.cvf-html-draft-synthetic.json'), JSON.stringify({ schemaVersion: 1, kind: 'CVF_HTML_DRAFT_SYNTHETIC', syntheticOnly: true, runId: 'synthetic_run_op_1234' }));
    Object.assign(process.env, { CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_ROOT: root, CVF_NCR_DRAFT_RUN_ID: 'synthetic_run_op_1234' });
    expect(await outcome()).toEqual([403, 'LEGACY_PROFILE_CONFLICT']);
    for (const [env, reason] of [[{ [key]: 'LEGACY_COMPATIBILITY_ONLY', NODE_ENV: 'production' }, 'PRODUCTION_DENIED'], [{ [key]: 'legacy_compatibility_only' }, 'INVALID_SELECTOR'],
      [{ [key]: 'LEGACY_COMPATIBILITY_ONLY,DISABLED' }, 'INVALID_SELECTOR'], [{ [key]: '' }, 'INVALID_SELECTOR']] as const) {
      state.operation = actual.resolveReceiptOperation(env);
      expect(await outcome(), reason).toEqual([403, reason]);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('never lets the runtime resolver build a controlled profile or invoker from any declared value', async () => {
    const actual = await actualProfile;
    for (const value of [undefined, 'LOCAL_SYNTHETIC', 'LEGACY_COMPATIBILITY_ONLY', 'DISABLED', 'INJECTED_SYNTHETIC_RECEIPT']) {
      const posture = actual.resolveReceiptOperation({ [key]: value });
      expect(posture).not.toHaveProperty('profile');
      expect(JSON.stringify(posture)).not.toMatch(/invoker|profile|root/i);
    }
  });
});

describe('PH/REQ-INTEGRATION local-only profile keeps no receipt and binds the local job only', () => {
  it('returns NOT_CONFIGURED without an injected send, and denies a missing job under selectors', async () => {
    const root = await newRoot('post-local');
    const marker = path.join(root, '.cvf-html-draft-synthetic.json');
    await fs.writeFile(marker, JSON.stringify({ schemaVersion: 1, kind: 'CVF_HTML_DRAFT_SYNTHETIC', syntheticOnly: true, runId: 'synthetic_run_op_1234' }));
    const keys = ['CVF_NCR_DRAFT_PROFILE', 'CVF_NCR_HTML_JOB_PROFILE', 'CVF_NCR_DRAFT_ROOT', 'CVF_NCR_DRAFT_RUN_ID'] as const;
    const prior = keys.map(key => process.env[key]);
    Object.assign(process.env, { CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_ROOT: root, CVF_NCR_DRAFT_RUN_ID: 'synthetic_run_op_1234' });
    try {
      state.operation = { posture: 'LOCAL_SYNTHETIC' };
      const store = new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, jobDecisions: true });
      await createJob(store);
      const bound = await post(BODY, selectors());
      expect(bound.status).toBe(200);
      const payload = await bound.json();
      expect(payload.data).toMatchObject({ governanceReceiptStatus: 'NOT_CONFIGURED', governanceState: 'DRAFT_UNACCEPTED' });
      expect(payload.data.governanceReceipt).toBeUndefined();
      expect((await post(BODY, selectors(JOB2))).status).toBe(404);
      expect((await post(BODY)).status).toBe(200);
      expect((await post(BODY, { 'X-CVF-Job-Id': JOB })).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      keys.forEach((key, index) => { if (prior[index] === undefined) delete process.env[key]; else process.env[key] = prior[index]; });
    }
  });
});

describe('PH/REQ-INTEGRATION hook selector transport', () => {
  const REQUEST: ArtifactExportRequest = { ...BODY };
  const RESULT = { html: '<p>x</p>', filename: 'x.html', receiptAnchor: 'a', verification: [], generatedAt: '2026-10-19T01:00:00.000Z' };
  const hookFetch = vi.fn<(url: string, init: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>>();
  const sameRequest = (a: ArtifactExportRequest, b: ArtifactExportRequest) => JSON.stringify(a) === JSON.stringify(b);
  beforeEach(() => {
    hookFetch.mockReset();
    hookFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: RESULT }) });
    vi.stubGlobal('fetch', hookFetch);
  });
  const generate = async (prepareJob?: (request: ArtifactExportRequest) => Promise<HtmlJobReference>) => {
    const { result } = renderHook(() => useHtmlBuildAttempts({ initialResult: null, exportEndpoint: '/api/artifacts/export', prepareJob, sameRequest }));
    await act(async () => { await result.current.generate(REQUEST); });
    return result;
  };
  it('sends both selectors with the unchanged seven-field body only for a valid job reference', async () => {
    await generate(async () => ({ jobId: JOB, sourceRecordId: SOURCE }));
    expect(hookFetch).toHaveBeenCalledTimes(1);
    const init = hookFetch.mock.calls[0][1];
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'X-CVF-Job-Id': JOB, 'X-CVF-Source-Record-Id': SOURCE });
    expect(Object.keys(JSON.parse(String(init.body))).sort()).toEqual(['claimBoundary', 'memoryClass', 'receiptAnchor', 'sourceContent', 'sourcePath', 'status', 'title']);
    expect(JSON.parse(String(init.body))).toEqual(REQUEST);
  });
  it.each([
    ['no prepareJob', undefined],
    ['malformed job id', async () => ({ jobId: 'not-a-uuid', sourceRecordId: SOURCE })],
    ['malformed source', async () => ({ jobId: JOB, sourceRecordId: 'bad id' })],
    ['partial reference', async () => ({ jobId: JOB }) as unknown as HtmlJobReference],
  ])('keeps the legacy no-header request for %s', async (_label, prepareJob) => {
    await generate(prepareJob);
    expect(hookFetch).toHaveBeenCalledTimes(1);
    expect(hookFetch.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
  });
  it('keeps the Stop fence: a stopped attempt never reaches fetch even when the job resolves later', async () => {
    let release!: (reference: HtmlJobReference) => void;
    const prepareJob = () => new Promise<HtmlJobReference>(resolve => { release = resolve; });
    const { result } = renderHook(() => useHtmlBuildAttempts({ initialResult: null, exportEndpoint: '/api/artifacts/export', prepareJob, sameRequest }));
    let pending!: Promise<void>;
    act(() => { pending = result.current.generate(REQUEST); });
    act(() => { result.current.stop(); });
    await act(async () => { release({ jobId: JOB, sourceRecordId: SOURCE }); await pending; });
    expect(hookFetch).not.toHaveBeenCalled();
    expect(result.current.stoppedUnknown).toBe(true);
  });
});
