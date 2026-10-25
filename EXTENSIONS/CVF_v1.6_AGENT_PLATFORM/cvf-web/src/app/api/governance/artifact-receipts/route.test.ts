import { createHash } from 'node:crypto';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { WIRE_SCHEMA, boundRequestSha256, canonicalBytes, parseCanonicalJson, parseWireRequest, type BoundConfigInput } from '@/lib/artifacts-bound-receipt-contract';
import type { ControlledEvaluateRequest } from '@/lib/artifacts-receipt-operation-contract';
import { createBoundReceiptHandlers } from '@/lib/server/bound-receipt-api';
import { createBoundReceiptFixtureProfile } from '@/lib/server/bound-receipt-profile';
import { EXPECTED_ACTION, createDeadline, type Deadline, type WireRequest, type WireResponse, type WireSend } from '@/lib/server/bound-receipt-transport';
import * as routeModule from './route';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const NOW = 1_760_000_000_000;
const ROOT = path.resolve(process.cwd(), '..', '..', '..', '.cvf', 'runtime', 'ncr-r2-w05-bound-authority-repair-20261020', 'worker', 'roots', 'route-unit');
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const CONFIG_INPUT: BoundConfigInput = { policyRevision: 'fixture-policy-r1', transformRevision: 'fixture-transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store',
  authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100',
  instanceId: '123e4567-e89b-42d3-a456-426614174000', storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 };
const keyBundle = { authReference: 'fixture-bundle-1', authScope: 'two-hop-fixture',
  hops: { EXPORT_PROXY: { keyReference: 'key-export-1', key: Buffer.alloc(32, 1) }, PROXY_ENGINE: { keyReference: 'key-engine-1', key: Buffer.alloc(32, 2) } } };
