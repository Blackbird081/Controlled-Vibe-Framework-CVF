import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BOUND_SCHEMA, boundAttemptIdFor, boundEnvelopeSha256, boundOperationKey, boundRequestSha256, buildBoundEnvelope, makeBoundConfig, type BoundReceipt } from './artifacts-bound-receipt-contract';
import { OPERATION_SCHEMA, attemptIdFor, buildEnvelope, canonicalJson, envelopeSha256, makeOperationConfig, operationKey, type ControlledEvaluateRequest } from './artifacts-receipt-operation-contract';
import { BOUND_CODEC, V1_CODEC, codecFor, envelopeDigest, parseAnyEnvelope, recordKindOf, requestDigest, schemaKindOf } from './receipt-operation-schema';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const NOW = 1_760_000_000_000;
const output = { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('s'), htmlSha256: sha('h'), artifactId: 'receipt-anchor', filename: 'review.html' };
const requestSha256 = sha('request');
const v1Config = makeOperationConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1',
  authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
const boundConfig = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
const v1Key = operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })!;
const boundKey = boundOperationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })!;
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const v1Envelope = buildEnvelope({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256, jobId, versionId: null, attemptId: attemptIdFor(v1Key), payloadSha256: sha('p'), config: v1Config, output })!;
const boundEnvelope = buildBoundEnvelope({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256, jobId, versionId: null, attemptId: boundAttemptIdFor(boundKey), payloadSha256: sha('p'),
  config: boundConfig, output })!;
const bound = (decision = 'ALLOW'): BoundReceipt => ({ receiptId: boundEnvelope.attemptId, decision, evaluatedAt: '2026-10-19T01:00:01.000000', riskLevel: 'R1', engineRiskLevel: 'R0',
  bindingDigest: sha('binding'), ledgerReference: { requestId: boundEnvelope.attemptId, blockHash: sha('block') } });

