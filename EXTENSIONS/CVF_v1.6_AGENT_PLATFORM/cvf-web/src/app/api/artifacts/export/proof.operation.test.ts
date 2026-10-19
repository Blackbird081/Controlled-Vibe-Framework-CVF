import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attemptIdFor, buildEnvelope, makeOperationConfig, operationKey, type ControlledEvaluateRequest, type ControlledInvoker, type OperationConfig,
} from '@/lib/artifacts-receipt-operation-contract';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import {
  buildControlledEvaluateRequest, controlledRequestSha256, diagnoseRemotePresence, fetchGovernanceReceipt, invokeWithGrant, parseControlledReceipt,
  runControlledReceipt, type ControlledReceiptOptions, type ReceiptOperationStore,
} from './proof';

const ROOTS = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-binding-repair-20261019', 'worker', 'roots');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const hex = (text: string) => createHash('sha256').update(text).digest('hex');
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const config = makeOperationConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1',
  storeId: 'synthetic-store-1', authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const NOW = Date.parse('2026-10-19T01:00:00.000Z');

async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
const makeStore = (root: string, enabled = true) =>
  new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, ...(enabled ? { receiptOperations: true as const } : {}) }, () => NOW);
const opsDir = (root: string) => path.join(root, hex(JSON.stringify([owner.userId, owner.orgId, owner.teamId])), 'operations');

interface Prep { html?: string; job?: string; version?: string | null; cfg?: OperationConfig; content?: string }
function prepared(index: number, prep: Prep = {}) {
  const sourceRecordId = `ncr-synthetic-${index}`;
  const requestSha256 = hex(`request-${index}`);
  const key = operationKey({ owner, sourceRecordId, requestSha256 })!;
  const attemptId = attemptIdFor(key);
  const request = buildControlledEvaluateRequest(attemptId, 'receipt-anchor', prep.content ?? `# source ${index}`);
  const envelope = buildEnvelope({ owner, sourceRecordId, requestSha256, jobId: prep.job ?? jobId, versionId: prep.version ?? null, attemptId,
    payloadSha256: controlledRequestSha256(request), config: prep.cfg ?? config,
    output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: hex(`source-${index}`), htmlSha256: prep.html ?? hex(`html-${index}`), artifactId: 'receipt-anchor', filename: 'review.html' } })!;
  return { envelope, request, attemptId, key };
}
type Prepared = ReturnType<typeof prepared>;

const ACTION: Record<string, string> = { ALLOW: 'ALLOW', DENY: 'BLOCK', REVIEW: 'NEEDS_APPROVAL', ESCALATE: 'ESCALATE', SANDBOX: 'LOG_ONLY' };
function engine(request: ControlledEvaluateRequest, fault: string | null = null, decision = 'ALLOW') {
  return { success: fault === 'string-success' ? 'false' : true, data: fault === 'no-data' ? undefined : {
    report: { request_summary: { request_id: fault === 'request-id' ? 'other' : request.request_id, artifact_id: fault === 'artifact-id' ? 'other' : request.artifact_id },
      decision_analysis: { final_decision: decision }, report_metadata: { generated_at: '2026-10-19T01:00:01.000Z' },
      cvf_risk_level: fault === 'risk-r0' ? 'R0' : 'R1', cvf_enforcement: { action: fault === 'enforcement' ? 'LOG_ONLY' : ACTION[decision] },
      integrity: { has_ledger_reference: fault !== 'ledger-ref' } },
    execution_record: { final_decision: fault === 'decision' ? 'DENY' : decision, ledger_attached: fault !== 'ledger' } } };
}
function counting(respond: (request: ControlledEvaluateRequest, signal: AbortSignal) => unknown) {
  const calls: Array<{ request: ControlledEvaluateRequest; signal: AbortSignal }> = [];
  const invoker: ControlledInvoker = async (request, signal) => { calls.push({ request, signal }); return respond(request, signal); };
  return { invoker, calls };
}
const run = (store: ReceiptOperationStore, p: Prepared, invoker: ControlledInvoker, extra: Partial<ControlledReceiptOptions> = {}) =>
  runControlledReceipt({ store, owner, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000, ...extra });
