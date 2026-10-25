import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoundConfigInput } from '@/lib/artifacts-bound-receipt-contract';
import { JOB_EFFECTS } from '@/lib/html-job-contract';
import { createBoundReceiptHandlers } from '@/lib/server/bound-receipt-api';
import { createBoundReceiptFixtureProfile } from '@/lib/server/bound-receipt-profile';
import type { WireRequest, WireResponse } from '@/lib/server/bound-receipt-transport';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import { POST } from './route';

const state = vi.hoisted(() => ({ operation: { posture: 'UNDECLARED' } as unknown, session: null as unknown }));
vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn(async () => state.session) }));
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: vi.fn() }));
vi.mock('@/lib/server/receipt-operation-profile', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/server/receipt-operation-profile')>();
  return { ...actual, resolveReceiptOperation: vi.fn(() => state.operation) };
});

const WORKER = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-authority-repair-20261020', 'worker');
const ROOTS = path.join(WORKER, 'roots');
const ENGINE_DIR = path.resolve(process.cwd(), '..', '..', 'CVF_v1.6.1_GOVERNANCE_ENGINE', 'ai_governance_core');
const PEER = path.join(ENGINE_DIR, 'tests', 'artifact_receipt_peer.py');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
// The Python engine uses the real clock, so the proxy clock stays real while the export route's Date is frozen to make the repeat render byte-identical.
const realNow = Date.now.bind(Date);
const T0 = new Date('2026-10-19T01:00:00.000Z');
const PROFILE_ENV = ['CVF_NCR_DRAFT_PROFILE', 'CVF_NCR_HTML_JOB_PROFILE', 'CVF_NCR_DRAFT_ROOT', 'CVF_NCR_DRAFT_RUN_ID', 'CVF_NCR_RECEIPT_OPERATION_PROFILE'] as const;
const ENGINE_KEY = Buffer.from('cvf-bound-bridge-engine-key-0001');
const EXPORT_KEY = Buffer.from('cvf-bound-bridge-export-key-0001');
const BODY = { title: 'Review', sourcePath: 'docs/p.md', sourceContent: '# Source\n\nSynthetic fixture content.', memoryClass: 'FULL_RECORD' as const,
  status: 'DRAFT', claimBoundary: 'Local synthetic fixture only.', receiptAnchor: 'receipt-anchor' };
const goodSession = () => ({ authMode: 'session', expiresAt: realNow() + 3_600_000, ...owner, role: 'owner' });

/** One owned Python process: its own context, its own native connection on its own thread, canonical frames over stdin/stdout. No socket. */
class Bridge {
  private buffer = '';
  private readonly frames: Array<Record<string, unknown>> = [];
  private readonly waiters: Array<(frame: Record<string, unknown>) => void> = [];
  private nextId = 1;
  stderr = '';
  asgiEntries = 0;
  readonly exited: Promise<number>;
  constructor(readonly child: ChildProcessWithoutNullStreams) {
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      for (let index = this.buffer.indexOf('\n'); index >= 0; index = this.buffer.indexOf('\n')) {
        const line = this.buffer.slice(0, index).trim();
        this.buffer = this.buffer.slice(index + 1);
        if (line) { const frame = JSON.parse(line) as Record<string, unknown>; const waiter = this.waiters.shift(); if (waiter) waiter(frame); else this.frames.push(frame); }
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => { this.stderr += chunk; });
    this.exited = new Promise(resolve => child.on('exit', code => resolve(code ?? -1)));
  }
  next(timeoutMs = 90_000): Promise<Record<string, unknown>> {
    const queued = this.frames.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`bridge timeout; stderr=${this.stderr}`)), timeoutMs);
      this.waiters.push(frame => { clearTimeout(timer); resolve(frame); });
    });
  }
  send(frame: Record<string, unknown>) { this.child.stdin.write(`${JSON.stringify(frame)}\n`); }
  async request(request: WireRequest): Promise<WireResponse> {
    const id = this.nextId++;
    this.send({ kind: 'REQUEST', id, origin: request.origin, method: request.method, path: request.path, remainingMs: request.deadline.remainingMs(),
      headers: request.headers, bodyHex: Buffer.from(request.body).toString('hex') });
    const frame = await this.next();
    if (frame.kind !== 'RESPONSE' || frame.id !== id) throw new Error(`unexpected frame ${JSON.stringify(frame)}`);
    this.asgiEntries += Number(frame.asgiEntries ?? 0);
    return { status: frame.status as number, headers: new Headers(frame.headers as Record<string, string>), body: Buffer.from(frame.bodyHex as string, 'hex') };
  }
  async ledger() {
    this.send({ kind: 'LEDGER' });
    return await this.next() as { requestIds: string[]; appended: number };
  }
  async close() {
    this.send({ kind: 'CLOSE' });
    const code = await Promise.race([this.exited, new Promise<number>(resolve => setTimeout(() => resolve(-999), 30_000))]);
    if (code === -999) this.child.kill();  // only this test's own child, only on a deadlock bound
    return code;
  }
}

