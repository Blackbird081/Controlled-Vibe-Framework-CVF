import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOUND_EFFECT, boundAttemptIdFor, boundDisclosureOf, boundOperationKey, buildBoundEnvelope, type BoundConfigInput } from '../artifacts-bound-receipt-contract';
import { createBoundReceiptFixtureProfile, type BoundFixtureProfileInput } from './bound-receipt-profile';
import { decideReceiptOperationRoute, resolveReceiptOperation, type ReceiptOperationPosture } from './receipt-operation-profile';
import type { WireSend } from './bound-receipt-transport';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const ROOT = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-authority-repair-20261020', 'worker', 'roots', 'profile-unit');
const CONFIG: BoundConfigInput = { policyRevision: 'fixture-policy-r1', transformRevision: 'fixture-transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store',
  authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100',
  instanceId: '123e4567-e89b-42d3-a456-426614174000', storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 };
const bundle = (patch: Record<string, unknown> = {}) => ({ authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture',
  hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(32, 1) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 2) } }, ...patch });
const never: WireSend = async () => { throw new Error('no transport expected'); };
const input = (patch: Partial<BoundFixtureProfileInput> = {}): BoundFixtureProfileInput => ({ root: ROOT, config: CONFIG, keyBundle: bundle(), webSend: never, engineSend: never, ...patch });
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };

describe('typed fixture profile factory', () => {
  it('issues a frozen non-production fixture profile whose config and store are server-owned', () => {
    const profile = createBoundReceiptFixtureProfile(input());
    expect(profile.kind).toBe('BOUND_ENGINE_RECEIPT_FIXTURE');
    expect(profile.effect).toBe(BOUND_EFFECT);
    expect(profile.production).toBe(false);
    expect(profile.identityTrust).toBe('AUTHENTICATED_DEPLOYMENT_BINDING');
    expect(profile.store).toEqual({ kind: 'local-synthetic', root: ROOT, production: false, jobDecisions: true, boundReceiptOperations: true });
    expect(profile.config.instanceId).toBe(CONFIG.instanceId);
    expect(profile.timeoutMs).toBe(4000);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.config)).toBe(true);
    expect(Object.isFrozen(profile.store)).toBe(true);
    expect(Object.isFrozen(profile.webContext)).toBe(true);
    expect(profile.disclosure()).toEqual(boundDisclosureOf(profile.config));
  });
  it('refuses every invalid root, sender, config or key bundle and constructs nothing', () => {
    const bad: Array<[string, Partial<BoundFixtureProfileInput>]> = [
      ['relative root', { root: 'relative/root' }], ['filesystem root', { root: path.parse(ROOT).root }], ['unc root', { root: '\\\\server\\share\\root' }],
      ['non-normalized root', { root: `${ROOT}${path.sep}..${path.sep}profile-unit` }], ['missing web sender', { webSend: undefined as unknown as WireSend }],
      ['missing engine sender', { engineSend: 'x' as unknown as WireSend }], ['bad clock', { now: 5 as unknown as () => number }],
      ['real origin', { config: { ...CONFIG, engineOrigin: 'http://example.com:8100' } }], ['default port', { config: { ...CONFIG, webOrigin: 'http://web.invalid:80' } }],
      ['short timeout', { config: { ...CONFIG, timeoutMs: 10 } }], ['not an object', { keyBundle: 'secret' }], ['null bundle', { keyBundle: null }],
      ['auth reference mismatch', { keyBundle: bundle({ authReference: 'other-bundle' }) }], ['scope mismatch', { keyBundle: bundle({ authScope: 'other' }) }],
      ['extra bundle field', { keyBundle: bundle({ extra: true }) }], ['missing hop', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(32, 1) } } }) }],
      ['unknown hop', { keyBundle: bundle({ hops: { ...bundle().hops, OTHER: { keyReference: 'k', key: Buffer.alloc(32, 3) } } }) }],
      ['same key reference', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'same-ref', key: Buffer.alloc(32, 1) }, PROXY_ENGINE: { keyReference: 'same-ref', key: Buffer.alloc(32, 2) } } }) }],
      ['same key bytes', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(32, 7) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 7) } } }) }],
      ['weak key', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(31, 1) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 2) } } }) }],
      ['string key', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: 'a'.repeat(32) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 2) } } }) }],
      ['bad key reference', { keyBundle: bundle({ hops: { EXPORT_PROXY: { keyReference: 'bad ref', key: Buffer.alloc(32, 1) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 2) } } }) }],
    ];
    for (const [name, patch] of bad) expect(() => createBoundReceiptFixtureProfile(input(patch)), name).toThrow('BOUND_PROFILE_INVALID');
    expect(() => createBoundReceiptFixtureProfile(null as unknown as BoundFixtureProfileInput)).toThrow('BOUND_PROFILE_INVALID');
  });
  it('clones key bytes at capture, keeps them private and never exports secrets or private paths', () => {
    const keys = bundle();
    const profile = createBoundReceiptFixtureProfile(input({ keyBundle: keys }));
    const ring = profile.webContext.keyring;
    const before = ring.sign('EXPORT_PROXY', 'REQUEST', profile.config.proxyPath, Buffer.from('{}'), 1_760_000_000_000, 'a'.repeat(64)).headers['x-cvf-bound-signature'];
    keys.hops.EXPORT_PROXY.key.fill(9);
    keys.hops.EXPORT_PROXY.keyReference = 'tampered';
    const after = ring.sign('EXPORT_PROXY', 'REQUEST', profile.config.proxyPath, Buffer.from('{}'), 1_760_000_000_000, 'a'.repeat(64)).headers['x-cvf-bound-signature'];
    expect(after).toBe(before);
    const dump = JSON.stringify({ profile, context: profile.webContext, disclosure: profile.disclosure() });
    expect(dump).not.toContain('key-export-1');
    expect(dump).not.toContain('key-engine-1');
    expect(dump).not.toMatch(/"data":\[1,1,1/);
    expect(dump).not.toMatch(/\.sqlite/i);
    expect(Object.keys(ring).sort()).toEqual(['authReference', 'authScope', 'sign', 'verify']);
  });
  it('creates one distinct invoker per operation envelope', () => {
    const profile = createBoundReceiptFixtureProfile(input());
    const requestSha256 = sha('request');
    const key = boundOperationKey({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256 })!;
    const envelope = buildBoundEnvelope({ owner, sourceRecordId: 'ncr-synthetic-1', requestSha256, jobId: '123e4567-e89b-42d3-a456-426614174001', versionId: null,
      attemptId: boundAttemptIdFor(key), payloadSha256: sha('p'), config: profile.config, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('s'),
        htmlSha256: sha('h'), artifactId: 'receipt-anchor', filename: 'review.html' } })!;
    const first = profile.createInvoker(envelope);
    expect(typeof first).toBe('function');
    expect(profile.createInvoker(envelope)).not.toBe(first);
    expect(profile.counters).toEqual({ invokerCalls: 0, challengeSent: 0, evaluateSent: 0, proxyRequests: 0, engineChallengeSends: 0, engineEvaluateSends: 0 });
    const mismatched = { ...envelope, config: { ...envelope.config, storeBindingId: 'cd'.repeat(32) } };
    expect(() => profile.createInvoker(mismatched)).toThrow('BOUND_ENVELOPE_AUTHORITY_MISMATCH');
  });
});

