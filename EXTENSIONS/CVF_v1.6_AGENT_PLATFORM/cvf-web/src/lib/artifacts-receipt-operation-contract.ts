/** Offline fixture contract for one-shot artifacts receipt operations. It grants no runtime, remote or production authority. */
import { SOURCE_ID, VERSION_ID, safeText, sha256, type DraftPrincipal } from './html-draft-recovery-contract';

export const OPERATION_SCHEMA = 'cvf.artifactsReceiptOperation.v1' as const;
export const OPERATION_EFFECT = 'INJECTED_SYNTHETIC_RECEIPT' as const;
export const OPERATION_PHASE = 'REVIEW' as const;
export const OPERATION_RISK = 'R1' as const;
export const SYNTHETIC_DISCLOSURE = 'SYNTHETIC_FIXTURE_NOT_LIVE_GOVERNANCE' as const;
export const RETENTION_POSTURE = 'NO_EXPIRY_DEVELOPMENT_BOUND_NO_GC' as const;
export const REVOKE_POSTURE = 'DISABLE_REVOKE_PERSISTENT_NO_RESET_BY_ABSENCE' as const;
export const SYNTHETIC_SOURCE_PREFIX = 'ncr-synthetic-' as const;
export const MAX_OPERATIONS_PER_OWNER = 256;
export const MAX_OPERATION_RECORD_BYTES = 16_384;
export const OUTCOMES = ['RECEIPT_VERIFIED', 'DENIED', 'FAILED_BEFORE_SEND', 'OUTCOME_UNKNOWN'] as const;
export type OperationOutcomeKind = (typeof OUTCOMES)[number];

const HASH = /^[a-f0-9]{64}$/;
const LABEL = /^[A-Za-z0-9._-]{1,100}$/;
const SYNTHETIC_ID = /^synthetic-[A-Za-z0-9._-]{1,90}$/;
const ATTEMPT_ID = /^[A-Za-z0-9._-]{8,150}$/;
const ARTIFACT_ID = /^[A-Za-z0-9._-]{1,150}$/;
const PRINCIPAL = /^[A-Za-z0-9_-]{1,150}$/;
const REASON = /^[A-Z0-9_]{1,64}$/;
const RECEIPT_ID = /^[A-Za-z0-9._:-]{1,200}$/;
const DECISION = /^[A-Z_]{1,40}$/;

const record = (v: unknown): v is Record<string, unknown> => Object.prototype.toString.call(v) === '[object Object]';
const exact = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const iso = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const hash = (v: unknown): v is string => typeof v === 'string' && HASH.test(v);
const label = (v: unknown, pattern: RegExp = LABEL): v is string => typeof v === 'string' && pattern.test(v) && safeText(v, 150);

/** Typed request and injection seam shared by the helper and the fixture profile. */
export interface ControlledEvaluateRequest {
  request_id: string;
  artifact_id: string;
  payload: { content: string };
  cvf_phase: typeof OPERATION_PHASE;
  cvf_risk_level: typeof OPERATION_RISK;
}
export type ControlledInvoker = (request: ControlledEvaluateRequest, signal: AbortSignal) => Promise<unknown>;
export interface PresenceEntry { requestId: string; actor: string; configDigest: string; storeId: string }
export type PresenceLookup = (query: { requestId: string }) => Promise<PresenceEntry | null | undefined>;

/** Deterministic serialization: sorted keys, no undefined, finite numbers only. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NON_CANONICAL_NUMBER');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map(k => {
      if (value[k] === undefined) throw new Error('NON_CANONICAL_UNDEFINED');
      return `${JSON.stringify(k)}:${canonicalJson(value[k])}`;
    }).join(',')}}`;
  }
  throw new Error('NON_CANONICAL_VALUE');
}

function copyOwner(v: unknown): DraftPrincipal | null {
  if (!record(v) || !exact(v, ['userId', 'orgId', 'teamId'])) return null;
  const { userId, orgId, teamId } = v;
  return [userId, orgId, teamId].every(x => typeof x === 'string' && PRINCIPAL.test(x))
    ? { userId: userId as string, orgId: orgId as string, teamId: teamId as string } : null;
}
export const ownerSha256 = (owner: DraftPrincipal): string => sha256(JSON.stringify([owner.userId, owner.orgId, owner.teamId]));

export interface OperationKeyParts { owner: DraftPrincipal; sourceRecordId: string; requestSha256: string }
/** Fixed-order key input: [schema,userId,orgId,teamId,sourceRecordId,recomputedRequestSha256,effectKind]. No job, version, config or HTML identity. */
export function operationKeySerialization(parts: OperationKeyParts): string | null {
  const owner = copyOwner(parts.owner);
  if (!owner || typeof parts.sourceRecordId !== 'string' || !SOURCE_ID.test(parts.sourceRecordId)
    || !parts.sourceRecordId.startsWith(SYNTHETIC_SOURCE_PREFIX) || !hash(parts.requestSha256)) return null;
  return JSON.stringify([OPERATION_SCHEMA, owner.userId, owner.orgId, owner.teamId, parts.sourceRecordId, parts.requestSha256, OPERATION_EFFECT]);
}
export function operationKey(parts: OperationKeyParts): string | null {
  const serialized = operationKeySerialization(parts);
  return serialized === null ? null : sha256(serialized);
}
export const attemptIdFor = (key: string): string => `ncr-op-${key.slice(0, 48)}`;

