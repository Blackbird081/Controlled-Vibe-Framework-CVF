import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WIRE_SCHEMA, boundAttemptIdFor, boundBindingDigest, boundEnvelopeSha256, boundOperationKey, boundRequestSha256, buildBoundEnvelope, makeBoundConfig,
  type BoundEnvelope, type EvaluateResult } from '@/lib/artifacts-bound-receipt-contract';
import { attemptIdFor, buildEnvelope, makeOperationConfig, operationKey, type ControlledEvaluateRequest } from '@/lib/artifacts-receipt-operation-contract';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import { BoundTransportError, EXPECTED_ACTION, type BoundInvoker } from '@/lib/server/bound-receipt-transport';
import { boundReceiptFromResult, invokeBoundWithGrant, runBoundReceipt, type BoundReceiptOptions } from './proof';

const ROOTS = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-source-20261019', 'worker', 'roots');
const T0 = Date.parse('2026-10-19T01:00:00.000Z');
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const config = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
async function newRoot(label: string) {
  await fs.mkdir(ROOTS, { recursive: true });
  return fs.realpath(await fs.mkdtemp(path.join(ROOTS, `${label}-`)));
}
const makeStore = (root: string, both = false) => new HtmlDraftSnapshotStore({ kind: 'local-synthetic', root, production: false, boundReceiptOperations: true,
  ...(both ? { receiptOperations: true as const } : {}) }, () => T0);
function operation(index = 1, over: { html?: string; job?: string; cfg?: typeof config } = {}) {
  const requestSha256 = sha(`request-${index}`);
  const key = boundOperationKey({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256 })!;
  const attemptId = boundAttemptIdFor(key);
  const request: ControlledEvaluateRequest = { request_id: attemptId, artifact_id: 'receipt-anchor', payload: { content: 'Heading' }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' };
  const envelope = buildBoundEnvelope({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256, jobId: over.job ?? jobId, versionId: null, attemptId,
    payloadSha256: boundRequestSha256(request), config: over.cfg ?? config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha(`source-${index}`),
      htmlSha256: over.html ?? sha(`html-${index}`), artifactId: 'receipt-anchor', filename: 'review.html' } })!;
  return { envelope, request };
}
function resultFor(envelope: BoundEnvelope, patch: Record<string, unknown> = {}, decision = 'ALLOW', risk = 'R0'): EvaluateResult {
  return { schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: 'a'.repeat(64), operationKey: envelope.operationKey, attemptId: envelope.attemptId,
    artifactId: envelope.output.artifactId, payloadSha256: envelope.payloadSha256, envelopeSha256: boundEnvelopeSha256(envelope), owner: { ...owner }, configDigest: envelope.config.configDigest,
    instanceId: envelope.config.instanceId, storeBindingId: envelope.config.storeBindingId, declaredRisk: 'R1', engineRiskLevel: risk,
    ledgerReference: { requestId: envelope.attemptId, blockHash: sha(`block-${envelope.attemptId}`) },
    report: { request_summary: { request_id: envelope.attemptId, artifact_id: envelope.output.artifactId }, decision_analysis: { final_decision: decision },
      cvf_enforcement: { action: EXPECTED_ACTION[decision] }, cvf_risk_level: risk, report_metadata: { generated_at: '2026-10-19T01:00:01.000000' },
      integrity: { has_ledger_reference: true } }, executionRecord: { final_decision: decision, ledger_attached: true }, ...patch } as EvaluateResult;
}
function stub(respond: (calls: ControlledEvaluateRequest[]) => Promise<unknown>) {
  const calls: ControlledEvaluateRequest[] = [];
  const invoker = (async (request: ControlledEvaluateRequest) => { calls.push(request); return respond(calls); }) as BoundInvoker;
  return { invoker, calls };
}
const options = (store: HtmlDraftSnapshotStore, op: ReturnType<typeof operation>, invoker: BoundInvoker, extra: Partial<BoundReceiptOptions> = {}): BoundReceiptOptions =>
  ({ store, owner, envelope: op.envelope, request: op.request, invoker, timeoutMs: 1000, ...extra });
const good = (op: ReturnType<typeof operation>, decision = 'ALLOW') => stub(async () => resultFor(op.envelope, {}, decision));

