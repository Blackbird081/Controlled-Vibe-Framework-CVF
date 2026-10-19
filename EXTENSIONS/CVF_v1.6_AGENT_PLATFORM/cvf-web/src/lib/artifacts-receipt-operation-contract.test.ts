import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MAX_OPERATION_RECORD_BYTES, OPERATION_SCHEMA, OUTCOMES, attemptIdFor, buildEnvelope, canonicalJson, decodeRecord, envelopeSha256, makeIntent,
  makeOperationConfig, makeOutcome, makeReservation, makeStart, operationKey, operationKeySerialization, parseEnvelope, parseIntent, parseOperationConfig,
  parseOutcome, parseReservation, parseStart, recordBytes, serializeEnvelope, type EnvelopeParts, type OperationEnvelope,
} from './artifacts-receipt-operation-contract';
import { MAX_JOB_METADATA_BYTES } from './html-job-contract';

const hex = (text: string) => createHash('sha256').update(text).digest('hex');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const requestSha256 = 'a'.repeat(64);
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const versionId = '123e4567-e89b-42d3-a456-426614174002';
const config = makeOperationConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'synthetic-endpoint-1',
  storeId: 'synthetic-store-1', authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' })!;
const output = { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: 'b'.repeat(64), htmlSha256: 'c'.repeat(64), artifactId: 'receipt-anchor', filename: 'review.html' };
const parts = (): EnvelopeParts => ({ owner: { ...owner }, sourceRecordId: 'ncr-synthetic-1', requestSha256, jobId, versionId: null,
  attemptId: attemptIdFor(operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })!), payloadSha256: 'd'.repeat(64), config: { ...config }, output: { ...output } });
const envelope = (): OperationEnvelope => buildEnvelope(parts())!;
const bytesOf = (value: unknown) => Buffer.from(typeof value === 'string' ? value : canonicalJson(value), 'utf8');

describe('PA/REQ-IDENTITY fixed-order logical key', () => {
  it('serializes exactly [schema,userId,orgId,teamId,sourceRecordId,requestSha256,effectKind] and hashes that text', () => {
    const expected = JSON.stringify([OPERATION_SCHEMA, 'u1', 'o1', 't1', 'ncr-synthetic-1', requestSha256, 'INJECTED_SYNTHETIC_RECEIPT']);
    expect(expected).toBe('["cvf.artifactsReceiptOperation.v1","u1","o1","t1","ncr-synthetic-1","' + requestSha256 + '","INJECTED_SYNTHETIC_RECEIPT"]');
    expect(operationKeySerialization({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })).toBe(expected);
    expect(operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })).toBe(hex(expected));
  });
  it('excludes jobId, versionId, config, endpoint and html identity from the key but binds them in the envelope', () => {
    const base = envelope();
    const otherConfig = makeOperationConfig({ policyRevision: 'policy-r2', transformRevision: 'transform-2', endpointId: 'synthetic-endpoint-2',
      storeId: 'synthetic-store-2', authReference: 'other-reference', authScope: 'NONE' })!;
    const changed = buildEnvelope({ ...parts(), jobId: '123e4567-e89b-42d3-a456-426614174099', versionId, config: otherConfig,
      output: { ...output, htmlSha256: 'e'.repeat(64), generatedAt: '2026-10-19T02:00:00.000Z' }, payloadSha256: 'f'.repeat(64) })!;
    expect(changed.operationKey).toBe(base.operationKey);
    expect(envelopeSha256(changed)).not.toBe(envelopeSha256(base));
    expect(base.versionId).toBeNull();
    for (const [field, value] of [['userId', 'u2'], ['orgId', 'o2'], ['teamId', 't2']] as const) {
      expect(operationKey({ owner: { ...owner, [field]: value }, sourceRecordId: 'ncr-synthetic-1', requestSha256 })).not.toBe(base.operationKey);
    }
    expect(operationKey({ owner, sourceRecordId: 'ncr-synthetic-2', requestSha256 })).not.toBe(base.operationKey);
    expect(operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: '9'.repeat(64) })).not.toBe(base.operationKey);
  });
  it('rejects an invalid owner, a non-synthetic source record and a non-hash request digest', () => {
    for (const bad of [
      { owner: { ...owner, userId: 'bad id' }, sourceRecordId: 'ncr-synthetic-1', requestSha256 },
      { owner: { ...owner, extra: 'x' } as typeof owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 },
      { owner, sourceRecordId: 'evt_1', requestSha256 },
      { owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: 'A'.repeat(64) },
      { owner, sourceRecordId: 'ncr-synthetic-1', requestSha256: 'a'.repeat(63) },
    ]) expect(operationKey(bad)).toBeNull();
  });
  it('derives a deterministic attempt id from the key only', () => {
    const key = operationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })!;
    expect(attemptIdFor(key)).toBe(`ncr-op-${key.slice(0, 48)}`);
    expect(attemptIdFor(key)).toMatch(/^[A-Za-z0-9._-]{8,150}$/);
  });
});

