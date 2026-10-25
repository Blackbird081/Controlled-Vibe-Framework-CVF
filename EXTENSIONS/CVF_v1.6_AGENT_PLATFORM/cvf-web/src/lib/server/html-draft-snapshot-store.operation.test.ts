import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { HtmlDraftSnapshotStore, type AdmitResult } from './html-draft-snapshot-store';
import {
  attemptIdFor, buildEnvelope, makeOperationConfig, operationKey, recordBytes, type OperationEnvelope,
} from '../artifacts-receipt-operation-contract';
import type { DraftInput } from '../html-draft-recovery-contract';

const WORKER = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-binding-repair-20261019', 'worker');
const ROOTS = path.join(WORKER, 'roots');
const HOUR = 3_600_000;
const T0 = Date.parse('2026-10-19T01:00:00.000Z');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const hex = (text: string) => createHash('sha256').update(text).digest('hex');
const ownerDir = (root: string, who = owner) => path.join(root, hex(JSON.stringify([who.userId, who.orgId, who.teamId])));
const config = makeOperationConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1',
  storeId: 'synthetic-store-1', authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
const jobId = '123e4567-e89b-42d3-a456-426614174001';

async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
function envelopeFor(index: number, who = owner, extra: { html?: string; job?: string } = {}): OperationEnvelope {
  const requestSha256 = hex(`request-${index}`);
  const key = operationKey({ owner: who, sourceRecordId: `ncr-synthetic-${index}`, requestSha256 })!;
  return buildEnvelope({ owner: who, sourceRecordId: `ncr-synthetic-${index}`, requestSha256, jobId: extra.job ?? jobId, versionId: null, attemptId: attemptIdFor(key),
    payloadSha256: hex(`payload-${index}`), config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: hex(`source-${index}`),
      htmlSha256: extra.html ?? hex(`html-${index}`), artifactId: 'receipt-anchor', filename: 'review.html' } })!;
}
const makeStore = (root: string, clock: () => number = () => T0, enabled = true) =>
  new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, ...(enabled ? { receiptOperations: true as const } : {}) }, clock);
const opsDir = (root: string) => path.join(ownerDir(root), 'operations');
const list = async (root: string) => (await fs.readdir(opsDir(root))).sort();
const slots = async (root: string) => (await list(root)).filter(name => name.startsWith('slot-'));
const noop = async () => ({});
const sha = async (file: string) => hex((await fs.readFile(file)).toString('binary'));

type Internals = { createOnce(dir: string, name: string, bytes: Buffer): Promise<string>; readFileExact(dir: string, name: string): Promise<{ kind: string; bytes?: Buffer }> };
/** Fault doubles on a real store. tear: a real torn file stays on disk, then the write is unconfirmed. unavailable: the open fails and nothing is created. mismatched: the readback differs. */
function fault(store: HtmlDraftSnapshotStore, kind: 'tear' | 'unavailable' | 'mismatched', pattern: RegExp) {
  const internals = store as unknown as Internals;
  const create = internals.createOnce.bind(store);
  const read = internals.readFileExact.bind(store);
  internals.createOnce = async (dir, name, bytes) => {
    if (!pattern.test(name) || kind === 'mismatched') return create(dir, name, bytes);
    if (kind === 'unavailable') return 'UNAVAILABLE';
    await fs.writeFile(path.join(dir, name), bytes.subarray(0, Math.max(1, Math.floor(bytes.byteLength / 2))), { flag: 'wx' });
    return 'UNCONFIRMED';
  };
  internals.readFileExact = async (dir, name) => {
    const back = await read(dir, name);
    return kind === 'mismatched' && pattern.test(name) && back.kind === 'OK' && back.bytes ? { kind: 'OK', bytes: Buffer.alloc(back.bytes.byteLength, 0x20) } : back;
  };
}
const tear = (store: HtmlDraftSnapshotStore, pattern: RegExp) => fault(store, 'tear', pattern);
const unavailable = (store: HtmlDraftSnapshotStore, pattern: RegExp) => fault(store, 'unavailable', pattern);
const mismatched = (store: HtmlDraftSnapshotStore, pattern: RegExp) => fault(store, 'mismatched', pattern);
async function admit(store: HtmlDraftSnapshotStore, envelope: OperationEnvelope) {
  const admitted = await store.admitOperation(envelope, owner);
  if (admitted.kind !== 'ADMITTED') throw new Error(`admit ${admitted.kind}`);
  return admitted;
}
async function fullFlow(store: HtmlDraftSnapshotStore, envelope: OperationEnvelope, invoker: unknown = noop) {
  const admitted = await admit(store, envelope);
  const started = await store.startOperation(owner, envelope.operationKey, invoker, admitted.admission);
  if (started.kind !== 'STARTED') throw new Error(`start ${started.kind}`);
  return { admitted, started, consumed: store.consumeGrant(started.grant, invoker, envelope)! };
}
const fresh = async (label: string) => { const root = await newRoot(label); return { root, store: makeStore(root), envelope: envelopeFor(1) }; };