const never: WireSend = async () => { throw new Error('no web transport expected'); };
const attemptId = `ncr-bound-${sha('op').slice(0, 48)}`;
const evaluateRequest: ControlledEvaluateRequest = { request_id: attemptId, artifact_id: 'receipt-anchor', payload: { content: 'Heading' }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' };

type EngineWrap = (request: WireRequest, real: WireSend) => Promise<WireResponse>;
function kit(wrap?: EngineWrap) {
  const seen: Array<{ path: string; headers: string[] }> = [];
  const late: { engine?: WireSend } = {};
  const profile = createBoundReceiptFixtureProfile({ root: ROOT, config: CONFIG_INPUT, keyBundle, webSend: never, now: () => NOW, engineSend: req => late.engine!(req) });
  const { config, keyring } = profile.webContext;
  const real: WireSend = async req => {
    seen.push({ path: req.path, headers: Object.keys(req.headers).sort() });
    const verified = keyring.verify({ hop: 'PROXY_ENGINE', kind: 'REQUEST', path: req.path }, new Headers(req.headers), req.body, NOW);
    const parsed = verified.ok ? parseCanonicalJson(req.body, 16_384) : null;
    const wire = parsed && parsed.ok ? parseWireRequest(parsed.value) : null;
    if (!verified.ok || !wire) return { status: 401, headers: new Headers(), body: Buffer.from('{}') };
    const result = wire.kind === 'CHALLENGE'
      ? { schema: WIRE_SCHEMA, kind: 'CHALLENGE_RESULT', requestNonce: verified.nonce, challengeNonce: wire.challengeNonce, configDigest: config.configDigest, instanceId: config.instanceId,
        storeBindingId: config.storeBindingId, backend: 'SQLITE', policyRevision: config.policyRevision, expiresAtMs: NOW + 5000 }
      : { schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: verified.nonce, operationKey: wire.operationKey, attemptId: wire.attemptId, artifactId: wire.artifactId,
        payloadSha256: wire.payloadSha256, envelopeSha256: wire.envelopeSha256, owner: wire.owner, configDigest: config.configDigest, instanceId: config.instanceId,
        storeBindingId: config.storeBindingId, declaredRisk: 'R1', engineRiskLevel: 'R0', ledgerReference: { requestId: wire.attemptId, blockHash: sha('block') },
        report: { request_summary: { request_id: wire.attemptId, artifact_id: wire.artifactId }, decision_analysis: { final_decision: 'ALLOW' }, cvf_enforcement: { action: EXPECTED_ACTION.ALLOW },
          cvf_risk_level: 'R0', report_metadata: { generated_at: '2026-10-19T01:00:01.000000' }, integrity: { has_ledger_reference: true } },
        executionRecord: { final_decision: 'ALLOW', ledger_attached: true } };
    const bytes = canonicalBytes(result);
    return { status: 200, headers: new Headers(keyring.sign('PROXY_ENGINE', 'RESPONSE', req.path, bytes, NOW).headers), body: bytes };
  };
  late.engine = wrap ? req => wrap(req, real) : real;
  const handlers = createBoundReceiptHandlers({ context: profile.webContext });
  return { profile, config, keyring, handlers, seen };
}
type Kit = ReturnType<typeof kit>;
const challengeWire = (k: Kit, patch: Record<string, unknown> = {}) => ({ schema: WIRE_SCHEMA, kind: 'CHALLENGE', owner, operationKey: sha('key'), attemptId, configDigest: k.config.configDigest,
  challengeNonce: 'ab'.repeat(32), ...patch });
const evaluateWire = (k: Kit, patch: Record<string, unknown> = {}) => ({ ...challengeWire(k), kind: 'EVALUATE', requestSha256: sha('request'), artifactId: 'receipt-anchor',
  payloadSha256: boundRequestSha256(evaluateRequest), envelopeSha256: sha('envelope'), phase: 'REVIEW', riskLevel: 'R1', instanceId: k.config.instanceId,
  storeBindingId: k.config.storeBindingId, evaluate: evaluateRequest, ...patch });
interface Sent { body: Uint8Array; nonce: string; headers: Record<string, string> }
function signed(k: Kit, wire: unknown, over: { hop?: 'EXPORT_PROXY' | 'PROXY_ENGINE'; kind?: 'REQUEST' | 'RESPONSE'; at?: number; nonce?: string; path?: string; raw?: Uint8Array } = {}): Sent {
  const body = over.raw ?? canonicalBytes(wire);
  const message = k.keyring.sign(over.hop ?? 'EXPORT_PROXY', over.kind ?? 'REQUEST', over.path ?? k.config.proxyPath, body, over.at ?? NOW, over.nonce);
  return { body, nonce: message.nonce, headers: message.headers };
}
const admittedPost = (k: Kit, request: Request, timeoutMs = 1000) => {
  const owner = createDeadline(timeoutMs, request.signal);
  return k.handlers.POST(request, owner.view).finally(() => owner.dispose());
};
const post = (k: Kit, sent: Sent, url = `${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, drop: string[] = []) => {
  const headers = { ...sent.headers }; for (const name of drop) delete headers[name];
  return admittedPost(k, new Request(url, { method: 'POST', headers, body: sent.body as unknown as BodyInit }));
};
const errorOf = async (response: Response) => (JSON.parse(await response.text()) as { error?: string }).error;

describe('dedicated endpoint: held by default, POST only', () => {
  afterEach(() => { delete process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE; });
  it('exports only POST and denies every request without an injected context, whatever the environment says', async () => {
    expect(Object.keys(routeModule)).toEqual(['POST']);
    const k = kit();
    const request = () => new NextRequest('http://localhost/api/governance/artifact-receipts', { method: 'POST', headers: signed(k, challengeWire(k)).headers, body: canonicalBytes(challengeWire(k)) as unknown as BodyInit });
    const first = await routeModule.POST(request());
    expect(first.status).toBe(503);
    expect(await errorOf(first)).toBe('BOUND_RECEIPT_NOT_ACTIVATED');
    process.env.CVF_NCR_RECEIPT_OPERATION_PROFILE = 'BOUND_ENGINE_RECEIPT';
    process.env.CVF_SERVICE_TOKEN = 'unused-token';
    expect((await routeModule.POST(request())).status).toBe(503);
    delete process.env.CVF_SERVICE_TOKEN;
    for (const deps of [undefined, {}, { context: null }]) {
      const response = await createBoundReceiptHandlers(deps).POST(new Request('http://localhost/api/governance/artifact-receipts', { method: 'POST', body: '{}' }));
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect(k.seen).toEqual([]);
  });
});

describe('signed export hop in, signed engine hop out', () => {
  it('serves a valid challenge with one engine send and a response signed for the export hop only', async () => {
    const k = kit();
    const sent = signed(k, challengeWire(k));
    const response = await post(k, sent);
    expect(response.status).toBe(200);
    const body = new Uint8Array(await response.arrayBuffer());
    const verified = k.keyring.verify({ hop: 'EXPORT_PROXY', kind: 'RESPONSE', path: k.config.proxyPath }, response.headers, body, NOW);
    expect(verified.ok).toBe(true);
    const parsed = parseCanonicalJson(body, 32_768);
    expect(parsed.ok && (parsed.value as { requestNonce: string }).requestNonce).toBe(sent.nonce);
    expect(parsed.ok && (parsed.value as { kind: string }).kind).toBe('CHALLENGE_RESULT');
    expect(k.keyring.verify({ hop: 'PROXY_ENGINE', kind: 'RESPONSE', path: k.config.proxyPath }, response.headers, body, NOW + 1)).toEqual({ ok: false, reason: 'HOP_KIND' });
    expect(k.profile.counters).toMatchObject({ proxyRequests: 1, engineChallengeSends: 1, engineEvaluateSends: 0 });
    expect(k.seen).toEqual([{ path: k.config.engineChallengePath, headers: ['content-type', 'x-cvf-bound-config', 'x-cvf-bound-hop', 'x-cvf-bound-kind', 'x-cvf-bound-nonce',
      'x-cvf-bound-signature', 'x-cvf-bound-timestamp'] }]);
  });
  it('serves a valid evaluate with one engine send and forwards no browser credential', async () => {
    const k = kit();
    const sent = signed(k, evaluateWire(k));
    const response = await post(k, { ...sent, headers: { ...sent.headers, cookie: 'session=abc', authorization: 'Bearer x', 'x-cvf-service-token': 't' } });
    expect(response.status).toBe(200);
    const parsed = parseCanonicalJson(new Uint8Array(await response.arrayBuffer()), 32_768);
    expect(parsed.ok && (parsed.value as { kind: string; engineRiskLevel: string; declaredRisk: string })).toMatchObject({ kind: 'EVALUATE_RESULT', engineRiskLevel: 'R0', declaredRisk: 'R1' });
    expect(k.profile.counters).toMatchObject({ proxyRequests: 1, engineChallengeSends: 0, engineEvaluateSends: 1 });
    expect(k.seen[0].path).toBe(k.config.engineEvaluatePath);
    expect(k.seen[0].headers).not.toContain('cookie');
    expect(k.seen[0].headers).not.toContain('authorization');
    expect(k.seen[0].headers).not.toContain('x-cvf-service-token');
  });
  const denials: Array<[string, (k: Kit) => Promise<Response>, number, string]> = [
    ['missing signature header', k => post(k, signed(k, challengeWire(k)), undefined, ['x-cvf-bound-signature']), 401, 'MALFORMED_AUTH'],
    ['engine-hop credentials', k => post(k, signed(k, challengeWire(k), { hop: 'PROXY_ENGINE' })), 401, 'HOP_KIND'],
    ['response-kind credentials', k => post(k, signed(k, challengeWire(k), { kind: 'RESPONSE' })), 401, 'HOP_KIND'],
    ['signed for another path', k => post(k, signed(k, challengeWire(k), { path: '/api/v1/artifact-receipts/challenge' })), 401, 'SIGNATURE'],
    ['tampered body', k => { const s = signed(k, challengeWire(k)); return post(k, { ...s, body: canonicalBytes(challengeWire(k, { attemptId: 'ncr-bound-tampered-attempt' })) }); }, 401, 'SIGNATURE'],
    ['expired request', k => post(k, signed(k, challengeWire(k), { at: NOW - 30_001 })), 401, 'EXPIRED'],
    ['future request', k => post(k, signed(k, challengeWire(k), { at: NOW + 1_001 })), 401, 'EXPIRED'],
    ['other config header', k => { const s = signed(k, challengeWire(k)); return post(k, { ...s, headers: { ...s.headers, 'x-cvf-bound-config': 'f'.repeat(64) } }); }, 401, 'CONFIG'],
    ['signature of another key', k => { const s = signed(k, challengeWire(k)); return post(k, { ...s, headers: { ...s.headers, 'x-cvf-bound-signature': 'a'.repeat(64) } }); }, 401, 'SIGNATURE'],
    ['non-canonical body', k => post(k, signed(k, null, { raw: Buffer.from(JSON.stringify(challengeWire(k), null, 1)) })), 422, 'WIRE_INVALID'],
    ['duplicate-key body', k => post(k, signed(k, null, { raw: Buffer.from('{"a":1,"a":2}') })), 422, 'WIRE_INVALID'],
    ['unknown field', k => post(k, signed(k, challengeWire(k, { actor_id: 'root' }))), 422, 'WIRE_INVALID'],
    ['challenge carrying evaluate keys', k => post(k, signed(k, { ...challengeWire(k), requestSha256: sha('x') })), 422, 'WIRE_INVALID'],
    ['body config digest differs', k => post(k, signed(k, challengeWire(k, { configDigest: 'f'.repeat(64) }))), 422, 'CONFIG_MISMATCH'],
    ['evaluate for another instance', k => post(k, signed(k, evaluateWire(k, { instanceId: '12345678-1234-4234-8234-123456789abc' }))), 422, 'STORE_MISMATCH'],
    ['evaluate for another store', k => post(k, signed(k, evaluateWire(k, { storeBindingId: 'cd'.repeat(32) }))), 422, 'STORE_MISMATCH'],
    ['evaluate risk other than R1', k => post(k, signed(k, evaluateWire(k, { riskLevel: 'R2' }))), 422, 'WIRE_INVALID'],
    ['evaluate excerpt over 500 units', k => { const long = { ...evaluateRequest, payload: { content: 'y'.repeat(501) } };
      return post(k, signed(k, evaluateWire(k, { evaluate: long, payloadSha256: boundRequestSha256(long) }))); }, 422, 'WIRE_INVALID'],
    ['evaluate actor override', k => { const bad = { ...evaluateRequest, payload: { content: 'c', actor_id: 'root' } };
      return post(k, signed(k, evaluateWire(k, { evaluate: bad, payloadSha256: sha('x') }))); }, 422, 'WIRE_INVALID'],
    ['wrong path', k => post(k, signed(k, challengeWire(k)), `${CONFIG_INPUT.webOrigin}/api/governance/evaluate`), 404, 'DESTINATION'],
    ['foreign origin', k => post(k, signed(k, challengeWire(k)), `http://foreign.invalid:3000${k.config.proxyPath}`), 404, 'DESTINATION'],
    ['declared oversize', k => admittedPost(k, { url: `${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, method: 'POST', headers: new Headers({ 'content-length': '20000' }), body: null,
      signal: new AbortController().signal } as unknown as Request), 413, 'OVERSIZE_BODY'],
    ['oversize stream', k => post(k, signed(k, null, { raw: Buffer.alloc(16_385, 0x20) })), 413, 'OVERSIZE_BODY'],
  ];
  it.each(denials)('refuses %s before any engine send', async (_name, run, status, code) => {
    const k = kit();
    const response = await run(k);
    expect(response.status).toBe(status);
    expect(await errorOf(response)).toBe(code);
    expect(k.seen).toEqual([]);
    expect(k.profile.counters).toMatchObject({ proxyRequests: 0, engineChallengeSends: 0, engineEvaluateSends: 0 });
  });
  it('refuses a body-less request without a send and refuses a replayed signed request', async () => {
    const k = kit();
    const none = await admittedPost(k, new Request(`${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, { method: 'POST' }));
    expect([400, 413]).toContain(none.status);
    const sent = signed(k, challengeWire(k));
    expect((await post(k, sent)).status).toBe(200);
    const replay = await post(k, sent);
    expect(replay.status).toBe(409);
    expect(await errorOf(replay)).toBe('REPLAY');
    expect(k.seen).toHaveLength(1);
  });
});

