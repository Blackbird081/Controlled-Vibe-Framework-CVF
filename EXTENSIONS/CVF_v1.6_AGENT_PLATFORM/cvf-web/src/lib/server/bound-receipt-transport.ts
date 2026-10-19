/**
 * Signed two-hop transport for the offline bound receipt. Everything here runs over injected in-process senders; it never calls fetch, reads
 * the environment or discovers a destination. A failure after the first send is reported to the caller, which records OUTCOME_UNKNOWN.
 */
import { randomBytes } from 'node:crypto';
import { AUTH_HEADERS, BOUND_PHASE, BOUND_RISK, CHALLENGE_TTL_MS, MAX_SKEW_FUTURE_MS, MAX_SKEW_PAST_MS, WIRE_SCHEMA, authPreimage, boundRequestSha256, canonicalBytes, computeSignature,
  parseCanonicalJson, parseChallengeResult, parseEvaluateResult, readAuthHeaders, signaturesEqual, timestampFresh,
  type BoundConfig, type BoundHop, type BoundMessageKind, type ChallengeResult, type ChallengeWire, type EvaluateResult, type EvaluateWire,
  type HeadersLikeInput } from '../artifacts-bound-receipt-contract';
import type { ControlledEvaluateRequest } from '../artifacts-receipt-operation-contract';
import type { DraftPrincipal } from '../html-draft-recovery-contract';

export type HeadersLike = HeadersLikeInput;
export interface WireRequest { path: string; headers: Record<string, string>; body: Uint8Array; signal: AbortSignal }
export interface WireResponse { status: number; headers: HeadersLike; body: Uint8Array; redirected?: boolean }
/** Injected sender. The offline profile supplies in-process functions; there is no default and no network implementation. */
export type WireSend = (request: WireRequest) => Promise<WireResponse>;

export class BoundTransportError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'BoundTransportError'; }
}
/** A transport failure code is a bounded upper-case token that can be persisted as an outcome reason. */
export const transportReason = (error: unknown): string =>
  error instanceof BoundTransportError && /^[A-Z0-9_]{1,64}$/.test(error.code) ? error.code : 'INVOKER_ERROR';

export const EXPECTED_ACTION: Readonly<Record<string, string>> = Object.freeze({ ALLOW: 'ALLOW', DENY: 'BLOCK', REVIEW: 'NEEDS_APPROVAL', ESCALATE: 'ESCALATE', SANDBOX: 'LOG_ONLY' });

/** Per-stage counters so a test can tell the invoker, the proxy, the engine sends and the ledger appends apart. */
export interface BoundCounters {
  invokerCalls: number; challengeSent: number; evaluateSent: number; proxyRequests: number; engineChallengeSends: number; engineEvaluateSends: number;
}
export const newCounters = (): BoundCounters => ({ invokerCalls: 0, challengeSent: 0, evaluateSent: 0, proxyRequests: 0, engineChallengeSends: 0, engineEvaluateSends: 0 });

// ---- Key bundle: a versioned immutable two-hop reference set. Key bytes are cloned once and never exported. ----
export interface HopKeyInput { keyReference: string; key: Uint8Array }
export interface KeyBundleInput { authReference: string; authScope: string; hops: { EXPORT_PROXY: HopKeyInput; PROXY_ENGINE: HopKeyInput } }
const LABEL = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_REPLAY_ENTRIES = 1024;
export type VerifyFailure = 'MALFORMED_AUTH' | 'HOP_KIND' | 'CONFIG' | 'EXPIRED' | 'SIGNATURE' | 'REPLAY' | 'REPLAY_CAPACITY';
export type VerifyResult = { ok: true; nonce: string; timestampMs: number } | { ok: false; reason: VerifyFailure };
export interface SignedMessage { headers: Record<string, string>; nonce: string }
export interface Keyring {
  readonly authReference: string;
  readonly authScope: string;
  sign(hop: BoundHop, kind: BoundMessageKind, path: string, body: Uint8Array, now: number, nonce?: string): SignedMessage;
  verify(expect: { hop: BoundHop; kind: BoundMessageKind; path: string }, headers: HeadersLike, body: Uint8Array, now: number): VerifyResult;
}
const randomHex = () => randomBytes(32).toString('hex');
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.byteLength === b.byteLength && Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

