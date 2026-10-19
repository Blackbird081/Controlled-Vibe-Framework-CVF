import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
type Vectors = typeof import('@/test/fixtures/artifact-bound-receipt-v1.json');
// The vector file carries lone surrogate escapes that the bundler JSON plugin cannot parse, so it is read as text and parsed by the platform parser.
const vectors = JSON.parse(readFileSync(path.resolve(process.cwd(), 'src', 'test', 'fixtures', 'artifact-bound-receipt-v1.json'), 'utf8')) as Vectors;
import {
  BOUND_DISCLOSURE, BOUND_EFFECT, BOUND_SCHEMA, WIRE_SCHEMA, authPreimage, boundBindingDigest, boundDisclosureOf, boundEnvelopeSha256, boundKeySerialization,
  boundOperationKey, boundRecordBytes, boundRequestSha256, boundSha256, buildBoundEnvelope, canonicalAscii, canonicalBytes, computeSignature, decodeBoundRecord,
  makeBoundConfig, makeBoundIntent, makeBoundOutcome, makeBoundReservation, makeBoundStart, parseBoundConfig, parseBoundEnvelope, parseBoundIntent, parseBoundOutcome,
  parseBoundReceipt, parseBoundReservation, parseBoundStart, parseCanonicalJson, parseChallengeResult, parseEvaluateResult, parseWireRequest, readAuthHeaders,
  signaturesEqual, timestampFresh, type BoundReceipt,
} from './artifacts-bound-receipt-contract';
import { OPERATION_SCHEMA, operationKey as v1OperationKey } from './artifacts-receipt-operation-contract';

const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const KEY = Buffer.from(vectors.hmacKeyAscii, 'ascii');
const config = makeBoundConfig(vectors.config.input)!;
const parts = vectors.operation.parts;
const key = boundOperationKey(parts)!;
const output = { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('source'), htmlSha256: sha('html'), artifactId: 'receipt-anchor', filename: 'review.html' };
const envelopeParts = { owner, sourceRecordId: parts.sourceRecordId, requestSha256: parts.requestSha256, jobId: '123e4567-e89b-42d3-a456-426614174001', versionId: null,
  attemptId: vectors.wire.attemptId, payloadSha256: vectors.wire.evaluate.payloadSha256, config, output };
const envelope = buildBoundEnvelope(envelopeParts)!;
const receipt: BoundReceipt = { receiptId: envelope.attemptId, decision: 'ALLOW', evaluatedAt: '2026-10-19T01:00:01.000000', riskLevel: 'R1', engineRiskLevel: 'R0',
  bindingDigest: boundBindingDigest(envelope), ledgerReference: { requestId: envelope.attemptId, blockHash: sha('block') } };
const raw = (hex: string) => Buffer.from(hex, 'hex');
const mutate = <T extends object>(value: T, patch: Record<string, unknown>) => ({ ...value, ...patch });

describe('canonical ASCII bytes (BC03) against the shared vectors', () => {
  it.each(vectors.canonical)('$id has exact canonical text, hex, digest and a strict round trip', c => {
    expect(canonicalAscii(c.input)).toBe(c.canonicalAscii);
    expect(canonicalBytes(c.input).toString('hex')).toBe(c.canonicalHex);
    expect(boundSha256(c.input)).toBe(c.sha256);
    expect(sha(canonicalBytes(c.input))).toBe(c.sha256);
    const parsed = parseCanonicalJson(raw(c.canonicalHex), 1000);
    expect(parsed.ok && parsed.value).toEqual(c.input);
  });
  it('keeps the JS slice(0,500) UTF-16 boundary, including a lone surrogate', () => {
    const source = vectors.excerpt.prefixChar.repeat(vectors.excerpt.prefixCount) + vectors.excerpt.tail;
    const sliced = source.slice(0, vectors.excerpt.sliceUnits);
    expect(sliced.length).toBe(500);
    expect(canonicalAscii(sliced)).toBe(vectors.excerpt.canonicalAscii);
    expect(boundSha256(sliced)).toBe(vectors.excerpt.sha256);
    expect(canonicalAscii(sliced).endsWith(`${String.fromCharCode(92)}ud83d"`)).toBe(true);
  });
  it.each(vectors.malformed)('refuses malformed input $id before any effect', m => {
    expect(parseCanonicalJson(raw(m.rawHex), 1000).ok).toBe(false);
  });
  it('reports the specific refusal class and enforces the byte cap', () => {
    expect(parseCanonicalJson(Buffer.alloc(0), 10)).toEqual({ ok: false, reason: 'EMPTY' });
    expect(parseCanonicalJson(Buffer.from('{"a":1}'), 3)).toEqual({ ok: false, reason: 'OVERSIZE' });
    expect(parseCanonicalJson(raw('7b2261223aff7d'), 100)).toEqual({ ok: false, reason: 'INVALID_UTF8' });
    expect(parseCanonicalJson(Buffer.from('{"a":'), 100)).toEqual({ ok: false, reason: 'INVALID_JSON' });
    expect(parseCanonicalJson(Buffer.from('{"b":1,"a":2}'), 100)).toEqual({ ok: false, reason: 'NOT_CANONICAL' });
  });
  it('refuses non-canonical values and sorts keys by ordinal ASCII', () => {
    for (const bad of [1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, -(2 ** 53), { a: undefined }, new Date(0), new Map(), () => 1, Symbol('x'), BigInt(10)]) {
      expect(() => canonicalAscii(bad)).toThrow();
    }
    expect(() => canonicalAscii({ [String.fromCharCode(0xe9)]: 1 })).toThrow('NON_ASCII_KEY');
    expect(canonicalAscii({ b: 1, a: 2, B: 3, _: 4 })).toBe('{"B":3,"_":4,"a":2,"b":1}');
    expect(canonicalAscii([null, true, false, 0, 'x'])).toBe('[null,true,false,0,"x"]');
  });
});

