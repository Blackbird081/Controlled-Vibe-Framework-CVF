import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { WIRE_SCHEMA, boundAttemptIdFor, boundEnvelopeSha256, boundOperationKey, boundRequestSha256, buildBoundEnvelope, canonicalBytes, makeBoundConfig, parseCanonicalJson,
  parseEvaluateResult, parseWireRequest, type BoundConfig, type BoundConfigInput, type BoundHop, type BoundMessageKind } from '../artifacts-bound-receipt-contract';
import type { ControlledEvaluateRequest } from '../artifacts-receipt-operation-contract';
import { createBoundReceiptHandlers } from './bound-receipt-api';
import { createBoundReceiptFixtureProfile } from './bound-receipt-profile';
import { BoundTransportError, EXPECTED_ACTION, checkChallengeResult, checkEvaluateResult, createDeadline, createKeyring, sendBounded, transportReason, type Keyring,
  type WireRequest, type WireResponse, type WireSend } from './bound-receipt-transport';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const NOW = 1_760_000_000_000;
const ROOT = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-authority-repair-20261020', 'worker', 'roots', 'transport-unit');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const CONFIG_INPUT: BoundConfigInput = { policyRevision: 'fixture-policy-r1', transformRevision: 'fixture-transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store',
  authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100',
  instanceId: '123e4567-e89b-42d3-a456-426614174000', storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 };
const config = makeBoundConfig(CONFIG_INPUT)!;
const keyBundle = (seed = 1) => ({ authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture',
  hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(32, seed) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, seed + 1) } } });
const ringOf = (seed = 1): Keyring => createKeyring(keyBundle(seed), config)!;
const body = Buffer.from('{"a":1}');
const nonceOf = (n: number) => n.toString(16).padStart(64, '0');
const headersOf = (signed: { headers: Record<string, string> }) => new Headers(signed.headers);