describe('engine hop failures end in a bad gateway and never a second send', () => {
  const cases: Array<[string, EngineWrap, string]> = [
    ['sender throws', async () => { throw new Error('reset'); }, 'SEND_FAILED'],
    ['server error', async () => ({ status: 500, headers: new Headers(), body: Buffer.from('{}') }), 'STATUS'],
    ['redirect', async (_r, real) => ({ ...(await real(_r)), redirected: true }), 'REDIRECT'],
    ['unsigned reply', async (_r, real) => ({ ...(await real(_r)), headers: new Headers() }), 'ENGINE_MALFORMED_AUTH'],
    ['oversize reply', async (_r, real) => ({ ...(await real(_r)), body: Buffer.alloc(40_000, 0x20) }), 'OVERSIZE'],
    ['tampered reply', async (_r, real) => { const r = await real(_r); return { ...r, body: Buffer.concat([r.body, Buffer.from(' ')]) }; }, 'ENGINE_SIGNATURE'],
  ];
  it.each(cases)('%s', async (_name, wrap, code) => {
    const k = kit(wrap);
    const response = await post(k, signed(k, evaluateWire(k)));
    expect(response.status).toBe(502);
    expect(await errorOf(response)).toBe(code);
    expect(k.profile.counters).toMatchObject({ proxyRequests: 1, engineEvaluateSends: 1 });
  });
  it('rejects a replayed engine reply', async () => {
    let first: WireResponse | undefined;
    const k = kit(async (req, real) => { if (!first) { first = await real(req); return first; } return first; });
    expect((await post(k, signed(k, challengeWire(k)))).status).toBe(200);
    const second = await post(k, signed(k, challengeWire(k, { challengeNonce: 'cd'.repeat(32) })));
    expect(second.status).toBe(502);
    expect(await errorOf(second)).toBe('ENGINE_REPLAY');
  });
});