describe('config, key and envelope (BC01/BC02)', () => {
  it('derives the vector config digest and rejects every drifted field', () => {
    expect(config.configDigest).toBe(vectors.config.configDigest);
    const { configDigest: _digest, ...body } = config;
    expect(_digest).toBe(vectors.config.configDigest);
    expect(canonicalAscii(body)).toBe(vectors.config.canonicalBody);
    expect(parseBoundConfig({ ...config })).toEqual(config);
    const bad: Array<[string, Record<string, unknown>]> = [
      ['digest', { configDigest: 'f'.repeat(64) }], ['extra key', { extra: 1 }], ['path in origin', { webOrigin: 'http://web.invalid:3000/x' }],
      ['query origin', { webOrigin: 'http://web.invalid:3000?x=1' }], ['userinfo', { engineOrigin: 'http://u:p@engine.invalid:8100' }],
      ['default port', { engineOrigin: 'http://engine.invalid:80' }], ['real host', { engineOrigin: 'http://example.com:8100' }],
      ['uppercase host', { engineOrigin: 'http://ENGINE.invalid:8100' }], ['ftp', { engineOrigin: 'ftp://engine.invalid:8100' }],
      ['proxy path', { proxyPath: '/api/governance/evaluate' }], ['challenge path', { engineChallengePath: '/api/v1/evaluate' }],
      ['production', { production: true }], ['v1 trust', { identityTrust: 'DECLARED_UNATTESTED' }], ['schema', { schemaRevision: OPERATION_SCHEMA }],
      ['short timeout', { timeoutMs: 999 }], ['long timeout', { timeoutMs: 30_001 }], ['fractional timeout', { timeoutMs: 1000.5 }],
      ['request cap', { maxRequestBytes: 16_385 }], ['response cap', { maxResponseBytes: 1 }], ['store id case', { storeBindingId: 'AB'.repeat(32) }],
      ['instance id', { instanceId: 'not-a-uuid' }], ['label', { endpointId: 'bad label' }],
    ];
    for (const [name, patch] of bad) expect(parseBoundConfig(mutate(config, patch)), name).toBeNull();
    expect(parseBoundConfig(null)).toBeNull();
    expect(makeBoundConfig({ ...vectors.config.input, webOrigin: 'http://example.com:3000' })).toBeNull();
    expect(makeBoundConfig({ ...vectors.config.input, timeoutMs: 100 })).toBeNull();
  });
  it('derives the vector operation key from fixed-order identity and excludes job, version, config and HTML', () => {
    expect(boundKeySerialization(parts)).toBe(vectors.operation.serialization);
    expect(key).toBe(vectors.operation.operationKey);
    expect(v1OperationKey(parts)).not.toBe(key);
    const other = buildBoundEnvelope({ ...envelopeParts, jobId: '123e4567-e89b-42d3-a456-426614174009', config: makeBoundConfig({ ...vectors.config.input, storeId: 'other-store' })!,
      output: { ...output, htmlSha256: sha('different html') } })!;
    expect(other.operationKey).toBe(key);
    expect(boundEnvelopeSha256(other)).not.toBe(boundEnvelopeSha256(envelope));
    expect(boundOperationKey({ ...parts, sourceRecordId: 'real-source-record' })).toBeNull();
    expect(boundOperationKey({ ...parts, requestSha256: 'AB'.repeat(32) })).toBeNull();
    expect(boundOperationKey({ ...parts, owner: { ...owner, extra: 'x' } as typeof owner })).toBeNull();
    expect(boundOperationKey({ ...parts, owner: { ...owner, userId: 'bad user' } })).toBeNull();
  });
  it('builds, round-trips and strictly rejects the bound envelope', () => {
    expect(parseBoundEnvelope(JSON.parse(JSON.stringify(envelope)))).toEqual(envelope);
    expect(envelope.schema).toBe(BOUND_SCHEMA);
    expect(envelope.effectKind).toBe(BOUND_EFFECT);
    expect(envelope.fixtureDisclosure).toBe(BOUND_DISCLOSURE);
    const bad: Array<[string, Record<string, unknown>]> = [
      ['v1 schema', { schema: OPERATION_SCHEMA }], ['v1 effect', { effectKind: 'INJECTED_SYNTHETIC_RECEIPT' }], ['wrong key', { operationKey: 'e'.repeat(64) }],
      ['risk', { riskLevel: 'R2' }], ['phase', { phase: 'BUILD' }], ['call limit', { callLimit: 2 }], ['extra', { extra: true }], ['disclosure', { fixtureDisclosure: 'SYNTHETIC_FIXTURE_NOT_LIVE_GOVERNANCE' }],
      ['config digest', { config: { ...config, configDigest: 'f'.repeat(64) } }], ['output hash', { output: { ...output, htmlSha256: 'xyz' } }],
      ['output extra', { output: { ...output, extra: 1 } }], ['owner', { owner: { ...owner, userId: 'u2' } }], ['job', { jobId: 'nope' }], ['attempt', { attemptId: 'short' }],
    ];
    for (const [name, patch] of bad) expect(parseBoundEnvelope(mutate(envelope, patch)), name).toBeNull();
    expect(buildBoundEnvelope({ ...envelopeParts, sourceRecordId: 'real-source' })).toBeNull();
    expect(boundRequestSha256(JSON.parse(vectors.wire.evaluate.canonicalAscii))).toBe(vectors.wire.evaluate.payloadSha256);
  });
  it('binds the receipt to envelope, config, instance, store, owner and payload', () => {
    const other = buildBoundEnvelope({ ...envelopeParts, config: makeBoundConfig({ ...vectors.config.input, storeBindingId: 'cd'.repeat(32) })! })!;
    expect(boundBindingDigest(envelope)).toMatch(/^[a-f0-9]{64}$/);
    expect(boundBindingDigest(other)).not.toBe(boundBindingDigest(envelope));
    expect(boundBindingDigest(buildBoundEnvelope({ ...envelopeParts, owner: { ...owner, teamId: 't2' } })!)).not.toBe(boundBindingDigest(envelope));
  });
  it('shapes the nonsecret disclosure without secrets or private paths', () => {
    const disclosure = boundDisclosureOf(config);
    expect(disclosure).toMatchObject({ effectBoundary: BOUND_EFFECT, mode: BOUND_DISCLOSURE, attemptLimit: 1, cost: 'UNKNOWN_NOT_AUTHORIZED', requestedRisk: 'R1' });
    expect(JSON.stringify(disclosure)).not.toMatch(/authReference|authScope|key|secret|storeBindingId|instanceId/i);
  });
});