/** A real store instance with selected methods replaced: the proof trusts only stores built by the artifacts store module, never a structural stand-in. */
function patched(root: string, make: (real: HtmlDraftSnapshotStore) => Partial<ReceiptOperationStore> = () => ({})): ReceiptOperationStore {
  const real = makeStore(root);
  return Object.assign(real, make(real));
}
type CreateInternals = { createOnce(dir: string, name: string, bytes: Buffer): Promise<string> };
const failStart = (store: ReceiptOperationStore) => {
  const internals = store as unknown as CreateInternals;
  const original = internals.createOnce.bind(store);
  internals.createOnce = async (dir, name, bytes) => (/\.start\.json$/.test(name) ? 'UNAVAILABLE' : original(dir, name, bytes));
  return store;
};
const hang = () => new Promise<never>(() => undefined);
const snapshot = async (root: string) => Promise.all((await fs.readdir(opsDir(root))).sort().map(async name => `${name}:${hex((await fs.readFile(path.join(opsDir(root), name))).toString('binary'))}`));

const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('PC/REQ-PROOF one injected send and exact joined outcome', () => {
  it('invokes the injected callback once with the exact R1/REVIEW payload and stores the joined verified receipt', async () => {
    const root = await newRoot('proof-positive');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const result = await run(store, p, invoker);
    expect(result).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', persisted: true, sends: 1, operationKey: p.key, reason: null });
    expect(calls).toHaveLength(1);
    expect(calls[0].request).toEqual({ request_id: p.attemptId, artifact_id: 'receipt-anchor', payload: { content: '# source 1' }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' });
    expect(controlledRequestSha256(calls[0].request)).toBe(p.envelope.payloadSha256);
    expect(calls[0].request).not.toBe(p.request);
    expect(calls[0].signal.aborted).toBe(false);
    const state = await store.readOperation(p.key, owner);
    expect(state.state).toBe('OUTCOME');
    if (state.state === 'OUTCOME') {
      expect(state.outcome.receipt).toEqual({ receiptId: p.attemptId, decision: 'ALLOW', evaluatedAt: '2026-10-19T01:00:01.000Z', riskLevel: 'R1' });
      expect(state.outcome.attemptId).toBe(p.envelope.attemptId);
      expect(state.intent.envelope).toEqual(p.envelope);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('slices the evaluated content to 500 characters and keeps fixed R1/REVIEW fields', () => {
    expect(buildControlledEvaluateRequest('ncr-op-aaaaaaaa', 'a', 'x'.repeat(900)).payload.content).toHaveLength(500);
    expect(buildControlledEvaluateRequest('ncr-op-aaaaaaaa', 'a', 'x')).toMatchObject({ cvf_phase: 'REVIEW', cvf_risk_level: 'R1' });
  });
  it('reuses an identical verified target with zero sends and never attaches the receipt to a different target', async () => {
    const root = await newRoot('proof-reuse');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    await run(store, p, invoker);
    const again = await run(makeStore(root), p, invoker);
    expect(again).toMatchObject({ kind: 'REUSED', sends: 0, receipt: { receiptId: p.attemptId, decision: 'ALLOW' } });
    for (const changed of [prepared(1, { html: hex('newly rendered html') }), prepared(1, { job: '123e4567-e89b-42d3-a456-426614174077' }),
      prepared(1, { version: '123e4567-e89b-42d3-a456-426614174078' }),
      prepared(1, { cfg: makeOperationConfig({ policyRevision: 'policy-r2', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', authReference: 'x', authScope: 'NONE' })! })]) {
      expect(changed.key).toBe(p.key);
      const mismatch = await run(store, changed, invoker);
      expect(mismatch).toEqual({ kind: 'ALREADY_PROCESSED', operationKey: p.key, state: 'OUTCOME', outcome: 'RECEIPT_VERIFIED', sends: 0 });
      expect(JSON.stringify(mismatch)).not.toMatch(/"receipt"|html/i);
    }
    expect(calls).toHaveLength(1);
  });
  it('maps a remote DENY to DENIED and never reuses it; review decisions stay verified receipts', async () => {
    const root = await newRoot('proof-decisions');
    const store = makeStore(root);
    const deny = prepared(1);
    const denied = counting(request => engine(request, null, 'DENY'));
    expect(await run(store, deny, denied.invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'DENIED', receipt: { decision: 'DENY' }, persisted: true });
    expect(await run(store, deny, denied.invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'DENIED', sends: 0 });
    expect(denied.calls).toHaveLength(1);
    for (const [index, decision] of [[2, 'REVIEW'], [3, 'ESCALATE'], [4, 'SANDBOX']] as const) {
      const p = prepared(index);
      const { invoker } = counting(request => engine(request, null, decision));
      expect(await run(store, p, invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', receipt: { decision, riskLevel: 'R1' } });
    }
  });
  it.each(['request-id', 'artifact-id', 'decision', 'ledger', 'ledger-ref', 'enforcement', 'risk-r0', 'string-success', 'no-data'])(
    'records an invalid current-engine response (%s) as OUTCOME_UNKNOWN with no receipt and no replay', async fault => {
      const root = await newRoot('proof-invalid');
      const store = makeStore(root);
      const p = prepared(1);
      const { invoker, calls } = counting(request => engine(request, fault));
      expect(await run(store, p, invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'INVALID_RESPONSE', persisted: true });
      expect(await run(store, p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
      const rejob = prepared(1, { job: '123e4567-e89b-42d3-a456-426614174077' });
      expect(await run(store, rejob, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
      expect(calls).toHaveLength(1);
    });
  it('does not accept the older explicit approval envelope on the controlled path', async () => {
    const p = prepared(1);
    const legacy = { success: true, data: { report: { status: 'APPROVED', risk_level: 'R1', cvf_enforcement: { action: 'ALLOW' } },
      execution_record: { request_id: p.attemptId, timestamp: '2026-10-19T01:00:01.000Z' } } };
    expect(parseControlledReceipt(legacy, p.request)).toBeNull();
    expect(parseControlledReceipt(engine(p.request), p.request)).not.toBeNull();
    expect(parseControlledReceipt(null, p.request)).toBeNull();
    expect(parseControlledReceipt(engine(p.request, null, 'constructor'), p.request)).toBeNull();
  });
});

describe('PC/REQ-PROOF failure, timeout, abort and late response keep unknown', () => {
  it.each([
    ['rejecting invoker', () => Promise.reject(new Error('network down'))],
    ['synchronously throwing invoker', () => { throw new Error('boom'); }],
  ])('records %s as OUTCOME_UNKNOWN and denies replay', async (_label, respond) => {
    const root = await newRoot('proof-throw');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(respond);
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', reason: 'INVOKER_ERROR', receipt: null, sends: 1 });
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', sends: 0 });
    expect(calls).toHaveLength(1);
  });
  it('treats an invoker that throws synchronously as an unknown outcome after one call', async () => {
    const root = await newRoot('proof-sync-throw');
    const store = makeStore(root);
    const p = prepared(1);
    let calls = 0;
    const invoker = ((): Promise<unknown> => { calls += 1; throw new Error('sync failure'); }) as ControlledInvoker;
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', reason: 'INVOKER_ERROR', sends: 1 });
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', sends: 0 });
    expect(calls).toBe(1);
  });
  it('marks a timeout unknown, aborts the signal, and a late success cannot publish or release the operation', async () => {
    const root = await newRoot('proof-timeout');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(async request => { await sleep(900); return engine(request); });
    const started = Date.now();
    const result = await run(store, p, invoker, { timeoutMs: 250 });
    expect(Date.now() - started).toBeLessThan(800);
    expect(result).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', reason: 'TIMED_OUT', receipt: null, persisted: true });
    expect(calls[0].signal.aborted).toBe(true);
    await sleep(1300);
    const state = await store.readOperation(p.key, owner);
    expect(state.state === 'OUTCOME' && state.outcome).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', reason: 'TIMED_OUT', receipt: null });
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
    expect(calls).toHaveLength(1);
  });
  it('marks an external abort during flight unknown and records FAILED_BEFORE_SEND for a pre-aborted signal with zero sends', async () => {
    const root = await newRoot('proof-abort');
    const store = makeStore(root);
    const during = prepared(1);
    const controller = new AbortController();
    const slow = counting(async request => { controller.abort(); await sleep(200); return engine(request); });
    expect(await run(store, during, slow.invoker, { signal: controller.signal })).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', reason: 'ABORTED', sends: 1 });
    expect(slow.calls[0].signal.aborted).toBe(true);
    const before = prepared(2);
    const aborted = new AbortController();
    aborted.abort();
    const never = counting(request => engine(request));
    expect(await run(store, before, never.invoker, { signal: aborted.signal })).toEqual({ kind: 'DENIED', reason: 'FAILED_BEFORE_SEND', sends: 0 });
    expect(never.calls).toHaveLength(0);
    const state = await store.readOperation(before.key, owner);
    expect(state.state === 'OUTCOME' && state.outcome).toMatchObject({ outcome: 'FAILED_BEFORE_SEND', reason: 'ABORTED_BEFORE_SEND' });
    expect(await run(store, before, never.invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'FAILED_BEFORE_SEND', sends: 0 });
    expect(never.calls).toHaveLength(0);
  });
  it('yields unknown, not a verified receipt, when the outcome write fails, hangs or throws', async () => {
    for (const [label, writeOutcome] of [
      ['unconfirmed', async () => ({ kind: 'UNCONFIRMED' as const })],
      ['hanging', hang],
      ['throwing', async () => { throw new Error('disk'); }],
    ] as const) {
      const root = await newRoot(`proof-write-${label}`);
      const real = makeStore(root);
      const p = prepared(1);
      const { invoker, calls } = counting(request => engine(request));
      const started = Date.now();
      const result = await run(patched(root, () => ({ writeOutcome })), p, invoker, { timeoutMs: 400 });
      expect(Date.now() - started, label).toBeLessThan(1500);
      expect(result, label).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', receipt: null, persisted: false, reason: 'OUTCOME_WRITE_UNCONFIRMED', sends: 1 });
      expect((await real.readOperation(p.key, owner)).state, label).toBe('STARTED');
      expect(await run(real, p, invoker), label).toMatchObject({ kind: 'ALREADY_PROCESSED', state: 'STARTED', sends: 0 });
      expect(calls, label).toHaveLength(1);
    }
  });
  it('denies before invoking when admission or start errors or hangs', async () => {
    const root = await newRoot('proof-pre-faults');
    const { invoker, calls } = counting(request => engine(request));
    const cases: Array<[string, Partial<ReceiptOperationStore>]> = [
      ['admit throws', { admitOperation: async () => { throw new Error('x'); } }],
      ['admit hangs', { admitOperation: hang }],
      ['start hangs', { startOperation: hang }],
      ['start throws', { startOperation: async () => { throw new Error('x'); } }],
    ];
    for (const [index, [label, override]] of cases.entries()) {
      expect(await run(patched(root, () => override), prepared(10 + index), invoker, { timeoutMs: 40 }), label).toEqual({ kind: 'DENIED', reason: 'STORE_UNAVAILABLE', sends: 0 });
    }
    expect(calls).toHaveLength(0);
  });
});

describe('PC/REQ-PROOF grant and input denial with zero sends', () => {
  it('rejects fabricated, copied, wrong-invoker and spent grants before invoking', async () => {
    const root = await newRoot('proof-grant');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const admitted = await store.admitOperation(p.envelope, owner);
    if (admitted.kind !== 'ADMITTED') throw new Error('admit');
    const started = await store.startOperation(owner, p.key, invoker, admitted.admission);
    if (started.kind !== 'STARTED') throw new Error('start');
    const options: ControlledReceiptOptions = { store, owner, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000 };
    const denied = { kind: 'DENIED', reason: 'GRANT_REJECTED', sends: 0 };
    expect(await invokeWithGrant(options, { kind: 'OPERATION_GRANT' })).toEqual(denied);
    expect(await invokeWithGrant(options, { ...started.grant })).toEqual(denied);
    expect(await invokeWithGrant(options, null)).toEqual(denied);
    expect(await invokeWithGrant({ ...options, invoker: counting(() => ({})).invoker }, started.grant)).toEqual(denied);
    expect(calls).toHaveLength(0);
    expect(await invokeWithGrant(options, started.grant)).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', sends: 1 });
    expect(await invokeWithGrant(options, started.grant)).toEqual(denied);
    expect(calls).toHaveLength(1);
  });
  it('denies invalid proof input, a disabled profile, a full namespace and a corrupt existing record with zero sends', async () => {
    const root = await newRoot('proof-denials');
    const store = makeStore(root);
    const { invoker, calls } = counting(request => engine(request));
    const p = prepared(1);
    const bad: Array<[string, Partial<ControlledReceiptOptions>]> = [
      ['tampered envelope', { envelope: { ...p.envelope, callLimit: 2 } }],
      ['payload digest mismatch', { request: { ...p.request, payload: { content: 'changed' } } }],
      ['phase', { request: { ...p.request, cvf_phase: 'EXECUTE' } as never }],
      ['risk', { request: { ...p.request, cvf_risk_level: 'R0' } as never }],
      ['attempt id', { request: { ...p.request, request_id: 'ncr-op-someoneelse' } }],
      ['artifact id', { request: { ...p.request, artifact_id: 'other-anchor' } }],
      ['timeout zero', { timeoutMs: 0 }], ['timeout high', { timeoutMs: 30_001 }], ['timeout fraction', { timeoutMs: 1.5 }], ['timeout NaN', { timeoutMs: Number.NaN }],
      ['invoker', { invoker: 'not-a-function' as never }],
    ];
    for (const [label, override] of bad) expect(await run(store, p, invoker, override), label).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    expect(await run(makeStore(root, false), p, invoker)).toEqual({ kind: 'DENIED', reason: 'DISABLED', sends: 0 });
    const fullRoot = await newRoot('proof-full');
    await fs.mkdir(opsDir(fullRoot), { recursive: true, mode: 0o700 });
    for (let i = 0; i < 256; i++) await fs.writeFile(path.join(opsDir(fullRoot), `slot-${String(i).padStart(3, '0')}.json`), Buffer.alloc(0));
    expect(await run(makeStore(fullRoot), p, invoker)).toEqual({ kind: 'DENIED', reason: 'CAPACITY_FULL', sends: 0 });
    const corruptRoot = await newRoot('proof-corrupt');
    const corrupt = makeStore(corruptRoot);
    await corrupt.admitOperation(p.envelope, owner);
    await fs.writeFile(path.join(opsDir(corruptRoot), `op-${p.key}.intent.json`), '{garbage');
    expect(await run(corrupt, p, invoker)).toEqual({ kind: 'DENIED', reason: 'OPERATION_CORRUPT', sends: 0 });
    expect(calls).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('LR1/REQ-AUTHORITY immutable invocation, no-bypass joins and no replay', () => {
  async function granted(label: string) {
    const root = await newRoot(label);
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const admitted = await store.admitOperation(p.envelope, owner);
    if (admitted.kind !== 'ADMITTED') throw new Error('admit');
    const started = await store.startOperation(owner, p.key, invoker, admitted.admission);
    if (started.kind !== 'STARTED') throw new Error('start');
    const options: ControlledReceiptOptions = { store, owner, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000 };
    return { root, p, calls, grant: started.grant, options };
  }
  it('keeps the approved bytes when the caller mutates request, envelope and owner aliases during the admit, start and write waits', async () => {
    const root = await newRoot('proof-toctou');
    const p = prepared(1);
    const pristine = prepared(1);
    const mine = { ...owner };
    const { invoker, calls } = counting(request => engine(request));
    const mutate = () => {
      p.request.payload.content = 'MUTATED AFTER VALIDATION';
      p.request.artifact_id = 'other-anchor';
      p.envelope.payloadSha256 = hex('mutated');
      p.envelope.output.artifactId = 'other-anchor';
      mine.userId = 'u2';
    };
    const store = patched(root, real => {
      const [admit, start, write] = [real.admitOperation.bind(real), real.startOperation.bind(real), real.writeOutcome.bind(real)];
      return { admitOperation: async (e, o) => { mutate(); return admit(e, o); }, startOperation: async (o, k, i, a) => { mutate(); return start(o, k, i, a); },
        writeOutcome: async (c, i) => { mutate(); return write(c, i); } };
    });
    const result = await runControlledReceipt({ store, owner: mine, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000 });
    expect(result).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', persisted: true, sends: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0].request).toEqual(pristine.request);
    expect(controlledRequestSha256(calls[0].request)).toBe(pristine.envelope.payloadSha256);
    const state = await makeStore(root).readOperation(pristine.key, owner);
    expect(state.state === 'OUTCOME' && [state.intent.envelope, state.outcome.receipt?.receiptId]).toEqual([pristine.envelope, pristine.attemptId]);
  });
  it('sends nothing when a genuine grant is presented with another request or envelope, and the grant stays usable for the genuine join', async () => {
    const { p, calls, grant, options } = await granted('proof-join');
    const swapped = buildControlledEvaluateRequest(p.attemptId, 'receipt-anchor', 'a replacement payload');
    const rejected = { kind: 'DENIED', reason: 'GRANT_REJECTED', sends: 0 };
    expect(await invokeWithGrant({ ...options, request: swapped }, grant)).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    expect(await invokeWithGrant({ ...options, request: swapped, envelope: { ...p.envelope, payloadSha256: controlledRequestSha256(swapped) } }, grant)).toEqual(rejected);
    expect(await invokeWithGrant({ ...options, envelope: prepared(1, { html: hex('another rendered html') }).envelope }, grant)).toEqual(rejected);
    expect(calls).toHaveLength(0);
    expect(await invokeWithGrant(options, grant)).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', sends: 1 });
    expect(calls.map(call => call.request.payload.content)).toEqual(['# source 1']);
  });
  const bad = (patch: Record<string, unknown>) => (p: Prepared) => ({ request: { ...p.request, ...patch } as never });
  it.each<[string, (p: Prepared) => Partial<ControlledReceiptOptions>]>([
    ['null request', () => ({ request: null as never })], ['string request', () => ({ request: 'x' as never })], ['array request', () => ({ request: [] as never })],
    ['unknown request key', bad({ extra: 1 })], ['missing request key', p => ({ request: { request_id: p.request.request_id } as never })],
    ['non-string request id', bad({ request_id: 7 })], ['payload with an extra key', bad({ payload: { content: 'x', more: 1 } })], ['non-string content', bad({ payload: { content: 5 } })],
    ['content over 500 characters', bad({ payload: { content: 'x'.repeat(501) } })], ['BigInt content', bad({ payload: { content: BigInt(1) } })],
    ['throwing getter', p => ({ request: Object.defineProperty({ ...p.request }, 'artifact_id', { get() { throw new Error('getter'); }, enumerable: true }) })],
    ['revoked proxy', () => { const { proxy, revoke } = Proxy.revocable({}, {}); revoke(); return { request: proxy as never }; }],
    ['circular request', p => { const loop: Record<string, unknown> = { ...p.request }; loop.self = loop; return { request: loop as never }; }],
    ['owner of another user', () => ({ owner: { ...owner, userId: 'u2' } })], ['null owner', () => ({ owner: null as never })],
    ['envelope with an unknown key', p => ({ envelope: { ...p.envelope, extra: 1 } })], ['signal that is not a signal', () => ({ signal: {} as AbortSignal })],
  ])('denies a malformed %s without throwing and without any send or write', async (_label, patch) => {
    const root = await newRoot('proof-malformed');
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const options = { store: makeStore(root), owner, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000, ...patch(p) };
    const denied = { kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 };
    expect(await runControlledReceipt(options)).toEqual(denied);
    expect(await invokeWithGrant(options, { kind: 'OPERATION_GRANT' })).toEqual(denied);
    expect([calls.length, await fs.readdir(root)]).toEqual([0, []]);
  });
  it('trusts only a store built by the artifacts store module: a structural stand-in is denied and never called', async () => {
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const calledWith: string[] = [];
    const standIn = { admitOperation: async () => { calledWith.push('admit'); return { kind: 'ADMITTED' }; }, startOperation: async () => { calledWith.push('start'); return { kind: 'STARTED', grant: {} }; },
      consumeGrant: () => { calledWith.push('consume'); return {}; }, writeOutcome: async () => { calledWith.push('write'); return { kind: 'SAVED' }; } };
    const forgedProto = Object.create(HtmlDraftSnapshotStore.prototype) as ReceiptOperationStore;
    for (const store of [standIn as never, forgedProto]) {
      const options = { store, owner, envelope: p.envelope, request: p.request, invoker, timeoutMs: 2000 };
      expect(await runControlledReceipt(options)).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
      expect(await invokeWithGrant(options, {})).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    }
    expect(await runControlledReceipt(null as never)).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    expect(await invokeWithGrant('options' as never, {})).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    expect([calls.length, calledWith]).toEqual([0, []]);
  });
  it('gives no retry after a failed start with no start file: the winner, a restart and a later caller all get zero sends', async () => {
    const root = await newRoot('proof-failed-start');
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    expect(await run(failStart(makeStore(root)), p, invoker)).toEqual({ kind: 'DENIED', reason: 'START_UNCONFIRMED', sends: 0 });
    for (const store of [makeStore(root), makeStore(root), failStart(makeStore(root))]) {
      expect(await run(store, p, invoker)).toEqual({ kind: 'ALREADY_PROCESSED', operationKey: p.key, state: 'INTENT', outcome: null, sends: 0 });
    }
    expect([calls.length, (await fs.readdir(opsDir(root))).filter(name => name.includes('.start.'))]).toEqual([0, []]);
  });
  it.each([
    ['typed NOT_CONFIGURED return', () => ({ status: 'NOT_CONFIGURED', receipt: null }), 'INVALID_RESPONSE'],
    ['thrown NOT_CONFIGURED', () => { throw new Error('NOT_CONFIGURED'); }, 'INVOKER_ERROR'],
    ['rejected NOT_CONFIGURED', () => Promise.reject(Object.assign(new Error('NOT_CONFIGURED'), { code: 'NOT_CONFIGURED' })), 'INVOKER_ERROR'],
  ])('records a %s after the invocation as OUTCOME_UNKNOWN with no receipt and never retries it', async (_label, respond, reason) => {
    const root = await newRoot('proof-not-configured');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(respond);
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', receipt: null, reason, persisted: true, sends: 1 });
    expect(await run(makeStore(root), p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
    expect(calls).toHaveLength(1);
  });
  it('lets a late durable outcome write exist after the bounded timeout without triggering another invoke or grant', async () => {
    const root = await newRoot('proof-late-write');
    const p = prepared(1);
    const { invoker, calls } = counting(request => engine(request));
    const store = patched(root, real => { const write = real.writeOutcome.bind(real); return { writeOutcome: async (c, i) => { await sleep(500); return write(c, i); } }; });
    expect(await run(store, p, invoker, { timeoutMs: 100 })).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', receipt: null, persisted: false, reason: 'OUTCOME_WRITE_UNCONFIRMED', sends: 1 });
    await sleep(900);
    expect((await makeStore(root).readOperation(p.key, owner)).state).toBe('OUTCOME');
    expect(await run(makeStore(root), p, invoker)).toMatchObject({ sends: 0 });
    expect(calls).toHaveLength(1);
  });
});

describe('PD/REQ-PROOF Reconcile B is a presence diagnostic only', () => {
  const entry = (p: Prepared, patch: Record<string, string> = {}) => ({ requestId: p.attemptId, actor: owner.userId, configDigest: config.configDigest, storeId: config.storeId, ...patch });
  it('observes presence only for the exact attempt, actor, config and store and never releases or invokes', async () => {
    const p = prepared(1);
    const flags = { releasesUnknown: false, grantsReplay: false };
    expect(await diagnoseRemotePresence(async () => entry(p), p.envelope)).toEqual({ status: 'REMOTE_PRESENCE_OBSERVED', ...flags });
    for (const lookup of [
      async () => null, async () => undefined, async () => entry(p, { requestId: 'other-attempt' }), async () => entry(p, { actor: 'someone-else' }),
      async () => entry(p, { configDigest: '0'.repeat(64) }), async () => entry(p, { storeId: 'synthetic-other-store' }),
      async () => { throw new Error('ledger down'); }, hang,
    ]) expect(await diagnoseRemotePresence(lookup, p.envelope, 40)).toEqual({ status: 'UNKNOWN', ...flags });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('leaves an UNKNOWN operation unchanged and unreplayable even when the lookup reports presence', async () => {
    const root = await newRoot('proof-reconcile');
    const store = makeStore(root);
    const p = prepared(1);
    const { invoker, calls } = counting(request => { throw new Error(`down ${request.request_id}`); });
    expect(await run(store, p, invoker)).toMatchObject({ outcome: 'OUTCOME_UNKNOWN' });
    const before = await snapshot(root);
    const lookup = vi.fn(async () => entry(p));
    expect(await diagnoseRemotePresence(lookup, p.envelope)).toMatchObject({ status: 'REMOTE_PRESENCE_OBSERVED', releasesUnknown: false, grantsReplay: false });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(await snapshot(root)).toEqual(before);
    expect(await run(store, p, invoker)).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
    expect(calls).toHaveLength(1);
  });
});

describe('PF/REQ-PROOF legacy helper is retained separately', () => {
  it('still sends the legacy R0 REVIEW request through global fetch and parses the same response shape', async () => {
    const prior = process.env.NEXTAUTH_URL;
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    try {
      fetchMock.mockImplementation(async (_url: string, options: RequestInit) => {
        const sent = JSON.parse(String(options.body)) as ControlledEvaluateRequest;
        return { ok: true, json: async () => engine(sent, 'risk-r0') };
      });
      const legacy = await fetchGovernanceReceipt('legacy-anchor', 'x'.repeat(900));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const sent = JSON.parse(String(fetchMock.mock.calls[0][1].body)) as Record<string, unknown>;
      expect(sent).toMatchObject({ cvf_phase: 'REVIEW', cvf_risk_level: 'R0', artifact_id: 'legacy-anchor', payload: { content: 'x'.repeat(500) } });
      expect(legacy).toMatchObject({ status: 'PRESENT', receipt: { decision: 'ALLOW', riskLevel: 'R0' } });
    } finally {
      if (prior === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = prior;
    }
  });
});