/** Returns null for any unknown scope, mismatched bundle, duplicate or weak key. The caller keeps no alias to the clone. */
export function createKeyring(input: unknown, config: Pick<BoundConfig, 'authReference' | 'authScope' | 'configDigest'>): Keyring | null {
  if (input === null || typeof input !== 'object') return null;
  const bundle = input as Record<string, unknown>;
  const hops = bundle.hops as Record<string, unknown> | undefined;
  if (Object.keys(bundle).sort().join(',') !== 'authReference,authScope,hops' || bundle.authReference !== config.authReference
    || bundle.authScope !== config.authScope || hops === null || typeof hops !== 'object'
    || Object.keys(hops).sort().join(',') !== 'EXPORT_PROXY,PROXY_ENGINE') return null;
  const cloned: Partial<Record<BoundHop, { keyReference: string; key: Buffer }>> = {};
  for (const hop of ['EXPORT_PROXY', 'PROXY_ENGINE'] as const) {
    const entry = hops[hop] as Record<string, unknown> | null;
    if (entry === null || typeof entry !== 'object' || Object.keys(entry).sort().join(',') !== 'key,keyReference'
      || typeof entry.keyReference !== 'string' || !LABEL.test(entry.keyReference) || !ArrayBuffer.isView(entry.key)) return null;
    const view = entry.key as Uint8Array;
    if (view.byteLength < 32 || view.byteLength > 128) return null;
    cloned[hop] = { keyReference: entry.keyReference, key: Buffer.from(view) };
  }
  const a = cloned.EXPORT_PROXY!;
  const b = cloned.PROXY_ENGINE!;
  if (a.keyReference === b.keyReference || sameBytes(a.key, b.key)) return null;
  const seen = new Map<string, number>();
  const keyring: Keyring = {
    authReference: config.authReference,
    authScope: config.authScope,
    sign(hop, kind, path, body, now, nonce = randomHex()) {
      const signature = computeSignature(cloned[hop]!.key, authPreimage(hop, kind, path, now, nonce, config.configDigest, body));
      return { nonce, headers: { 'content-type': 'application/json', [AUTH_HEADERS.hop]: hop, [AUTH_HEADERS.kind]: kind, [AUTH_HEADERS.timestamp]: String(now),
        [AUTH_HEADERS.nonce]: nonce, [AUTH_HEADERS.config]: config.configDigest, [AUTH_HEADERS.signature]: signature } };
    },
    verify(expect, headers, body, now) {
      const h = readAuthHeaders(headers);
      if (!h) return { ok: false, reason: 'MALFORMED_AUTH' };
      if (h.hop !== expect.hop || h.kind !== expect.kind) return { ok: false, reason: 'HOP_KIND' };
      if (h.config !== config.configDigest) return { ok: false, reason: 'CONFIG' };
      if (!timestampFresh(h.timestampMs, now)) return { ok: false, reason: 'EXPIRED' };
      const expected = computeSignature(cloned[expect.hop]!.key, authPreimage(expect.hop, expect.kind, expect.path, h.timestampMs, h.nonce, config.configDigest, body));
      if (!signaturesEqual(expected, h.signature)) return { ok: false, reason: 'SIGNATURE' };
      // The replay key covers key reference, hop, kind, nonce and config. Entries older than the accepted window can never be replayed, so they are dropped.
      for (const [key, at] of seen) if (at < now - MAX_SKEW_PAST_MS) seen.delete(key);
      const replayKey = [cloned[expect.hop]!.keyReference, expect.hop, expect.kind, h.nonce, h.config].join('|');
      if (seen.has(replayKey)) return { ok: false, reason: 'REPLAY' };
      if (seen.size >= MAX_REPLAY_ENTRIES) return { ok: false, reason: 'REPLAY_CAPACITY' };
      seen.set(replayKey, h.timestampMs);
      return { ok: true, nonce: h.nonce, timestampMs: h.timestampMs };
    },
  };
  return Object.freeze(keyring);
}

// ---- One absolute deadline for the whole logical operation ----
export interface Deadline { readonly signal: AbortSignal; readonly expired: () => boolean; readonly dispose: () => void }
export function createDeadline(timeoutMs: number, external?: AbortSignal): Deadline {
  const controller = new AbortController();
  const startedAt = Date.now();
  let disposed = false;
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  external?.addEventListener('abort', abort, { once: true });
  if (external?.aborted) abort();
  return { signal: controller.signal, expired: () => controller.signal.aborted || Date.now() - startedAt >= timeoutMs,
    dispose: () => { if (disposed) return; disposed = true; clearTimeout(timer); external?.removeEventListener('abort', abort); } };
}
/** Races one send against the deadline; the deadline outcome is the same whether the sender was slow, hung or ignored the signal. */
export async function sendBounded(send: WireSend, request: Omit<WireRequest, 'signal'>, deadline: Deadline, maxResponseBytes: number): Promise<WireResponse> {
  if (deadline.expired()) throw new BoundTransportError(deadline.signal.aborted ? 'ABORTED' : 'TIMED_OUT');
  const abort = new Promise<never>((_, reject) => {
    deadline.signal.addEventListener('abort', () => reject(new BoundTransportError('TIMED_OUT')), { once: true });
  });
  let response: WireResponse;
  try { response = await Promise.race([send({ ...request, signal: deadline.signal }), abort]); }
  catch (error) { throw error instanceof BoundTransportError ? error : new BoundTransportError('SEND_FAILED'); }
  if (response.redirected === true || (response.status >= 300 && response.status < 400)) throw new BoundTransportError('REDIRECT');
  if (response.status !== 200) throw new BoundTransportError('STATUS');
  if (!response.body || response.body.byteLength === 0 || response.body.byteLength > maxResponseBytes) throw new BoundTransportError('OVERSIZE');
  return response;
}