describe('keyring: signature, hop, freshness and replay (BC04)', () => {
  const path1 = config.proxyPath;
  it('verifies a signed message exactly once and rejects a replay', () => {
    const ring = ringOf();
    const signed = ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW);
    const ok = ring.verify({ hop: 'EXPORT_PROXY', kind: 'REQUEST', path: path1 }, headersOf(signed), body, NOW);
    expect(ok).toEqual({ ok: true, nonce: signed.nonce, timestampMs: NOW });
    expect(ring.verify({ hop: 'EXPORT_PROXY', kind: 'REQUEST', path: path1 }, headersOf(signed), body, NOW)).toEqual({ ok: false, reason: 'REPLAY' });
  });
  it('refuses a tampered body, path, hop, kind, config, key, stale or future timestamp and missing or duplicate headers', () => {
    const ring = ringOf();
    const expect1: { hop: BoundHop; kind: BoundMessageKind; path: string } = { hop: 'EXPORT_PROXY', kind: 'REQUEST', path: path1 };
    const fresh = () => ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW);
    const check = (headers: Headers, over: Partial<typeof expect1> = {}, payload: Uint8Array = body, now = NOW) => ring.verify({ ...expect1, ...over }, headers, payload, now);
    expect(check(headersOf(fresh()), {}, Buffer.from('{"a":2}'))).toEqual({ ok: false, reason: 'SIGNATURE' });
    expect(check(headersOf(fresh()), { path: `${path1}/x` })).toEqual({ ok: false, reason: 'SIGNATURE' });
    expect(check(headersOf(fresh()), { hop: 'PROXY_ENGINE' })).toEqual({ ok: false, reason: 'HOP_KIND' });
    expect(check(headersOf(fresh()), { kind: 'RESPONSE' })).toEqual({ ok: false, reason: 'HOP_KIND' });
    const other = fresh(); other.headers['x-cvf-bound-config'] = 'f'.repeat(64);
    expect(check(headersOf(other))).toEqual({ ok: false, reason: 'CONFIG' });
    expect(check(headersOf(ringOf(5).sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW)))).toEqual({ ok: false, reason: 'SIGNATURE' });
    expect(check(headersOf(fresh()), {}, body, NOW + 30_001)).toEqual({ ok: false, reason: 'EXPIRED' });
    expect(check(headersOf(ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW + 1_001)))).toEqual({ ok: false, reason: 'EXPIRED' });
    expect(check(headersOf(ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW - 30_001)))).toEqual({ ok: false, reason: 'EXPIRED' });
    const missing = fresh(); delete missing.headers['x-cvf-bound-signature'];
    expect(check(headersOf(missing))).toEqual({ ok: false, reason: 'MALFORMED_AUTH' });
    const dup = headersOf(fresh()); dup.append('x-cvf-bound-nonce', 'c'.repeat(64));
    expect(check(dup)).toEqual({ ok: false, reason: 'MALFORMED_AUTH' });
    // A failed verification must not consume the nonce.
    const reused = ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW, 'd'.repeat(64));
    expect(check(headersOf(reused), {}, Buffer.from('{"a":3}'))).toEqual({ ok: false, reason: 'SIGNATURE' });
    expect(check(headersOf(reused)).ok).toBe(true);
  });
  it('bounds replay memory at 1024 entries and denies when full', () => {
    const ring = ringOf();
    const expectation = { hop: 'EXPORT_PROXY', kind: 'REQUEST', path: path1 } as const;
    for (let i = 1; i <= 1024; i += 1) expect(ring.verify(expectation, headersOf(ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW, nonceOf(i))), body, NOW).ok).toBe(true);
    expect(ring.verify(expectation, headersOf(ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW, nonceOf(5000))), body, NOW)).toEqual({ ok: false, reason: 'REPLAY_CAPACITY' });
    // After the accepted window passes, old entries can no longer replay and are released.
    expect(ring.verify(expectation, headersOf(ring.sign('EXPORT_PROXY', 'REQUEST', path1, body, NOW + 40_000, nonceOf(5001))), body, NOW + 40_000).ok).toBe(true);
  });
  it('creates a keyring only from a matching two-hop bundle', () => {
    expect(createKeyring(keyBundle(), { ...config, authReference: 'other' })).toBeNull();
    expect(createKeyring(keyBundle(), { ...config, authScope: 'other' })).toBeNull();
    expect(createKeyring(null, config)).toBeNull();
    expect(createKeyring({ ...keyBundle(), extra: 1 }, config)).toBeNull();
    expect(Object.isFrozen(ringOf())).toBe(true);
  });
});

describe('deadline and bounded send', () => {
  const request = { origin: 'http://web.invalid:3000', method: 'POST' as const, path: '/p', headers: {}, body: Buffer.from('x') };
  const okResponse = (patch: Partial<WireResponse> = {}): WireResponse => ({ status: 200, headers: new Headers(), body: Buffer.from('{}'), ...patch });
  const run = (response: WireSend, deadline = createDeadline(1000)) => sendBounded(response, request, deadline, 100).finally(() => deadline.dispose());
  it('uses one monotonic budget even if the signing wall clock jumps', () => {
    const deadline = createDeadline(1000);
    const before = deadline.remainingMs();
    const wall = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 3_600_000);
    try { expect(deadline.remainingMs()).toBeLessThanOrEqual(before); expect(deadline.remainingMs()).toBeGreaterThan(0); }
    finally { wall.mockRestore(); deadline.dispose(); }
  });
  it('accepts one in-limit 200 response and refuses redirect, status, empty, oversize and sender failure', async () => {
    await expect(run(async () => okResponse())).resolves.toMatchObject({ status: 200 });
    await expect(run(async () => okResponse({ redirected: true }))).rejects.toMatchObject({ code: 'REDIRECT' });
    await expect(run(async () => okResponse({ status: 302 }))).rejects.toMatchObject({ code: 'REDIRECT' });
    await expect(run(async () => okResponse({ status: 404 }))).rejects.toMatchObject({ code: 'STATUS' });
    await expect(run(async () => okResponse({ body: Buffer.alloc(0) }))).rejects.toMatchObject({ code: 'OVERSIZE' });
    await expect(run(async () => okResponse({ body: Buffer.alloc(101) }))).rejects.toMatchObject({ code: 'OVERSIZE' });
    await expect(run(async () => { throw new Error('boom'); })).rejects.toMatchObject({ code: 'SEND_FAILED' });
  });
  it('never calls the sender after an abort or an expired deadline, and a hung sender hits the single deadline', async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const counted: WireSend = async () => { calls += 1; return okResponse(); };
    await expect(run(counted, createDeadline(1000, controller.signal))).rejects.toMatchObject({ code: 'ABORTED' });
    expect(calls).toBe(0);
    const started = Date.now();
    await expect(run(() => new Promise<WireResponse>(() => undefined), createDeadline(40))).rejects.toMatchObject({ code: 'TIMED_OUT' });
    expect(Date.now() - started).toBeLessThan(900);
    expect(transportReason(new BoundTransportError('TIMED_OUT'))).toBe('TIMED_OUT');
    expect(transportReason(new BoundTransportError('bad code!'))).toBe('INVOKER_ERROR');
    expect(transportReason(new Error('x'))).toBe('INVOKER_ERROR');
  });
});