describe('issued ingress budget before receive/auth/forward', () => {
  it('rejects absent, structural, copied and spent deadlines before touching the body', async () => {
    const k = kit();
    let reads = 0;
    const request = { url: `${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, method: 'POST', headers: new Headers(),
      get body() { reads += 1; throw new Error('BODY_MUST_NOT_BE_READ'); } } as unknown as Request;
    const owner = createDeadline(1000);
    const spent = createDeadline(1000); spent.dispose();
    try {
      for (const value of [undefined, { expired: () => false, remainingMs: () => 1000, signal: new AbortController().signal },
        { ...owner.view }, spent.view]) {
        const reply = await k.handlers.POST(request, value as Deadline);
        expect(reply.status).toBeGreaterThanOrEqual(400);
      }
      expect(reads).toBe(0); expect(k.seen).toEqual([]);
    } finally { owner.dispose(); }
  });
  it('bounds a stalled body by the issued time budget without forwarding', async () => {
    const k = kit();
    const stream = new ReadableStream<Uint8Array>({ pull: () => new Promise<void>(() => undefined) });
    const request = new Request(`${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    const started = performance.now();
    const reply = await admittedPost(k, request, 40);
    expect(reply.status).toBe(408);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(k.seen).toEqual([]);
  });
  it('spends body ingress time from the same deadline before the engine hop', async () => {
    const samples: number[] = [];
    const k = kit(async (request, real) => {
      samples.push(request.deadline.remainingMs());
      await new Promise(resolve => setTimeout(resolve, 70));
      return real(request);
    });
    const sent = signed(k, challengeWire(k));
    const stream = new ReadableStream<Uint8Array>({ start(controller) {
      setTimeout(() => { controller.enqueue(sent.body); controller.close(); }, 70);
    } });
    const request = new Request(`${CONFIG_INPUT.webOrigin}${k.config.proxyPath}`, { method: 'POST', headers: sent.headers, body: stream, duplex: 'half' } as RequestInit);
    const reply = await admittedPost(k, request, 110);
    expect(reply.status).toBe(502); expect(samples).toHaveLength(1);
    expect(samples[0]).toBeLessThan(80);
  });
});