// ---- Exact joins, shared by the proxy handler (against the wire it forwarded) and the receipt proof (against the envelope) ----
export interface EvaluateExpectation {
  operationKey: string; attemptId: string; artifactId: string; payloadSha256: string; envelopeSha256: string; owner: DraftPrincipal;
}
const sameOwner = (a: DraftPrincipal, b: DraftPrincipal) => a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;
/** Returns a failure code, or null when every join holds. A request signature never substitutes for these checks. */
export function checkChallengeResult(result: ChallengeResult, wire: ChallengeWire, config: BoundConfig, requestNonce: string, window: { sentAtMs: number; receivedAtMs: number }): string | null {
  if (result.requestNonce !== requestNonce) return 'NONCE_MISMATCH';
  if (result.challengeNonce !== wire.challengeNonce) return 'CHALLENGE_MISMATCH';
  if (result.configDigest !== config.configDigest || result.policyRevision !== config.policyRevision) return 'CONFIG_MISMATCH';
  if (result.instanceId !== config.instanceId) return 'INSTANCE_MISMATCH';
  if (result.storeBindingId !== config.storeBindingId) return 'STORE_MISMATCH';
  // The engine issued it between our send and our receipt, so its expiry can be at most the TTL past the receipt (plus the accepted skew) and not long before the send.
  if (result.expiresAtMs > window.receivedAtMs + CHALLENGE_TTL_MS + MAX_SKEW_FUTURE_MS || result.expiresAtMs <= window.sentAtMs - MAX_SKEW_PAST_MS) return 'CHALLENGE_EXPIRY';
  return null;
}
export function checkEvaluateResult(result: EvaluateResult, expect: EvaluateExpectation, config: BoundConfig, requestNonce?: string): string | null {
  if (requestNonce !== undefined && result.requestNonce !== requestNonce) return 'NONCE_MISMATCH';
  if (result.operationKey !== expect.operationKey || result.attemptId !== expect.attemptId || result.artifactId !== expect.artifactId
    || result.payloadSha256 !== expect.payloadSha256 || result.envelopeSha256 !== expect.envelopeSha256 || !sameOwner(result.owner, expect.owner)) return 'REQUEST_JOIN_MISMATCH';
  if (result.configDigest !== config.configDigest) return 'CONFIG_MISMATCH';
  if (result.instanceId !== config.instanceId) return 'INSTANCE_MISMATCH';
  if (result.storeBindingId !== config.storeBindingId) return 'STORE_MISMATCH';
  if (result.declaredRisk !== BOUND_RISK) return 'DECLARED_RISK_MISMATCH';
  const decision = result.report.decision_analysis.final_decision;
  if (!Object.hasOwn(EXPECTED_ACTION, decision) || result.report.cvf_enforcement.action !== EXPECTED_ACTION[decision]
    || result.executionRecord.final_decision !== decision || !result.report.integrity.has_ledger_reference) return 'DECISION_JOIN_MISMATCH';
  if (result.report.request_summary.request_id !== expect.attemptId || result.report.request_summary.artifact_id !== expect.artifactId
    || result.ledgerReference.requestId !== expect.attemptId || result.report.cvf_risk_level !== result.engineRiskLevel) return 'REPORT_JOIN_MISMATCH';
  return null;
}

// ---- Invoker: one signed challenge plus one signed evaluate through the proxy hop ----
export interface InvokerOptions {
  config: BoundConfig;
  envelope: { operationKey: string; attemptId: string; owner: DraftPrincipal; requestSha256: string; payloadSha256: string; output: { artifactId: string } };
  envelopeSha256: string;
  keyring: Keyring;
  send: WireSend;
  now: () => number;
  random?: () => string;
  counters: BoundCounters;
}
export type BoundInvoker = (request: ControlledEvaluateRequest, signal: AbortSignal) => Promise<EvaluateResult>;