export interface OperationConfig {
  schemaRevision: typeof OPERATION_SCHEMA;
  policyRevision: string;
  transformRevision: string;
  endpointId: string;
  storeId: string;
  authReference: string;
  authScope: string;
  identityTrust: 'DECLARED_UNATTESTED';
  production: false;
  configDigest: string;
}
export type OperationConfigInput = Pick<OperationConfig, 'policyRevision' | 'transformRevision' | 'endpointId' | 'storeId' | 'authReference' | 'authScope'>;
const CONFIG_KEYS = ['schemaRevision', 'policyRevision', 'transformRevision', 'endpointId', 'storeId', 'authReference', 'authScope', 'identityTrust', 'production', 'configDigest'] as const;
type ConfigBody = Omit<OperationConfig, 'configDigest'>;
const configDigestOf = (body: ConfigBody): string => sha256(canonicalJson(body));

export function parseOperationConfig(v: unknown): OperationConfig | null {
  if (!record(v) || !exact(v, CONFIG_KEYS) || v.schemaRevision !== OPERATION_SCHEMA || v.identityTrust !== 'DECLARED_UNATTESTED'
    || v.production !== false || !label(v.policyRevision) || !label(v.transformRevision) || !label(v.endpointId, SYNTHETIC_ID)
    || !label(v.storeId, SYNTHETIC_ID) || !label(v.authReference) || !label(v.authScope) || !hash(v.configDigest)) return null;
  const body: ConfigBody = { schemaRevision: OPERATION_SCHEMA, policyRevision: v.policyRevision as string, transformRevision: v.transformRevision as string,
    endpointId: v.endpointId as string, storeId: v.storeId as string, authReference: v.authReference as string, authScope: v.authScope as string,
    identityTrust: 'DECLARED_UNATTESTED', production: false };
  return configDigestOf(body) === v.configDigest ? { ...body, configDigest: v.configDigest as string } : null;
}
export function makeOperationConfig(input: OperationConfigInput): OperationConfig | null {
  const body: ConfigBody = { schemaRevision: OPERATION_SCHEMA, policyRevision: input.policyRevision, transformRevision: input.transformRevision,
    endpointId: input.endpointId, storeId: input.storeId, authReference: input.authReference, authScope: input.authScope,
    identityTrust: 'DECLARED_UNATTESTED', production: false };
  try { return parseOperationConfig({ ...body, configDigest: configDigestOf(body) }); } catch { return null; }
}

export interface OperationOutputIdentity { generatedAt: string; sourceHash: string; htmlSha256: string; artifactId: string; filename: string }
const OUTPUT_KEYS = ['generatedAt', 'sourceHash', 'htmlSha256', 'artifactId', 'filename'] as const;
function parseOutput(v: unknown): OperationOutputIdentity | null {
  if (!record(v) || !exact(v, OUTPUT_KEYS) || !iso(v.generatedAt) || !hash(v.sourceHash) || !hash(v.htmlSha256)
    || !label(v.artifactId, ARTIFACT_ID) || !safeText(v.filename, 200)) return null;
  return { generatedAt: v.generatedAt, sourceHash: v.sourceHash, htmlSha256: v.htmlSha256, artifactId: v.artifactId as string, filename: v.filename as string };
}