describe('lifecycle records and receipt', () => {
  it('round-trips each record in canonical ASCII bytes within the cap', () => {
    const reservation = makeBoundReservation(3, owner, key, config.configDigest, 1_760_000_000_000);
    const intent = makeBoundIntent(3, envelope, 1_760_000_000_000);
    const start = makeBoundStart(envelope, 'a'.repeat(32), 1_760_000_000_000);
    const outcome = makeBoundOutcome(start, { outcome: 'RECEIPT_VERIFIED', receipt, reason: null }, 1_760_000_000_000);
    expect(parseBoundReservation(JSON.parse(JSON.stringify(reservation)))).toEqual(reservation);
    expect(parseBoundIntent(JSON.parse(JSON.stringify(intent)))).toEqual(intent);
    expect(parseBoundStart(JSON.parse(JSON.stringify(start)))).toEqual(start);
    expect(parseBoundOutcome(JSON.parse(JSON.stringify(outcome)))).toEqual(outcome);
    for (const record of [reservation, intent, start, outcome]) {
      const bytes = boundRecordBytes(record)!;
      expect(bytes.byteLength).toBeLessThanOrEqual(16_384);
      expect(decodeBoundRecord(bytes)).toEqual({ kind: 'OK', value: JSON.parse(bytes.toString('ascii')) });
    }
    expect(parseBoundIntent(mutate(intent, { envelopeSha256: 'f'.repeat(64) }))).toBeNull();
    expect(parseBoundIntent(mutate(intent, { slot: 256 }))).toBeNull();
    expect(parseBoundStart(mutate(start, { startNonce: 'g'.repeat(32) }))).toBeNull();
  });
  it('distinguishes corrupt, unsupported and non-canonical record bytes', () => {
    const intent = makeBoundIntent(0, envelope, 1_760_000_000_000);
    expect(decodeBoundRecord(Buffer.from(JSON.stringify(intent, null, 1))).kind).toBe('CORRUPT');
    expect(decodeBoundRecord(Buffer.from('not json')).kind).toBe('CORRUPT');
    expect(decodeBoundRecord(Buffer.from('[]')).kind).toBe('CORRUPT');
    expect(decodeBoundRecord(Buffer.alloc(0)).kind).toBe('CORRUPT');
    expect(decodeBoundRecord(Buffer.alloc(16_385, 0x20)).kind).toBe('CORRUPT');
    expect(decodeBoundRecord(canonicalBytes({ schema: 'cvf.artifactsBoundReceiptOperation.v2', kind: 'INTENT' })).kind).toBe('UNSUPPORTED');
    expect(decodeBoundRecord(canonicalBytes({ schema: OPERATION_SCHEMA, kind: 'INTENT' })).kind).toBe('OK');
    expect(parseBoundIntent(JSON.parse(canonicalAscii({ schema: OPERATION_SCHEMA, kind: 'INTENT' })))).toBeNull();
  });
  it('accepts only the exact outcome and receipt combinations', () => {
    const start = makeBoundStart(envelope, 'a'.repeat(32), 1_760_000_000_000);
    const at = 1_760_000_000_000;
    const ok = (input: Parameters<typeof makeBoundOutcome>[1]) => parseBoundOutcome(JSON.parse(JSON.stringify(makeBoundOutcome(start, input, at))));
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt, reason: null })).not.toBeNull();
    expect(ok({ outcome: 'DENIED', receipt: { ...receipt, decision: 'DENY' }, reason: null })).not.toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).not.toBeNull();
    expect(ok({ outcome: 'FAILED_BEFORE_SEND', receipt: null, reason: 'ABORTED_BEFORE_SEND' })).not.toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, decision: 'DENY' }, reason: null })).toBeNull();
    expect(ok({ outcome: 'DENIED', receipt, reason: null })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt, reason: 'TIMED_OUT' })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: null })).toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, riskLevel: 'R2' as 'R1' }, reason: null })).toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, engineRiskLevel: 'R9' }, reason: null })).toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, ledgerReference: { ...receipt.ledgerReference, extra: 1 } as never }, reason: null })).toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, bindingDigest: 'nope' }, reason: null })).toBeNull();
    expect(parseBoundReceipt({ ...receipt, extra: true })).toBeNull();
    expect(parseBoundReceipt(receipt)).toEqual(receipt);
  });
});