let bridge: Bridge;
let measured: { instanceId: string; storeBindingId: string };
const configInput = (): BoundConfigInput => ({ policyRevision: 'peer-policy-r1', transformRevision: 'peer-transform-1', endpointId: 'peer-endpoint', storeId: 'peer-store',
  authReference: 'peer-bundle-1', authScope: 'two-hop-peer', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100',
  instanceId: measured.instanceId, storeBindingId: measured.storeBindingId, timeoutMs: 4000 });
const keyBundle = (engineKey: Uint8Array = ENGINE_KEY) => ({ authReference: 'peer-bundle-1', authScope: 'two-hop-peer',
  hops: { EXPORT_PROXY: { keyReference: 'export-key-1', key: EXPORT_KEY }, PROXY_ENGINE: { keyReference: 'peer-engine-key-1', key: engineKey } } });

beforeAll(async () => {
  const bridgeRoot = await newRoot('bridge-db');
  const childTmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cvf-ncr-r2-w05-bound-bridge-'));
  const child = spawn('python', [PEER, 'bridge', bridgeRoot], { cwd: ENGINE_DIR,
    env: { ...process.env, PYTHONPATH: ENGINE_DIR, CVF_GOVERNANCE_LEDGER_PATH: path.join(bridgeRoot, 'default-ledger.json'),
      TMP: childTmp, TEMP: childTmp, TMPDIR: childTmp }, stdio: ['pipe', 'pipe', 'pipe'] });
  bridge = new Bridge(child);
  const first = await bridge.next();
  if (first.kind !== 'MEASURED') throw new Error(`bridge did not start: ${JSON.stringify(first)} ${bridge.stderr}`);
  measured = { instanceId: first.instanceId as string, storeBindingId: first.storeBindingId as string };
  const probe = createBoundReceiptFixtureProfile({ root: await newRoot('probe'), config: configInput(), keyBundle: keyBundle(), webSend: async () => { throw new Error('unused'); },
    engineSend: async () => { throw new Error('unused'); } });
  bridge.send({ kind: 'CONFIGURE', config: probe.config, keyReference: 'peer-engine-key-1', keyHex: ENGINE_KEY.toString('hex'), challengeCapacity: 64 });
  expect((await bridge.next()).kind).toBe('READY');
}, 120_000);
afterAll(async () => { if (bridge) expect(await bridge.close()).toBe(0); }, 60_000);

async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
interface Wiring { engineWrap?: (request: WireRequest, real: (request: WireRequest) => Promise<WireResponse>) => Promise<WireResponse>; now?: () => number;
  engineKey?: Buffer; config?: Partial<BoundConfigInput> }