export interface OperationEnvelope {
  schema: typeof OPERATION_SCHEMA;
  operationKey: string;
  effectKind: typeof OPERATION_EFFECT;
  owner: DraftPrincipal;
  sourceRecordId: string;
  requestSha256: string;
  jobId: string;
  versionId: string | null;
  attemptId: string;
  payloadSha256: string;
  phase: typeof OPERATION_PHASE;
  riskLevel: typeof OPERATION_RISK;
  callLimit: 1;
  syntheticDisclosure: typeof SYNTHETIC_DISCLOSURE;
  retention: typeof RETENTION_POSTURE;
  revokePosture: typeof REVOKE_POSTURE;
  config: OperationConfig;
  output: OperationOutputIdentity;
}
const ENVELOPE_KEYS = ['schema', 'operationKey', 'effectKind', 'owner', 'sourceRecordId', 'requestSha256', 'jobId', 'versionId', 'attemptId',
  'payloadSha256', 'phase', 'riskLevel', 'callLimit', 'syntheticDisclosure', 'retention', 'revokePosture', 'config', 'output'] as const;

/** Strict parse that returns a rebuilt copy; the caller alias is never retained. */
export function parseEnvelope(v: unknown): OperationEnvelope | null {
  if (!record(v) || !exact(v, ENVELOPE_KEYS) || v.schema !== OPERATION_SCHEMA || v.effectKind !== OPERATION_EFFECT || v.phase !== OPERATION_PHASE
    || v.riskLevel !== OPERATION_RISK || v.callLimit !== 1 || v.syntheticDisclosure !== SYNTHETIC_DISCLOSURE
    || v.retention !== RETENTION_POSTURE || v.revokePosture !== REVOKE_POSTURE) return null;
  const owner = copyOwner(v.owner);
  const config = parseOperationConfig(v.config);
  const output = parseOutput(v.output);
  if (!owner || !config || !output || typeof v.sourceRecordId !== 'string' || typeof v.jobId !== 'string' || !VERSION_ID.test(v.jobId)
    || !(v.versionId === null || (typeof v.versionId === 'string' && VERSION_ID.test(v.versionId))) || !label(v.attemptId, ATTEMPT_ID)
    || !hash(v.requestSha256) || !hash(v.payloadSha256) || !hash(v.operationKey)) return null;
  const key = operationKey({ owner, sourceRecordId: v.sourceRecordId, requestSha256: v.requestSha256 });
  if (key === null || key !== v.operationKey) return null;
  return { schema: OPERATION_SCHEMA, operationKey: key, effectKind: OPERATION_EFFECT, owner, sourceRecordId: v.sourceRecordId,
    requestSha256: v.requestSha256, jobId: v.jobId, versionId: v.versionId as string | null, attemptId: v.attemptId as string,
    payloadSha256: v.payloadSha256, phase: OPERATION_PHASE, riskLevel: OPERATION_RISK, callLimit: 1, syntheticDisclosure: SYNTHETIC_DISCLOSURE,
    retention: RETENTION_POSTURE, revokePosture: REVOKE_POSTURE, config, output };
}
export interface EnvelopeParts {
  owner: DraftPrincipal; sourceRecordId: string; requestSha256: string; jobId: string; versionId: string | null;
  attemptId: string; payloadSha256: string; config: OperationConfig; output: OperationOutputIdentity;
}
export function buildEnvelope(parts: EnvelopeParts): OperationEnvelope | null {
  const key = operationKey(parts);
  if (key === null) return null;
  return parseEnvelope({ schema: OPERATION_SCHEMA, operationKey: key, effectKind: OPERATION_EFFECT, owner: { ...parts.owner },
    sourceRecordId: parts.sourceRecordId, requestSha256: parts.requestSha256, jobId: parts.jobId, versionId: parts.versionId,
    attemptId: parts.attemptId, payloadSha256: parts.payloadSha256, phase: OPERATION_PHASE, riskLevel: OPERATION_RISK, callLimit: 1,
    syntheticDisclosure: SYNTHETIC_DISCLOSURE, retention: RETENTION_POSTURE, revokePosture: REVOKE_POSTURE,
    config: { ...parts.config }, output: { ...parts.output } });
}
export const serializeEnvelope = (envelope: OperationEnvelope): string => canonicalJson(envelope);
export const envelopeSha256 = (envelope: OperationEnvelope): string => sha256(serializeEnvelope(envelope));