describe('held activation and default denial (BC09)', () => {
  const profile = createBoundReceiptFixtureProfile(input());
  it('never resolves a bound posture from the environment: absent, declared and production values all deny or stay undeclared', () => {
    expect(resolveReceiptOperation({})).toEqual({ posture: 'UNDECLARED' });
    for (const declared of ['BOUND_ENGINE_RECEIPT', 'INJECTED_SYNTHETIC_RECEIPT', 'BOUND_CONTROLLED', 'CONTROLLED', 'true', '1', '']) {
      const resolved = resolveReceiptOperation({ CVF_NCR_RECEIPT_OPERATION_PROFILE: declared, CVF_NCR_BOUND_ENGINE_ORIGIN: 'http://engine.invalid:8100', CVF_SERVICE_TOKEN: 'x' });
      expect(resolved.posture, declared).toBe('DENY');
    }
    expect(resolveReceiptOperation({ CVF_NCR_RECEIPT_OPERATION_PROFILE: 'BOUND_ENGINE_RECEIPT' })).toEqual({ posture: 'DENY', reason: 'ACTIVATION_HELD_UNSUPPORTED' });
    expect(resolveReceiptOperation({ CVF_NCR_RECEIPT_OPERATION_PROFILE: 'BOUND_ENGINE_RECEIPT', NODE_ENV: 'production' })).toEqual({ posture: 'DENY', reason: 'PRODUCTION_DENIED' });
    expect(resolveReceiptOperation({ NODE_ENV: 'production' })).toEqual({ posture: 'UNDECLARED' });
  });
  it('routes the injected bound posture only with a valid selector and never falls back to legacy', () => {
    const posture: ReceiptOperationPosture = { posture: 'BOUND_CONTROLLED', profile };
    expect(decideReceiptOperationRoute({ posture, selectors: 'VALID', localProfilePresent: false })).toEqual({ route: 'BOUND', profile });
    expect(decideReceiptOperationRoute({ posture, selectors: 'VALID', localProfilePresent: true })).toEqual({ route: 'BOUND', profile });
    const copy = { ...profile };
    expect(decideReceiptOperationRoute({ posture: { posture: 'BOUND_CONTROLLED', profile: copy }, selectors: 'VALID', localProfilePresent: false }))
      .toEqual({ route: 'DENY', reason: 'BOUND_PROFILE_UNISSUED', status: 403 });
    expect(decideReceiptOperationRoute({ posture, selectors: 'NONE', localProfilePresent: false })).toEqual({ route: 'DENY', reason: 'SELECTOR_REQUIRED', status: 400 });
    expect(decideReceiptOperationRoute({ posture, selectors: 'INVALID', localProfilePresent: false })).toEqual({ route: 'DENY', reason: 'SELECTOR_INVALID', status: 400 });
    expect(decideReceiptOperationRoute({ posture: { posture: 'DENY', reason: 'DISABLED' }, selectors: 'VALID', localProfilePresent: false }).route).toBe('DENY');
    expect(decideReceiptOperationRoute({ posture: { posture: 'UNDECLARED' }, selectors: 'VALID', localProfilePresent: false })).toEqual({ route: 'DENY', reason: 'SELECTORS_WITHOUT_PROFILE', status: 403 });
    expect(decideReceiptOperationRoute({ posture: { posture: 'BOGUS' } as unknown as ReceiptOperationPosture, selectors: 'VALID', localProfilePresent: false }).route).toBe('DENY');
  });
});