describe('PA/REQ-IDENTITY canonical serialization', () => {
  it('sorts keys and refuses non-canonical values', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe('{"a":{"c":null,"d":[2,1]},"b":1}');
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(() => canonicalJson({ a: undefined })).toThrow();
    expect(() => canonicalJson({ a: Number.NaN })).toThrow();
    expect(() => canonicalJson({ a: () => 1 })).toThrow();
    expect(() => canonicalJson(new Date())).toThrow();
  });
  it('serializes the same envelope to the same bytes regardless of property order', () => {
    const base = envelope();
    const reversed = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(base).reverse()))) as unknown;
    expect(serializeEnvelope(parseEnvelope(reversed)!)).toBe(serializeEnvelope(base));
    expect(envelopeSha256(base)).toBe(hex(serializeEnvelope(base)));
  });
});

describe('PA/REQ-IDENTITY strict envelope and config', () => {
  it('copies input and never aliases the caller object', () => {
    const input = parts();
    const built = buildEnvelope(input)!;
    input.owner.userId = 'mutated';
    input.output.htmlSha256 = '0'.repeat(64);
    input.config.endpointId = 'synthetic-mutated';
    expect(built.owner.userId).toBe('u1');
    expect(built.output.htmlSha256).toBe('c'.repeat(64));
    expect(built.config.endpointId).toBe('synthetic-endpoint-1');
    const reparsed = parseEnvelope(built)!;
    expect(reparsed).toEqual(built);
    expect(reparsed).not.toBe(built);
    expect(reparsed.owner).not.toBe(built.owner);
  });
  it('binds every declared identity, phase, risk, call limit, disclosure and posture', () => {
    const e = envelope();
    expect(e).toMatchObject({ effectKind: 'INJECTED_SYNTHETIC_RECEIPT', phase: 'REVIEW', riskLevel: 'R1', callLimit: 1,
      syntheticDisclosure: 'SYNTHETIC_FIXTURE_NOT_LIVE_GOVERNANCE', retention: 'NO_EXPIRY_DEVELOPMENT_BOUND_NO_GC',
      revokePosture: 'DISABLE_REVOKE_PERSISTENT_NO_RESET_BY_ABSENCE' });
    expect(e.config).toMatchObject({ identityTrust: 'DECLARED_UNATTESTED', production: false, endpointId: 'synthetic-endpoint-1', storeId: 'synthetic-store-1',
      authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' });
    expect(JSON.stringify(e)).not.toMatch(/password|secret|token/i);
  });
  it('rejects extra, missing, retyped and tampered envelope fields', () => {
    const plain = JSON.parse(JSON.stringify(envelope())) as Record<string, unknown>;
    expect(parseEnvelope(plain)).not.toBeNull();
    for (const mutate of [
      (v: Record<string, unknown>) => { v.extra = 1; },
      (v: Record<string, unknown>) => { delete v.output; },
      (v: Record<string, unknown>) => { v.callLimit = 2; },
      (v: Record<string, unknown>) => { v.phase = 'EXECUTE'; },
      (v: Record<string, unknown>) => { v.riskLevel = 'R0'; },
      (v: Record<string, unknown>) => { v.effectKind = 'JOB_EFFECTS'; },
      (v: Record<string, unknown>) => { v.operationKey = '1'.repeat(64); },
      (v: Record<string, unknown>) => { v.sourceRecordId = 'ncr-synthetic-other'; },
      (v: Record<string, unknown>) => { v.versionId = 'not-a-uuid'; },
      (v: Record<string, unknown>) => { v.jobId = '../unsafe'; },
      (v: Record<string, unknown>) => { v.attemptId = 'short'; },
      (v: Record<string, unknown>) => { (v.owner as Record<string, unknown>).teamId = 'other'; },
      (v: Record<string, unknown>) => { (v.config as Record<string, unknown>).endpointId = 'synthetic-tampered'; },
      (v: Record<string, unknown>) => { (v.output as Record<string, unknown>).generatedAt = '2026-10-19'; },
      (v: Record<string, unknown>) => { (v.output as Record<string, unknown>).htmlSha256 = 'xyz'; },
    ]) {
      const copy = JSON.parse(JSON.stringify(plain)) as Record<string, unknown>;
      mutate(copy);
      expect(parseEnvelope(copy)).toBeNull();
    }
    expect(parseEnvelope(null)).toBeNull();
    expect(parseEnvelope([])).toBeNull();
  });
  it('accepts a saved version id only as an explicit later binding', () => {
    expect(buildEnvelope({ ...parts(), versionId })!.versionId).toBe(versionId);
    expect(buildEnvelope({ ...parts(), versionId: 'x' })).toBeNull();
  });
  it('requires synthetic endpoint and store ids and a self-consistent digest; production and attested trust are not representable', () => {
    expect(makeOperationConfig({ policyRevision: 'p', transformRevision: 't', endpointId: 'https://real.example', storeId: 'synthetic-s', authReference: 'a', authScope: 'NONE' })).toBeNull();
    expect(makeOperationConfig({ policyRevision: 'p', transformRevision: 't', endpointId: 'synthetic-e', storeId: 'production-store', authReference: 'a', authScope: 'NONE' })).toBeNull();
    const plain = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
    expect(parseOperationConfig(plain)).toEqual(config);
    for (const mutate of [
      (v: Record<string, unknown>) => { v.production = true; },
      (v: Record<string, unknown>) => { v.identityTrust = 'ATTESTED'; },
      (v: Record<string, unknown>) => { v.configDigest = '0'.repeat(64); },
      (v: Record<string, unknown>) => { v.policyRevision = 'other'; },
      (v: Record<string, unknown>) => { v.extra = true; },
    ]) {
      const copy = JSON.parse(JSON.stringify(plain)) as Record<string, unknown>;
      mutate(copy);
      expect(parseOperationConfig(copy)).toBeNull();
    }
  });
  it('rejects secret-like values in config and output text', () => {
    expect(makeOperationConfig({ policyRevision: 'sk-abcdefghijklmnopqrstuvwxyz', transformRevision: 't', endpointId: 'synthetic-e', storeId: 'synthetic-s', authReference: 'a', authScope: 'NONE' })).toBeNull(); // fake alphabet-only credential fixture
    expect(buildEnvelope({ ...parts(), output: { ...output, filename: 'OPENAI_API_KEY=hidden-value.html' } })).toBeNull();
    expect(buildEnvelope({ ...parts(), output: { ...output, artifactId: 'Bearer abcdefghijklmnopqrstuvwxyz' } })).toBeNull();
  });
});

describe('PB/REQ-STORE lifecycle records and bytes', () => {
  const now = Date.parse('2026-10-19T01:00:00.000Z');
  const e = envelope();
  const nonce = 'ab'.repeat(16);
  const receipt = { receiptId: 'ncr-op-x', decision: 'ALLOW', evaluatedAt: '2026-10-19T01:00:01.000Z', riskLevel: 'R1' };
  it('round trips reservation, intent, start and outcome through strict parsers', () => {
    const reservation = makeReservation(3, owner, e.operationKey, e.config.configDigest, now);
    expect(parseReservation(JSON.parse(JSON.stringify(reservation)))).toEqual(reservation);
    const intent = makeIntent(3, e, now);
    expect(parseIntent(JSON.parse(JSON.stringify(intent)))).toEqual(intent);
    const start = makeStart(e, nonce, now);
    expect(parseStart(JSON.parse(JSON.stringify(start)))).toEqual(start);
    const outcome = makeOutcome(start, { outcome: 'RECEIPT_VERIFIED', receipt, reason: null }, now);
    expect(parseOutcome(JSON.parse(JSON.stringify(outcome)))).toEqual(outcome);
    for (const record of [reservation, intent, start, outcome]) {
      const bytes = recordBytes(record)!;
      expect(bytes.byteLength).toBeLessThanOrEqual(MAX_OPERATION_RECORD_BYTES);
      expect(decodeRecord(bytes)).toEqual({ kind: 'OK', value: JSON.parse(bytes.toString('utf8')) });
    }
    expect(MAX_OPERATION_RECORD_BYTES).toBe(MAX_JOB_METADATA_BYTES);
    expect(OUTCOMES).toEqual(['RECEIPT_VERIFIED', 'DENIED', 'FAILED_BEFORE_SEND', 'OUTCOME_UNKNOWN']);
  });
  it('rejects a slot outside 0..255, a mismatched intent digest and a non-hex nonce', () => {
    expect(parseReservation({ ...makeReservation(256, owner, e.operationKey, e.config.configDigest, now) })).toBeNull();
    expect(parseReservation({ ...makeReservation(-1, owner, e.operationKey, e.config.configDigest, now) })).toBeNull();
    expect(parseIntent({ ...makeIntent(0, e, now), envelopeSha256: '0'.repeat(64) })).toBeNull();
    expect(parseStart({ ...makeStart(e, nonce, now), startNonce: 'not-hex' })).toBeNull();
    expect(parseIntent({ ...makeIntent(0, e, now), extra: 1 })).toBeNull();
  });
  it('enforces outcome/receipt/reason invariants', () => {
    const start = makeStart(e, nonce, now);
    const ok = (input: Parameters<typeof makeOutcome>[1]) => parseOutcome(makeOutcome(start, input, now));
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt, reason: null })).not.toBeNull();
    expect(ok({ outcome: 'DENIED', receipt: { ...receipt, decision: 'DENY' }, reason: null })).not.toBeNull();
    expect(ok({ outcome: 'FAILED_BEFORE_SEND', receipt: null, reason: 'ABORTED_BEFORE_SEND' })).not.toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'TIMED_OUT' })).not.toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: null, reason: null })).toBeNull();
    expect(ok({ outcome: 'RECEIPT_VERIFIED', receipt: { ...receipt, decision: 'DENY' }, reason: null })).toBeNull();
    expect(ok({ outcome: 'DENIED', receipt, reason: null })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt, reason: 'TIMED_OUT' })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: null })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'lower case reason' })).toBeNull();
    expect(ok({ outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'X'.repeat(65) })).toBeNull();
    expect(ok({ outcome: 'MAYBE' as never, receipt: null, reason: 'X' })).toBeNull();
  });
  it('refuses to serialize a record over the 16384-byte bound', () => {
    const intent = makeIntent(0, e, now);
    expect(recordBytes(intent)).not.toBeNull();
    expect(recordBytes({ ...intent, createdAt: 'x'.repeat(MAX_OPERATION_RECORD_BYTES) })).toBeNull();
  });
  it('distinguishes corrupt, unsupported and canonical bytes', () => {
    const good = recordBytes(makeStart(e, nonce, now))!;
    expect(decodeRecord(good).kind).toBe('OK');
    expect(decodeRecord(Buffer.alloc(0)).kind).toBe('CORRUPT');
    expect(decodeRecord(Buffer.from('{"schema":'))).toEqual({ kind: 'CORRUPT' });
    expect(decodeRecord(Buffer.from([0x7b, 0xff, 0xfe, 0x7d]))).toEqual({ kind: 'CORRUPT' });
    expect(decodeRecord(Buffer.from('[]'))).toEqual({ kind: 'CORRUPT' });
    expect(decodeRecord(Buffer.from(JSON.stringify(JSON.parse(good.toString('utf8')), null, 2)))).toEqual({ kind: 'CORRUPT' });
    expect(decodeRecord(Buffer.alloc(MAX_OPERATION_RECORD_BYTES + 1, 0x20))).toEqual({ kind: 'CORRUPT' });
    expect(decodeRecord(bytesOf({ schema: 'cvf.artifactsReceiptOperation.v2', kind: 'STARTED' }))).toEqual({ kind: 'UNSUPPORTED' });
    expect(decodeRecord(bytesOf({ schema: 'something.else', kind: 'STARTED' })).kind).toBe('OK');
    expect(parseStart(JSON.parse(good.toString('utf8')) as unknown)).not.toBeNull();
  });
});