export interface OperationReceipt { receiptId: string; decision: string; evaluatedAt: string; riskLevel: string }
function parseReceipt(v: unknown): OperationReceipt | null {
  if (!record(v) || !exact(v, ['receiptId', 'decision', 'evaluatedAt', 'riskLevel']) || typeof v.receiptId !== 'string' || !RECEIPT_ID.test(v.receiptId)
    || typeof v.decision !== 'string' || !DECISION.test(v.decision) || !safeText(v.evaluatedAt, 64)
    || typeof v.riskLevel !== 'string' || !/^R[0-4]$/.test(v.riskLevel)) return null;
  return { receiptId: v.receiptId, decision: v.decision, evaluatedAt: v.evaluatedAt as string, riskLevel: v.riskLevel };
}

export interface ReservationRecord { schema: typeof OPERATION_SCHEMA; kind: 'RESERVATION'; slot: number; ownerSha256: string; operationKey: string; configDigest: string; reservedAt: string }
export interface IntentRecord { schema: typeof OPERATION_SCHEMA; kind: 'INTENT'; slot: number; operationKey: string; envelopeSha256: string; envelope: OperationEnvelope; createdAt: string }
export interface StartRecord { schema: typeof OPERATION_SCHEMA; kind: 'STARTED'; operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string; startedAt: string }
export interface OutcomeRecord {
  schema: typeof OPERATION_SCHEMA; kind: 'OUTCOME'; operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string;
  outcome: OperationOutcomeKind; receipt: OperationReceipt | null; reason: string | null; completedAt: string;
}
export interface OutcomeInput { outcome: OperationOutcomeKind; receipt: OperationReceipt | null; reason: string | null }
const slotValid = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < MAX_OPERATIONS_PER_OWNER;
const RESERVATION_KEYS = ['schema', 'kind', 'slot', 'ownerSha256', 'operationKey', 'configDigest', 'reservedAt'] as const;
const INTENT_KEYS = ['schema', 'kind', 'slot', 'operationKey', 'envelopeSha256', 'envelope', 'createdAt'] as const;
const START_KEYS = ['schema', 'kind', 'operationKey', 'envelopeSha256', 'attemptId', 'startNonce', 'startedAt'] as const;
const OUTCOME_KEYS = ['schema', 'kind', 'operationKey', 'envelopeSha256', 'attemptId', 'startNonce', 'outcome', 'receipt', 'reason', 'completedAt'] as const;

export const makeReservation = (slot: number, owner: DraftPrincipal, key: string, configDigest: string, now: number): ReservationRecord =>
  ({ schema: OPERATION_SCHEMA, kind: 'RESERVATION', slot, ownerSha256: ownerSha256(owner), operationKey: key, configDigest, reservedAt: new Date(now).toISOString() });
export function parseReservation(v: unknown): ReservationRecord | null {
  if (!record(v) || !exact(v, RESERVATION_KEYS) || v.schema !== OPERATION_SCHEMA || v.kind !== 'RESERVATION' || !slotValid(v.slot)
    || !hash(v.ownerSha256) || !hash(v.operationKey) || !hash(v.configDigest) || !iso(v.reservedAt)) return null;
  return { schema: OPERATION_SCHEMA, kind: 'RESERVATION', slot: v.slot, ownerSha256: v.ownerSha256, operationKey: v.operationKey, configDigest: v.configDigest, reservedAt: v.reservedAt };
}
const intentOf = (slot: number, envelope: OperationEnvelope, createdAt: string): IntentRecord =>
  ({ schema: OPERATION_SCHEMA, kind: 'INTENT', slot, operationKey: envelope.operationKey, envelopeSha256: envelopeSha256(envelope), envelope, createdAt });
export const makeIntent = (slot: number, envelope: OperationEnvelope, now: number): IntentRecord => intentOf(slot, envelope, new Date(now).toISOString());
export function parseIntent(v: unknown): IntentRecord | null {
  if (!record(v) || !exact(v, INTENT_KEYS) || v.schema !== OPERATION_SCHEMA || v.kind !== 'INTENT' || !slotValid(v.slot) || !iso(v.createdAt)) return null;
  const envelope = parseEnvelope(v.envelope);
  if (!envelope || v.operationKey !== envelope.operationKey || v.envelopeSha256 !== envelopeSha256(envelope)) return null;
  return intentOf(v.slot, envelope, v.createdAt);
}
export const makeStart = (envelope: OperationEnvelope, startNonce: string, now: number): StartRecord =>
  ({ schema: OPERATION_SCHEMA, kind: 'STARTED', operationKey: envelope.operationKey, envelopeSha256: envelopeSha256(envelope), attemptId: envelope.attemptId, startNonce, startedAt: new Date(now).toISOString() });
