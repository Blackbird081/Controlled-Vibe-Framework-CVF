/**
 * Dedicated Web handler for the offline bound receipt. It authenticates the export hop with its own signed message (no session, no token
 * equality, no generic evaluate fallback), forwards exactly one signed message to the engine hop and returns a re-signed, fully joined result.
 * With no injected context every request is denied; nothing in the environment, the body or a header can supply one.
 */
import { WIRE_SCHEMA, canonicalAscii, canonicalBytes, parseCanonicalJson, parseChallengeResult, parseEvaluateResult, parseWireRequest,
  type ChallengeResult, type ChallengeWire, type EvaluateResult, type EvaluateWire } from '../artifacts-bound-receipt-contract';
import { BoundTransportError, checkChallengeResult, checkEvaluateResult, isIssuedDeadline, sendBounded, waitBounded, type Deadline, type WireSend } from './bound-receipt-transport';
import { isIssuedBoundContext, type BoundWebContext } from './bound-receipt-profile';

export interface BoundReceiptHandlerDeps { context?: BoundWebContext | null }

const NO_STORE = { 'cache-control': 'no-store', pragma: 'no-cache', 'x-content-type-options': 'nosniff' };
function deny(status: number, code: string): Response {
  return new Response(canonicalAscii({ schema: WIRE_SCHEMA, kind: 'ERROR', error: code }), { status, headers: { ...NO_STORE, 'content-type': 'application/json' } });
}

/** Bounded read of the raw request bytes; an oversized stream is cancelled and refused. */
async function readBounded(request: Request, max: number, deadline: Deadline): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await waitBounded(() => reader.read(), deadline);
      if (done) break;
      total += value.byteLength;
      if (total > max) { void reader.cancel().catch(() => undefined); return null; }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
}

export function createBoundReceiptHandlers(deps: BoundReceiptHandlerDeps = {}) {
  const context = deps.context ?? null;
  async function forward(ctx: BoundWebContext, wire: ChallengeWire | EvaluateWire, body: Uint8Array, hopANonce: string, deadline: Deadline): Promise<Response> {
    const { config, keyring, counters } = ctx;
    const enginePath = wire.kind === 'CHALLENGE' ? config.engineChallengePath : config.engineEvaluatePath;
    try {
      const issuedAt = ctx.now();
      const signed = keyring.sign('PROXY_ENGINE', 'REQUEST', enginePath, body, issuedAt);
      const counted: WireSend = request => { if (wire.kind === 'CHALLENGE') counters.engineChallengeSends += 1; else counters.engineEvaluateSends += 1; return ctx.engineSend(request); };
      const response = await sendBounded(counted, { origin: config.engineOrigin, method: 'POST', path: enginePath, headers: signed.headers, body }, deadline, config.maxResponseBytes);
      const verified = keyring.verify({ hop: 'PROXY_ENGINE', kind: 'RESPONSE', path: enginePath }, response.headers, response.body, ctx.now());
      if (!verified.ok) throw new BoundTransportError(`ENGINE_${verified.reason}`);
      const parsed = parseCanonicalJson(response.body, config.maxResponseBytes);
      if (!parsed.ok) throw new BoundTransportError('ENGINE_BODY');
      let result: ChallengeResult | EvaluateResult;
      if (wire.kind === 'CHALLENGE') {
        const challenge = parseChallengeResult(parsed.value);
        const failure = challenge ? checkChallengeResult(challenge, wire, config, signed.nonce, { sentAtMs: issuedAt, receivedAtMs: ctx.now() }) : 'SHAPE';
        if (!challenge || failure) throw new BoundTransportError(`ENGINE_CHALLENGE_${failure ?? 'SHAPE'}`);
        result = { ...challenge, requestNonce: hopANonce };
      } else {
        const evaluated = parseEvaluateResult(parsed.value);
        const failure = evaluated ? checkEvaluateResult(evaluated, wire, config, signed.nonce) : 'SHAPE';
        if (!evaluated || failure) throw new BoundTransportError(`ENGINE_EVALUATE_${failure ?? 'SHAPE'}`);
        result = { ...evaluated, requestNonce: hopANonce };
      }
      const out = canonicalBytes(result);
      if (deadline.expired()) throw new BoundTransportError('TIMED_OUT');
      const reply = keyring.sign('EXPORT_PROXY', 'RESPONSE', config.proxyPath, out, ctx.now());
      return new Response(out.toString('ascii'), { status: 200, headers: { ...NO_STORE, ...reply.headers } });
    } catch (error) {
      // Any failure after the engine send is reported as a bad gateway with a bounded code; the caller records an unknown outcome and never resends.
      return deny(502, error instanceof BoundTransportError ? error.code : 'FORWARD_FAILED');
    }
  }

  return {
    async POST(request: Request, issuedDeadline?: Deadline): Promise<Response> {
      const ctx = context;
      if (!ctx) return deny(503, 'BOUND_RECEIPT_NOT_ACTIVATED');
      if (!isIssuedBoundContext(ctx)) return deny(403, 'BOUND_CONTEXT_UNISSUED');
      const { config, keyring, counters } = ctx;
      if (!isIssuedDeadline(issuedDeadline)) return deny(403, 'DEADLINE_UNISSUED');
      const deadline = issuedDeadline;
      try {
        const destination = new URL(request.url);
        if (request.method !== 'POST' || destination.origin !== config.webOrigin || destination.pathname !== config.proxyPath
          || destination.search || destination.hash) return deny(404, 'DESTINATION');
        if (deadline.expired()) return deny(408, 'TIMED_OUT');
        const declared = request.headers.get('content-length');
        if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > config.maxRequestBytes)) return deny(413, 'OVERSIZE_BODY');
        const body = await readBounded(request, config.maxRequestBytes, deadline);
        if (!body || body.byteLength === 0) return deny(body ? 400 : 413, body ? 'EMPTY_BODY' : 'OVERSIZE_BODY');
        const auth = keyring.verify({ hop: 'EXPORT_PROXY', kind: 'REQUEST', path: config.proxyPath }, request.headers, body, ctx.now());
        if (!auth.ok) return deny(auth.reason === 'REPLAY' || auth.reason === 'REPLAY_CAPACITY' ? 409 : 401, auth.reason);
        const parsed = parseCanonicalJson(body, config.maxRequestBytes);
        const wire = parsed.ok ? parseWireRequest(parsed.value) : null;
        if (!wire) return deny(422, 'WIRE_INVALID');
        if (wire.configDigest !== config.configDigest) return deny(422, 'CONFIG_MISMATCH');
        if (wire.kind === 'EVALUATE' && (wire.instanceId !== config.instanceId || wire.storeBindingId !== config.storeBindingId)) return deny(422, 'STORE_MISMATCH');
        counters.proxyRequests += 1;
        return await forward(ctx, wire, body, auth.nonce, deadline);
      } catch (error) { return error instanceof BoundTransportError ? deny(408, error.code) : deny(500, 'INTERNAL_ERROR'); }
    },
  };
}