describe('PB/REQ-STORE immutable operation records', () => {
  it('writes reservation, intent, start and outcome once each as exact canonical bytes under the operations child directory', async () => {
    const { root, store, envelope } = await fresh('ops-lifecycle');
    expect(await store.readOperation(envelope.operationKey, owner)).toEqual({ state: 'ABSENT' });
    const { admitted, consumed } = await fullFlow(store, envelope);
    expect(admitted.intent.slot).toBe(0);
    const outcome = await store.writeOutcome(consumed, { outcome: 'RECEIPT_VERIFIED', receipt: { receiptId: envelope.attemptId, decision: 'ALLOW',
      evaluatedAt: '2026-10-19T01:00:01.000Z', riskLevel: 'R1' }, reason: null });
    expect(outcome.kind).toBe('SAVED');
    expect(await list(root)).toEqual([`op-${envelope.operationKey}.intent.json`, `op-${envelope.operationKey}.outcome.json`,
      `op-${envelope.operationKey}.start.json`, 'slot-000.json']);
    for (const name of await list(root)) {
      const bytes = await fs.readFile(path.join(opsDir(root), name));
      expect(bytes.byteLength).toBeGreaterThan(0);
      expect(bytes.byteLength).toBeLessThanOrEqual(16_384);
      expect(JSON.parse(bytes.toString('utf8'))).toBeTruthy();
    }
    const state = await store.readOperation(envelope.operationKey, owner);
    expect(state.state).toBe('OUTCOME');
    if (state.state === 'OUTCOME') {
      expect(Buffer.compare(await fs.readFile(path.join(opsDir(root), `op-${envelope.operationKey}.intent.json`)), recordBytes(state.intent)!)).toBe(0);
      expect(Buffer.compare(await fs.readFile(path.join(opsDir(root), `op-${envelope.operationKey}.outcome.json`)), recordBytes(state.outcome)!)).toBe(0);
    }
    expect((await fs.readdir(ownerDir(root))).sort()).toEqual(['operations']);
  });
  it('keeps existing draft and job files outside the operations scan', async () => {
    const { root, store } = await fresh('ops-coexist');
    const draft: DraftInput = { versionId: '123e4567-e89b-42d3-a456-426614174009', sourceRecordId: 'ncr-synthetic-1',
      request: { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' },
      html: '<p>x</p>', filename: 'x.html', generatedAt: new Date(T0).toISOString(), buildNumber: 1 };
    expect(await store.save(draft, owner)).toBe('SAVED');
    expect((await store.admitOperation(envelopeFor(1), owner)).kind).toBe('ADMITTED');
    expect((await store.list('ncr-synthetic-1', owner)).map(row => row.versionId)).toEqual([draft.versionId]);
    expect((await fs.readdir(ownerDir(root))).sort()).toEqual([`${draft.versionId}.json`, 'operations']);
  });
  it('denies every operation call when the profile does not enable receipt operations', async () => {
    const root = await newRoot('ops-disabled');
    const store = makeStore(root, () => T0, false);
    const envelope = envelopeFor(1);
    expect(await store.admitOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason: 'DISABLED' });
    expect(await store.startOperation(owner, envelope.operationKey, noop)).toEqual({ kind: 'DENIED', reason: 'DISABLED' });
    expect((await store.readOperation(envelope.operationKey, owner)).state).toBe('UNCONFIRMED');
    expect(await fs.readdir(root)).toEqual([]);
  });
  it('looks up an existing key before reserving, so a repeat consumes no new slot', async () => {
    const { root, store, envelope } = await fresh('ops-existing');
    expect((await store.admitOperation(envelope, owner)).kind).toBe('ADMITTED');
    const again = await store.admitOperation(envelope, owner);
    expect(again.kind).toBe('EXISTING');
    expect((await slots(root))).toEqual(['slot-000.json']);
    expect((await store.admitOperation(envelopeFor(2), owner)).kind).toBe('ADMITTED');
    expect((await slots(root))).toEqual(['slot-000.json', 'slot-001.json']);
  });
  it('rejects an envelope for another owner and keeps owner namespaces apart', async () => {
    const { store } = await fresh('ops-owner');
    const other = { ...owner, teamId: 't2' };
    expect(await store.admitOperation(envelopeFor(1, other), owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect((await store.admitOperation(envelopeFor(1), owner)).kind).toBe('ADMITTED');
    expect(await store.readOperation(envelopeFor(1).operationKey, other)).toEqual({ state: 'ABSENT' });
    expect(await store.admitOperation({ ...envelopeFor(2), callLimit: 2 }, owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect(await store.admitOperation(null, owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect(await store.admitOperation(envelopeFor(3), { ...owner, userId: '../x' })).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
  });
});

describe('PB/REQ-STORE missing, corrupt, unconfirmed and unsupported are distinct', () => {
  const intentFile = (root: string, envelope: OperationEnvelope) => path.join(opsDir(root), `op-${envelope.operationKey}.intent.json`);
  it.each([
    ['empty record', Buffer.alloc(0), 'CORRUPT'],
    ['not json', Buffer.from('{not json'), 'CORRUPT'],
    ['oversize record', Buffer.alloc(16_385, 0x20), 'CORRUPT'],
    ['unsupported revision', Buffer.from(JSON.stringify({ schema: 'cvf.artifactsReceiptOperation.v2' })), 'UNSUPPORTED'],
    ['wrong shape', Buffer.from('{"schema":"cvf.artifactsReceiptOperation.v1","kind":"INTENT"}'), 'CORRUPT'],
  ])('reports %s as %s without admitting a replacement', async (_label, bytes, expected) => {
    const { root, store, envelope } = await fresh('ops-bad');
    expect((await store.admitOperation(envelope, owner)).kind).toBe('ADMITTED');
    await fs.writeFile(intentFile(root, envelope), bytes);
    const planted = await fs.readFile(intentFile(root, envelope));
    expect((await store.readOperation(envelope.operationKey, owner)).state).toBe(expected);
    const again = await store.admitOperation(envelope, owner);
    expect(again.kind).toBe('EXISTING');
    expect(await slots(root)).toEqual(['slot-000.json']);
    expect(await store.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING' });
    expect(Buffer.compare(await fs.readFile(intentFile(root, envelope)), planted)).toBe(0);
  });
  it('treats an orphan start or a missing reservation as corrupt and an unusable root as unconfirmed', async () => {
    const { root, store, envelope } = await fresh('ops-orphan');
    const { started } = await fullFlow(store, envelope);
    expect(started.kind).toBe('STARTED');
    await fs.rename(intentFile(root, envelope), path.join(opsDir(root), 'moved-intent.bin'));
    expect(await store.readOperation(envelope.operationKey, owner)).toMatchObject({ state: 'CORRUPT', reason: 'ORPHAN_LIFECYCLE' });
    await fs.rename(path.join(opsDir(root), 'moved-intent.bin'), intentFile(root, envelope));
    await fs.rename(path.join(opsDir(root), 'slot-000.json'), path.join(opsDir(root), 'moved-slot.bin'));
    expect(await store.readOperation(envelope.operationKey, owner)).toMatchObject({ state: 'CORRUPT', reason: 'RESERVATION_MISMATCH' });
    await fs.rename(path.join(opsDir(root), 'moved-slot.bin'), path.join(opsDir(root), 'slot-000.json'));
    expect((await store.readOperation(envelope.operationKey, owner)).state).toBe('STARTED');
    const missingRoot = makeStore(path.join(root, 'does-not-exist'));
    expect((await missingRoot.readOperation(envelope.operationKey, owner)).state).toBe('UNCONFIRMED');
    expect(await missingRoot.admitOperation(envelope, owner)).toMatchObject({ kind: 'DENIED' });
  });
  it('rejects a key mismatch planted under another key name', async () => {
    const { root, store } = await fresh('ops-swap');
    const first = envelopeFor(1);
    const second = envelopeFor(2);
    await store.admitOperation(first, owner);
    await fs.copyFile(intentFile(root, first), intentFile(root, second));
    expect(await store.readOperation(second.operationKey, owner)).toMatchObject({ state: 'CORRUPT' });
  });
  it('denies through a junction operations directory and a junction root without writing through the link', async ctx => {
    const root = await newRoot('ops-link');
    const target = await newRoot('ops-link-target');
    await fs.mkdir(ownerDir(root), { mode: 0o700 });
    try { await fs.symlink(target, opsDir(root), 'junction'); }
    catch { ctx.skip(); }
    const store = makeStore(root);
    expect(await store.admitOperation(envelopeFor(1), owner)).toEqual({ kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' });
    expect(await fs.readdir(target)).toEqual([]);
    const rootLink = path.join(await newRoot('ops-link-holder'), 'link');
    await fs.symlink(root, rootLink, 'junction');
    expect(await makeStore(rootLink).admitOperation(envelopeFor(1), owner)).toEqual({ kind: 'DENIED', reason: 'UNSAFE_NAMESPACE' });
  });
  it('denies an unknown entry and an over-bound scan instead of ignoring them', async () => {
    const { root, store } = await fresh('ops-unknown');
    expect((await store.admitOperation(envelopeFor(1), owner)).kind).toBe('ADMITTED');
    await fs.writeFile(path.join(opsDir(root), 'stray.txt'), 'x');
    expect(await store.admitOperation(envelopeFor(2), owner)).toEqual({ kind: 'DENIED', reason: 'UNKNOWN_ENTRY' });
    expect(await slots(root)).toEqual(['slot-000.json']);
    const outOfRange = await newRoot('ops-slot-256');
    const outOfRangeStore = makeStore(outOfRange);
    await outOfRangeStore.admitOperation(envelopeFor(1), owner);
    await fs.writeFile(path.join(opsDir(outOfRange), 'slot-256.json'), 'x');
    expect(await outOfRangeStore.admitOperation(envelopeFor(2), owner)).toEqual({ kind: 'DENIED', reason: 'UNKNOWN_ENTRY' });
    const bounded = await newRoot('ops-scan-bound');
    const boundedStore = makeStore(bounded);
    await boundedStore.admitOperation(envelopeFor(1), owner);
    await Promise.all(Array.from({ length: 1030 }, (_v, i) => fs.writeFile(path.join(opsDir(bounded), `junk-${i}`), '')));
    expect(await boundedStore.admitOperation(envelopeFor(2), owner)).toEqual({ kind: 'DENIED', reason: 'SCAN_BOUND_EXCEEDED' });
  });
});

describe('PB/REQ-STORE write and readback faults consume, never recycle', () => {
  it('a torn reservation consumes its slot, denies, and the next admit uses a later slot', async () => {
    const { root, store: faulty, envelope } = await fresh('ops-torn-slot');
    tear(faulty, /^slot-/);
    expect(await faulty.admitOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason: 'RESERVATION_UNCONFIRMED' });
    expect(await list(root)).toEqual(['slot-000.json']);
    const healthy = makeStore(root);
    const retry = await healthy.admitOperation(envelope, owner);
    expect(retry.kind).toBe('ADMITTED');
    if (retry.kind === 'ADMITTED') expect(retry.intent.slot).toBe(1);
    expect(await slots(root)).toEqual(['slot-000.json', 'slot-001.json']);
  });
  it('a torn intent keeps the key consumed: lookup is corrupt, no replacement intent or slot', async () => {
    const { root, store: faulty, envelope } = await fresh('ops-torn-intent');
    tear(faulty, /\.intent\.json$/);
    expect(await faulty.admitOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason: 'INTENT_UNCONFIRMED' });
    const healthy = makeStore(root);
    expect((await healthy.readOperation(envelope.operationKey, owner)).state).toBe('CORRUPT');
    expect((await healthy.admitOperation(envelope, owner)).kind).toBe('EXISTING');
    expect(await slots(root)).toEqual(['slot-000.json']);
  });
  it('a torn start denies before any grant exists and later callers never mint one', async () => {
    const { root, store, envelope } = await fresh('ops-torn-start');
    const admitted = await admit(store, envelope);
    tear(store, /\.start\.json$/);
    expect(await store.startOperation(owner, envelope.operationKey, noop, admitted.admission)).toEqual({ kind: 'DENIED', reason: 'START_UNCONFIRMED' });
    const healthy = makeStore(root);
    expect(await healthy.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING', operation: { state: 'CORRUPT' } });
  });
  it('a torn outcome leaves the operation corrupt and a healthy writer cannot replace it', async () => {
    const { root, store, envelope } = await fresh('ops-torn-outcome');
    const { consumed } = await fullFlow(store, envelope);
    tear(store, /\.outcome\.json$/);
    const input = { outcome: 'OUTCOME_UNKNOWN' as const, receipt: null, reason: 'TIMED_OUT' };
    expect((await store.writeOutcome(consumed, input)).kind).toBe('UNCONFIRMED');
    expect((await store.writeOutcome(consumed, input)).kind).toBe('UNAVAILABLE');
    const healthy = makeStore(root);
    expect((await healthy.readOperation(envelope.operationKey, owner)).state).toBe('CORRUPT');
    expect((await healthy.writeOutcome(consumed, input)).kind).toBe('UNAVAILABLE');
  });
  it('an abandoned empty reservation file consumes capacity and is never recycled', async () => {
    const root = await newRoot('ops-abandoned');
    await fs.mkdir(opsDir(root), { recursive: true, mode: 0o700 });
    await fs.writeFile(path.join(opsDir(root), 'slot-000.json'), Buffer.alloc(0));
    const store = makeStore(root);
    const admitted = await store.admitOperation(envelopeFor(1), owner);
    expect(admitted.kind === 'ADMITTED' && admitted.intent.slot).toBe(1);
    expect((await fs.stat(path.join(opsDir(root), 'slot-000.json'))).size).toBe(0);
  });
});

describe('PB/REQ-STORE injected open failure and readback mismatch deny before any send', () => {
  it('denies when the reservation open fails and creates no marker', async () => {
    const { root, store: faulty } = await fresh('ops-open-slot');
    unavailable(faulty, /^slot-/);
    expect(await faulty.admitOperation(envelopeFor(1), owner)).toEqual({ kind: 'DENIED', reason: 'RESERVATION_UNCONFIRMED' });
    expect(await list(root)).toEqual([]);
  });
  it('denies when the intent open fails: the reservation marker stays consumed and a later admit uses a later slot', async () => {
    const { root, store: faulty } = await fresh('ops-open-intent');
    unavailable(faulty, /\.intent\.json$/);
    expect(await faulty.admitOperation(envelopeFor(1), owner)).toEqual({ kind: 'DENIED', reason: 'INTENT_UNCONFIRMED' });
    expect(await list(root)).toEqual(['slot-000.json']);
    const later = await makeStore(root).admitOperation(envelopeFor(1), owner);
    expect(later.kind === 'ADMITTED' && later.intent.slot).toBe(1);
  });
  it('denies when the start open fails and mints no grant', async () => {
    const { root, store, envelope } = await fresh('ops-open-start');
    const admitted = await admit(store, envelope);
    unavailable(store, /\.start\.json$/);
    expect(await store.startOperation(owner, envelope.operationKey, noop, admitted.admission)).toEqual({ kind: 'DENIED', reason: 'START_UNCONFIRMED' });
    expect((await list(root)).filter(name => name.includes('.start.'))).toEqual([]);
  });
  it.each<[string, RegExp, string, string]>([
    ['reservation', /^slot-/, 'RESERVATION_UNCONFIRMED', 'slot-000.json'],
    ['intent', /\.intent\.json$/, 'INTENT_UNCONFIRMED', 'intent.json'],
  ])('denies on a %s readback mismatch and keeps the written record consumed', async (_label, pattern, reason, fileSuffix) => {
    const { root, store: faulty, envelope } = await fresh('ops-mismatch');
    mismatched(faulty, pattern);
    expect(await faulty.admitOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason });
    expect((await list(root)).some(name => name.endsWith(fileSuffix))).toBe(true);
    expect((await makeStore(root).admitOperation(envelope, owner)).kind).toBe(reason === 'INTENT_UNCONFIRMED' ? 'EXISTING' : 'ADMITTED');
  });
  it('a start readback mismatch leaves STARTED with no grant, so nothing can be sent', async () => {
    const { root, store, envelope } = await fresh('ops-mismatch-start');
    const admitted = await admit(store, envelope);
    mismatched(store, /\.start\.json$/);
    expect(await store.startOperation(owner, envelope.operationKey, noop, admitted.admission)).toEqual({ kind: 'DENIED', reason: 'START_UNCONFIRMED' });
    const healthy = makeStore(root);
    expect((await healthy.readOperation(envelope.operationKey, owner)).state).toBe('STARTED');
    expect(await healthy.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
  });
});

describe('PB/REQ-STORE capacity of 256 monotonic reservations per owner', () => {
  it('admits exactly 256 operations, denies the 257th, and an existing key still resolves at capacity', async () => {
    const { root, store } = await fresh('ops-cap');
    const admissions: unknown[] = [];
    for (let i = 0; i < 256; i++) admissions.push((await admit(store, envelopeFor(i))).admission);
    expect(await slots(root)).toHaveLength(256);
    expect(await store.admitOperation(envelopeFor(256), owner)).toEqual({ kind: 'DENIED', reason: 'CAPACITY_FULL' });
    expect(await slots(root)).toHaveLength(256);
    expect((await store.admitOperation(envelopeFor(7), owner)).kind).toBe('EXISTING');
    expect(await store.startOperation(owner, envelopeFor(7).operationKey, noop)).toEqual({ kind: 'DENIED', reason: 'ADMISSION_REQUIRED' });
    expect((await store.startOperation(owner, envelopeFor(7).operationKey, noop, admissions[7])).kind).toBe('STARTED');
    const other = { ...owner, teamId: 't2' };
    expect((await store.admitOperation(envelopeFor(256, other), other)).kind).toBe('ADMITTED');
  }, 120_000);
  it('counts 255 abandoned slots as consumed so exactly one more admission fits', async () => {
    const root = await newRoot('ops-near-full');
    await fs.mkdir(opsDir(root), { recursive: true, mode: 0o700 });
    for (let i = 0; i < 255; i++) await fs.writeFile(path.join(opsDir(root), `slot-${String(i).padStart(3, '0')}.json`), Buffer.alloc(0));
    const store = makeStore(root);
    const last = await store.admitOperation(envelopeFor(1), owner);
    expect(last.kind === 'ADMITTED' && last.intent.slot).toBe(255);
    expect(await store.admitOperation(envelopeFor(2), owner)).toEqual({ kind: 'DENIED', reason: 'CAPACITY_FULL' });
    expect(await slots(root)).toHaveLength(256);
  });
  it('keeps the cap under in-process racing and wastes slots conservatively for duplicate keys', async () => {
    const { root, store } = await fresh('ops-race');
    const distinct = await Promise.all(Array.from({ length: 8 }, (_v, i) => store.admitOperation(envelopeFor(i), owner)));
    expect(distinct.every(result => result.kind === 'ADMITTED')).toBe(true);
    expect(new Set(distinct.map(result => (result as Extract<AdmitResult, { kind: 'ADMITTED' }>).intent.slot)).size).toBe(8);
    const same = await Promise.all(Array.from({ length: 8 }, () => store.admitOperation(envelopeFor(100), owner)));
    expect(same.filter(result => result.kind === 'ADMITTED')).toHaveLength(1);
    const count = (await slots(root)).length;
    expect(count).toBeGreaterThanOrEqual(9);
    expect(count).toBeLessThanOrEqual(16);
  });
});

describe('PC/REQ-STORE single-use grant and unknown without retry', () => {
  it('mints one opaque grant from the winning start and rejects copies, forgeries, spent grants and foreign stores', async () => {
    const { root, store, envelope } = await fresh('ops-grant');
    const admitted = await admit(store, envelope);
    const invoker = async () => ({});
    const started = await store.startOperation(owner, envelope.operationKey, invoker, admitted.admission);
    expect(started.kind).toBe('STARTED');
    if (started.kind !== 'STARTED') return;
    for (const bad of [{ ...started.grant }, JSON.parse(JSON.stringify(started.grant)), { kind: 'OPERATION_GRANT' }, null, 'grant']) expect(store.consumeGrant(bad, invoker, envelope)).toBeNull();
    expect(store.consumeGrant(started.grant, async () => ({}), envelope)).toBeNull();
    expect(makeStore(root).consumeGrant(started.grant, invoker, envelope)).toBeNull();
    const consumed = store.consumeGrant(started.grant, invoker, envelope);
    expect(consumed).toEqual({ kind: 'CONSUMED_START' });
    expect(store.consumeGrant(started.grant, invoker, envelope)).toBeNull();
  });
  it('never mints a second grant after STARTED, a restart, or a terminal outcome', async () => {
    const { root, store, envelope } = await fresh('ops-restart');
    const { consumed } = await fullFlow(store, envelope);
    expect(await store.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
    const restarted = makeStore(root);
    expect(await restarted.admitOperation(envelope, owner)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
    expect(await restarted.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
    const unknown = { outcome: 'OUTCOME_UNKNOWN' as const, receipt: null, reason: 'TIMED_OUT' };
    expect((await store.writeOutcome(consumed, unknown)).kind).toBe('SAVED');
    expect(await restarted.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING', operation: { state: 'OUTCOME' } });
  });
  it('writes one immutable outcome: a second writer collides and a wrong nonce or early write is refused', async () => {
    const { root, store, envelope } = await fresh('ops-outcome');
    const early = await store.admitOperation(envelope, owner);
    expect(early.kind).toBe('ADMITTED');
    const fake = { owner, operationKey: envelope.operationKey, envelopeSha256: '0'.repeat(64), attemptId: envelope.attemptId, startNonce: 'ab'.repeat(16) };
    const unknown = { outcome: 'OUTCOME_UNKNOWN' as const, receipt: null, reason: 'TIMED_OUT' };
    expect((await store.writeOutcome(fake, unknown)).kind).toBe('UNAVAILABLE');
    const started = await store.startOperation(owner, envelope.operationKey, noop, early.kind === 'ADMITTED' ? early.admission : null);
    if (started.kind !== 'STARTED') throw new Error('start');
    const consumed = store.consumeGrant(started.grant, noop, envelope)!;
    expect((await store.writeOutcome({ ...consumed, startNonce: 'cd'.repeat(16) }, unknown)).kind).toBe('UNAVAILABLE');
    expect((await store.writeOutcome({ ...consumed, owner: { ...owner, userId: '../x' } }, unknown)).kind).toBe('UNAVAILABLE');
    expect((await store.writeOutcome(consumed, unknown)).kind).toBe('SAVED');
    const file = path.join(opsDir(root), `op-${envelope.operationKey}.outcome.json`);
    const before = await sha(file);
    const verified = { outcome: 'RECEIPT_VERIFIED' as const, receipt: { receiptId: envelope.attemptId, decision: 'ALLOW', evaluatedAt: 'x', riskLevel: 'R1' }, reason: null };
    expect((await store.writeOutcome(consumed, verified)).kind).toBe('COLLISION');
    expect(await sha(file)).toBe(before);
    expect((await store.readOperation(envelope.operationKey, owner)).state).toBe('OUTCOME');
  });
});

describe('LR1/REQ-AUTHORITY opaque admission, start and outcome authority', () => {
  const needsAdmission = { kind: 'DENIED', reason: 'ADMISSION_REQUIRED' };
  const verified = (envelope: OperationEnvelope, patch: Record<string, string> = {}) => ({ outcome: 'RECEIPT_VERIFIED' as const, reason: null,
    receipt: { receiptId: envelope.attemptId, decision: 'ALLOW', evaluatedAt: '2026-10-19T01:00:01.000Z', riskLevel: 'R1', ...patch } });
  const files = async (root: string, part: string) => (await list(root)).filter(name => name.includes(part));
  it('issues an admission only to the caller whose new intent was written; forged, copied, foreign-store and cross-owner use gets no start', async () => {
    const { root, store, envelope } = await fresh('auth-admission');
    const first = await admit(store, envelope);
    const second = await store.admitOperation(envelope, owner);
    expect(second).toMatchObject({ kind: 'EXISTING', operation: { state: 'INTENT' } });
    expect('admission' in second).toBe(false);
    const forged = [{ kind: 'OPERATION_ADMISSION' }, { ...first.admission }, JSON.parse(JSON.stringify(first.admission)), await store.readOperation(envelope.operationKey, owner), first.intent, second, null, 'x'];
    for (const bad of forged) expect(await store.startOperation(owner, envelope.operationKey, noop, bad)).toEqual(needsAdmission);
    expect(await makeStore(root).startOperation(owner, envelope.operationKey, noop, first.admission)).toEqual(needsAdmission);
    expect((await store.startOperation({ ...owner, teamId: 't2' }, envelope.operationKey, noop, first.admission)).kind).toBe('DENIED');
    expect((await store.startOperation(owner, envelopeFor(2).operationKey, noop, first.admission)).kind).toBe('DENIED');
    expect(await files(root, '.start.')).toEqual([]);
    expect((await store.startOperation(owner, envelope.operationKey, noop, first.admission)).kind).toBe('STARTED');
    expect(await store.startOperation(owner, envelope.operationKey, noop, first.admission)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
  });
  it('lets no restart, fresh store or later caller turn a durable INTENT into a start, even long after and when the winner never started', async () => {
    const { root, envelope } = await fresh('auth-restart');
    await admit(makeStore(root), envelope);
    for (const later of [makeStore(root), makeStore(root, () => T0 + 400 * 24 * HOUR)]) {
      expect(await later.admitOperation(envelope, owner)).toMatchObject({ kind: 'EXISTING', operation: { state: 'INTENT' } });
      expect(await later.startOperation(owner, envelope.operationKey, noop)).toEqual(needsAdmission);
    }
    expect([await files(root, '.start.'), (await makeStore(root).readOperation(envelope.operationKey, owner)).state, await slots(root)]).toEqual([[], 'INTENT', ['slot-000.json']]);
  });
  it('gives no retry after a failed start with no start file: the spent admission, a restart and every later caller get no grant', async () => {
    const { root, store, envelope } = await fresh('auth-failed-start');
    const { admission } = await admit(store, envelope);
    unavailable(store, /\.start\.json$/);
    expect(await store.startOperation(owner, envelope.operationKey, noop, admission)).toEqual({ kind: 'DENIED', reason: 'START_UNCONFIRMED' });
    const healthy = makeStore(root);
    for (const attempt of [store.startOperation(owner, envelope.operationKey, noop, admission), healthy.startOperation(owner, envelope.operationKey, noop, admission),
      healthy.startOperation(owner, envelope.operationKey, noop)]) expect(await attempt).toEqual(needsAdmission);
    expect([await files(root, '.start.'), (await healthy.readOperation(envelope.operationKey, owner)).state]).toEqual([[], 'INTENT']);
  });
  it('lets one admission authorize exactly one start under in-process racing', async () => {
    const { root, store, envelope } = await fresh('auth-race');
    const { admission } = await admit(store, envelope);
    const results = await Promise.all(Array.from({ length: 8 }, () => store.startOperation(owner, envelope.operationKey, noop, admission)));
    expect(results.filter(result => result.kind === 'STARTED')).toHaveLength(1);
    expect(results.filter(result => result.kind === 'DENIED').every(result => result.kind === 'DENIED' && result.reason === 'ADMISSION_REQUIRED')).toBe(true);
    expect(await files(root, '.start.')).toHaveLength(1);
  });
  it('binds a grant to its full envelope and invoker: another envelope, payload or invoker is rejected and a mismatch does not spend it', async () => {
    const { store, envelope } = await fresh('auth-envelope');
    const started = await store.startOperation(owner, envelope.operationKey, noop, (await admit(store, envelope)).admission);
    if (started.kind !== 'STARTED') throw new Error('start');
    const retargeted = envelopeFor(1, owner, { html: hex('other rendered html') });
    expect(retargeted.operationKey).toBe(envelope.operationKey);
    for (const other of [retargeted, envelopeFor(2), { ...envelope, payloadSha256: hex('another payload') }, null, 'x']) expect(store.consumeGrant(started.grant, noop, other)).toBeNull();
    expect(store.consumeGrant(started.grant, async () => ({}), envelope)).toBeNull();
    expect(store.consumeGrant(started.grant, noop, envelope)).not.toBeNull();
    expect(store.consumeGrant(started.grant, noop, envelope)).toBeNull();
  });
  it('rejects a structural, copied, foreign-store or fabricated outcome handle before any write, then accepts the authentic handle once', async () => {
    const { root, store, envelope } = await fresh('auth-outcome');
    const { consumed } = await fullFlow(store, envelope);
    const state = await store.readOperation(envelope.operationKey, owner);
    if (state.state !== 'STARTED') throw new Error('state');
    const structural = { owner, operationKey: envelope.operationKey, envelopeSha256: state.start.envelopeSha256, attemptId: state.start.attemptId, startNonce: state.start.startNonce };
    for (const forged of [structural, { ...structural, kind: 'CONSUMED_START' }, { ...consumed }, JSON.parse(JSON.stringify(consumed)), null, 'x']) {
      expect((await store.writeOutcome(forged, verified(envelope))).kind).toBe('UNAVAILABLE');
    }
    expect((await makeStore(root).writeOutcome(consumed, verified(envelope))).kind).toBe('UNAVAILABLE');
    expect(await files(root, '.outcome.')).toEqual([]);
    expect((await store.writeOutcome(consumed, verified(envelope))).kind).toBe('SAVED');
    expect((await store.writeOutcome(consumed, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).kind).toBe('COLLISION');
  });
  it.each([['another receipt id', { receiptId: 'ncr-op-someoneelse' }], ['risk R0', { riskLevel: 'R0' }], ['an unaccepted decision', { decision: 'APPROVED' }]])(
    'refuses a verified receipt with %s: no outcome file and the used handle is no replay channel', async (_label, patch) => {
      const { root, store, envelope } = await fresh('auth-receipt-join');
      const { consumed } = await fullFlow(store, envelope);
      expect((await store.writeOutcome(consumed, verified(envelope, patch))).kind).toBe('UNAVAILABLE');
      expect((await store.writeOutcome(consumed, verified(envelope))).kind).toBe('UNAVAILABLE');
      expect([await files(root, '.outcome.'), (await store.readOperation(envelope.operationKey, owner)).state]).toEqual([[], 'STARTED']);
    });
});

describe('PE/REQ-STORE no expiry, retained facts and separate draft TTL', () => {
  it('keeps unknown and verified facts beyond 24 hours with no reuse, while the draft snapshot expires', async () => {
    const root = await newRoot('ops-ttl');
    let now = T0;
    const store = makeStore(root, () => now);
    const envelope = envelopeFor(1);
    const { consumed } = await fullFlow(store, envelope);
    const draft: DraftInput = { versionId: '123e4567-e89b-42d3-a456-426614174009', sourceRecordId: 'ncr-synthetic-1',
      request: { title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' },
      html: '<p>x</p>', filename: 'x.html', generatedAt: new Date(T0).toISOString(), buildNumber: 1 };
    expect(await store.save(draft, owner)).toBe('SAVED');
    now = T0 + 25 * HOUR;
    expect(await store.get(draft.versionId, draft.sourceRecordId, owner)).toBeNull();
    expect((await store.readOperation(envelope.operationKey, owner)).state).toBe('STARTED');
    expect(await store.admitOperation(envelope, owner)).toMatchObject({ kind: 'EXISTING', operation: { state: 'STARTED' } });
    expect(await store.startOperation(owner, envelope.operationKey, noop)).toMatchObject({ kind: 'EXISTING' });
    expect((await store.writeOutcome(consumed, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).kind).toBe('SAVED');
    now = T0 + 400 * 24 * HOUR;
    expect((await makeStore(root, () => now).readOperation(envelope.operationKey, owner)).state).toBe('OUTCOME');
    expect(await slots(root)).toEqual(['slot-000.json']);
  });
  it('retains every record byte-for-byte when the profile is disabled and readable again when re-enabled', async () => {
    const { root, store, envelope } = await fresh('ops-revoke');
    const { consumed } = await fullFlow(store, envelope);
    await store.writeOutcome(consumed, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' });
    const before = await Promise.all((await list(root)).map(name => sha(path.join(opsDir(root), name))));
    const disabled = makeStore(root, () => T0, false);
    expect((await disabled.readOperation(envelope.operationKey, owner)).state).toBe('UNCONFIRMED');
    expect(await disabled.admitOperation(envelope, owner)).toEqual({ kind: 'DENIED', reason: 'DISABLED' });
    expect(await Promise.all((await list(root)).map(name => sha(path.join(opsDir(root), name))))).toEqual(before);
    expect((await makeStore(root).readOperation(envelope.operationKey, owner)).state).toBe('OUTCOME');
  });
  it('rejects secret-like and non-synthetic input at the contract boundary before any file exists', async () => {
    const { root, store } = await fresh('ops-secret');
    const bad = { ...envelopeFor(1), output: { ...envelopeFor(1).output, filename: 'OPENAI_API_KEY=hidden-value.html' } };
    expect(await store.admitOperation(bad, owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    const live = { ...envelopeFor(1), sourceRecordId: 'evt_1' };
    expect(await store.admitOperation(live, owner)).toEqual({ kind: 'DENIED', reason: 'INVALID_INPUT' });
    expect(await fs.readdir(root)).toEqual([]);
  });
});

// ---- Real OS processes. Each child runs the production store source transpiled into owned scratch and pinned by hash. ----
const SKIP_PROCESSES = process.env.CVF_W05_SKIP_PROCESS === '1';
const CHILD_DIR = path.join(WORKER, 'child');
const SPAWN_LOG = path.join(WORKER, 'spawn-log.jsonl');
const SOURCES = ['lib/server/html-draft-snapshot-store', 'lib/artifacts-receipt-operation-contract', 'lib/html-draft-recovery-contract', 'lib/html-job-contract', 'lib/html-cta-rendering'];
const CHILD_SOURCE = `'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = JSON.parse(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
for (const [rel, pin] of Object.entries(manifest.transpiledSha256)) {
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, rel))).digest('hex') !== pin) { console.log(JSON.stringify({ error: 'PIN_MISMATCH', rel })); process.exit(3); }
}
const { HtmlDraftSnapshotStore } = require(path.join(__dirname, 'lib/server/html-draft-snapshot-store.js'));
const contract = require(path.join(__dirname, 'lib/artifacts-receipt-operation-contract.js'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const owner = cfg.owner;
const config = contract.makeOperationConfig(cfg.config);
function envelope(index) {
  const requestSha256 = crypto.createHash('sha256').update('request-' + index).digest('hex');
  const key = contract.operationKey({ owner, sourceRecordId: 'ncr-synthetic-' + index, requestSha256 });
  return contract.buildEnvelope({ owner, sourceRecordId: 'ncr-synthetic-' + index, requestSha256, jobId: cfg.jobId, versionId: null, attemptId: contract.attemptIdFor(key),
    payloadSha256: crypto.createHash('sha256').update('payload-' + index).digest('hex'), config,
    output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: 'a'.repeat(64), htmlSha256: 'b'.repeat(64), artifactId: 'receipt-anchor', filename: 'review.html' } });
}
const store = root => new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, receiptOperations: true }, () => Date.parse('2026-10-19T01:00:00.000Z'));
async function barrier() {
  fs.writeFileSync(path.join(cfg.barrierDir, 'ready-' + cfg.index), String(process.pid));
  for (let i = 0; i < 4000 && !fs.existsSync(path.join(cfg.barrierDir, 'go')); i++) await sleep(5);
}
async function invokeOnce(invokeDir) { fs.writeFileSync(path.join(invokeDir, 'invoke-' + process.pid), '1', { flag: 'wx' }); await sleep(10); }
async function sameKey() {
  const s = store(cfg.rootA);
  const env = envelope(1);
  const result = { admit: null, start: null, invoked: false };
  const admitted = await s.admitOperation(env, owner);
  result.admit = admitted.kind + (admitted.kind === 'EXISTING' ? ':' + admitted.operation.state : admitted.kind === 'DENIED' ? ':' + admitted.reason : '');
  if (admitted.kind === 'ADMITTED') {
    const invoker = async () => ({});
    const started = await s.startOperation(owner, env.operationKey, invoker, admitted.admission);
    result.start = started.kind;
    if (started.kind === 'STARTED') {
      const consumed = s.consumeGrant(started.grant, invoker, env);
      if (consumed) { await invokeOnce(cfg.invokeDir); result.invoked = true; await s.writeOutcome(consumed, { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'FIXTURE_NO_RESPONSE' }); }
    }
  }
  return result;
}
async function boundary() {
  const admitted = await store(cfg.rootB).admitOperation(envelope(1000 + cfg.index), owner);
  return { kind: admitted.kind, slot: admitted.kind === 'ADMITTED' ? admitted.intent.slot : null, reason: admitted.kind === 'DENIED' ? admitted.reason : null };
}
async function crashAfterInvoke() {
  const s = store(cfg.rootC);
  const env = envelope(5);
  const admitted = await s.admitOperation(env, owner);
  const invoker = async () => ({});
  const started = admitted.kind === 'ADMITTED' ? await s.startOperation(owner, env.operationKey, invoker, admitted.admission) : { kind: 'NONE' };
  const consumed = started.kind === 'STARTED' ? s.consumeGrant(started.grant, invoker, env) : null;
  if (consumed) { await invokeOnce(cfg.invokeDirC); }
  process.exit(0);
}
async function restart() {
  const s = store(cfg.rootC);
  const env = envelope(5);
  const admitted = await s.admitOperation(env, owner);
  const invoker = async () => ({});
  const started = await s.startOperation(owner, env.operationKey, invoker);
  return { admit: admitted.kind + (admitted.kind === 'EXISTING' ? ':' + admitted.operation.state : ''), start: started.kind + (started.kind === 'EXISTING' ? ':' + started.operation.state : ''),
    grantMinted: started.kind === 'STARTED' };
}
(async () => {
  if (cfg.mode === 'crash') return crashAfterInvoke();
  if (cfg.mode === 'restart') { console.log(JSON.stringify({ pid: process.pid, pins: true, restart: await restart() })); return; }
  await barrier();
  const [same, edge] = await Promise.all([sameKey(), boundary()]);
  console.log(JSON.stringify({ pid: process.pid, pins: true, same, edge }));
})().catch(error => { console.log(JSON.stringify({ error: String(error && error.stack || error) })); process.exit(1); });
`;

async function prepareHarness() {
  await fs.mkdir(CHILD_DIR, { recursive: true });
  const sourceSha256: Record<string, string> = {};
  const transpiledSha256: Record<string, string> = {};
  for (const stem of SOURCES) {
    const source = await fs.readFile(path.resolve(process.cwd(), 'src', `${stem}.ts`), 'utf8');
    const output = ts.transpileModule(source, { fileName: `${stem}.ts`, reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
    expect(output.diagnostics ?? []).toEqual([]);
    const target = path.join(CHILD_DIR, `${stem}.js`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, output.outputText, 'utf8');
    sourceSha256[`src/${stem}.ts`] = hex(source);
    transpiledSha256[`${stem}.js`] = hex(output.outputText);
  }
  await fs.writeFile(path.join(CHILD_DIR, 'manifest.json'), JSON.stringify({ sourceSha256, transpiledSha256 }, null, 2));
  await fs.writeFile(path.join(CHILD_DIR, 'child.js'), CHILD_SOURCE, 'utf8');
  return { sourceSha256, harnessSha256: hex(CHILD_SOURCE) };
}
function run(config: Record<string, unknown>): Promise<{ code: number | null; output: string; pid: number | undefined }> {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(CHILD_DIR, 'child.js'), JSON.stringify(config)], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let output = '';
    const timer = setTimeout(() => { child.kill(); }, 40_000);
    child.stdout.on('data', chunk => { output += String(chunk); });
    child.stderr.on('data', chunk => { output += String(chunk); });
    void fs.appendFile(SPAWN_LOG, `${JSON.stringify({ pid: child.pid, mode: config.mode ?? 'race', index: config.index ?? null, at: new Date().toISOString() })}\n`);
    child.on('close', code => { clearTimeout(timer); resolve({ code, output: output.trim(), pid: child.pid }); });
  });
}

describe.skipIf(SKIP_PROCESSES)('PC/REQ-STORE eight real OS contenders, boundary reservation 256/257 and restart', () => {
  it('lets at most one process start and invoke, caps reservations at 256, and never replays after a crash', async () => {
    const harness = await prepareHarness();
    const rootA = await newRoot('proc-same');
    const rootB = await newRoot('proc-boundary');
    const rootC = await newRoot('proc-restart');
    const barrierDir = await newRoot('proc-barrier');
    const invokeDir = await newRoot('proc-invoke');
    const invokeDirC = await newRoot('proc-invoke-c');
    await fs.mkdir(path.join(ownerDir(rootB), 'operations'), { recursive: true, mode: 0o700 });
    for (let i = 0; i < 255; i++) await fs.writeFile(path.join(opsDir(rootB), `slot-${String(i).padStart(3, '0')}.json`), Buffer.alloc(0));
    const shared = { owner, rootA, rootB, rootC, barrierDir, invokeDir, invokeDirC, jobId,
      config: { policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1',
        authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' } };
    const racers = Array.from({ length: 8 }, (_v, index) => run({ ...shared, mode: 'race', index }));
    for (let i = 0; i < 4000 && (await fs.readdir(barrierDir)).length < 8; i++) await new Promise(resolve => setTimeout(resolve, 5));
    expect((await fs.readdir(barrierDir)).filter(name => name.startsWith('ready-'))).toHaveLength(8);
    await fs.writeFile(path.join(barrierDir, 'go'), '1');
    const results = await Promise.all(racers);
    for (const result of results) expect(result.code, result.output).toBe(0);
    const rows = results.map(result => JSON.parse(result.output) as { pid: number; pins: boolean; same: { admit: string; start: string | null; invoked: boolean }; edge: { kind: string; slot: number | null; reason: string | null } });
    expect(new Set(rows.map(row => row.pid)).size).toBe(8);
    expect(rows.every(row => row.pins)).toBe(true);
    expect(rows.filter(row => row.same.start === 'STARTED')).toHaveLength(1);
    expect(rows.filter(row => row.same.invoked)).toHaveLength(1);
    expect(rows.filter(row => row.same.admit !== 'ADMITTED').every(row => row.same.start === null && !row.same.invoked)).toBe(true);
    expect((await fs.readdir(invokeDir)).filter(name => name.startsWith('invoke-'))).toHaveLength(1);
    expect(rows.filter(row => row.same.admit === 'ADMITTED').length).toBeLessThanOrEqual(1);
    const stateStore = makeStore(rootA);
    const state = await stateStore.readOperation(envelopeFor(1).operationKey, owner);
    expect(state.state).toBe('OUTCOME');
    if (state.state === 'OUTCOME') expect(state.outcome).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', reason: 'FIXTURE_NO_RESPONSE' });
    const sameSlots = (await slots(rootA)).length;
    expect(sameSlots).toBeGreaterThanOrEqual(1);
    expect(sameSlots).toBeLessThanOrEqual(8);
    expect(rows.filter(row => row.edge.kind === 'ADMITTED')).toHaveLength(1);
    expect(rows.filter(row => row.edge.kind === 'ADMITTED')[0].edge.slot).toBe(255);
    expect(rows.filter(row => row.edge.kind === 'DENIED' && row.edge.reason === 'CAPACITY_FULL')).toHaveLength(7);
    expect(await slots(rootB)).toHaveLength(256);
    expect(await slots(rootB)).not.toContain('slot-256.json');
    const crash = await run({ ...shared, mode: 'crash', index: 8 });
    expect(crash.code).toBe(0);
    expect((await fs.readdir(invokeDirC)).filter(name => name.startsWith('invoke-'))).toHaveLength(1);
    const restart = await run({ ...shared, mode: 'restart', index: 9 });
    expect(restart.code, restart.output).toBe(0);
    const restartRow = JSON.parse(restart.output) as { restart: { admit: string; start: string; grantMinted: boolean } };
    expect(restartRow.restart).toEqual({ admit: 'EXISTING:STARTED', start: 'EXISTING:STARTED', grantMinted: false });
    expect((await fs.readdir(invokeDirC)).filter(name => name.startsWith('invoke-'))).toHaveLength(1);
    expect((await makeStore(rootC).readOperation(envelopeFor(5).operationKey, owner)).state).toBe('STARTED');
    const manifest = JSON.parse(await fs.readFile(path.join(CHILD_DIR, 'manifest.json'), 'utf8')) as { sourceSha256: Record<string, string> };
    expect(manifest.sourceSha256['src/lib/server/html-draft-snapshot-store.ts']).toBe(harness.sourceSha256['src/lib/server/html-draft-snapshot-store.ts']);
    expect(harness.harnessSha256).toMatch(/^[a-f0-9]{64}$/);
  }, 120_000);
});