describe('PG/REQ-INTEGRATION import graph and no ambient authority', () => {
  const root = process.cwd();
  const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
  const specifiers = (source: string) => [...source.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+'([^']+)'/gm)].map(match => match[1]);
  const controlledProof = () => read('src/app/api/artifacts/export/proof.ts').split('// ---- Controlled receipt operation')[1];
  it('limits imports to Node builtins and current artifacts modules', () => {
    const allowed = /^(node:[a-z/]+|\.\.?\/[A-Za-z0-9./_-]+|@\/lib\/(artifacts-receipt-operation-contract|html-draft-recovery-contract|server\/(html-draft-snapshot-store|receipt-operation-profile))|\.\/(proof|operation-branch))$/;
    for (const file of [
      'src/lib/artifacts-receipt-operation-contract.ts', 'src/lib/server/html-draft-snapshot-store.ts', 'src/lib/server/receipt-operation-profile.ts',
      'src/app/api/artifacts/export/operation-branch.ts', 'src/app/api/artifacts/export/proof.ts',
    ]) {
      const found = specifiers(read(file));
      expect(found.length).toBeGreaterThan(0);
      for (const specifier of found) expect(specifier, `${file} imports ${specifier}`).toMatch(allowed);
    }
    expect(specifiers(read('src/lib/artifacts-receipt-operation-contract.ts'))).toEqual(['./html-draft-recovery-contract']);
  });
  it('has no default fetch, credential, engine, provider or network use in the new fixture owners', () => {
    const forbidden = /\bfetch\(|XMLHttpRequest|WebSocket|node:(?:http|https|net|dns|tls|child_process)|CVF_SERVICE_TOKEN|API_KEY|governance-engine|ai_governance_core|pending-agent|better-sqlite3|provider-attempt|model-gateway|CVF_MODEL_GATEWAY|approval-store|approvals/;
    for (const file of ['src/lib/artifacts-receipt-operation-contract.ts', 'src/lib/server/receipt-operation-profile.ts', 'src/app/api/artifacts/export/operation-branch.ts']) {
      expect(read(file), file).not.toMatch(forbidden);
    }
    expect(controlledProof()).not.toMatch(forbidden);
    expect(read('src/lib/server/html-draft-snapshot-store.ts').split('// ---- Receipt operations')[1]).not.toMatch(forbidden);
  });
  it('has no unlink, rename, truncate, append, chmod, chown or lock in the operations code and opens files only with wx', () => {
    const operations = read('src/lib/server/html-draft-snapshot-store.ts').split('// ---- Receipt operations')[1];
    expect(operations).not.toMatch(/\.(?:unlink|rm|rmdir|rename|truncate|appendFile|chmod|chown|utimes|copyFile)\(|flock|lockfile|proper-lockfile|O_APPEND/);
    expect(operations.match(/fs\.open\(/g)).toHaveLength(1);
    expect(operations).toMatch(/fs\.open\(path\.join\(dir, name\), 'wx', 0o600\)/);
  });
  it('reads the environment in one default parameter only and never for activation', () => {
    const profile = read('src/lib/server/receipt-operation-profile.ts');
    expect(profile.match(/process\.env/g)).toHaveLength(1);
    expect(profile).toMatch(/env: Record<string, string \| undefined> = process\.env/);
    expect(read('src/lib/artifacts-receipt-operation-contract.ts')).not.toMatch(/process\.env/);
    expect(controlledProof()).not.toMatch(/process\.env/);
  });
});
