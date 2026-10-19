import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { boundAttemptIdFor, boundOperationKey, boundRecordBytes, buildBoundEnvelope, makeBoundConfig, type BoundEnvelope, type BoundReceipt } from '../artifacts-bound-receipt-contract';
import { attemptIdFor, buildEnvelope, makeOperationConfig, operationKey, type OperationEnvelope } from '../artifacts-receipt-operation-contract';
import { HtmlDraftSnapshotStore, type BoundAdmitResult } from './html-draft-snapshot-store';

const ROOTS = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-source-20261019', 'worker', 'roots');
const T0 = Date.parse('2026-10-19T01:00:00.000Z');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const hex = (text: string) => createHash('sha256').update(text).digest('hex');
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const boundConfig = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
const v1Config = makeOperationConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1',
  authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
const ownerDir = (root: string) => path.join(root, hex(JSON.stringify([owner.userId, owner.orgId, owner.teamId])));
const boundDir = (root: string) => path.join(ownerDir(root), 'bound-operations');
const names = async (dir: string) => (await fs.readdir(dir)).sort();
const noop = async () => ({});

async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
function boundEnvelope(index: number, html = hex(`html-${index}`)): BoundEnvelope {
  const requestSha256 = hex(`request-${index}`);
  const key = boundOperationKey({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256 })!;
  return buildBoundEnvelope({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256, jobId, versionId: null, attemptId: boundAttemptIdFor(key), payloadSha256: hex(`payload-${index}`),
    config: boundConfig, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: hex(`source-${index}`), htmlSha256: html, artifactId: 'receipt-anchor', filename: 'review.html' } })!;
}
function v1Envelope(index: number): OperationEnvelope {
  const requestSha256 = hex(`request-${index}`);
  const key = operationKey({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256 })!;
  return buildEnvelope({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256, jobId, versionId: null, attemptId: attemptIdFor(key), payloadSha256: hex(`payload-${index}`),
    config: v1Config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: hex(`source-${index}`), htmlSha256: hex(`html-${index}`), artifactId: 'receipt-anchor', filename: 'review.html' } })!;
}
const receiptFor = (envelope: BoundEnvelope, patch: Partial<BoundReceipt> = {}): BoundReceipt => ({ receiptId: envelope.attemptId, decision: 'ALLOW', evaluatedAt: '2026-10-19T01:00:01.000000',
  riskLevel: 'R1', engineRiskLevel: 'R0', bindingDigest: hex('binding'), ledgerReference: { requestId: envelope.attemptId, blockHash: hex('block') }, ...patch });
type Flags = { v1?: boolean; bound?: boolean };
const makeStore = (root: string, flags: Flags = { bound: true }, clock: () => number = () => T0) => new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false,
  ...(flags.v1 ? { receiptOperations: true as const } : {}), ...(flags.bound ? { boundReceiptOperations: true as const } : {}) }, clock);
async function admitted(store: HtmlDraftSnapshotStore, envelope: BoundEnvelope) {
  const result: BoundAdmitResult = await store.admitBoundOperation(envelope, owner);
  if (result.kind !== 'ADMITTED') throw new Error(`not admitted: ${JSON.stringify(result)}`);
  return result;
}
async function started(store: HtmlDraftSnapshotStore, envelope: BoundEnvelope, invoker: unknown = noop) {
  const { admission } = await admitted(store, envelope);
  const result = await store.startBoundOperation(owner, envelope.operationKey, invoker, admission);
  if (result.kind !== 'STARTED') throw new Error(`not started: ${JSON.stringify(result)}`);
  return result.grant;
}