export function parseStart(v: unknown): StartRecord | null {
  if (!record(v) || !exact(v, START_KEYS) || v.schema !== OPERATION_SCHEMA || v.kind !== 'STARTED' || !hash(v.operationKey) || !hash(v.envelopeSha256)
    || !label(v.attemptId, ATTEMPT_ID) || typeof v.startNonce !== 'string' || !/^[a-f0-9]{32}$/.test(v.startNonce) || !iso(v.startedAt)) return null;
  return { schema: OPERATION_SCHEMA, kind: 'STARTED', operationKey: v.operationKey, envelopeSha256: v.envelopeSha256, attemptId: v.attemptId as string, startNonce: v.startNonce, startedAt: v.startedAt };
}
export const makeOutcome = (start: StartRecord, input: OutcomeInput, now: number): OutcomeRecord =>
  ({ schema: OPERATION_SCHEMA, kind: 'OUTCOME', operationKey: start.operationKey, envelopeSha256: start.envelopeSha256, attemptId: start.attemptId,
    startNonce: start.startNonce, outcome: input.outcome, receipt: input.receipt ? { ...input.receipt } : null, reason: input.reason, completedAt: new Date(now).toISOString() });
export function parseOutcome(v: unknown): OutcomeRecord | null {
  if (!record(v) || !exact(v, OUTCOME_KEYS) || v.schema !== OPERATION_SCHEMA || v.kind !== 'OUTCOME' || !hash(v.operationKey) || !hash(v.envelopeSha256)
    || !label(v.attemptId, ATTEMPT_ID) || typeof v.startNonce !== 'string' || !/^[a-f0-9]{32}$/.test(v.startNonce) || !iso(v.completedAt)
    || typeof v.outcome !== 'string' || !(OUTCOMES as readonly string[]).includes(v.outcome)
    || !(v.reason === null || (typeof v.reason === 'string' && REASON.test(v.reason)))) return null;
  const receipt = v.receipt === null ? null : parseReceipt(v.receipt);
  if (v.receipt !== null && !receipt) return null;
  const verified = v.outcome === 'RECEIPT_VERIFIED' && receipt !== null && receipt.decision !== 'DENY' && v.reason === null;
  const denied = v.outcome === 'DENIED' && receipt !== null && receipt.decision === 'DENY' && v.reason === null;
  const open = (v.outcome === 'FAILED_BEFORE_SEND' || v.outcome === 'OUTCOME_UNKNOWN') && receipt === null && v.reason !== null;
  if (!verified && !denied && !open) return null;
  return { schema: OPERATION_SCHEMA, kind: 'OUTCOME', operationKey: v.operationKey, envelopeSha256: v.envelopeSha256, attemptId: v.attemptId as string,
    startNonce: v.startNonce, outcome: v.outcome as OperationOutcomeKind, receipt, reason: v.reason as string | null, completedAt: v.completedAt };
}

/** Exact record bytes. Oversized records return null and must never be written. */
export function recordBytes(value: ReservationRecord | IntentRecord | StartRecord | OutcomeRecord): Buffer | null {
  const bytes = Buffer.from(canonicalJson(value), 'utf8');
  return bytes.byteLength > 0 && bytes.byteLength <= MAX_OPERATION_RECORD_BYTES ? bytes : null;
}
export type RecordDecode = { kind: 'OK'; value: unknown } | { kind: 'CORRUPT' } | { kind: 'UNSUPPORTED' };
/** Distinguish corrupt (not canonical UTF-8 JSON) from unsupported (same family, other revision). Parsers still validate shape. */
export function decodeRecord(bytes: Uint8Array): RecordDecode {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_OPERATION_RECORD_BYTES) return { kind: 'CORRUPT' };
  let text: string;
  let value: unknown;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); value = JSON.parse(text); } catch { return { kind: 'CORRUPT' }; }
  if (!record(value)) return { kind: 'CORRUPT' };
  if (typeof value.schema === 'string' && value.schema !== OPERATION_SCHEMA && value.schema.startsWith('cvf.artifactsReceiptOperation.')) return { kind: 'UNSUPPORTED' };
  try { return canonicalJson(value) === text ? { kind: 'OK', value } : { kind: 'CORRUPT' }; } catch { return { kind: 'CORRUPT' }; }
}