describe('wire bodies (BC05)', () => {
  const challenge = JSON.parse(vectors.wire.challenge.canonicalAscii);
  const evaluate = JSON.parse(vectors.wire.evaluateWire.canonicalAscii);
  it('parses the shared vector bodies and their digests', () => {
    expect(sha(vectors.wire.challenge.canonicalAscii)).toBe(vectors.wire.challenge.sha256);
    expect(sha(vectors.wire.evaluateWire.canonicalAscii)).toBe(vectors.wire.evaluateWire.sha256);
    expect(parseWireRequest(challenge)).toMatchObject({ kind: 'CHALLENGE', schema: WIRE_SCHEMA });
    expect(parseWireRequest(evaluate)).toMatchObject({ kind: 'EVALUATE', riskLevel: 'R1', phase: 'REVIEW' });
    expect(canonicalAscii(parseWireRequest(evaluate))).toBe(vectors.wire.evaluateWire.canonicalAscii);
  });
  it('refuses every join, shape and excerpt mutation', () => {
    const request = evaluate.evaluate;
    const rehash = (value: unknown) => boundRequestSha256(value as never);
    const longer = { ...request, payload: { content: 'y'.repeat(501) } };
    const bad: Array<[string, unknown]> = [
      ['challenge with evaluate key', { ...challenge, requestSha256: 'a'.repeat(64) }], ['unknown kind', { ...challenge, kind: 'LOOKUP' }],
      ['schema', { ...challenge, schema: 'cvf.boundReceiptWire.v2' }], ['config', { ...challenge, configDigest: 'x' }], ['nonce', { ...challenge, challengeNonce: 'A'.repeat(64) }],
      ['payload digest', { ...evaluate, payloadSha256: 'a'.repeat(64) }], ['request id', { ...evaluate, evaluate: { ...request, request_id: 'ncr-bound-other-attempt' } }],
      ['artifact', { ...evaluate, evaluate: { ...request, artifact_id: 'other' } }], ['phase', { ...evaluate, phase: 'BUILD' }], ['risk', { ...evaluate, riskLevel: 'R2' }],
      ['evaluate risk', { ...evaluate, evaluate: { ...request, cvf_risk_level: 'R0' } }], ['extra', { ...evaluate, extra: 1 }], ['instance', { ...evaluate, instanceId: 'x' }],
      ['actor override', { ...evaluate, evaluate: { ...request, payload: { content: 'c', actor_id: 'root' } } }],
      ['excerpt over 500', { ...evaluate, evaluate: longer, payloadSha256: rehash(longer) }], ['owner extra', { ...evaluate, owner: { ...owner, role: 'admin' } }],
    ];
    for (const [name, value] of bad) expect(parseWireRequest(value), name).toBeNull();
    expect(parseWireRequest(null)).toBeNull();
  });
  it('parses exact challenge and evaluate results only', () => {
    const base = { schema: WIRE_SCHEMA, kind: 'CHALLENGE_RESULT', requestNonce: 'a'.repeat(64), challengeNonce: 'b'.repeat(64), configDigest: config.configDigest,
      instanceId: config.instanceId, storeBindingId: config.storeBindingId, backend: 'SQLITE', policyRevision: config.policyRevision, expiresAtMs: 1_760_000_005_000 };
    expect(parseChallengeResult(base)).toEqual(base);
    for (const patch of [{ backend: 'JSON' }, { expiresAtMs: 1.5 }, { extra: 1 }, { storeBindingId: 'x' }, { kind: 'EVALUATE_RESULT' }]) expect(parseChallengeResult({ ...base, ...patch })).toBeNull();
    const result = { schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: 'a'.repeat(64), operationKey: key, attemptId: envelope.attemptId, artifactId: 'receipt-anchor',
      payloadSha256: envelope.payloadSha256, envelopeSha256: boundEnvelopeSha256(envelope), owner, configDigest: config.configDigest, instanceId: config.instanceId,
      storeBindingId: config.storeBindingId, declaredRisk: 'R1', engineRiskLevel: 'R0', ledgerReference: receipt.ledgerReference,
      report: { request_summary: { request_id: envelope.attemptId, artifact_id: 'receipt-anchor' }, decision_analysis: { final_decision: 'ALLOW' }, cvf_enforcement: { action: 'ALLOW' },
        cvf_risk_level: 'R0', report_metadata: { generated_at: '2026-10-19T01:00:01.000000' }, integrity: { has_ledger_reference: true } },
      executionRecord: { final_decision: 'ALLOW', ledger_attached: true } };
    expect(parseEvaluateResult(result)).toEqual(result);
    const bad: Array<Record<string, unknown>> = [{ declaredRisk: 'R0' }, { engineRiskLevel: 'R9' }, { extra: 1 }, { executionRecord: { final_decision: 'ALLOW', ledger_attached: false } },
      { report: { ...result.report, extra: 1 } }, { report: { ...result.report, cvf_risk_level: 1.5 } }, { ledgerReference: { requestId: 'x', blockHash: 'short' } }, { owner: { userId: 'u1' } }];
    for (const patch of bad) expect(parseEvaluateResult({ ...result, ...patch })).toBeNull();
  });
});