// ---- A hostile-capable fake engine and the real Web handler, joined through the real profile and invoker. ----
interface EngineHooks { mutate?: (kind: 'CHALLENGE_RESULT' | 'EVALUATE_RESULT', result: Record<string, unknown>) => unknown; ring?: Keyring; decision?: string; engineRisk?: string }
function fakeEngine(ring: Keyring, cfg: BoundConfig, now: () => number, hooks: EngineHooks, log: string[]): WireSend {
  return async (req: WireRequest) => {
    log.push(req.path.endsWith('challenge') ? 'CHALLENGE' : 'EVALUATE');
    const verified = ring.verify({ hop: 'PROXY_ENGINE', kind: 'REQUEST', path: req.path }, new Headers(req.headers), req.body, now());
    const parsed = verified.ok ? parseCanonicalJson(req.body, 16_384) : null;
    const wire = parsed && parsed.ok ? parseWireRequest(parsed.value) : null;
    if (!verified.ok || !wire) return { status: 401, headers: new Headers(), body: Buffer.from('{}') };
    const decision = hooks.decision ?? 'ALLOW';
    const risk = hooks.engineRisk ?? 'R0';
    const result: Record<string, unknown> = wire.kind === 'CHALLENGE'
      ? { schema: WIRE_SCHEMA, kind: 'CHALLENGE_RESULT', requestNonce: verified.nonce, challengeNonce: wire.challengeNonce, configDigest: cfg.configDigest, instanceId: cfg.instanceId,
        storeBindingId: cfg.storeBindingId, backend: 'SQLITE', policyRevision: cfg.policyRevision, expiresAtMs: now() + 5000 }
      : { schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: verified.nonce, operationKey: wire.operationKey, attemptId: wire.attemptId, artifactId: wire.artifactId,
        payloadSha256: wire.payloadSha256, envelopeSha256: wire.envelopeSha256, owner: wire.owner, configDigest: cfg.configDigest, instanceId: cfg.instanceId,
        storeBindingId: cfg.storeBindingId, declaredRisk: 'R1', engineRiskLevel: risk, ledgerReference: { requestId: wire.attemptId, blockHash: sha(`block-${wire.attemptId}`) },
        report: { request_summary: { request_id: wire.attemptId, artifact_id: wire.artifactId }, decision_analysis: { final_decision: decision },
          cvf_enforcement: { action: EXPECTED_ACTION[decision] }, cvf_risk_level: risk, report_metadata: { generated_at: '2026-10-19T01:00:01.000000' },
          integrity: { has_ledger_reference: true } }, executionRecord: { final_decision: decision, ledger_attached: true } };
    const changed = hooks.mutate ? hooks.mutate(result.kind as 'CHALLENGE_RESULT' | 'EVALUATE_RESULT', result) : result;
    const bytes = ArrayBuffer.isView(changed) ? Buffer.from(changed.buffer, changed.byteOffset, changed.byteLength) : canonicalBytes(changed);
    const signed = (hooks.ring ?? ring).sign('PROXY_ENGINE', 'RESPONSE', req.path, bytes, now());
    return { status: 200, headers: new Headers(signed.headers), body: bytes };
  };
}
type Phase = 'CHALLENGE' | 'EVALUATE';
type WebHook = (response: WireResponse, request: WireRequest, phase: Phase) => WireResponse | Promise<WireResponse>;
function kit(hooks: EngineHooks = {}, webHook?: WebHook, clock = { t: NOW }) {
  const log: string[] = [];
  const trace = { text: '' };
  const late: { handlers?: ReturnType<typeof createBoundReceiptHandlers>; engine?: WireSend } = {};
  const now = () => clock.t;
  const profile = createBoundReceiptFixtureProfile({ root: ROOT, config: CONFIG_INPUT, keyBundle: keyBundle(), now, engineSend: req => late.engine!(req), webSend: async req => {
    const response = await late.handlers!.POST(new Request(`${req.origin}${req.path}`, { method: req.method,
      headers: req.headers, body: req.body as unknown as BodyInit }), req.deadline);
    const bytes = new Uint8Array(await response.arrayBuffer());
    trace.text = Buffer.from(bytes).toString('ascii');
    const phase: Phase = trace.text.length > 0 && Buffer.from(req.body).toString('ascii').includes('"kind":"EVALUATE"') ? 'EVALUATE' : 'CHALLENGE';
    const wireResponse: WireResponse = { status: response.status, headers: response.headers, body: bytes };
    return webHook ? webHook(wireResponse, req, phase) : wireResponse;
  } });
  late.handlers = createBoundReceiptHandlers({ context: profile.webContext });
  late.engine = fakeEngine(profile.webContext.keyring, profile.config, now, hooks, log);
  return { profile, log, trace, ring: profile.webContext.keyring, clock };
}
function operation(cfg: BoundConfig, index = 1, mutateRequest: (r: ControlledEvaluateRequest) => ControlledEvaluateRequest = r => r) {
  const requestSha256 = sha(`request-${index}`);
  const key = boundOperationKey({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256 })!;
  const attemptId = boundAttemptIdFor(key);
  const request: ControlledEvaluateRequest = { request_id: attemptId, artifact_id: 'receipt-anchor', payload: { content: `Heading ${String.fromCharCode(0xe9)}` }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' };
  const envelope = buildBoundEnvelope({ owner, sourceRecordId: `ncr-synthetic-${index}`, requestSha256, jobId: '123e4567-e89b-42d3-a456-426614174001', versionId: null, attemptId,
    payloadSha256: boundRequestSha256(request), config: cfg, output: { generatedAt: '2026-10-19T01:00:00.000Z', sourceHash: sha('s'), htmlSha256: sha('h'), artifactId: 'receipt-anchor',
      filename: 'review.html' } })!;
  return { envelope, request: mutateRequest(request) };
}
const invoke = (k: ReturnType<typeof kit>, mutateRequest?: (r: ControlledEvaluateRequest) => ControlledEvaluateRequest) => {
  const { envelope, request } = operation(k.profile.config, 1, mutateRequest);
  return k.profile.createInvoker(envelope)(request, new AbortController().signal);
};
const forge = (ring: Keyring, response: WireResponse, patch: Record<string, unknown>, at = NOW): WireResponse => {
  const parsed = parseCanonicalJson(response.body, 40_000);
  const bytes = canonicalBytes({ ...(parsed.ok ? parsed.value as Record<string, unknown> : {}), ...patch });
  return { status: 200, headers: new Headers(ring.sign('EXPORT_PROXY', 'RESPONSE', config.proxyPath, bytes, at).headers), body: bytes };
};
const COUNTS_C = { invokerCalls: 1, challengeSent: 1, evaluateSent: 0, proxyRequests: 1, engineChallengeSends: 1, engineEvaluateSends: 0 };
const COUNTS_E = { invokerCalls: 1, challengeSent: 1, evaluateSent: 1, proxyRequests: 2, engineChallengeSends: 1, engineEvaluateSends: 1 };

describe('invoker through the real Web handler and a fake engine', () => {
  it('performs exactly one signed challenge and one signed evaluate and returns the joined result', async () => {
    const k = kit();
    const result = await invoke(k);
    expect(result.kind).toBe('EVALUATE_RESULT');
    expect(result.engineRiskLevel).toBe('R0');
    expect(result.declaredRisk).toBe('R1');
    expect(k.profile.counters).toEqual(COUNTS_E);
    expect(k.log).toEqual(['CHALLENGE', 'EVALUATE']);
    expect(parseEvaluateResult(JSON.parse(JSON.stringify(result)))).toEqual(result);
  });
  const stale = '12345678-1234-4234-8234-123456789abc';
  const engineCases: Array<[string, 'C' | 'E', EngineHooks, string]> = [
    ['challenge store mismatch', 'C', { mutate: (_k, r) => ({ ...r, storeBindingId: 'cd'.repeat(32) }) }, 'ENGINE_CHALLENGE_STORE_MISMATCH'],
    ['challenge instance mismatch', 'C', { mutate: (_k, r) => ({ ...r, instanceId: stale }) }, 'ENGINE_CHALLENGE_INSTANCE_MISMATCH'],
    ['challenge request nonce', 'C', { mutate: (_k, r) => ({ ...r, requestNonce: 'e'.repeat(64) }) }, 'ENGINE_CHALLENGE_NONCE_MISMATCH'],
    ['challenge nonce echo', 'C', { mutate: (_k, r) => ({ ...r, challengeNonce: 'e'.repeat(64) }) }, 'ENGINE_CHALLENGE_CHALLENGE_MISMATCH'],
    ['challenge over-long expiry', 'C', { mutate: (_k, r) => ({ ...r, expiresAtMs: NOW + 7000 }) }, 'ENGINE_CHALLENGE_CHALLENGE_EXPIRY'],
    ['challenge config digest', 'C', { mutate: (_k, r) => ({ ...r, configDigest: 'f'.repeat(64) }) }, 'ENGINE_CHALLENGE_CONFIG_MISMATCH'],
    ['challenge extra field', 'C', { mutate: (_k, r) => ({ ...r, extra: 1 }) }, 'ENGINE_CHALLENGE_SHAPE'],
    ['engine signed with another key', 'C', { ring: ringOf(7) }, 'ENGINE_SIGNATURE'],
    ['engine non-canonical body', 'C', { mutate: (_k, r) => Buffer.from(JSON.stringify(r, null, 1)) }, 'ENGINE_BODY'],
    ['evaluate request nonce', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, requestNonce: 'e'.repeat(64) } : r) }, 'ENGINE_EVALUATE_NONCE_MISMATCH'],
    ['evaluate wrong ledger request id', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, ledgerReference: { requestId: 'other-attempt-id', blockHash: sha('b') } } : r) }, 'ENGINE_EVALUATE_REPORT_JOIN_MISMATCH'],
    ['evaluate payload digest', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, payloadSha256: sha('other') } : r) }, 'ENGINE_EVALUATE_REQUEST_JOIN_MISMATCH'],
    ['evaluate owner', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, owner: { ...owner, userId: 'u2' } } : r) }, 'ENGINE_EVALUATE_REQUEST_JOIN_MISMATCH'],
    ['evaluate store', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, storeBindingId: 'cd'.repeat(32) } : r) }, 'ENGINE_EVALUATE_STORE_MISMATCH'],
    ['evaluate action does not match decision', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, report: { ...(r.report as object), cvf_enforcement: { action: 'BLOCK' } } } : r) }, 'ENGINE_EVALUATE_DECISION_JOIN_MISMATCH'],
    ['evaluate declared risk', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, declaredRisk: 'R0' } : r) }, 'ENGINE_EVALUATE_SHAPE'],
    ['evaluate engine risk disagrees with report', 'E', { mutate: (k, r) => (k === 'EVALUATE_RESULT' ? { ...r, engineRiskLevel: 'R2' } : r) }, 'ENGINE_EVALUATE_REPORT_JOIN_MISMATCH'],
  ];
  it.each(engineCases)('%s is refused at the proxy with no further send', async (_name, stage, hooks, code) => {
    const k = kit(hooks);
    await expect(invoke(k)).rejects.toMatchObject({ code: 'STATUS' });
    expect(JSON.parse(k.trace.text).error).toBe(code);
    expect(k.profile.counters).toEqual(stage === 'C' ? COUNTS_C : COUNTS_E);
    expect(k.log).toEqual(stage === 'C' ? ['CHALLENGE'] : ['CHALLENGE', 'EVALUATE']);
  });
  it('refuses a request that no longer joins its envelope before any send', async () => {
    const k = kit();
    await expect(invoke(k, r => ({ ...r, request_id: 'ncr-bound-other-attempt' }))).rejects.toMatchObject({ code: 'REQUEST_JOIN_MISMATCH' });
    await expect(invoke(k, r => ({ ...r, payload: { content: 'altered' } }))).rejects.toMatchObject({ code: 'REQUEST_JOIN_MISMATCH' });
    expect(k.profile.counters).toMatchObject({ invokerCalls: 2, challengeSent: 0, evaluateSent: 0, proxyRequests: 0 });
    expect(k.log).toEqual([]);
  });
  it('does not call the sender when the abort signal is already set', async () => {
    const k = kit();
    const { envelope, request } = operation(k.profile.config);
    const controller = new AbortController();
    controller.abort();
    await expect(k.profile.createInvoker(envelope)(request, controller.signal)).rejects.toMatchObject({ code: 'ABORTED' });
    expect(k.profile.counters).toMatchObject({ invokerCalls: 1, challengeSent: 0 });
  });
  const webCases: Array<[string, Phase, WebHook, string]> = [
    ['tampered challenge body', 'CHALLENGE', res => ({ ...res, body: Buffer.concat([res.body, Buffer.from(' ')]) }), 'RESPONSE_SIGNATURE'],
    ['tampered evaluate body', 'EVALUATE', res => ({ ...res, body: Buffer.from(res.body).fill(0x20, 2, 3) }), 'RESPONSE_SIGNATURE'],
    ['redirect flag', 'CHALLENGE', res => ({ ...res, redirected: true }), 'REDIRECT'],
    ['redirect status', 'EVALUATE', res => ({ ...res, status: 302 }), 'REDIRECT'],
    ['server error', 'CHALLENGE', res => ({ ...res, status: 500 }), 'STATUS'],
    ['empty body', 'EVALUATE', res => ({ ...res, body: Buffer.alloc(0) }), 'OVERSIZE'],
    ['oversize body', 'CHALLENGE', res => ({ ...res, body: Buffer.alloc(33_000, 0x20) }), 'OVERSIZE'],
    ['sender failure', 'CHALLENGE', () => { throw new Error('connection reset'); }, 'SEND_FAILED'],
  ];
  it.each(webCases)('%s becomes a transport failure with no replay or second evaluate', async (_name, phase, hook, code) => {
    const k = kit({}, (res, req, p) => (p === phase ? hook(res, req, p) : res));
    await expect(invoke(k)).rejects.toMatchObject({ code });
    expect(k.profile.counters.evaluateSent).toBe(phase === 'CHALLENGE' ? 0 : 1);
    expect(k.profile.counters.invokerCalls).toBe(1);
  });
  it('rejects a replayed response, a response signed for another hop and a stale challenge', async () => {
    let first: WireResponse | undefined;
    const replay = kit({}, (res, _req, phase) => { if (phase === 'CHALLENGE') { first = res; return res; } return first!; });
    await expect(invoke(replay)).rejects.toMatchObject({ code: 'RESPONSE_REPLAY' });
    const hop = kit({}, (res, _req, phase) => (phase === 'CHALLENGE'
      ? { ...res, headers: new Headers(replay.ring.sign('PROXY_ENGINE', 'RESPONSE', config.proxyPath, res.body, NOW).headers) } : res));
    await expect(invoke(hop)).rejects.toMatchObject({ code: 'RESPONSE_HOP_KIND' });
    const clock = { t: NOW };
    const slow = kit({}, (res, _req, phase) => { if (phase === 'CHALLENGE') clock.t = NOW + 6000; return res; }, clock);
    await expect(invoke(slow)).rejects.toMatchObject({ code: 'CHALLENGE_STALE' });
    expect(slow.profile.counters.evaluateSent).toBe(0);
  });
  const forged: Array<[string, Phase, Record<string, unknown>, string]> = [
    ['challenge store', 'CHALLENGE', { storeBindingId: 'cd'.repeat(32) }, 'CHALLENGE_STORE_MISMATCH'],
    ['challenge instance', 'CHALLENGE', { instanceId: stale }, 'CHALLENGE_INSTANCE_MISMATCH'],
    ['challenge response nonce', 'CHALLENGE', { requestNonce: 'f'.repeat(64) }, 'CHALLENGE_NONCE_MISMATCH'],
    ['challenge policy', 'CHALLENGE', { policyRevision: 'other-policy' }, 'CHALLENGE_CONFIG_MISMATCH'],
    ['challenge shape', 'CHALLENGE', { backend: 'JSON' }, 'CHALLENGE_BODY'],
    ['evaluate operation key', 'EVALUATE', { operationKey: 'e'.repeat(64) }, 'EVALUATE_REQUEST_JOIN_MISMATCH'],
    ['evaluate response nonce', 'EVALUATE', { requestNonce: 'f'.repeat(64) }, 'EVALUATE_NONCE_MISMATCH'],
    ['evaluate artifact', 'EVALUATE', { artifactId: 'other-artifact' }, 'EVALUATE_REQUEST_JOIN_MISMATCH'],
    ['evaluate shape', 'EVALUATE', { declaredRisk: 'R0' }, 'EVALUATE_BODY'],
  ];
  it.each(forged)('a validly signed but wrongly joined %s response is refused by the invoker itself', async (_name, phase, patch, code) => {
    const k = kit({}, (res, _req, p) => (p === phase ? forge(k.ring, res, patch) : res));
    await expect(invoke(k)).rejects.toMatchObject({ code });
  });
  it('turns a hung sender into the single TIMED_OUT outcome without a second evaluate', async () => {
    const k = kit({}, (_res, _req, phase) => (phase === 'EVALUATE' ? new Promise<WireResponse>(() => undefined) : _res));
    const started = Date.now();
    await expect(invoke(k)).rejects.toMatchObject({ code: 'TIMED_OUT' });
    expect(Date.now() - started).toBeLessThan(5000);
    expect(k.profile.counters.evaluateSent).toBe(1);
  }, 15_000);
});