async function wire(opts: Wiring = {}) {
  const root = await newRoot('export');
  const real = (request: WireRequest) => bridge.request(request);
  const late: { handlers?: ReturnType<typeof createBoundReceiptHandlers> } = {};
  const profile = createBoundReceiptFixtureProfile({ root, config: { ...configInput(), ...opts.config }, keyBundle: keyBundle(opts.engineKey), now: opts.now ?? (() => realNow()),
    engineSend: request => (opts.engineWrap ? opts.engineWrap(request, real) : real(request)), webSend: async request => {
      const response = await late.handlers!.POST(new Request(`${request.origin}${request.path}`, { method: request.method,
        headers: request.headers, body: request.body as unknown as BodyInit }), request.deadline);
      return { status: response.status, headers: response.headers, body: new Uint8Array(await response.arrayBuffer()) };
    } });
  late.handlers = createBoundReceiptHandlers({ context: profile.webContext });
  state.operation = { posture: 'BOUND_CONTROLLED', profile };
  return { profile, store: new HtmlDraftSnapshotStore(profile.store) };
}
let sequence = 0;
async function job(store: HtmlDraftSnapshotStore, body = BODY) {
  sequence += 1;
  const jobId = `123e4567-e89b-42d3-a456-4266141${String(sequence).padStart(5, '0')}`;
  const sourceRecordId = `ncr-synthetic-bridge-${sequence}`;
  expect(await store.createJob({ jobId, sourceRecordId, goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }], expectedOutput: 'HTML', allowedEffects: JOB_EFFECTS, request: { ...body } }, owner)).toBe('SAVED');
  return { jobId, sourceRecordId };
}
const exportPost = (selector: { jobId: string; sourceRecordId: string }, extra: Record<string, string> = {}, body: unknown = BODY, origin = 'http://localhost') =>
  POST(new NextRequest('http://localhost/api/artifacts/export', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin',
    'X-CVF-Job-Id': selector.jobId, 'X-CVF-Source-Record-Id': selector.sourceRecordId, ...extra }, body: JSON.stringify(body) }));
type Body = { success: boolean; error?: string; reason?: string; data?: Record<string, unknown>; operation?: Record<string, unknown> };
const json = async (response: Response) => await response.json() as Body;
const zero = { invokerCalls: 0, challengeSent: 0, evaluateSent: 0, proxyRequests: 0, engineChallengeSends: 0, engineEvaluateSends: 0 };
const once = { invokerCalls: 1, challengeSent: 1, evaluateSent: 1, proxyRequests: 2, engineChallengeSends: 1, engineEvaluateSends: 1 };

beforeEach(() => {
  for (const key of PROFILE_ENV) delete process.env[key];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  state.session = goodSession();
  state.operation = { posture: 'UNDECLARED' };
});
afterEach(() => { vi.useRealTimers(); });