describe('bound receipt proof: one admitted operation, one invoker entry', () => {
  it('records a verified receipt with the engine risk kept separate from the requested R1, then reuses it with zero sends', async () => {
    const root = await newRoot('happy');
    const store = makeStore(root);
    const op = operation();
    const first = good(op);
    const result = await runBoundReceipt(options(store, op, first.invoker));
    expect(result).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED', persisted: true, sends: 1, reason: null });
    const receipt = result.kind === 'EXECUTED' ? result.receipt! : null;
    expect(receipt).toMatchObject({ receiptId: op.envelope.attemptId, decision: 'ALLOW', riskLevel: 'R1', engineRiskLevel: 'R0', bindingDigest: boundBindingDigest(op.envelope) });
    expect(receipt?.ledgerReference.requestId).toBe(op.envelope.attemptId);
    expect(first.calls).toHaveLength(1);
    const again = good(op);
    expect(await runBoundReceipt(options(store, op, again.invoker))).toMatchObject({ kind: 'REUSED', sends: 0, receipt });
    expect(again.calls).toHaveLength(0);
    expect(await runBoundReceipt(options(makeStore(root), op, again.invoker))).toMatchObject({ kind: 'REUSED' });
  });
  it('maps a verified DENY to DENIED and never reuses it', async () => {
    const store = makeStore(await newRoot('deny'));
    const op = operation();
    const first = good(op, 'DENY');
    expect(await runBoundReceipt(options(store, op, first.invoker))).toMatchObject({ kind: 'EXECUTED', outcome: 'DENIED', persisted: true });
    const again = good(op);
    expect(await runBoundReceipt(options(store, op, again.invoker))).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'DENIED', sends: 0 });
    expect(again.calls).toHaveLength(0);
  });
  it.each(['REVIEW', 'ESCALATE', 'SANDBOX'])('verifies a %s decision as a receipt with explicit separate engine risk', async decision => {
    const store = makeStore(await newRoot('decision'));
    const op = operation();
    expect(await runBoundReceipt(options(store, op, good(op, decision).invoker))).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED' });
  });
  const unknowns: Array<[string, (envelope: BoundEnvelope) => Promise<unknown>, string]> = [
    ['typed transport failure', async () => { throw new BoundTransportError('RESPONSE_SIGNATURE'); }, 'RESPONSE_SIGNATURE'],
    ['response loss after commit', async () => { throw new BoundTransportError('SEND_FAILED'); }, 'SEND_FAILED'],
    ['untyped error', async () => { throw new Error('boom'); }, 'INVOKER_ERROR'],
    ['not configured style error', async () => { throw new BoundTransportError('NOT_CONFIGURED'); }, 'NOT_CONFIGURED'],
    ['malformed result', async () => ({ success: true }), 'INVALID_RESPONSE'],
    ['wrong ledger request id', async e => resultFor(e, { ledgerReference: { requestId: 'other-attempt-id', blockHash: sha('b') } }), 'INVALID_RESPONSE'],
    ['wrong store', async e => resultFor(e, { storeBindingId: 'cd'.repeat(32) }), 'INVALID_RESPONSE'],
    ['wrong payload digest', async e => resultFor(e, { payloadSha256: sha('other') }), 'INVALID_RESPONSE'],
    ['action does not match decision', async e => resultFor(e, { report: { ...resultFor(e).report, cvf_enforcement: { action: 'BLOCK' } } }), 'INVALID_RESPONSE'],
  ];
  it.each(unknowns)('records OUTCOME_UNKNOWN for %s and never sends again', async (_name, respond, reason) => {
    const store = makeStore(await newRoot('unknown'));
    const op = operation();
    const first = stub(async () => respond(op.envelope));
    const result = await runBoundReceipt(options(store, op, first.invoker));
    expect(result).toMatchObject({ kind: 'EXECUTED', outcome: 'OUTCOME_UNKNOWN', receipt: null, reason, persisted: true, sends: 1 });
    const again = good(op);
    expect(await runBoundReceipt(options(store, op, again.invoker))).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'OUTCOME_UNKNOWN', sends: 0 });
    expect(again.calls).toHaveLength(0);
    expect(first.calls).toHaveLength(1);
  });
  it('turns a timeout into one UNKNOWN record and drops a late response', async () => {
    const root = await newRoot('timeout');
    const store = makeStore(root);
    const op = operation();
    const slow = stub(() => new Promise(resolve => setTimeout(() => resolve(resultFor(op.envelope)), 800)));
    expect(await runBoundReceipt(options(store, op, slow.invoker, { timeoutMs: 400 }))).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', reason: 'TIMED_OUT', persisted: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const state = await store.readBoundOperation(op.envelope.operationKey, owner);
    expect(state.state === 'OUTCOME' && state.outcome.outcome).toBe('OUTCOME_UNKNOWN');
    expect(slow.calls).toHaveLength(1);
  });
  it('fences an already-aborted caller: one FAILED_BEFORE_SEND record, zero invoker entries, no retry', async () => {
    const store = makeStore(await newRoot('abort'));
    const op = operation();
    const controller = new AbortController();
    controller.abort();
    const first = good(op);
    expect(await runBoundReceipt(options(store, op, first.invoker, { signal: controller.signal }))).toEqual({ kind: 'DENIED', reason: 'FAILED_BEFORE_SEND', sends: 0 });
    expect(first.calls).toHaveLength(0);
    const state = await store.readBoundOperation(op.envelope.operationKey, owner);
    expect(state.state === 'OUTCOME' && state.outcome.outcome).toBe('FAILED_BEFORE_SEND');
    expect(await runBoundReceipt(options(store, op, first.invoker))).toMatchObject({ kind: 'ALREADY_PROCESSED', outcome: 'FAILED_BEFORE_SEND' });
    expect(first.calls).toHaveLength(0);
  });
  it('reports an unconfirmed outcome write as UNKNOWN not persisted and leaves the operation started', async () => {
    const store = makeStore(await newRoot('write-fail'));
    store.writeBoundOutcome = async () => ({ kind: 'UNAVAILABLE' });
    const op = operation();
    const first = good(op);
    expect(await runBoundReceipt(options(store, op, first.invoker))).toMatchObject({ outcome: 'OUTCOME_UNKNOWN', persisted: false, reason: 'OUTCOME_WRITE_UNAVAILABLE', receipt: null });
    expect((await store.readBoundOperation(op.envelope.operationKey, owner)).state).toBe('STARTED');
    expect(await runBoundReceipt(options(store, op, first.invoker))).toMatchObject({ kind: 'ALREADY_PROCESSED', state: 'STARTED', sends: 0 });
    expect(first.calls).toHaveLength(1);
  });
});