describe('joins are exact', () => {
  it('rejects every drifted challenge and evaluate result field', () => {
    const wire = parseWireRequest({ schema: WIRE_SCHEMA, kind: 'CHALLENGE', owner, operationKey: 'a'.repeat(64), attemptId: 'ncr-bound-attempt-1', configDigest: config.configDigest, challengeNonce: 'b'.repeat(64) })!;
    if (wire.kind !== 'CHALLENGE') throw new Error('unexpected wire');
    const result = { schema: WIRE_SCHEMA, kind: 'CHALLENGE_RESULT' as const, requestNonce: 'c'.repeat(64), challengeNonce: wire.challengeNonce, configDigest: config.configDigest,
      instanceId: config.instanceId, storeBindingId: config.storeBindingId, backend: 'SQLITE' as const, policyRevision: config.policyRevision, expiresAtMs: NOW + 5000 };
    const seen = { sentAtMs: NOW, receivedAtMs: NOW };
    expect(checkChallengeResult(result, wire, config, 'c'.repeat(64), seen)).toBeNull();
    expect(checkChallengeResult({ ...result, expiresAtMs: NOW + 6001 }, wire, config, 'c'.repeat(64), seen)).toBe('CHALLENGE_EXPIRY');
    expect(checkChallengeResult({ ...result, expiresAtMs: NOW - 30_000 }, wire, config, 'c'.repeat(64), seen)).toBe('CHALLENGE_EXPIRY');
    expect(checkChallengeResult(result, wire, config, 'd'.repeat(64), seen)).toBe('NONCE_MISMATCH');
    const evaluateOk = parseEvaluateResult({ schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: 'c'.repeat(64), operationKey: 'a'.repeat(64), attemptId: 'ncr-bound-attempt-1',
      artifactId: 'receipt-anchor', payloadSha256: sha('p'), envelopeSha256: sha('e'), owner, configDigest: config.configDigest, instanceId: config.instanceId,
      storeBindingId: config.storeBindingId, declaredRisk: 'R1', engineRiskLevel: 'R1', ledgerReference: { requestId: 'ncr-bound-attempt-1', blockHash: sha('b') },
      report: { request_summary: { request_id: 'ncr-bound-attempt-1', artifact_id: 'receipt-anchor' }, decision_analysis: { final_decision: 'DENY' }, cvf_enforcement: { action: 'BLOCK' },
        cvf_risk_level: 'R1', report_metadata: { generated_at: 'x' }, integrity: { has_ledger_reference: true } }, executionRecord: { final_decision: 'DENY', ledger_attached: true } })!;
    const expectation = { operationKey: 'a'.repeat(64), attemptId: 'ncr-bound-attempt-1', artifactId: 'receipt-anchor', payloadSha256: sha('p'), envelopeSha256: sha('e'), owner };
    expect(checkEvaluateResult(evaluateOk, expectation, config)).toBeNull();
    expect(checkEvaluateResult(evaluateOk, { ...expectation, envelopeSha256: sha('x') }, config)).toBe('REQUEST_JOIN_MISMATCH');
    expect(checkEvaluateResult(evaluateOk, expectation, { ...config, configDigest: 'f'.repeat(64) })).toBe('CONFIG_MISMATCH');
    expect(checkEvaluateResult({ ...evaluateOk, executionRecord: { final_decision: 'ALLOW', ledger_attached: true } }, expectation, config)).toBe('DECISION_JOIN_MISMATCH');
    expect(Object.keys(EXPECTED_ACTION).sort()).toEqual(['ALLOW', 'DENY', 'ESCALATE', 'REVIEW', 'SANDBOX']);
    expect(boundEnvelopeSha256(operation(config).envelope)).toMatch(/^[a-f0-9]{64}$/);
  });
});