describe('combined codec dispatch', () => {
  it('selects a codec only from the exact schema and effect pair', () => {
    expect(schemaKindOf(v1Envelope)).toBe('V1');
    expect(schemaKindOf(boundEnvelope)).toBe('BOUND');
    for (const value of [null, 'x', [], {}, { schema: OPERATION_SCHEMA }, { schema: OPERATION_SCHEMA, effectKind: 'BOUND_ENGINE_RECEIPT' },
      { schema: BOUND_SCHEMA, effectKind: 'INJECTED_SYNTHETIC_RECEIPT' }, { schema: 'cvf.artifactsBoundReceiptOperation.v2', effectKind: 'BOUND_ENGINE_RECEIPT' },
      { schema: BOUND_SCHEMA, effectKind: 'bound_engine_receipt' }]) expect(schemaKindOf(value)).toBeNull();
    expect(recordKindOf({ schema: OPERATION_SCHEMA })).toBe('V1');
    expect(recordKindOf({ schema: BOUND_SCHEMA })).toBe('BOUND');
    expect(recordKindOf({ schema: 'other' })).toBeNull();
    expect(recordKindOf(7)).toBeNull();
  });
  it('parses each envelope with its own parser and denies a cross-schema or mixed envelope', () => {
    expect(parseAnyEnvelope(JSON.parse(JSON.stringify(v1Envelope)))?.kind).toBe('V1');
    expect(parseAnyEnvelope(JSON.parse(JSON.stringify(boundEnvelope)))?.kind).toBe('BOUND');
    expect(V1_CODEC.parseEnvelope(boundEnvelope)).toBeNull();
    expect(BOUND_CODEC.parseEnvelope(v1Envelope)).toBeNull();
    expect(parseAnyEnvelope({ ...boundEnvelope, schema: OPERATION_SCHEMA })).toBeNull();
    expect(parseAnyEnvelope({ ...v1Envelope, effectKind: 'BOUND_ENGINE_RECEIPT' })).toBeNull();
    expect(parseAnyEnvelope({ ...boundEnvelope, config: v1Envelope.config })).toBeNull();
    expect(parseAnyEnvelope({ ...v1Envelope, config: boundEnvelope.config })).toBeNull();
    expect(parseAnyEnvelope({ ...boundEnvelope, extra: 1 })).toBeNull();
  });
  it('keeps the two keys, namespaces and digests apart for the same identity', () => {
    expect(v1Key).not.toBe(boundKey);
    expect(V1_CODEC.directory).toBe('operations');
    expect(BOUND_CODEC.directory).toBe('bound-operations');
    expect(codecFor('V1')).toBe(V1_CODEC);
    expect(codecFor('BOUND')).toBe(BOUND_CODEC);
    expect(envelopeDigest({ kind: 'V1', envelope: v1Envelope })).toBe(envelopeSha256(v1Envelope));
    expect(envelopeDigest({ kind: 'BOUND', envelope: boundEnvelope })).toBe(boundEnvelopeSha256(boundEnvelope));
  });
  it('chooses the request digest from the validated schema, never one serializer for both', () => {
    const ascii: ControlledEvaluateRequest = { request_id: 'a', artifact_id: 'b', payload: { content: 'plain' }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' };
    const unicode: ControlledEvaluateRequest = { ...ascii, payload: { content: `Heading ${String.fromCharCode(0xe9)} ${String.fromCodePoint(0x1f600)}` } };
    expect(requestDigest('V1', ascii)).toBe(sha(canonicalJson(ascii)));
    expect(requestDigest('BOUND', ascii)).toBe(boundRequestSha256(ascii));
    expect(requestDigest('V1', ascii)).toBe(requestDigest('BOUND', ascii));
    expect(requestDigest('V1', unicode)).not.toBe(requestDigest('BOUND', unicode));
    expect(requestDigest('BOUND', unicode)).toBe(boundRequestSha256(unicode));
  });
});

describe('codec lifecycle records stay in their own schema', () => {
  it('round-trips intent, start and outcome per codec and refuses the other codec parsers', () => {
    const v1Intent = V1_CODEC.makeIntent(0, v1Envelope, NOW);
    const boundIntent = BOUND_CODEC.makeIntent(0, boundEnvelope, NOW);
    expect(V1_CODEC.parseIntent(JSON.parse(JSON.stringify(v1Intent)))).toEqual(v1Intent);
    expect(BOUND_CODEC.parseIntent(JSON.parse(JSON.stringify(boundIntent)))).toEqual(boundIntent);
    expect(V1_CODEC.parseIntent(JSON.parse(JSON.stringify(boundIntent)))).toBeNull();
    expect(BOUND_CODEC.parseIntent(JSON.parse(JSON.stringify(v1Intent)))).toBeNull();
    const v1Start = V1_CODEC.makeStart(v1Envelope, 'a'.repeat(32), NOW);
    const boundStart = BOUND_CODEC.makeStart(boundEnvelope, 'a'.repeat(32), NOW);
    expect(BOUND_CODEC.parseStart(JSON.parse(JSON.stringify(v1Start)))).toBeNull();
    expect(V1_CODEC.parseStart(JSON.parse(JSON.stringify(boundStart)))).toBeNull();
    const outcome = BOUND_CODEC.makeOutcome(boundStart, { receipt: bound() }, NOW) as unknown as { receipt: unknown };
    expect(outcome.receipt).toEqual(bound());
    for (const codec of [V1_CODEC, BOUND_CODEC]) {
      const bytes = codec.recordBytes(codec.kind === 'V1' ? v1Intent : boundIntent)!;
      expect(bytes.byteLength).toBeGreaterThan(0);
      expect(codec.decode(bytes).kind).toBe('OK');
    }
    expect(V1_CODEC.parseReservation(JSON.parse(JSON.stringify(BOUND_CODEC.makeReservation(0, owner, boundKey, boundConfig.configDigest, NOW))))).toBeNull();
    expect(BOUND_CODEC.parseReservation(JSON.parse(JSON.stringify(V1_CODEC.makeReservation(0, owner, v1Key, v1Config.configDigest, NOW))))).toBeNull();
  });
  it('joins a persisted receipt to the attempt, the declared risk and an accepted decision for either schema', () => {
    const v1 = (id: string, decision: string, risk = 'R1') => ({ receipt: { receiptId: id, decision, riskLevel: risk } });
    for (const decision of ['ALLOW', 'DENY', 'REVIEW', 'ESCALATE', 'SANDBOX']) {
      expect(V1_CODEC.receiptJoins('attempt-1', v1('attempt-1', decision))).toBe(true);
      expect(BOUND_CODEC.receiptJoins('attempt-1', v1('attempt-1', decision))).toBe(true);
    }
    expect(V1_CODEC.receiptJoins('attempt-1', { receipt: null })).toBe(true);
    expect(BOUND_CODEC.receiptJoins('attempt-1', { receipt: null })).toBe(true);
    for (const codec of [V1_CODEC, BOUND_CODEC]) {
      expect(codec.receiptJoins('attempt-1', v1('attempt-2', 'ALLOW'))).toBe(false);
      expect(codec.receiptJoins('attempt-1', v1('attempt-1', 'ALLOW', 'R0'))).toBe(false);
      expect(codec.receiptJoins('attempt-1', v1('attempt-1', 'APPROVED'))).toBe(false);
    }
  });
});