describe('isolation, identity and authority', () => {
  it('snapshots request, envelope and owner before the first await', async () => {
    const store = makeStore(await newRoot('snapshot'));
    const op = operation();
    const first = good(op);
    const live = options(store, op, first.invoker, { owner: { ...owner }, envelope: JSON.parse(JSON.stringify(op.envelope)), request: { ...op.request, payload: { content: 'Heading' } } });
    const pending = runBoundReceipt(live);
    (live.request.payload as { content: string }).content = 'changed after the call';
    (live.owner as { userId: string }).userId = 'u2';
    (live.envelope as { jobId: string }).jobId = 'mutated';
    expect(await pending).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED' });
    expect(first.calls[0].payload.content).toBe('Heading');
  });
  it('denies hostile input with zero invoker entries and no durable write', async () => {
    const root = await newRoot('hostile');
    const store = makeStore(root);
    const op = operation();
    const v1Config = makeOperationConfig({ policyRevision: 'p', transformRevision: 't', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
    const v1Key = operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: sha('request-1') })!;
    const v1Envelope = buildEnvelope({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: sha('request-1'), jobId, versionId: null, attemptId: attemptIdFor(v1Key),
      payloadSha256: sha('p'), config: v1Config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('s'), htmlSha256: sha('h'), artifactId: 'receipt-anchor', filename: 'f.html' } })!;
    const stand = { admitBoundOperation: async () => ({ kind: 'DENIED' }) } as unknown as HtmlDraftSnapshotStore;
    const bad: Array<[string, Partial<BoundReceiptOptions>]> = [
      ['v1 envelope', { envelope: v1Envelope }], ['mutated envelope', { envelope: { ...op.envelope, riskLevel: 'R2' } }], ['other owner', { owner: { ...owner, userId: 'u2' } }],
      ['altered payload', { request: { ...op.request, payload: { content: 'altered' } } }], ['other attempt', { request: { ...op.request, request_id: 'ncr-bound-other-attempt' } }],
      ['other artifact', { request: { ...op.request, artifact_id: 'other' } }], ['phase', { request: { ...op.request, cvf_phase: 'BUILD' as 'REVIEW' } }],
      ['structural store', { store: stand }], ['timeout zero', { timeoutMs: 0 }], ['timeout too long', { timeoutMs: 30_001 }], ['fractional timeout', { timeoutMs: 10.5 }],
      ['fake signal', { signal: {} as AbortSignal }], ['no invoker', { invoker: 'x' as unknown as BoundInvoker }],
    ];
    for (const [name, patch] of bad) {
      const run = good(op);
      expect(await runBoundReceipt(options(store, op, run.invoker, patch)), name).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
      expect(run.calls, name).toHaveLength(0);
    }
    expect(await runBoundReceipt(null as unknown as BoundReceiptOptions)).toEqual({ kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 });
    expect((await store.readBoundOperation(op.envelope.operationKey, owner)).state).toBe('ABSENT');
  });
  it('never lets a v1, copied, spent, fabricated or foreign grant invoke a bound operation', async () => {
    const root = await newRoot('grants');
    const store = makeStore(root, true);
    const op = operation();
    const run = good(op);
    const v1Config = makeOperationConfig({ policyRevision: 'p', transformRevision: 't', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1', authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
    const v1Key = operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: sha('request-1') })!;
    const v1Envelope = buildEnvelope({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: sha('request-1'), jobId, versionId: null, attemptId: attemptIdFor(v1Key),
      payloadSha256: sha('p'), config: v1Config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('s'), htmlSha256: sha('h'), artifactId: 'receipt-anchor', filename: 'f.html' } })!;
    const admitted = await store.admitOperation(v1Envelope, owner);
    if (admitted.kind !== 'ADMITTED') throw new Error('v1 not admitted');
    const v1Start = await store.startOperation(owner, v1Envelope.operationKey, run.invoker, admitted.admission);
    if (v1Start.kind !== 'STARTED') throw new Error('v1 not started');
    const denied = { kind: 'DENIED', reason: 'GRANT_REJECTED', sends: 0 };
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), v1Start.grant)).toEqual(denied);
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), { kind: 'OPERATION_GRANT' })).toEqual(denied);
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), null)).toEqual(denied);
    const boundAdmit = await store.admitBoundOperation(op.envelope, owner);
    if (boundAdmit.kind !== 'ADMITTED') throw new Error('bound not admitted');
    const started = await store.startBoundOperation(owner, op.envelope.operationKey, run.invoker, boundAdmit.admission);
    if (started.kind !== 'STARTED') throw new Error('bound not started');
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), { ...started.grant })).toEqual(denied);
    expect(await invokeBoundWithGrant(options(makeStore(root, true), op, run.invoker), started.grant)).toEqual(denied);
    expect(await invokeBoundWithGrant(options(store, op, good(op).invoker), started.grant)).toEqual(denied);
    expect(run.calls).toHaveLength(0);
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), started.grant)).toMatchObject({ kind: 'EXECUTED', outcome: 'RECEIPT_VERIFIED' });
    expect(await invokeBoundWithGrant(options(store, op, run.invoker), started.grant)).toEqual(denied);
    expect(run.calls).toHaveLength(1);
  });
  it('gives a changed job, version, config or HTML a reference-only answer, never the prior receipt with new HTML', async () => {
    const store = makeStore(await newRoot('changed'));
    const op = operation();
    expect(await runBoundReceipt(options(store, op, good(op).invoker))).toMatchObject({ outcome: 'RECEIPT_VERIFIED' });
    const variants = [operation(1, { html: sha('another html') }), operation(1, { job: '123e4567-e89b-42d3-a456-426614174009' }),
      operation(1, { cfg: makeBoundConfig({ policyRevision: 'policy-r2', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
        authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000', storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })! })];
    for (const variant of variants) {
      expect(variant.envelope.operationKey).toBe(op.envelope.operationKey);
      const run = good(variant);
      expect(await runBoundReceipt(options(store, variant, run.invoker))).toMatchObject({ kind: 'ALREADY_PROCESSED', state: 'OUTCOME', outcome: 'RECEIPT_VERIFIED', sends: 0 });
      expect(run.calls).toHaveLength(0);
    }
  });
  it('rebuilds the receipt from the verified result and rejects any join drift', () => {
    const op = operation();
    const result = resultFor(op.envelope, {}, 'ALLOW', 'R2');
    expect(boundReceiptFromResult(JSON.parse(JSON.stringify(result)), op.envelope)).toMatchObject({ riskLevel: 'R1', engineRiskLevel: 'R2', decision: 'ALLOW' });
    expect(boundReceiptFromResult({ ...result, storeBindingId: 'cd'.repeat(32) }, op.envelope)).toBeNull();
    expect(boundReceiptFromResult({ ...result, owner: { ...owner, orgId: 'o2' } }, op.envelope)).toBeNull();
    expect(boundReceiptFromResult({ ...result, extra: 1 }, op.envelope)).toBeNull();
    expect(boundReceiptFromResult(null, op.envelope)).toBeNull();
  });
});