describe('signatures (BC04)', () => {
  it.each(vectors.hmac)('$id signs the exact shared preimage', h => {
    const text = h.id.startsWith('export') ? vectors.wire.challenge.canonicalAscii : vectors.wire.evaluateWire.canonicalAscii;
    const body = Buffer.from(text, 'ascii');
    expect(sha(body)).toBe(h.bodySha256);
    const preimage = authPreimage(h.hop as 'EXPORT_PROXY', h.kind as 'REQUEST', h.path, h.timestampMs, h.nonce, vectors.config.configDigest, body);
    expect(preimage).toBe(h.preimage);
    expect(computeSignature(KEY, preimage)).toBe(h.signature);
    expect(signaturesEqual(h.signature, computeSignature(KEY, preimage))).toBe(true);
    // A request signature cannot authenticate another hop, kind or path.
    for (const other of [authPreimage(h.hop === 'EXPORT_PROXY' ? 'PROXY_ENGINE' : 'EXPORT_PROXY', h.kind as 'REQUEST', h.path, h.timestampMs, h.nonce, vectors.config.configDigest, body),
      authPreimage(h.hop as 'EXPORT_PROXY', h.kind === 'REQUEST' ? 'RESPONSE' : 'REQUEST', h.path, h.timestampMs, h.nonce, vectors.config.configDigest, body),
      authPreimage(h.hop as 'EXPORT_PROXY', h.kind as 'REQUEST', `${h.path}x`, h.timestampMs, h.nonce, vectors.config.configDigest, body),
      authPreimage(h.hop as 'EXPORT_PROXY', h.kind as 'REQUEST', h.path, h.timestampMs + 1, h.nonce, vectors.config.configDigest, body),
      authPreimage(h.hop as 'EXPORT_PROXY', h.kind as 'REQUEST', h.path, h.timestampMs, h.nonce, 'f'.repeat(64), body),
      authPreimage(h.hop as 'EXPORT_PROXY', h.kind as 'REQUEST', h.path, h.timestampMs, h.nonce, vectors.config.configDigest, Buffer.from(`${text} `))]) {
      expect(signaturesEqual(h.signature, computeSignature(KEY, other))).toBe(false);
    }
  });
  it('compares only well-formed lowercase hex signatures', () => {
    expect(signaturesEqual('a'.repeat(64), 'a'.repeat(64))).toBe(true);
    expect(signaturesEqual('a'.repeat(64), 'b'.repeat(64))).toBe(false);
    expect(signaturesEqual('A'.repeat(64), 'A'.repeat(64))).toBe(false);
    expect(signaturesEqual('a'.repeat(63), 'a'.repeat(63))).toBe(false);
  });
  it('reads each auth header exactly once as a bounded ASCII scalar', () => {
    const good = { 'x-cvf-bound-hop': 'EXPORT_PROXY', 'x-cvf-bound-kind': 'REQUEST', 'x-cvf-bound-timestamp': '1760000000000', 'x-cvf-bound-nonce': 'a'.repeat(64),
      'x-cvf-bound-config': config.configDigest, 'x-cvf-bound-signature': 'b'.repeat(64) };
    expect(readAuthHeaders(new Headers(good))).toEqual({ hop: 'EXPORT_PROXY', kind: 'REQUEST', timestampMs: 1_760_000_000_000, nonce: 'a'.repeat(64), config: config.configDigest, signature: 'b'.repeat(64) });
    const without = (name: string) => { const copy: Record<string, string> = { ...good }; delete copy[name]; return new Headers(copy); };
    for (const name of Object.keys(good)) expect(readAuthHeaders(without(name)), name).toBeNull();
    const duplicate = new Headers(good); duplicate.append('x-cvf-bound-nonce', 'c'.repeat(64));
    expect(readAuthHeaders(duplicate)).toBeNull();
    for (const patch of [{ 'x-cvf-bound-hop': 'ENGINE' }, { 'x-cvf-bound-kind': 'RESPONSEX' }, { 'x-cvf-bound-timestamp': '12.5' }, { 'x-cvf-bound-timestamp': '12345678901234567' },
      { 'x-cvf-bound-nonce': 'A'.repeat(64) }, { 'x-cvf-bound-config': 'x' }, { 'x-cvf-bound-signature': 'b'.repeat(65) }]) expect(readAuthHeaders(new Headers({ ...good, ...patch }))).toBeNull();
  });
  it('accepts timestamps only inside [now-30000, now+1000]', () => {
    const now = 1_760_000_000_000;
    expect(timestampFresh(now - 30_000, now)).toBe(true);
    expect(timestampFresh(now - 30_001, now)).toBe(false);
    expect(timestampFresh(now + 1_000, now)).toBe(true);
    expect(timestampFresh(now + 1_001, now)).toBe(false);
  });
});