describe('actual export POST -> Web handler -> Python handler -> bound SQLite', () => {
  it('commits one block and returns a joined receipt whose engine risk is not overwritten by the requested R1; a repeat reuses it with zero sends', async () => {
    const { profile, store } = await wire();
    const selector = await job(store);
    const response = await exportPost(selector);
    expect(response.status).toBe(200);
    const body = await json(response);
    const receipt = body.data!.governanceReceipt as { receiptId: string; decision: string; riskLevel: string };
    const verification = body.data!.boundVerification as { effect: string; requestedRiskLevel: string; engineRiskLevel: string; bindingDigest: string; ledgerReference: { requestId: string; blockHash: string } };
    expect(body.data!.governanceState).toBe('DRAFT_UNACCEPTED');
    expect(body.data!.governanceReceiptStatus).toBe('PRESENT');
    expect(receipt).toMatchObject({ decision: 'ALLOW', riskLevel: 'R0' });
    expect(verification).toMatchObject({ effect: 'BOUND_ENGINE_RECEIPT', requestedRiskLevel: 'R1', engineRiskLevel: 'R0' });
    expect(verification.ledgerReference.requestId).toBe(receipt.receiptId);
    expect(body.operation).toMatchObject({ outcome: 'RECEIPT_VERIFIED', reused: false, sends: 1, persisted: true });
    expect(profile.counters).toEqual(once);
    const ledger = await bridge.ledger();
    expect(ledger.requestIds).toContain(receipt.receiptId);
    const again = await json(await exportPost(selector));
    expect(again.operation).toMatchObject({ outcome: 'RECEIPT_VERIFIED', reused: true, sends: 0 });
    expect((again.data!.boundVerification as { bindingDigest: string }).bindingDigest).toBe(verification.bindingDigest);
    expect(profile.counters).toEqual(once);
    expect((await bridge.ledger()).requestIds.filter(id => id === receipt.receiptId)).toHaveLength(1);
  }, 60_000);

  it('gives a second job with the same identity a reference-only answer: no HTML, no receipt and no second effect', async () => {
    const { profile, store } = await wire();
    const first = await job(store);
    expect((await exportPost(first)).status).toBe(200);
    const sourceRecordId = first.sourceRecordId;
    const jobId = '123e4567-e89b-42d3-a456-426614179999';
    expect(await store.createJob({ jobId, sourceRecordId, goal: 'Review again', criteria: [{ criterionId: 'c1', text: 'Heading' }], expectedOutput: 'HTML', allowedEffects: JOB_EFFECTS, request: { ...BODY } }, owner)).toBe('SAVED');
    const before = (await bridge.ledger()).appended;
    const second = await exportPost({ jobId, sourceRecordId });
    expect(second.status).toBe(409);
    const body = await json(second);
    expect(body).toMatchObject({ success: false, error: 'ALREADY_PROCESSED', operation: { state: 'OUTCOME', outcome: 'RECEIPT_VERIFIED' } });
    expect(body.data).toBeUndefined();
    expect(profile.counters).toEqual(once);
    expect((await bridge.ledger()).appended).toBe(before);
  }, 60_000);

  it('records OUTCOME_UNKNOWN when the response is lost after the engine committed, and never sends again', async () => {
    const { profile, store } = await wire({ engineWrap: async (request, real) => {
      const response = await real(request);
      if (request.path.endsWith('evaluate')) throw new Error('connection reset after commit');
      return response;
    } });
    const selector = await job(store);
    const before = (await bridge.ledger()).appended;
    const lost = await json(await exportPost(selector));
    expect(lost.operation).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', sends: 1, persisted: true, reason: 'STATUS' });
    expect(lost.data!.governanceReceiptStatus).toBe('UNAVAILABLE');
    expect(lost.data!.governanceReceipt).toBeUndefined();
    expect(lost.data!.governanceState).toBe('DRAFT_UNACCEPTED');
    expect((await bridge.ledger()).appended).toBe(before + 1);  // the effect exists; the caller still cannot claim it
    const retry = await exportPost(selector);
    expect(retry.status).toBe(409);
    expect(await json(retry)).toMatchObject({ error: 'ALREADY_PROCESSED', operation: { state: 'OUTCOME', outcome: 'OUTCOME_UNKNOWN' } });
    expect(profile.counters).toMatchObject({ invokerCalls: 1, engineEvaluateSends: 1 });
    expect((await bridge.ledger()).appended).toBe(before + 1);
  }, 60_000);

  const hostile: Array<[string, Wiring, string]> = [
    ['a tampered proxy->engine body', { engineWrap: async (request, real) => real({ ...request, body: Buffer.from(request.body).fill(0x20, 2, 3) }) }, 'SIGNATURE'],
    ['an engine key the engine does not hold', { engineKey: Buffer.from('cvf-bound-bridge-other-key-00001') }, 'SIGNATURE'],
    ['a stale proxy clock', { now: () => realNow() - 31_000 }, 'EXPIRED'],
    ['a different configuration digest', { config: { timeoutMs: 5000 } }, 'CONFIG'],
  ];
  it.each(hostile)('refuses %s at the engine with no ledger effect', async (_name, wiring, code) => {
    const seen: Array<{ status: number; error?: string }> = [];
    const { profile, store } = await wire({ ...wiring, engineWrap: async (request, real) => {
      const response = await (wiring.engineWrap ? wiring.engineWrap(request, real) : real(request));
      seen.push({ status: response.status, error: (JSON.parse(Buffer.from(response.body).toString('ascii')) as { error?: string }).error });
      return response;
    } });
    const selector = await job(store);
    const before = (await bridge.ledger()).appended;
    const result = await json(await exportPost(selector));
    expect(seen[0]).toEqual({ status: 401, error: code });
    expect(result.operation).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', persisted: true });
    expect(profile.counters.engineEvaluateSends).toBe(0);
    expect((await bridge.ledger()).appended).toBe(before);
  }, 60_000);

  it.each([
    ['foreign origin', (request: WireRequest) => ({ ...request, origin: 'http://foreign.invalid:8100' })],
    ['foreign path', (request: WireRequest) => ({ ...request, path: '/api/v1/foreign-receipts' })],
    ['foreign method', (request: WireRequest) => ({ ...request, method: 'PUT' as 'POST' })],
    ['query', (request: WireRequest) => ({ ...request, path: request.path + '?foreign=1' })],
  ])('refuses %s before a real engine ledger effect', async (_name, redirect) => {
    const seen: number[] = [];
    const { profile, store } = await wire({ engineWrap: async (request, real) => {
      const response = await real(redirect(request));
      seen.push(response.status);
      return response;
    } });
    const selector = await job(store);
    const before = (await bridge.ledger()).appended;
    const entriesBefore = bridge.asgiEntries;
    const result = await json(await exportPost(selector));
    expect(seen[0]).toBeGreaterThanOrEqual(400);
    expect(bridge.asgiEntries).toBe(entriesBefore);
    expect(result.operation).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', persisted: true });
    expect(profile.counters.engineEvaluateSends).toBe(0);
    expect((await bridge.ledger()).appended).toBe(before);
  }, 60_000);

  it('refuses a replayed proxy->engine message at the real engine without a second effect', async () => {
    const replies: number[] = [];
    const { profile, store } = await wire({ engineWrap: async (request, real) => {
      const first = await real(request);
      if (request.path.endsWith('challenge')) replies.push((await real(request)).status);
      return first;
    } });
    const selector = await job(store);
    const result = await json(await exportPost(selector));
    expect(replies).toEqual([409]);
    expect(result.operation).toMatchObject({ outcome: 'RECEIPT_VERIFIED' });
    expect(profile.counters).toEqual({ ...once, engineChallengeSends: 1 });
  }, 60_000);

  it('denies before any traffic for an absent posture, a bad origin, a missing session and an unknown body field', async () => {
    const { profile, store } = await wire();
    const selector = await job(store);
    state.operation = { posture: 'UNDECLARED' };
    expect((await exportPost(selector)).status).toBe(403);
    state.operation = { posture: 'BOUND_CONTROLLED', profile };
    expect((await exportPost(selector, {}, BODY, 'http://evil.invalid')).status).toBe(403);
    state.session = NextResponse.json({ error: 'AUTH' }, { status: 401 });
    expect((await exportPost(selector)).status).toBe(401);
    state.session = goodSession();
    expect((await exportPost(selector, {}, { ...BODY, boundConfig: { engineOrigin: 'http://evil.invalid' } })).status).toBe(400);
    const missing = POST(new NextRequest('http://localhost/api/artifacts/export', { method: 'POST', headers: { origin: 'http://localhost', 'Content-Type': 'application/json',
      'sec-fetch-site': 'same-origin' }, body: JSON.stringify(BODY) }));
    expect((await missing).status).toBe(400);
    expect(profile.counters).toEqual(zero);
  }, 60_000);

  it('ignores browser-supplied permits, config, URLs and destination headers', async () => {
    const { profile, store } = await wire();
    const selector = await job(store);
    const response = await exportPost(selector, { 'x-cvf-bound-config': 'f'.repeat(64), 'x-cvf-engine-origin': 'http://evil.invalid:1', 'x-cvf-bound-permit': 'allow',
      'x-cvf-service-token': 'unused', authorization: 'Bearer unused' });
    expect(response.status).toBe(200);
    expect(profile.counters).toEqual(once);
  }, 60_000);

  it('keeps a wrong-owner job unreachable: 404 before any traffic', async () => {
    const { profile, store } = await wire();
    const selector = await job(store);
    state.session = { ...goodSession(), userId: 'u2' };
    expect((await exportPost(selector)).status).toBe(404);
    expect(profile.counters).toEqual(zero);
  }, 60_000);
});