export function createBoundInvoker(options: InvokerOptions): BoundInvoker {
  const { config, keyring, send, now, counters } = options;
  // Everything the invoker reads is copied once, synchronously; later caller mutation cannot change it.
  const envelope = { operationKey: options.envelope.operationKey, attemptId: options.envelope.attemptId, owner: { ...options.envelope.owner },
    requestSha256: options.envelope.requestSha256, payloadSha256: options.envelope.payloadSha256, artifactId: options.envelope.output.artifactId };
  const envelopeSha256 = options.envelopeSha256;
  const random = options.random ?? randomHex;
  async function hop(wire: ChallengeWire | EvaluateWire, deadline: Deadline): Promise<{ value: unknown; nonce: string; issuedAt: number }> {
    const body = canonicalBytes(wire);
    if (body.byteLength > config.maxRequestBytes) throw new BoundTransportError('REQUEST_OVERSIZE');
    const issuedAt = now();
    const signed = keyring.sign('EXPORT_PROXY', 'REQUEST', config.proxyPath, body, issuedAt);
    // Counted only when the sender is actually invoked, so a request refused before the send never inflates the count.
    const counted: WireSend = request => { if (wire.kind === 'CHALLENGE') counters.challengeSent += 1; else counters.evaluateSent += 1; return send(request); };
    const response = await sendBounded(counted, { path: config.proxyPath, headers: signed.headers, body }, deadline, config.maxResponseBytes);
    const verified = keyring.verify({ hop: 'EXPORT_PROXY', kind: 'RESPONSE', path: config.proxyPath }, response.headers, response.body, now());
    if (!verified.ok) throw new BoundTransportError(`RESPONSE_${verified.reason}`);
    const parsed = parseCanonicalJson(response.body, config.maxResponseBytes);
    if (!parsed.ok) throw new BoundTransportError('RESPONSE_BODY');
    return { value: parsed.value, nonce: signed.nonce, issuedAt };
  }
  return async (request, signal) => {
    counters.invokerCalls += 1;
    const deadline = createDeadline(config.timeoutMs, signal);
    try {
      if (request.request_id !== envelope.attemptId || request.artifact_id !== envelope.artifactId || boundRequestSha256(request) !== envelope.payloadSha256) {
        throw new BoundTransportError('REQUEST_JOIN_MISMATCH');
      }
      const challengeNonce = random();
      const challengeWire: ChallengeWire = { schema: WIRE_SCHEMA, kind: 'CHALLENGE', owner: { ...envelope.owner }, operationKey: envelope.operationKey,
        attemptId: envelope.attemptId, configDigest: config.configDigest, challengeNonce };
      const first = await hop(challengeWire, deadline);
      const challenge = parseChallengeResult(first.value);
      if (!challenge) throw new BoundTransportError('CHALLENGE_BODY');
      const challengeFailure = checkChallengeResult(challenge, challengeWire, config, first.nonce, { sentAtMs: first.issuedAt, receivedAtMs: now() });
      if (challengeFailure) throw new BoundTransportError(`CHALLENGE_${challengeFailure}`);
      if (now() >= challenge.expiresAtMs) throw new BoundTransportError('CHALLENGE_STALE');
      const evaluateWire: EvaluateWire = { schema: WIRE_SCHEMA, kind: 'EVALUATE', owner: { ...envelope.owner }, operationKey: envelope.operationKey,
        attemptId: envelope.attemptId, configDigest: config.configDigest, challengeNonce, requestSha256: envelope.requestSha256, artifactId: envelope.artifactId,
        payloadSha256: envelope.payloadSha256, envelopeSha256, phase: BOUND_PHASE, riskLevel: BOUND_RISK, instanceId: config.instanceId,
        storeBindingId: config.storeBindingId, evaluate: { request_id: request.request_id, artifact_id: request.artifact_id,
          payload: { content: request.payload.content }, cvf_phase: BOUND_PHASE, cvf_risk_level: BOUND_RISK } };
      const second = await hop(evaluateWire, deadline);
      const result = parseEvaluateResult(second.value);
      if (!result) throw new BoundTransportError('EVALUATE_BODY');
      const failure = checkEvaluateResult(result, { operationKey: envelope.operationKey, attemptId: envelope.attemptId, artifactId: envelope.artifactId,
        payloadSha256: envelope.payloadSha256, envelopeSha256, owner: envelope.owner }, config, second.nonce);
      if (failure) throw new BoundTransportError(`EVALUATE_${failure}`);
      return result;
    } finally { deadline.dispose(); }
  };
}
