/** Offline bound-receipt contract: canonical bytes, strict codec, signed two-hop wire. It grants no runtime, remote or production authority. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SOURCE_ID, VERSION_ID, safeText, sha256, type DraftPrincipal } from './html-draft-recovery-contract';
import { MAX_OPERATION_RECORD_BYTES, OUTCOMES, RETENTION_POSTURE, REVOKE_POSTURE, SYNTHETIC_SOURCE_PREFIX, ownerSha256,
  type ControlledEvaluateRequest, type OperationOutcomeKind, type OperationOutputIdentity } from './artifacts-receipt-operation-contract';

export const BOUND_SCHEMA = 'cvf.artifactsBoundReceiptOperation.v1' as const;
export const BOUND_EFFECT = 'BOUND_ENGINE_RECEIPT' as const;
export const BOUND_DISCLOSURE = 'OFFLINE_BOUND_RECEIPT_NOT_ACTIVATED' as const;
export const WIRE_SCHEMA = 'cvf.boundReceiptWire.v1' as const;
export const AUTH_TAG = 'cvf.boundReceiptAuth.v1' as const;
export const BOUND_PHASE = 'REVIEW' as const;
export const BOUND_RISK = 'R1' as const;
export const IDENTITY_TRUST = 'AUTHENTICATED_DEPLOYMENT_BINDING' as const;
export const BOUND_PROXY_PATH = '/api/governance/artifact-receipts' as const;
export const ENGINE_CHALLENGE_PATH = '/api/v1/artifact-receipts/challenge' as const;
export const ENGINE_EVALUATE_PATH = '/api/v1/artifact-receipts/evaluate' as const;
export const MAX_REQUEST_BYTES = 16_384;
export const MAX_RESPONSE_BYTES = 32_768;
export const MAX_SKEW_PAST_MS = 30_000;
export const MAX_SKEW_FUTURE_MS = 1_000;
export const CHALLENGE_TTL_MS = 5_000;
export const AUTH_HEADERS = { hop: 'x-cvf-bound-hop', kind: 'x-cvf-bound-kind', timestamp: 'x-cvf-bound-timestamp',
  nonce: 'x-cvf-bound-nonce', config: 'x-cvf-bound-config', signature: 'x-cvf-bound-signature' } as const;
export type BoundHop = 'EXPORT_PROXY' | 'PROXY_ENGINE';
export type BoundMessageKind = 'REQUEST' | 'RESPONSE';

const HASH = /^[a-f0-9]{64}$/;
const LABEL = /^[A-Za-z0-9._-]{1,100}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ATTEMPT_ID = /^[A-Za-z0-9._-]{8,150}$/;
const ARTIFACT_ID = /^[A-Za-z0-9._-]{1,150}$/;
const PRINCIPAL = /^[A-Za-z0-9_-]{1,150}$/;
const REASON = /^[A-Z0-9_]{1,64}$/;
const RECEIPT_ID = /^[A-Za-z0-9._:-]{1,200}$/;
const DECISION = /^[A-Z_]{1,40}$/;
const ASCII_KEY = /^[\x20-\x7e]*$/;
const record = (v: unknown): v is Record<string, unknown> => Object.prototype.toString.call(v) === '[object Object]';
const exact = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const iso = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const hash = (v: unknown): v is string => typeof v === 'string' && HASH.test(v);
const label = (v: unknown, pattern: RegExp = LABEL): v is string => typeof v === 'string' && pattern.test(v) && safeText(v, 150);

// ---- BC03 canonical bytes ----
const asciiString = (s: string) => JSON.stringify(s).replace(/[\u007f-\uffff]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
/** Sorted keys, compact separators, integers within the JS safe range, every non-ASCII UTF-16 code unit and DEL as lowercase \uXXXX. */
export function canonicalAscii(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return asciiString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('NON_CANONICAL_NUMBER');
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalAscii).join(',')}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map(k => {
      if (!ASCII_KEY.test(k)) throw new Error('NON_ASCII_KEY');
      if (value[k] === undefined) throw new Error('NON_CANONICAL_UNDEFINED');
      return `${asciiString(k)}:${canonicalAscii(value[k])}`;
    }).join(',')}}`;
  }
  throw new Error('NON_CANONICAL_VALUE');
}
export const canonicalBytes = (value: unknown): Buffer => Buffer.from(canonicalAscii(value), 'ascii');
export const boundSha256 = (value: unknown): string => sha256(canonicalAscii(value));
export type StrictParse = { ok: true; value: unknown } | { ok: false; reason: 'EMPTY' | 'OVERSIZE' | 'INVALID_UTF8' | 'INVALID_JSON' | 'NOT_CANONICAL' };
/** Duplicate keys, alternate escapes, whitespace, key order, floats and BOMs all fail the canonical-equality check. */
export function parseCanonicalJson(raw: Uint8Array, maxBytes: number): StrictParse {
  if (raw.byteLength === 0) return { ok: false, reason: 'EMPTY' };
  if (raw.byteLength > maxBytes) return { ok: false, reason: 'OVERSIZE' };
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(raw); } catch { return { ok: false, reason: 'INVALID_UTF8' }; }
  let value: unknown;
  try { value = JSON.parse(text); } catch { return { ok: false, reason: 'INVALID_JSON' }; }
  try { return canonicalAscii(value) === text ? { ok: true, value } : { ok: false, reason: 'NOT_CANONICAL' }; } catch { return { ok: false, reason: 'NOT_CANONICAL' }; }
}
/** The bound request digest. The v1 serializer is never used for a bound request. */
export const boundRequestSha256 = (request: ControlledEvaluateRequest): string => boundSha256(request);

function copyOwner(v: unknown): DraftPrincipal | null {
  if (!record(v) || !exact(v, ['userId', 'orgId', 'teamId'])) return null;
  const { userId, orgId, teamId } = v;
  return [userId, orgId, teamId].every(x => typeof x === 'string' && PRINCIPAL.test(x))
    ? { userId: userId as string, orgId: orgId as string, teamId: teamId as string } : null;
}

// ---- BC01 key ----
export interface BoundKeyParts { owner: DraftPrincipal; sourceRecordId: string; requestSha256: string }
/** Fixed-order key input: [newSchema,userId,orgId,teamId,sourceRecordId,recomputedRequestSha256,newEffect]. No job, version, config or HTML identity. */
export function boundKeySerialization(parts: BoundKeyParts): string | null {
  const owner = copyOwner(parts.owner);
  if (!owner || typeof parts.sourceRecordId !== 'string' || !SOURCE_ID.test(parts.sourceRecordId)
    || !parts.sourceRecordId.startsWith(SYNTHETIC_SOURCE_PREFIX) || !hash(parts.requestSha256)) return null;
  return canonicalAscii([BOUND_SCHEMA, owner.userId, owner.orgId, owner.teamId, parts.sourceRecordId, parts.requestSha256, BOUND_EFFECT]);
}
export function boundOperationKey(parts: BoundKeyParts): string | null {
  const serialized = boundKeySerialization(parts);
  return serialized === null ? null : sha256(serialized);
}
export const boundAttemptIdFor = (key: string): string => `ncr-bound-${key.slice(0, 48)}`;

// ---- BC02 config ----
export interface BoundConfig {
  schemaRevision: typeof BOUND_SCHEMA; policyRevision: string; transformRevision: string; endpointId: string; storeId: string;
  authReference: string; authScope: string; identityTrust: typeof IDENTITY_TRUST; production: false; webOrigin: string; proxyPath: typeof BOUND_PROXY_PATH;
  engineOrigin: string; engineChallengePath: typeof ENGINE_CHALLENGE_PATH; engineEvaluatePath: typeof ENGINE_EVALUATE_PATH;
  instanceId: string; storeBindingId: string; timeoutMs: number; maxRequestBytes: typeof MAX_REQUEST_BYTES; maxResponseBytes: typeof MAX_RESPONSE_BYTES;
  configDigest: string;
}
export type BoundConfigInput = Pick<BoundConfig, 'policyRevision' | 'transformRevision' | 'endpointId' | 'storeId' | 'authReference' | 'authScope'
  | 'webOrigin' | 'engineOrigin' | 'instanceId' | 'storeBindingId' | 'timeoutMs'>;
const CONFIG_KEYS = ['schemaRevision', 'policyRevision', 'transformRevision', 'endpointId', 'storeId', 'authReference', 'authScope', 'identityTrust', 'production',
  'webOrigin', 'proxyPath', 'engineOrigin', 'engineChallengePath', 'engineEvaluatePath', 'instanceId', 'storeBindingId', 'timeoutMs', 'maxRequestBytes',
  'maxResponseBytes', 'configDigest'] as const;
type ConfigBody = Omit<BoundConfig, 'configDigest'>;
const configDigestOf = (body: ConfigBody): string => boundSha256(body);
const FIXTURE_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
/** Absolute http(s) origin only: no userinfo, path, query, fragment or default port. Offline fixtures use reserved .invalid or loopback names. */
export function originValid(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 200) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.origin === v && u.username === '' && u.password === ''
      && (u.hostname.endsWith('.invalid') || FIXTURE_HOSTS.includes(u.hostname));
  } catch { return false; }
}
export function parseBoundConfig(v: unknown): BoundConfig | null {
  if (!record(v) || !exact(v, CONFIG_KEYS) || v.schemaRevision !== BOUND_SCHEMA || v.identityTrust !== IDENTITY_TRUST || v.production !== false
    || !label(v.policyRevision) || !label(v.transformRevision) || !label(v.endpointId) || !label(v.storeId) || !label(v.authReference) || !label(v.authScope)
    || !originValid(v.webOrigin) || !originValid(v.engineOrigin) || v.proxyPath !== BOUND_PROXY_PATH || v.engineChallengePath !== ENGINE_CHALLENGE_PATH
    || v.engineEvaluatePath !== ENGINE_EVALUATE_PATH || typeof v.instanceId !== 'string' || !UUID.test(v.instanceId) || !hash(v.storeBindingId)
    || !Number.isInteger(v.timeoutMs) || (v.timeoutMs as number) < 1000 || (v.timeoutMs as number) > 30_000
    || v.maxRequestBytes !== MAX_REQUEST_BYTES || v.maxResponseBytes !== MAX_RESPONSE_BYTES || !hash(v.configDigest)) return null;
  const body: ConfigBody = { schemaRevision: BOUND_SCHEMA, policyRevision: v.policyRevision as string, transformRevision: v.transformRevision as string,
    endpointId: v.endpointId as string, storeId: v.storeId as string, authReference: v.authReference as string, authScope: v.authScope as string,
    identityTrust: IDENTITY_TRUST, production: false, webOrigin: v.webOrigin as string, proxyPath: BOUND_PROXY_PATH, engineOrigin: v.engineOrigin as string,
    engineChallengePath: ENGINE_CHALLENGE_PATH, engineEvaluatePath: ENGINE_EVALUATE_PATH, instanceId: v.instanceId as string,
    storeBindingId: v.storeBindingId as string, timeoutMs: v.timeoutMs as number, maxRequestBytes: MAX_REQUEST_BYTES, maxResponseBytes: MAX_RESPONSE_BYTES };
  return configDigestOf(body) === v.configDigest ? { ...body, configDigest: v.configDigest as string } : null;
}
export function makeBoundConfig(input: BoundConfigInput): BoundConfig | null {
  const body: ConfigBody = { schemaRevision: BOUND_SCHEMA, policyRevision: input.policyRevision, transformRevision: input.transformRevision,
    endpointId: input.endpointId, storeId: input.storeId, authReference: input.authReference, authScope: input.authScope, identityTrust: IDENTITY_TRUST,
    production: false, webOrigin: input.webOrigin, proxyPath: BOUND_PROXY_PATH, engineOrigin: input.engineOrigin, engineChallengePath: ENGINE_CHALLENGE_PATH,
    engineEvaluatePath: ENGINE_EVALUATE_PATH, instanceId: input.instanceId, storeBindingId: input.storeBindingId, timeoutMs: input.timeoutMs,
    maxRequestBytes: MAX_REQUEST_BYTES, maxResponseBytes: MAX_RESPONSE_BYTES };
  try { return parseBoundConfig({ ...body, configDigest: configDigestOf(body) }); } catch { return null; }
}

function parseOutput(v: unknown): OperationOutputIdentity | null {
  if (!record(v) || !exact(v, ['generatedAt', 'sourceHash', 'htmlSha256', 'artifactId', 'filename']) || !iso(v.generatedAt) || !hash(v.sourceHash)
    || !hash(v.htmlSha256) || !label(v.artifactId, ARTIFACT_ID) || !safeText(v.filename, 200)) return null;
  return { generatedAt: v.generatedAt, sourceHash: v.sourceHash, htmlSha256: v.htmlSha256, artifactId: v.artifactId as string, filename: v.filename as string };
}

// ---- Envelope ----
export interface BoundEnvelope {
  schema: typeof BOUND_SCHEMA; operationKey: string; effectKind: typeof BOUND_EFFECT; owner: DraftPrincipal; sourceRecordId: string; requestSha256: string;
  jobId: string; versionId: string | null; attemptId: string; payloadSha256: string; phase: typeof BOUND_PHASE; riskLevel: typeof BOUND_RISK; callLimit: 1;
  fixtureDisclosure: typeof BOUND_DISCLOSURE; retention: typeof RETENTION_POSTURE; revokePosture: typeof REVOKE_POSTURE; config: BoundConfig; output: OperationOutputIdentity;
}
const ENVELOPE_KEYS = ['schema', 'operationKey', 'effectKind', 'owner', 'sourceRecordId', 'requestSha256', 'jobId', 'versionId', 'attemptId', 'payloadSha256',
  'phase', 'riskLevel', 'callLimit', 'fixtureDisclosure', 'retention', 'revokePosture', 'config', 'output'] as const;
export function parseBoundEnvelope(v: unknown): BoundEnvelope | null {
  if (!record(v) || !exact(v, ENVELOPE_KEYS) || v.schema !== BOUND_SCHEMA || v.effectKind !== BOUND_EFFECT || v.phase !== BOUND_PHASE || v.riskLevel !== BOUND_RISK
    || v.callLimit !== 1 || v.fixtureDisclosure !== BOUND_DISCLOSURE || v.retention !== RETENTION_POSTURE || v.revokePosture !== REVOKE_POSTURE) return null;
  const owner = copyOwner(v.owner);
  const config = parseBoundConfig(v.config);
  const output = parseOutput(v.output);
  if (!owner || !config || !output || typeof v.sourceRecordId !== 'string' || typeof v.jobId !== 'string' || !VERSION_ID.test(v.jobId)
    || !(v.versionId === null || (typeof v.versionId === 'string' && VERSION_ID.test(v.versionId))) || !label(v.attemptId, ATTEMPT_ID)
    || !hash(v.requestSha256) || !hash(v.payloadSha256) || !hash(v.operationKey)) return null;
  const key = boundOperationKey({ owner, sourceRecordId: v.sourceRecordId, requestSha256: v.requestSha256 });
  if (key === null || key !== v.operationKey) return null;
  return { schema: BOUND_SCHEMA, operationKey: key, effectKind: BOUND_EFFECT, owner, sourceRecordId: v.sourceRecordId, requestSha256: v.requestSha256,
    jobId: v.jobId, versionId: v.versionId as string | null, attemptId: v.attemptId as string, payloadSha256: v.payloadSha256, phase: BOUND_PHASE,
    riskLevel: BOUND_RISK, callLimit: 1, fixtureDisclosure: BOUND_DISCLOSURE, retention: RETENTION_POSTURE, revokePosture: REVOKE_POSTURE, config, output };
}
export interface BoundEnvelopeParts {
  owner: DraftPrincipal; sourceRecordId: string; requestSha256: string; jobId: string; versionId: string | null; attemptId: string;
  payloadSha256: string; config: BoundConfig; output: OperationOutputIdentity;
}
export function buildBoundEnvelope(parts: BoundEnvelopeParts): BoundEnvelope | null {
  const key = boundOperationKey(parts);
  if (key === null) return null;
  return parseBoundEnvelope({ schema: BOUND_SCHEMA, operationKey: key, effectKind: BOUND_EFFECT, owner: { ...parts.owner }, sourceRecordId: parts.sourceRecordId,
    requestSha256: parts.requestSha256, jobId: parts.jobId, versionId: parts.versionId, attemptId: parts.attemptId, payloadSha256: parts.payloadSha256,
    phase: BOUND_PHASE, riskLevel: BOUND_RISK, callLimit: 1, fixtureDisclosure: BOUND_DISCLOSURE, retention: RETENTION_POSTURE, revokePosture: REVOKE_POSTURE,
    config: { ...parts.config }, output: { ...parts.output } });
}
export const boundEnvelopeSha256 = (envelope: BoundEnvelope): string => boundSha256(envelope);
/** Joins envelope, config, instance, store, owner and payload. riskLevel R1 stays the requested class; the engine risk is a separate receipt field. */
export const boundBindingDigest = (envelope: BoundEnvelope): string => boundSha256(['cvf.boundReceiptBinding.v1', boundEnvelopeSha256(envelope),
  envelope.config.configDigest, envelope.config.instanceId, envelope.config.storeBindingId, ownerSha256(envelope.owner), envelope.payloadSha256]);

// ---- BC02 receipt ----
export interface BoundLedgerReference { requestId: string; blockHash: string }
export interface BoundReceipt {
  receiptId: string; decision: string; evaluatedAt: string; riskLevel: typeof BOUND_RISK; engineRiskLevel: string; bindingDigest: string; ledgerReference: BoundLedgerReference;
}
export function parseLedgerReference(v: unknown): BoundLedgerReference | null {
  return record(v) && exact(v, ['requestId', 'blockHash']) && typeof v.requestId === 'string' && RECEIPT_ID.test(v.requestId) && hash(v.blockHash)
    ? { requestId: v.requestId, blockHash: v.blockHash } : null;
}
export function parseBoundReceipt(v: unknown): BoundReceipt | null {
  if (!record(v) || !exact(v, ['receiptId', 'decision', 'evaluatedAt', 'riskLevel', 'engineRiskLevel', 'bindingDigest', 'ledgerReference'])
    || typeof v.receiptId !== 'string' || !RECEIPT_ID.test(v.receiptId) || typeof v.decision !== 'string' || !DECISION.test(v.decision)
    || !safeText(v.evaluatedAt, 64) || v.riskLevel !== BOUND_RISK || typeof v.engineRiskLevel !== 'string' || !/^R[0-4]$/.test(v.engineRiskLevel)
    || !hash(v.bindingDigest)) return null;
  const ledgerReference = parseLedgerReference(v.ledgerReference);
  return ledgerReference ? { receiptId: v.receiptId, decision: v.decision, evaluatedAt: v.evaluatedAt as string, riskLevel: BOUND_RISK,
    engineRiskLevel: v.engineRiskLevel, bindingDigest: v.bindingDigest, ledgerReference } : null;
}

// ---- Lifecycle records ----
export interface BoundReservation { schema: typeof BOUND_SCHEMA; kind: 'RESERVATION'; slot: number; ownerSha256: string; operationKey: string; configDigest: string; reservedAt: string }
export interface BoundIntent { schema: typeof BOUND_SCHEMA; kind: 'INTENT'; slot: number; operationKey: string; envelopeSha256: string; envelope: BoundEnvelope; createdAt: string }
export interface BoundStart { schema: typeof BOUND_SCHEMA; kind: 'STARTED'; operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string; startedAt: string }
export interface BoundOutcome {
  schema: typeof BOUND_SCHEMA; kind: 'OUTCOME'; operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string;
  outcome: OperationOutcomeKind; receipt: BoundReceipt | null; reason: string | null; completedAt: string;
}
export interface BoundOutcomeInput { outcome: OperationOutcomeKind; receipt: BoundReceipt | null; reason: string | null }
const slotValid = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 256;
const RESERVATION_KEYS = ['schema', 'kind', 'slot', 'ownerSha256', 'operationKey', 'configDigest', 'reservedAt'] as const;
const INTENT_KEYS = ['schema', 'kind', 'slot', 'operationKey', 'envelopeSha256', 'envelope', 'createdAt'] as const;
const START_KEYS = ['schema', 'kind', 'operationKey', 'envelopeSha256', 'attemptId', 'startNonce', 'startedAt'] as const;
const OUTCOME_KEYS = ['schema', 'kind', 'operationKey', 'envelopeSha256', 'attemptId', 'startNonce', 'outcome', 'receipt', 'reason', 'completedAt'] as const;

export const makeBoundReservation = (slot: number, owner: DraftPrincipal, key: string, configDigest: string, now: number): BoundReservation =>
  ({ schema: BOUND_SCHEMA, kind: 'RESERVATION', slot, ownerSha256: ownerSha256(owner), operationKey: key, configDigest, reservedAt: new Date(now).toISOString() });
export function parseBoundReservation(v: unknown): BoundReservation | null {
  if (!record(v) || !exact(v, RESERVATION_KEYS) || v.schema !== BOUND_SCHEMA || v.kind !== 'RESERVATION' || !slotValid(v.slot)
    || !hash(v.ownerSha256) || !hash(v.operationKey) || !hash(v.configDigest) || !iso(v.reservedAt)) return null;
  return { schema: BOUND_SCHEMA, kind: 'RESERVATION', slot: v.slot, ownerSha256: v.ownerSha256, operationKey: v.operationKey, configDigest: v.configDigest, reservedAt: v.reservedAt };
}
const intentOf = (slot: number, envelope: BoundEnvelope, createdAt: string): BoundIntent =>
  ({ schema: BOUND_SCHEMA, kind: 'INTENT', slot, operationKey: envelope.operationKey, envelopeSha256: boundEnvelopeSha256(envelope), envelope, createdAt });
export const makeBoundIntent = (slot: number, envelope: BoundEnvelope, now: number): BoundIntent => intentOf(slot, envelope, new Date(now).toISOString());
export function parseBoundIntent(v: unknown): BoundIntent | null {
  if (!record(v) || !exact(v, INTENT_KEYS) || v.schema !== BOUND_SCHEMA || v.kind !== 'INTENT' || !slotValid(v.slot) || !iso(v.createdAt)) return null;
  const envelope = parseBoundEnvelope(v.envelope);
  if (!envelope || v.operationKey !== envelope.operationKey || v.envelopeSha256 !== boundEnvelopeSha256(envelope)) return null;
  return intentOf(v.slot, envelope, v.createdAt);
}
export const makeBoundStart = (envelope: BoundEnvelope, startNonce: string, now: number): BoundStart =>
  ({ schema: BOUND_SCHEMA, kind: 'STARTED', operationKey: envelope.operationKey, envelopeSha256: boundEnvelopeSha256(envelope), attemptId: envelope.attemptId,
    startNonce, startedAt: new Date(now).toISOString() });
export function parseBoundStart(v: unknown): BoundStart | null {
  if (!record(v) || !exact(v, START_KEYS) || v.schema !== BOUND_SCHEMA || v.kind !== 'STARTED' || !hash(v.operationKey) || !hash(v.envelopeSha256)
    || !label(v.attemptId, ATTEMPT_ID) || typeof v.startNonce !== 'string' || !/^[a-f0-9]{32}$/.test(v.startNonce) || !iso(v.startedAt)) return null;
  return { schema: BOUND_SCHEMA, kind: 'STARTED', operationKey: v.operationKey, envelopeSha256: v.envelopeSha256, attemptId: v.attemptId as string,
    startNonce: v.startNonce, startedAt: v.startedAt };
}
export const makeBoundOutcome = (start: BoundStart, input: BoundOutcomeInput, now: number): BoundOutcome =>
  ({ schema: BOUND_SCHEMA, kind: 'OUTCOME', operationKey: start.operationKey, envelopeSha256: start.envelopeSha256, attemptId: start.attemptId,
    startNonce: start.startNonce, outcome: input.outcome, receipt: input.receipt ? { ...input.receipt, ledgerReference: { ...input.receipt.ledgerReference } } : null,
    reason: input.reason, completedAt: new Date(now).toISOString() });
export function parseBoundOutcome(v: unknown): BoundOutcome | null {
  if (!record(v) || !exact(v, OUTCOME_KEYS) || v.schema !== BOUND_SCHEMA || v.kind !== 'OUTCOME' || !hash(v.operationKey) || !hash(v.envelopeSha256)
    || !label(v.attemptId, ATTEMPT_ID) || typeof v.startNonce !== 'string' || !/^[a-f0-9]{32}$/.test(v.startNonce) || !iso(v.completedAt)
    || typeof v.outcome !== 'string' || !(OUTCOMES as readonly string[]).includes(v.outcome)
    || !(v.reason === null || (typeof v.reason === 'string' && REASON.test(v.reason)))) return null;
  const receipt = v.receipt === null ? null : parseBoundReceipt(v.receipt);
  if (v.receipt !== null && !receipt) return null;
  const verified = v.outcome === 'RECEIPT_VERIFIED' && receipt !== null && receipt.decision !== 'DENY' && v.reason === null;
  const denied = v.outcome === 'DENIED' && receipt !== null && receipt.decision === 'DENY' && v.reason === null;
  const open = (v.outcome === 'FAILED_BEFORE_SEND' || v.outcome === 'OUTCOME_UNKNOWN') && receipt === null && v.reason !== null;
  if (!verified && !denied && !open) return null;
  return { schema: BOUND_SCHEMA, kind: 'OUTCOME', operationKey: v.operationKey, envelopeSha256: v.envelopeSha256, attemptId: v.attemptId as string,
    startNonce: v.startNonce, outcome: v.outcome as OperationOutcomeKind, receipt, reason: v.reason as string | null, completedAt: v.completedAt };
}
export function boundRecordBytes(value: BoundReservation | BoundIntent | BoundStart | BoundOutcome): Buffer | null {
  const bytes = canonicalBytes(value);
  return bytes.byteLength > 0 && bytes.byteLength <= MAX_OPERATION_RECORD_BYTES ? bytes : null;
}
export type BoundRecordDecode = { kind: 'OK'; value: unknown } | { kind: 'CORRUPT' } | { kind: 'UNSUPPORTED' };
export function decodeBoundRecord(bytes: Uint8Array): BoundRecordDecode {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_OPERATION_RECORD_BYTES) return { kind: 'CORRUPT' };
  let loose: unknown;
  try { loose = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return { kind: 'CORRUPT' }; }
  if (!record(loose)) return { kind: 'CORRUPT' };
  // A same-family record of another revision is UNSUPPORTED rather than corrupt.
  if (typeof loose.schema === 'string' && loose.schema !== BOUND_SCHEMA && loose.schema.startsWith('cvf.artifactsBoundReceiptOperation.')) return { kind: 'UNSUPPORTED' };
  const parsed = parseCanonicalJson(bytes, MAX_OPERATION_RECORD_BYTES);
  return parsed.ok ? { kind: 'OK', value: parsed.value } : { kind: 'CORRUPT' };
}

// ---- BC10 nonsecret disclosure shape. Type only: the validator lives in the component so no client bundle imports this module at runtime. ----
export const BOUND_SENT_FIELDS = ['EXCERPT_500_UTF16_UNITS', 'ARTIFACT_ID', 'ATTEMPT_ID', 'OWNER_USER_ORG_TEAM'] as const;
export const BOUND_ACCESS = 'OWNER_SCOPED_ENGINE_LEDGER' as const;
export const BOUND_COST = 'UNKNOWN_NOT_AUTHORIZED' as const;
export interface BoundDisclosure {
  effectBoundary: typeof BOUND_EFFECT; mode: typeof BOUND_DISCLOSURE;
  destination: { endpointId: string; engineOrigin: string; storeId: string };
  sent: readonly string[]; access: typeof BOUND_ACCESS; retention: typeof RETENTION_POSTURE; attemptLimit: 1; cost: typeof BOUND_COST;
  requestedRisk: typeof BOUND_RISK; policyRevision: string; configDigest: string;
}
export function boundDisclosureOf(config: BoundConfig): BoundDisclosure {
  return { effectBoundary: BOUND_EFFECT, mode: BOUND_DISCLOSURE, destination: { endpointId: config.endpointId, engineOrigin: config.engineOrigin, storeId: config.storeId },
    sent: [...BOUND_SENT_FIELDS], access: BOUND_ACCESS, retention: RETENTION_POSTURE, attemptLimit: 1, cost: BOUND_COST, requestedRisk: BOUND_RISK,
    policyRevision: config.policyRevision, configDigest: config.configDigest };
}

// ---- BC05 wire bodies ----
export interface WireOwnerBase { schema: typeof WIRE_SCHEMA; owner: DraftPrincipal; operationKey: string; attemptId: string; configDigest: string; challengeNonce: string }
export interface ChallengeWire extends WireOwnerBase { kind: 'CHALLENGE' }
export interface EvaluateWire extends WireOwnerBase {
  kind: 'EVALUATE'; requestSha256: string; artifactId: string; payloadSha256: string; envelopeSha256: string; phase: typeof BOUND_PHASE; riskLevel: typeof BOUND_RISK;
  instanceId: string; storeBindingId: string; evaluate: ControlledEvaluateRequest;
}
const COMMON_KEYS = ['schema', 'kind', 'owner', 'operationKey', 'attemptId', 'configDigest', 'challengeNonce'] as const;
const EVALUATE_KEYS = [...COMMON_KEYS, 'requestSha256', 'artifactId', 'payloadSha256', 'envelopeSha256', 'phase', 'riskLevel', 'instanceId', 'storeBindingId', 'evaluate'] as const;
export function parseEvaluateRequest(v: unknown): ControlledEvaluateRequest | null {
  if (!record(v) || !exact(v, ['request_id', 'artifact_id', 'payload', 'cvf_phase', 'cvf_risk_level']) || typeof v.request_id !== 'string'
    || typeof v.artifact_id !== 'string' || !record(v.payload) || !exact(v.payload, ['content']) || typeof v.payload.content !== 'string'
    || v.payload.content.length > 500 || v.cvf_phase !== BOUND_PHASE || v.cvf_risk_level !== BOUND_RISK) return null;
  return { request_id: v.request_id, artifact_id: v.artifact_id, payload: { content: v.payload.content }, cvf_phase: BOUND_PHASE, cvf_risk_level: BOUND_RISK };
}
export function parseWireRequest(v: unknown): ChallengeWire | EvaluateWire | null {
  if (!record(v) || v.schema !== WIRE_SCHEMA || (v.kind !== 'CHALLENGE' && v.kind !== 'EVALUATE')) return null;
  if (!exact(v, v.kind === 'CHALLENGE' ? COMMON_KEYS : EVALUATE_KEYS)) return null;
  const owner = copyOwner(v.owner);
  if (!owner || !hash(v.operationKey) || !label(v.attemptId, ATTEMPT_ID) || !hash(v.configDigest) || !hash(v.challengeNonce)) return null;
  const base: WireOwnerBase = { schema: WIRE_SCHEMA, owner, operationKey: v.operationKey, attemptId: v.attemptId as string, configDigest: v.configDigest, challengeNonce: v.challengeNonce };
  if (v.kind === 'CHALLENGE') return { ...base, kind: 'CHALLENGE' };
  const evaluate = parseEvaluateRequest(v.evaluate);
  if (!evaluate || !hash(v.requestSha256) || !label(v.artifactId, ARTIFACT_ID) || !hash(v.payloadSha256) || !hash(v.envelopeSha256)
    || v.phase !== BOUND_PHASE || v.riskLevel !== BOUND_RISK || typeof v.instanceId !== 'string' || !UUID.test(v.instanceId) || !hash(v.storeBindingId)
    || evaluate.request_id !== v.attemptId || evaluate.artifact_id !== v.artifactId || evaluate.cvf_phase !== v.phase || evaluate.cvf_risk_level !== v.riskLevel
    || boundRequestSha256(evaluate) !== v.payloadSha256) return null;
  return { ...base, kind: 'EVALUATE', requestSha256: v.requestSha256, artifactId: v.artifactId as string, payloadSha256: v.payloadSha256, envelopeSha256: v.envelopeSha256,
    phase: BOUND_PHASE, riskLevel: BOUND_RISK, instanceId: v.instanceId, storeBindingId: v.storeBindingId, evaluate };
}
export interface ChallengeResult {
  schema: typeof WIRE_SCHEMA; kind: 'CHALLENGE_RESULT'; requestNonce: string; challengeNonce: string; configDigest: string; instanceId: string;
  storeBindingId: string; backend: 'SQLITE'; policyRevision: string; expiresAtMs: number;
}
export function parseChallengeResult(v: unknown): ChallengeResult | null {
  if (!record(v) || !exact(v, ['schema', 'kind', 'requestNonce', 'challengeNonce', 'configDigest', 'instanceId', 'storeBindingId', 'backend', 'policyRevision', 'expiresAtMs'])
    || v.schema !== WIRE_SCHEMA || v.kind !== 'CHALLENGE_RESULT' || !hash(v.requestNonce) || !hash(v.challengeNonce) || !hash(v.configDigest)
    || typeof v.instanceId !== 'string' || !UUID.test(v.instanceId) || !hash(v.storeBindingId) || v.backend !== 'SQLITE' || !label(v.policyRevision)
    || !Number.isSafeInteger(v.expiresAtMs) || (v.expiresAtMs as number) < 0) return null;
  return { schema: WIRE_SCHEMA, kind: 'CHALLENGE_RESULT', requestNonce: v.requestNonce, challengeNonce: v.challengeNonce, configDigest: v.configDigest,
    instanceId: v.instanceId, storeBindingId: v.storeBindingId, backend: 'SQLITE', policyRevision: v.policyRevision as string, expiresAtMs: v.expiresAtMs as number };
}
/** Integer-only projection of the current engine report and execution record: the sections the receipt join needs, with no float risk score. */
export interface ReportProjection {
  request_summary: { request_id: string; artifact_id: string }; decision_analysis: { final_decision: string }; cvf_enforcement: { action: string };
  cvf_risk_level: string; report_metadata: { generated_at: string }; integrity: { has_ledger_reference: boolean };
}
export interface ExecutionProjection { final_decision: string; ledger_attached: boolean }
export interface EvaluateResult {
  schema: typeof WIRE_SCHEMA; kind: 'EVALUATE_RESULT'; requestNonce: string; operationKey: string; attemptId: string; artifactId: string; payloadSha256: string;
  envelopeSha256: string; owner: DraftPrincipal; configDigest: string; instanceId: string; storeBindingId: string; declaredRisk: typeof BOUND_RISK;
  engineRiskLevel: string; ledgerReference: BoundLedgerReference; report: ReportProjection; executionRecord: ExecutionProjection;
}
const EVALUATE_RESULT_KEYS = ['schema', 'kind', 'requestNonce', 'operationKey', 'attemptId', 'artifactId', 'payloadSha256', 'envelopeSha256', 'owner', 'configDigest',
  'instanceId', 'storeBindingId', 'declaredRisk', 'engineRiskLevel', 'ledgerReference', 'report', 'executionRecord'] as const;
function parseReport(v: unknown): ReportProjection | null {
  if (!record(v) || !exact(v, ['request_summary', 'decision_analysis', 'cvf_enforcement', 'cvf_risk_level', 'report_metadata', 'integrity'])) return null;
  const { request_summary: rs, decision_analysis: da, cvf_enforcement: ce, report_metadata: rm, integrity: ig } = v;
  if (!record(rs) || !exact(rs, ['request_id', 'artifact_id']) || typeof rs.request_id !== 'string' || typeof rs.artifact_id !== 'string'
    || !record(da) || !exact(da, ['final_decision']) || typeof da.final_decision !== 'string' || !DECISION.test(da.final_decision)
    || !record(ce) || !exact(ce, ['action']) || typeof ce.action !== 'string' || !DECISION.test(ce.action)
    || typeof v.cvf_risk_level !== 'string' || !/^R[0-4]$/.test(v.cvf_risk_level) || !record(rm) || !exact(rm, ['generated_at']) || !safeText(rm.generated_at, 64)
    || !record(ig) || !exact(ig, ['has_ledger_reference']) || typeof ig.has_ledger_reference !== 'boolean') return null;
  return { request_summary: { request_id: rs.request_id, artifact_id: rs.artifact_id }, decision_analysis: { final_decision: da.final_decision },
    cvf_enforcement: { action: ce.action }, cvf_risk_level: v.cvf_risk_level, report_metadata: { generated_at: rm.generated_at as string },
    integrity: { has_ledger_reference: ig.has_ledger_reference } };
}
export function parseEvaluateResult(v: unknown): EvaluateResult | null {
  if (!record(v) || !exact(v, EVALUATE_RESULT_KEYS) || v.schema !== WIRE_SCHEMA || v.kind !== 'EVALUATE_RESULT' || !hash(v.requestNonce) || !hash(v.operationKey)
    || !label(v.attemptId, ATTEMPT_ID) || !label(v.artifactId, ARTIFACT_ID) || !hash(v.payloadSha256) || !hash(v.envelopeSha256) || !hash(v.configDigest)
    || typeof v.instanceId !== 'string' || !UUID.test(v.instanceId) || !hash(v.storeBindingId) || v.declaredRisk !== BOUND_RISK
    || typeof v.engineRiskLevel !== 'string' || !/^R[0-4]$/.test(v.engineRiskLevel)) return null;
  const owner = copyOwner(v.owner);
  const ledgerReference = parseLedgerReference(v.ledgerReference);
  const report = parseReport(v.report);
  const exec = v.executionRecord;
  if (!owner || !ledgerReference || !report || !record(exec) || !exact(exec, ['final_decision', 'ledger_attached']) || typeof exec.final_decision !== 'string'
    || exec.ledger_attached !== true) return null;
  return { schema: WIRE_SCHEMA, kind: 'EVALUATE_RESULT', requestNonce: v.requestNonce, operationKey: v.operationKey, attemptId: v.attemptId as string,
    artifactId: v.artifactId as string, payloadSha256: v.payloadSha256, envelopeSha256: v.envelopeSha256, owner, configDigest: v.configDigest, instanceId: v.instanceId,
    storeBindingId: v.storeBindingId, declaredRisk: BOUND_RISK, engineRiskLevel: v.engineRiskLevel, ledgerReference, report,
    executionRecord: { final_decision: exec.final_decision, ledger_attached: true } };
}

// ---- BC04 signatures ----
export const authPreimage = (hop: BoundHop, kind: BoundMessageKind, path: string, timestampMs: number, nonce: string, configDigest: string, body: Uint8Array): string =>
  canonicalAscii([AUTH_TAG, hop, kind, 'POST', path, timestampMs, nonce, configDigest, sha256(body)]);
export const computeSignature = (key: Uint8Array, preimage: string): string => createHmac('sha256', key).update(preimage, 'ascii').digest('hex');
export function signaturesEqual(a: string, b: string): boolean {
  return HASH.test(a) && HASH.test(b) && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
export interface HeadersLikeInput { get(name: string): string | null }
export interface AuthHeaderValues { hop: BoundHop; kind: BoundMessageKind; timestampMs: number; nonce: string; config: string; signature: string }
/** Each header exactly once and a bounded ASCII scalar; a joined duplicate value fails the scalar patterns. */
export function readAuthHeaders(headers: HeadersLikeInput): AuthHeaderValues | null {
  const hop = headers.get(AUTH_HEADERS.hop);
  const kind = headers.get(AUTH_HEADERS.kind);
  const timestamp = headers.get(AUTH_HEADERS.timestamp);
  const nonce = headers.get(AUTH_HEADERS.nonce);
  const config = headers.get(AUTH_HEADERS.config);
  const signature = headers.get(AUTH_HEADERS.signature);
  if ((hop !== 'EXPORT_PROXY' && hop !== 'PROXY_ENGINE') || (kind !== 'REQUEST' && kind !== 'RESPONSE') || timestamp === null || !/^[0-9]{1,16}$/.test(timestamp)
    || nonce === null || !HASH.test(nonce) || config === null || !HASH.test(config) || signature === null || !HASH.test(signature)) return null;
  const timestampMs = Number(timestamp);
  return Number.isSafeInteger(timestampMs) ? { hop, kind, timestampMs, nonce, config, signature } : null;
}
export const timestampFresh = (timestampMs: number, now: number): boolean => timestampMs >= now - MAX_SKEW_PAST_MS && timestampMs <= now + MAX_SKEW_FUTURE_MS;