describe('bound lifecycle in its own namespace', () => {
  it('admits, starts, consumes and writes one immutable canonical-ASCII outcome', async () => {
    const root = await newRoot('lifecycle');
    const store = makeStore(root);
    const envelope = boundEnvelope(1);
    const first = await admitted(store, envelope);
    expect(await names(boundDir(root))).toEqual(['slot-000.json', `op-${envelope.operationKey}.intent.json`].sort());
    await expect(fs.stat(path.join(ownerDir(root), 'operations'))).rejects.toThrow();
    expect(await fs.readFile(path.join(boundDir(root), `op-${envelope.operationKey}.intent.json`))).toEqual(boundRecordBytes(first.intent));
    expect((await store.readBoundOperation(envelope.operationKey, owner)).state).toBe('INTENT');
    const start = await store.startBoundOperation(owner, envelope.operationKey, noop, first.admission);
    expect(start.kind).toBe('STARTED');
    expect((await store.readBoundOperation(envelope.operationKey, owner)).state).toBe('STARTED');
    const handle = store.consumeBoundGrant((start as { grant: unknown }).grant, noop, envelope)!;
    expect(handle).not.toBeNull();
    const saved = await store.writeBoundOutcome(handle, { outcome: 'RECEIPT_VERIFIED', receipt: receiptFor(envelope), reason: null });
    expect(saved.kind).toBe('SAVED');
    const state = await store.readBoundOperation(envelope.operationKey, owner);
    expect(state.state).toBe('OUTCOME');
    expect(state.state === 'OUTCOME' && state.outcome.receipt?.engineRiskLevel).toBe('R0');
    expect(state.state === 'OUTCOME' && state.outcome.receipt?.riskLevel).toBe('R1');
    expect(await store.writeBoundOutcome(handle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).toEqual({ kind: 'COLLISION' });
    const fresh = makeStore(root);
    const again = await fresh.admitBoundOperation(envelope, owner);
    expect(again.kind === 'EXISTING' && again.operation.state).toBe('OUTCOME');
  });
  it('enables each schema only by its own flag and keeps both namespaces separate', async () => {
    const root = await newRoot('flags');
    const v1Only = makeStore(root, { v1: true });
    const boundOnly = makeStore(root, { bound: true });
    expect(await v1Only.admitBoundOperation(boundEnvelope(1), owner)).toEqual({ kind: 'DENIED', reason: 'DISABLED' });
    expect(await boundOnly.admitOperation(v1Envelope(1), owner)).toEqual({ kind: 'DENIED', reason: 'DISABLED' });
    expect((await boundOnly.readBoundOperation(boundEnvelope(1).operationKey, owner)).state).toBe('ABSENT');
    expect(await v1Only.readBoundOperation(boundEnvelope(1).operationKey, owner)).toEqual({ state: 'UNCONFIRMED', reason: 'LOOKUP_REFUSED' });
    const both = makeStore(root, { v1: true, bound: true });
    expect((await both.admitOperation(v1Envelope(1), owner)).kind).toBe('ADMITTED');
    expect((await both.admitBoundOperation(boundEnvelope(1), owner)).kind).toBe('ADMITTED');
    expect(await names(path.join(ownerDir(root), 'operations'))).toContain('slot-000.json');
    expect(await names(boundDir(root))).toContain('slot-000.json');
    expect(await both.admitOperation(boundEnvelope(1), owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect(await both.admitBoundOperation(v1Envelope(1), owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect(await both.admitBoundOperation(boundEnvelope(1), { ...owner, userId: 'u2' })).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
  });
});

describe('opaque authority across schemas', () => {
  it('never lets a v1 authority act on a bound operation or the reverse, and a mismatch spends nothing', async () => {
    const root = await newRoot('cross');
    const store = makeStore(root, { v1: true, bound: true });
    const v1 = v1Envelope(2);
    const bound = boundEnvelope(2);
    const v1Admit = await store.admitOperation(v1, owner);
    const boundAdmit = await admitted(store, bound);
    if (v1Admit.kind !== 'ADMITTED') throw new Error('v1 not admitted');
    expect(await store.startBoundOperation(owner, bound.operationKey, noop, v1Admit.admission)).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect(await store.startOperation(owner, v1.operationKey, noop, boundAdmit.admission)).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    const v1Start = await store.startOperation(owner, v1.operationKey, noop, v1Admit.admission);
    const boundStart = await store.startBoundOperation(owner, bound.operationKey, noop, boundAdmit.admission);
    expect(v1Start.kind).toBe('STARTED');
    expect(boundStart.kind).toBe('STARTED');
    const v1Grant = (v1Start as { grant: unknown }).grant;
    const boundGrant = (boundStart as { grant: unknown }).grant;
    expect(store.consumeBoundGrant(v1Grant, noop, bound)).toBeNull();
    expect(store.consumeGrant(boundGrant, noop, v1)).toBeNull();
    expect(store.consumeGrant(boundGrant, noop, bound)).toBeNull();
    const boundHandle = store.consumeBoundGrant(boundGrant, noop, bound)!;
    const v1Handle = store.consumeGrant(v1Grant, noop, v1)!;
    expect(boundHandle).not.toBeNull();
    expect(v1Handle).not.toBeNull();
    expect(await store.writeOutcome(boundHandle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).toEqual({ kind: 'UNAVAILABLE' });
    expect(await store.writeBoundOutcome(v1Handle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).toEqual({ kind: 'UNAVAILABLE' });
    expect((await store.writeBoundOutcome(boundHandle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).kind).toBe('SAVED');
    expect((await store.writeOutcome(v1Handle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).kind).toBe('SAVED');
  });
  it('denies a fabricated, copied, spent, restarted or foreign-store authority', async () => {
    const root = await newRoot('forged');
    const store = makeStore(root);
    const envelope = boundEnvelope(3);
    const { admission } = await admitted(store, envelope);
    const key = envelope.operationKey;
    expect(await store.startBoundOperation(owner, key, noop, { kind: 'OPERATION_ADMISSION' })).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect(await store.startBoundOperation(owner, key, noop, { ...admission })).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect(await store.startBoundOperation(owner, key, noop)).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect(await makeStore(root).startBoundOperation(owner, key, noop, admission)).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect(await store.startBoundOperation({ ...owner, userId: 'u2' }, key, noop, admission)).toEqual({ kind: 'DENIED', reason: 'NO_INTENT' });
    expect(await store.startBoundOperation(owner, key, 'not a function', admission)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    const start = await store.startBoundOperation(owner, key, noop, admission);
    expect(start.kind).toBe('STARTED');
    expect((await store.startBoundOperation(owner, key, noop, admission)).kind).toBe('EXISTING');
    const grant = (start as { grant: unknown }).grant;
    for (const bad of [{ kind: 'OPERATION_GRANT' }, { ...(grant as object) }, null, 'x', 7]) expect(store.consumeBoundGrant(bad, noop, envelope)).toBeNull();
    expect(makeStore(root).consumeBoundGrant(grant, noop, envelope)).toBeNull();
    expect(store.consumeBoundGrant(grant, async () => ({}), envelope)).toBeNull();
    const changedHtml = boundEnvelope(3, hex('another html'));
    expect(store.consumeBoundGrant(grant, noop, changedHtml)).toBeNull();
    expect(store.consumeBoundGrant(grant, noop, { ...envelope, attemptId: 'ncr-bound-other-attempt' })).toBeNull();
    expect(store.consumeBoundGrant(grant, noop, 'nope')).toBeNull();
    const handle = store.consumeBoundGrant(grant, noop, envelope);
    expect(handle).not.toBeNull();
    expect(store.consumeBoundGrant(grant, noop, envelope)).toBeNull();
    expect(await store.writeBoundOutcome({ kind: 'CONSUMED_START' }, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'X' })).toEqual({ kind: 'UNAVAILABLE' });
    expect(await makeStore(root).writeBoundOutcome(handle, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'X' })).toEqual({ kind: 'UNAVAILABLE' });
  });
  it('writes a receipt only when it joins the attempt, declared risk and an accepted decision, and never retries through the handle', async () => {
    const root = await newRoot('joins');
    const store = makeStore(root);
    const envelope = boundEnvelope(4);
    const grant = await started(store, envelope);
    const handle = store.consumeBoundGrant(grant, noop, envelope)!;
    expect(await store.writeBoundOutcome(handle, { outcome: 'RECEIPT_VERIFIED', receipt: receiptFor(envelope, { receiptId: 'ncr-bound-other-attempt' }), reason: null })).toEqual({ kind: 'UNAVAILABLE' });
    expect(await store.writeBoundOutcome(handle, { outcome: 'RECEIPT_VERIFIED', receipt: receiptFor(envelope), reason: null })).toEqual({ kind: 'UNAVAILABLE' });
    expect((await store.readBoundOperation(envelope.operationKey, owner)).state).toBe('STARTED');
    const second = boundEnvelope(5);
    const handleTwo = store.consumeBoundGrant(await started(store, second), noop, second)!;
    expect(await store.writeBoundOutcome(handleTwo, { outcome: 'RECEIPT_VERIFIED', receipt: receiptFor(second, { decision: 'APPROVED' }), reason: null })).toEqual({ kind: 'UNAVAILABLE' });
    const third = boundEnvelope(6);
    const handleThree = store.consumeBoundGrant(await started(store, third), noop, third)!;
    expect(await store.writeBoundOutcome(handleThree, { outcome: 'RECEIPT_VERIFIED', receipt: receiptFor(third, { riskLevel: 'R2' as 'R1' }), reason: null })).toEqual({ kind: 'UNAVAILABLE' });
  });
});

describe('durable record faults and capacity', () => {
  type Internals = { createOnce(dir: string, name: string, bytes: Buffer): Promise<string> };
  it('consumes the operation when the intent write is torn: no second admission and no replay', async () => {
    const root = await newRoot('torn');
    const store = makeStore(root);
    const internals = store as unknown as Internals;
    const create = internals.createOnce.bind(store);
    internals.createOnce = async (dir, name, bytes) => {
      if (!/\.intent\.json$/.test(name)) return create(dir, name, bytes);
      await fs.writeFile(path.join(dir, name), bytes.subarray(0, Math.floor(bytes.byteLength / 2)), { flag: 'wx' });
      return 'UNCONFIRMED';
    };
    const envelope = boundEnvelope(7);
    expect(await store.admitBoundOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason: 'INTENT_UNCONFIRMED' });
    const again = await makeStore(root).admitBoundOperation(envelope, owner);
    expect(again.kind).toBe('EXISTING');
    expect(again.kind === 'EXISTING' && again.operation.state).toBe('CORRUPT');
  });
  it('reports corrupt, unsupported and foreign-schema records instead of repairing or ignoring them', async () => {
    const root = await newRoot('records');
    const store = makeStore(root);
    const envelope = boundEnvelope(8);
    await admitted(store, envelope);
    const intentFile = path.join(boundDir(root), `op-${envelope.operationKey}.intent.json`);
    const original = await fs.readFile(intentFile);
    await fs.writeFile(intentFile, '{"schema":"cvf.artifactsBoundReceiptOperation.v2","kind":"INTENT"}');
    expect(await store.readBoundOperation(envelope.operationKey, owner)).toEqual({ state: 'UNSUPPORTED', reason: 'UNSUPPORTED_REVISION' });
    await fs.writeFile(intentFile, '{"schema":"cvf.artifactsReceiptOperation.v1","kind":"INTENT"}');
    expect(await store.readBoundOperation(envelope.operationKey, owner)).toEqual({ state: 'CORRUPT', reason: 'INVALID_RECORD' });
    await fs.writeFile(intentFile, '');
    expect(await store.readBoundOperation(envelope.operationKey, owner)).toEqual({ state: 'CORRUPT', reason: 'EMPTY_RECORD' });
    await fs.writeFile(intentFile, original);
    expect((await store.readBoundOperation(envelope.operationKey, owner)).state).toBe('INTENT');
    await fs.writeFile(path.join(boundDir(root), 'slot-000.json'), original);
    expect((await store.readBoundOperation(envelope.operationKey, owner)).state).toBe('CORRUPT');
    const other = boundEnvelope(9);
    await fs.writeFile(path.join(boundDir(root), 'stray.txt'), 'x');
    expect(await store.admitBoundOperation(other, owner)).toEqual({ kind: 'DENIED', reason: 'UNKNOWN_ENTRY' });
  });
  it('keeps 256 monotonic reservations per owner and denies the 257th without recycling', async () => {
    const root = await newRoot('capacity');
    const store = makeStore(root);
    for (let index = 0; index < 256; index += 1) expect((await store.admitBoundOperation(boundEnvelope(1000 + index), owner)).kind).toBe('ADMITTED');
    expect((await names(boundDir(root))).filter(name => name.startsWith('slot-'))).toHaveLength(256);
    expect(await store.admitBoundOperation(boundEnvelope(2000), owner)).toEqual({ kind: 'DENIED', reason: 'CAPACITY_FULL' });
    expect((await names(boundDir(root))).filter(name => name.startsWith('slot-'))).toHaveLength(256);
    expect((await makeStore(root).admitBoundOperation(boundEnvelope(1005), owner)).kind).toBe('EXISTING');
  }, 120_000);
});