describe('opaque deadline ownership', () => {
  it('gives injected senders a frozen view without disposal and rejects structural state', async () => {
    const owner = createDeadline(1000);
    const request = { origin: config.webOrigin, method: 'POST' as const, path: config.proxyPath, headers: {}, body: Buffer.from('{}') };
    let calls = 0;
    try {
      await sendBounded(async sent => {
        calls += 1;
        expect(sent.deadline).toBe(owner.view);
        expect(Object.isFrozen(sent.deadline)).toBe(true);
        expect('dispose' in sent.deadline).toBe(false);
        return { status: 200, headers: new Headers(), body: Buffer.from('{}') };
      }, request, owner, 100);
      for (const fake of [{ ...owner.view }, { expired: () => false, remainingMs: () => 9999, signal: owner.signal }]) {
        await expect(sendBounded(async () => { calls += 1; throw new Error('entered'); }, request, fake, 100))
          .rejects.toMatchObject({ code: 'DEADLINE_UNISSUED' });
      }
      expect(calls).toBe(1);
    } finally { owner.dispose(); }
  });
  it('refuses invalid durations and carries one deadline across cumulative hops', async () => {
    for (const invalid of [NaN, Infinity, -Infinity, 0, -1]) expect(() => createDeadline(invalid)).toThrow('DEADLINE_INVALID');
    const owner = createDeadline(90);
    const request = { origin: config.webOrigin, method: 'POST' as const, path: config.proxyPath, headers: {}, body: Buffer.from('{}') };
    const slow: WireSend = async () => { await new Promise(resolve => setTimeout(resolve, 55)); return { status: 200, headers: new Headers(), body: Buffer.from('{}') }; };
    try {
      await sendBounded(slow, request, owner, 100);
      await expect(sendBounded(slow, request, owner, 100)).rejects.toMatchObject({ code: 'TIMED_OUT' });
    } finally { owner.dispose(); }
  });
});
