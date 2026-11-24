/**
 * Web attempt lineage journal (T3). Server-only; pure of auth and route concerns.
 *
 * Storage: the opt-in keyed native profile (SQLiteKeyedAtomicRecordStore) over an already initialized,
 * dedicated database. This module never creates a directory or database, never runs DDL, never scans a
 * namespace and never reads or stores token material. Every keyed transaction selects at most four keys.
 *
 * ---------------------------------------------------------------------------------------------------
 * CONFIGURATION (server environment only): CVF_WEB_LINEAGE_CONFIG_JSON, at most 8 KiB, strict schema.
 *   {
 *     "schema": "cvf.webLineageConfig.v1",
 *     "revision": <integer >= 1>,                 // bumped by an explicit maintenance switch
 *     "directory": "<absolute existing directory>", // approved custody; never created here
 *     "namespace": "cvf-web-lineage[...]",          // dedicated namespace (fixed prefix)
 *     "tenants": [                                  // 1..5 entries, unique tenantId
 *       { "tenantId": "<[A-Za-z0-9._-]{1,64}>", "activeSlots": 1..100 (default 100), "archiveSlots": 1..100 (default 100) }
 *     ],
 *     "servicePrincipal": { "principalId": "<[A-Za-z0-9._-]{1,64}>", "tenantId": "<configured tenantId>" }  // optional
 *   }
 * Any deviation (unknown key, wrong type, bound exceeded, relative directory) yields NOT_READY.
 *
 * ---------------------------------------------------------------------------------------------------
 * RECORD LAYOUT (namespace = config.namespace; ids match /^[a-zA-Z0-9._:-]{1,200}$/):
 *   m:<tenantId>                    tenant metadata, <= 48 KiB  (counters, allocation, config revision)
 *   r:<tenantId>:<envelopeId>       active request row,  <= 16 KiB  (envelopeId = canonical id, /^[A-Za-z0-9._-]{1,100}$/)
 *   a:<tenantId>:<envelopeId>       archive row,         <= 16 KiB  (written by maintenance only)
 * tenantId and envelopeId never contain ':' so the key is unambiguous. An offline maintenance tool can enumerate one
 * tenant with a read-only range/LIKE query on `id` ('r:<tenantId>:' / 'a:<tenantId>:'); the request path never enumerates.
 *
 * Transaction key sets (all <= 4): reserve [m, r, a]; settle/finalize [m, r]; read [m, r, a]; capacity probe [m].
 * Maintenance archive of one envelope: [m, r, a]; archive release: [m, a].
 *
 * Capacity: a full 16 KiB request slot (count + bytes) is charged to the tenant at the first ordinal; ordinals 2-4 and
 * settle/finalize consume no new slot. Counters are never repaired; contradictory metadata holds only that tenant.
 *
 * ---------------------------------------------------------------------------------------------------
 * EXPORTED API
 *   Constants:  LINEAGE_CONFIG_ENV, LINEAGE_REQUEST_SLOT_BYTES (16384), LINEAGE_REQUEST_ROW_MAX_BYTES (16384),
 *               LINEAGE_METADATA_ROW_MAX_BYTES (49152), LINEAGE_RECORD_BODY_MAX_BYTES, LINEAGE_MAX_ORDINALS (4),
 *               LINEAGE_MAX_TENANTS (5), LINEAGE_MAX_SLOTS (100), LINEAGE_MAX_IN_FLIGHT_PER_PROCESS (4),
 *               LINEAGE_ARCHIVE_MIN_AGE_MS (1 h), LINEAGE_ARCHIVE_MIN_RETENTION_MS (7 d).
 *   Config:     parseLineageConfig(raw), loadLineageConfig(env?)
 *   Identity:   resolveSessionIdentity(config, provenance), resolveServiceIdentity(config, serviceVerified), ownersEqual(a, b)
 *   Operations: reserve, settle, finalize, readLineage, readTenantCapacity, provisionTenantMetadata (offline/test init only)
 *   Projection: projectObservation, observationFromCanonicalEvidence, toSafeLineageView
 *   Pure helpers for maintenance: metadataKey, requestKey, archiveKey, parseLineageKey, lineageRowByteLimit,
 *               createLineageStore, buildInitialMetadata, validateMetadata, validateRequestRecord, validateArchiveRecord,
 *               buildArchiveRecord, metadataAfterReserve, metadataAfterArchive, metadataAfterArchiveRelease,
 *               isArchiveEligible, recordDigest
 * Result codes: OK | NOT_READY | UNQUALIFIED | CAPACITY | BUSY | CONFLICT | UNAVAILABLE | COMMIT_UNKNOWN | NOT_FOUND | JOIN_DISCREPANT
 * ---------------------------------------------------------------------------------------------------
 * No raw prompt, model output, raw error, credential, token or token hash is accepted by any persisted field: every
 * observation passes through an allowlisted projection with explicit maximum lengths (unknown fields are dropped).
 */
import { createHash } from 'node:crypto';
import path from 'node:path';
import { blocksNewAdmission, initialControl, ownerKey, validControls, withExecution, type AdmissionControl } from './canonical-web-admission-control';
import { validOwnerRelease, type OwnerRelease } from './canonical-web-held-release';
import {
    AtomicSQLiteError,
    SQLiteKeyedAtomicRecordStore,
    type AtomicSQLiteKeyedEntry,
    type AtomicSQLiteKeyedHooks,
} from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';

// -- constants -------------------------------------------------------------------------------------------------------

export const LINEAGE_CONFIG_ENV = 'CVF_WEB_LINEAGE_CONFIG_JSON';
export const LINEAGE_REQUEST_SLOT_BYTES = 16384;
export const LINEAGE_REQUEST_ROW_MAX_BYTES = 16384;
export const LINEAGE_METADATA_ROW_MAX_BYTES = 49152;
/** The archive wrapper adds a few hundred bytes, so the embedded request body is capped below the row bound. */
export const LINEAGE_RECORD_BODY_MAX_BYTES = 15000;
export const LINEAGE_MAX_ORDINALS = 4;
export const LINEAGE_MAX_TENANTS = 5;
export const LINEAGE_MAX_SLOTS = 100;
export const LINEAGE_MAX_IN_FLIGHT_PER_PROCESS = 4;
export const LINEAGE_ARCHIVE_MIN_AGE_MS = 60 * 60 * 1000;
export const LINEAGE_ARCHIVE_MIN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const CONFIG_SCHEMA = 'cvf.webLineageConfig.v1';
const META_SCHEMA = 'cvf.webLineageMeta.v1';
const REQUEST_SCHEMA = 'cvf.webLineageRequest.v1';
const ARCHIVE_SCHEMA = 'cvf.webLineageArchive.v1';
const CONFIG_MAX_BYTES = 8192;

const ID_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const ENVELOPE_ID_RE = /^[a-zA-Z0-9._-]{1,100}$/;
const NAMESPACE_RE = /^cvf-web-lineage[a-zA-Z0-9._-]{0,60}$/;
const REF_RE = /^[a-zA-Z0-9._:/-]{1,120}$/;
const REVISION_RE = /^[a-zA-Z0-9._:+-]{1,80}$/;
const TOKEN_RE = /^[a-zA-Z0-9._:-]{1,64}$/;
const MODEL_RE = /^[a-zA-Z0-9._:/-]{1,96}$/;
const OWNER_FIELD_RE = /^[\x21-\x7e]{1,128}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
// Closed vocabulary for persisted status/error codes: the Gateway GatewayProviderDiagnosticCode union. A free-form
// token pattern would let a provider-controlled or credential-shaped value be stored; unknown values become null.
const DIAGNOSTIC_CODES = ['request_cancelled', 'provider_timeout', 'provider_http_error', 'output_incomplete', 'quota_locked',
    'credential_unavailable', 'destination_denied', 'invalid_identity', 'network_error', 'unknown_error'] as const;

// -- result types ----------------------------------------------------------------------------------------------------

export type LineageFailureCode =
    | 'NOT_READY' | 'UNQUALIFIED' | 'CAPACITY' | 'BUSY' | 'CONFLICT'
    | 'UNAVAILABLE' | 'COMMIT_UNKNOWN' | 'NOT_FOUND' | 'JOIN_DISCREPANT';
export type LineageFailure = { ok: false; code: LineageFailureCode; reason: string; view?: SafeLineageView };
export type LineageSuccess<T> = { ok: true; code: 'OK'; value: T };
export type LineageResult<T> = LineageSuccess<T> | LineageFailure;

function ok<T>(value: T): LineageSuccess<T> { return { ok: true, code: 'OK', value }; }
function fail(code: LineageFailureCode, reason: string, view?: SafeLineageView): LineageFailure {
    return view ? { ok: false, code, reason, view } : { ok: false, code, reason };
}

// -- small validators ------------------------------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
    const actual = Object.keys(value).sort();
    const expected = [...keys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function safeString(value: unknown, pattern: RegExp): string | null {
    return typeof value === 'string' && pattern.test(value) ? value : null;
}
function boundedInt(value: unknown, min: number, max: number): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}
function isCounter(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function isIso(value: unknown): value is string {
    return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function isAbsoluteLocalDirectory(value: unknown): value is string {
    return typeof value === 'string' && value.length <= 512 && path.isAbsolute(value) && !value.startsWith('\\\\') && !value.includes('\0');
}
function byteLength(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

// -- configuration ---------------------------------------------------------------------------------------------------

export type LineageTenantConfig = { tenantId: string; activeSlots: number; archiveSlots: number };
export type LineageServicePrincipal = { principalId: string; tenantId: string };
export type LineageConfig = {
    schema: typeof CONFIG_SCHEMA;
    revision: number;
    directory: string;
    namespace: string;
    tenants: LineageTenantConfig[];
    servicePrincipal: LineageServicePrincipal | null;
};

/** Strict parse. Never throws. Any problem is reported as a safe reason string (no configuration value is echoed). */
export function parseLineageConfig(raw: string | undefined | null): { ok: true; config: LineageConfig } | { ok: false; reason: string } {
    const invalid = (reason: string) => ({ ok: false as const, reason });
    if (typeof raw !== 'string' || raw.trim() === '') return invalid('CONFIG_MISSING');
    if (Buffer.byteLength(raw, 'utf8') > CONFIG_MAX_BYTES) return invalid('CONFIG_TOO_LARGE');
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return invalid('CONFIG_NOT_JSON'); }
    if (!isObject(parsed)) return invalid('CONFIG_SHAPE');
    const allowed = ['schema', 'revision', 'directory', 'namespace', 'tenants', 'servicePrincipal'];
    if (Object.keys(parsed).some(key => !allowed.includes(key))) return invalid('CONFIG_UNKNOWN_KEY');
    if (parsed.schema !== CONFIG_SCHEMA) return invalid('CONFIG_SCHEMA');
    const revision = boundedInt(parsed.revision, 1, 1_000_000);
    if (revision === null) return invalid('CONFIG_REVISION');
    if (!isAbsoluteLocalDirectory(parsed.directory)) return invalid('CONFIG_DIRECTORY');
    const namespace = safeString(parsed.namespace, NAMESPACE_RE);
    if (namespace === null) return invalid('CONFIG_NAMESPACE');
    if (!Array.isArray(parsed.tenants) || parsed.tenants.length < 1 || parsed.tenants.length > LINEAGE_MAX_TENANTS) return invalid('CONFIG_TENANTS');
    const tenants: LineageTenantConfig[] = [];
    for (const entry of parsed.tenants) {
        if (!isObject(entry) || Object.keys(entry).some(key => !['tenantId', 'activeSlots', 'archiveSlots'].includes(key))) return invalid('CONFIG_TENANT_SHAPE');
        const tenantId = safeString(entry.tenantId, ID_RE);
        const activeSlots = entry.activeSlots === undefined ? LINEAGE_MAX_SLOTS : boundedInt(entry.activeSlots, 1, LINEAGE_MAX_SLOTS);
        const archiveSlots = entry.archiveSlots === undefined ? LINEAGE_MAX_SLOTS : boundedInt(entry.archiveSlots, 1, LINEAGE_MAX_SLOTS);
        if (tenantId === null || activeSlots === null || archiveSlots === null) return invalid('CONFIG_TENANT_VALUE');
        if (tenants.some(existing => existing.tenantId === tenantId)) return invalid('CONFIG_TENANT_DUPLICATE');
        tenants.push({ tenantId, activeSlots, archiveSlots });
    }
    let servicePrincipal: LineageServicePrincipal | null = null;
    if (parsed.servicePrincipal !== undefined) {
        const principal = parsed.servicePrincipal;
        if (!isObject(principal) || !hasExactKeys(principal, ['principalId', 'tenantId'])) return invalid('CONFIG_PRINCIPAL_SHAPE');
        const principalId = safeString(principal.principalId, ID_RE);
        const principalTenant = safeString(principal.tenantId, ID_RE);
        if (principalId === null || principalTenant === null || !tenants.some(tenant => tenant.tenantId === principalTenant)) return invalid('CONFIG_PRINCIPAL_VALUE');
        servicePrincipal = { principalId, tenantId: principalTenant };
    }
    return { ok: true, config: { schema: CONFIG_SCHEMA, revision, directory: parsed.directory, namespace, tenants, servicePrincipal } };
}

/** Reads the environment on every call (no caching) so a configuration change is never silently ignored. */
export function loadLineageConfig(env: Record<string, string | undefined> = process.env): LineageResult<LineageConfig> {
    const parsed = parseLineageConfig(env[LINEAGE_CONFIG_ENV]);
    return parsed.ok ? ok(parsed.config) : fail('NOT_READY', parsed.reason);
}

function tenantConfig(config: LineageConfig, tenantId: string): LineageTenantConfig | undefined {
    return config.tenants.find(tenant => tenant.tenantId === tenantId);
}

// -- identity --------------------------------------------------------------------------------------------------------

export type LineageOwner =
    | { kind: 'session'; userId: string; teamId: string; orgId: string }
    | { kind: 'service'; principalId: string };
export type LineageIdentity = { tenantId: string; owner: LineageOwner };

/** Structural subset of VerifiedSessionProvenance, so this module does not import the auth layer. */
export type LineageProvenanceInput =
    | { qualified: true; userId: string; orgId: string; teamId: string }
    | { qualified: false; reason: string };

export function ownersEqual(left: LineageOwner, right: LineageOwner): boolean {
    if (left.kind === 'session' && right.kind === 'session') {
        return left.userId === right.userId && left.teamId === right.teamId && left.orgId === right.orgId;
    }
    return left.kind === 'service' && right.kind === 'service' && left.principalId === right.principalId;
}

/** Tenant is the verified organization; user and team become immutable owner fields. Unqualified provenance never resolves. */
export function resolveSessionIdentity(config: LineageConfig, provenance: LineageProvenanceInput): LineageResult<LineageIdentity> {
    if (!provenance || provenance.qualified !== true) {
        return fail('UNQUALIFIED', `SESSION_${provenance && !provenance.qualified ? String(provenance.reason).replace(/[^A-Z_]/g, '').slice(0, 40) : 'UNQUALIFIED'}`);
    }
    const fields = [provenance.userId, provenance.orgId, provenance.teamId];
    if (!fields.every(field => safeString(field, OWNER_FIELD_RE) !== null)) return fail('UNQUALIFIED', 'SESSION_IDENTITY_FIELD_INVALID');
    if (!tenantConfig(config, provenance.orgId)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    return ok({ tenantId: provenance.orgId, owner: { kind: 'session', userId: provenance.userId, teamId: provenance.teamId, orgId: provenance.orgId } });
}

/**
 * The caller passes the result of the existing signed-body verifier. The owner is the server-configured stable principal;
 * no token, token hash or deriveServiceTokenIdentity value is read, stored or used as a tenant.
 */
export function resolveServiceIdentity(config: LineageConfig, serviceVerified: boolean): LineageResult<LineageIdentity> {
    if (serviceVerified !== true) return fail('UNQUALIFIED', 'SERVICE_NOT_VERIFIED');
    const principal = config.servicePrincipal;
    if (!principal) return fail('NOT_READY', 'SERVICE_PRINCIPAL_UNMAPPED');
    if (!tenantConfig(config, principal.tenantId)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    return ok({ tenantId: principal.tenantId, owner: { kind: 'service', principalId: principal.principalId } });
}

function validOwner(value: unknown): value is LineageOwner {
    if (!isObject(value)) return false;
    if (value.kind === 'session') {
        return hasExactKeys(value, ['kind', 'userId', 'teamId', 'orgId'])
            && [value.userId, value.teamId, value.orgId].every(field => safeString(field, OWNER_FIELD_RE) !== null);
    }
    return value.kind === 'service' && hasExactKeys(value, ['kind', 'principalId']) && safeString(value.principalId, ID_RE) !== null;
}

// -- keys ------------------------------------------------------------------------------------------------------------

export function metadataKey(tenantId: string): string { return `m:${tenantId}`; }
export function requestKey(tenantId: string, envelopeId: string): string { return `r:${tenantId}:${envelopeId}`; }
export function archiveKey(tenantId: string, envelopeId: string): string { return `a:${tenantId}:${envelopeId}`; }
export function parseLineageKey(id: string): { kind: 'metadata' | 'request' | 'archive'; tenantId: string; envelopeId: string | null } | null {
    const parts = typeof id === 'string' ? id.split(':') : [];
    if (parts.length === 2 && parts[0] === 'm' && ID_RE.test(parts[1])) return { kind: 'metadata', tenantId: parts[1], envelopeId: null };
    if (parts.length === 3 && (parts[0] === 'r' || parts[0] === 'a') && ID_RE.test(parts[1]) && ENVELOPE_ID_RE.test(parts[2])) {
        return { kind: parts[0] === 'r' ? 'request' : 'archive', tenantId: parts[1], envelopeId: parts[2] };
    }
    return null;
}
export function lineageRowByteLimit(id: string): number {
    return id.startsWith('m:') ? LINEAGE_METADATA_ROW_MAX_BYTES : LINEAGE_REQUEST_ROW_MAX_BYTES;
}
/** Operational keyed store for this configuration. The constructor performs no I/O. */
export function createLineageStore(config: LineageConfig): SQLiteKeyedAtomicRecordStore {
    return new SQLiteKeyedAtomicRecordStore(config.directory, config.namespace, {
        maxRowBytes: LINEAGE_METADATA_ROW_MAX_BYTES,
        maxRowBytesFor: lineageRowByteLimit,
    });
}

// -- tenant metadata -------------------------------------------------------------------------------------------------

export type LineageMetadata = {
    schema: typeof META_SCHEMA;
    tenantId: string;
    configRevision: number;
    activeSlots: number;
    archiveSlots: number;
    slotBytes: number;
    activeUsed: number;
    archiveUsed: number;
    activeBytes: number;
    archiveBytes: number;
    admissionControls?: AdmissionControl[];
};
const META_KEYS = ['schema', 'tenantId', 'configRevision', 'activeSlots', 'archiveSlots', 'slotBytes', 'activeUsed', 'archiveUsed', 'activeBytes', 'archiveBytes'];

export function buildInitialMetadata(config: LineageConfig, tenant: LineageTenantConfig): LineageMetadata {
    return {
        schema: META_SCHEMA, tenantId: tenant.tenantId, configRevision: config.revision,
        activeSlots: tenant.activeSlots, archiveSlots: tenant.archiveSlots, slotBytes: LINEAGE_REQUEST_SLOT_BYTES,
        activeUsed: 0, archiveUsed: 0, activeBytes: 0, archiveBytes: 0, admissionControls: [],
    };
}

/** Shape, safe nonnegative counters, exact byte accounting and bounds. Contradictions are never repaired. */
export function validateMetadata(value: unknown, tenantId?: string): LineageMetadata | null {
    if (!isObject(value) || !(hasExactKeys(value, META_KEYS) || (hasExactKeys(value, [...META_KEYS, 'admissionControls']) && validControls(value.admissionControls))) || value.schema !== META_SCHEMA) return null;
    if (safeString(value.tenantId, ID_RE) === null || (tenantId !== undefined && value.tenantId !== tenantId)) return null;
    const counters = [value.configRevision, value.activeSlots, value.archiveSlots, value.slotBytes, value.activeUsed, value.archiveUsed, value.activeBytes, value.archiveBytes];
    if (!counters.every(isCounter)) return null;
    const meta = value as unknown as LineageMetadata;
    if (meta.configRevision < 1 || meta.activeSlots < 1 || meta.activeSlots > LINEAGE_MAX_SLOTS || meta.archiveSlots < 1 || meta.archiveSlots > LINEAGE_MAX_SLOTS) return null;
    if (meta.slotBytes !== LINEAGE_REQUEST_SLOT_BYTES) return null;
    if (meta.activeUsed > meta.activeSlots || meta.archiveUsed > meta.archiveSlots) return null;
    if (meta.activeBytes !== meta.activeUsed * meta.slotBytes || meta.archiveBytes !== meta.archiveUsed * meta.slotBytes) return null;
    return meta;
}
/** First-ordinal reservation: one slot (count and bytes). Returns null when the tenant has no free active slot. */
export function metadataAfterReserve(meta: LineageMetadata): LineageMetadata | null {
    if (meta.activeUsed + 1 > meta.activeSlots) return null;
    return { ...meta, activeUsed: meta.activeUsed + 1, activeBytes: (meta.activeUsed + 1) * meta.slotBytes };
}
/** Active to archive move for one envelope. Returns null when nothing is active or the archive allocation is full. */
export function metadataAfterArchive(meta: LineageMetadata): LineageMetadata | null {
    if (meta.activeUsed < 1 || meta.archiveUsed + 1 > meta.archiveSlots) return null;
    return {
        ...meta, activeUsed: meta.activeUsed - 1, activeBytes: (meta.activeUsed - 1) * meta.slotBytes,
        archiveUsed: meta.archiveUsed + 1, archiveBytes: (meta.archiveUsed + 1) * meta.slotBytes,
    };
}
/** Deletion of an exported archive row. Returns null when the archive counter is already zero (never goes negative). */
export function metadataAfterArchiveRelease(meta: LineageMetadata): LineageMetadata | null {
    if (meta.archiveUsed < 1) return null;
    return { ...meta, archiveUsed: meta.archiveUsed - 1, archiveBytes: (meta.archiveUsed - 1) * meta.slotBytes };
}
function metadataDrifted(config: LineageConfig, tenant: LineageTenantConfig, meta: LineageMetadata): boolean {
    return meta.configRevision !== config.revision || meta.activeSlots !== tenant.activeSlots || meta.archiveSlots !== tenant.archiveSlots;
}

// -- observation projection (allowlist) ------------------------------------------------------------------------------

const ATTEMPT_OUTCOMES = ['not_reached', 'denied', 'callback_error', 'invoked', 'unknown'] as const;
const RECEIPT_DECISIONS = ['selected', 'denied', 'requires_approval', 'fallback', 'no_candidate'] as const;
const MANIFEST_DISPOSITIONS = ['attached', 'invalid', 'not_built_precondition_stopped'] as const;
const USAGE_PROVENANCE = ['provider_reported_partial_or_complete', 'unknown'] as const;
type OneOf<T extends readonly string[]> = T[number];
function oneOf<T extends readonly string[]>(value: unknown, allowed: T): OneOf<T> | null {
    return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as OneOf<T> : null;
}

export type LineageUsage = { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
export type LineageObservation = {
    attemptOutcome: OneOf<typeof ATTEMPT_OUTCOMES>;
    callbackAttemptIndex: number | null;
    provider: string | null;
    model: string | null;
    gatewayReceiptIds: string[];
    receiptDecision: OneOf<typeof RECEIPT_DECISIONS> | null;
    manifestDigest: string | null;
    manifestDisposition: OneOf<typeof MANIFEST_DISPOSITIONS> | null;
    usageProvenance: OneOf<typeof USAGE_PROVENANCE>;
    actualUsageKnown: boolean;
    usage: LineageUsage | null;
    statusCode: string | null;
    httpStatus: number | null;
    errorCode: string | null;
    observedAt: string;
};

function projectUsage(value: unknown): LineageUsage | null {
    if (!isObject(value)) return null;
    const usage = { inputTokens: boundedInt(value.inputTokens, 0, 1_000_000_000), outputTokens: boundedInt(value.outputTokens, 0, 1_000_000_000), totalTokens: boundedInt(value.totalTokens, 0, 1_000_000_000) };
    return usage.inputTokens === null && usage.outputTokens === null && usage.totalTokens === null ? null : usage;
}

/**
 * Allowlisted projection of one provider-attempt observation. Only the named fields survive, each with an explicit type,
 * pattern and maximum length; everything else (prompt, output, raw error, credential fingerprint, headers...) is dropped.
 */
export function projectObservation(raw: unknown, observedAt: string = new Date().toISOString()): LineageObservation {
    const source = isObject(raw) ? raw : {};
    const receiptIds: string[] = [];
    if (Array.isArray(source.gatewayReceiptIds)) {
        for (const id of source.gatewayReceiptIds.slice(0, 8)) {
            const safe = safeString(id, REF_RE);
            if (safe !== null && !receiptIds.includes(safe) && receiptIds.length < 3) receiptIds.push(safe);
        }
    }
    const usageProvenance = oneOf(source.usageProvenance, USAGE_PROVENANCE) ?? 'unknown';
    const usage = projectUsage(source.usage);
    return {
        attemptOutcome: oneOf(source.attemptOutcome, ATTEMPT_OUTCOMES) ?? 'unknown',
        callbackAttemptIndex: boundedInt(source.callbackAttemptIndex, 0, 99),
        provider: safeString(source.provider, TOKEN_RE),
        model: safeString(source.model, MODEL_RE),
        gatewayReceiptIds: receiptIds,
        receiptDecision: oneOf(source.receiptDecision, RECEIPT_DECISIONS),
        manifestDigest: safeString(source.manifestDigest, SHA256_RE),
        manifestDisposition: oneOf(source.manifestDisposition, MANIFEST_DISPOSITIONS),
        usageProvenance,
        actualUsageKnown: usageProvenance === 'provider_reported_partial_or_complete' && usage !== null,
        usage,
        statusCode: oneOf(source.statusCode, DIAGNOSTIC_CODES) ?? null,
        httpStatus: boundedInt(source.httpStatus, 100, 599),
        errorCode: oneOf(source.errorCode, DIAGNOSTIC_CODES) ?? null,
        observedAt: isIso(source.observedAt) ? source.observedAt : observedAt,
    };
}

/** Maps CanonicalGatewayEvidence (src/lib/ai/types.ts) onto the raw observation shape; never copies prose or credentials. */
export function observationFromCanonicalEvidence(
    evidence: unknown,
    extra: { callbackAttemptIndex?: number | null; statusCode?: string | null; errorCode?: string | null; observedAt?: string } = {},
): Record<string, unknown> {
    const source = isObject(evidence) ? evidence : {};
    const receipt = isObject(source.receipt) ? source.receipt : {};
    const manifest = isObject(source.materialContextManifest) ? source.materialContextManifest : {};
    const diagnostic = isObject(source.providerDiagnostic) ? source.providerDiagnostic : {};
    return {
        attemptOutcome: source.attemptOutcome,
        callbackAttemptIndex: extra.callbackAttemptIndex ?? null,
        provider: receipt.providerId,
        model: receipt.selectedModelId ?? receipt.requestedModelId,
        gatewayReceiptIds: typeof receipt.receiptId === 'string' ? [receipt.receiptId] : [],
        receiptDecision: receipt.decision,
        manifestDigest: manifest.manifestDigest,
        manifestDisposition: source.materialContextManifestDisposition,
        usageProvenance: source.usageProvenance,
        usage: source.actualUsage ?? diagnostic.usage,
        statusCode: extra.statusCode ?? diagnostic.code,
        httpStatus: diagnostic.httpStatus,
        errorCode: extra.errorCode ?? null,
        observedAt: extra.observedAt,
        canonicalExecutionId: source.canonicalExecutionId,
        receiptCanonicalExecutionId: receipt.canonicalExecutionId,
        manifestCanonicalExecutionId: manifest.canonicalExecutionId,
    };
}

type JoinStatus = 'MATCHED' | 'NOT_PRESENT' | 'DISCREPANT';
/** Canonical id carried by evidence, receipt and manifest must equal the envelope id when present. */
function joinStatus(raw: unknown, canonicalId: string): JoinStatus {
    const source = isObject(raw) ? raw : {};
    const present = [source.canonicalExecutionId, source.receiptCanonicalExecutionId, source.manifestCanonicalExecutionId].filter(id => id !== undefined && id !== null);
    if (present.length === 0) return 'NOT_PRESENT';
    return present.every(id => id === canonicalId) ? 'MATCHED' : 'DISCREPANT';
}

// -- request records -------------------------------------------------------------------------------------------------

export type LineageEntryState = 'PORT_PENDING' | 'SETTLED';
export type LineageEntry = {
    ordinal: number;
    state: LineageEntryState;
    reservedAt: string;
    settledAt: string | null;
    join: JoinStatus | 'NOT_CHECKED';
    observation: LineageObservation | null;
};
const TERMINAL_DISPOSITIONS = ['COMPLETED', 'VALIDATION_FAILED', 'DENIED', 'CANCELLED', 'EXHAUSTED', 'FAILED'] as const;
const GAP_NAMES = ['VALIDATION', 'GUARD', 'SOT3', 'AUDIT'] as const;
export type LineageTerminal = {
    disposition: OneOf<typeof TERMINAL_DISPOSITIONS>;
    finalizedAt: string;
    refs: { validation: string | null; guard: string | null; sot3: string | null; audit: string | null };
    gaps: string[];
};
export type LineageRequestRecord = {
    schema: typeof REQUEST_SCHEMA;
    canonicalId: string;
    tenantId: string;
    owner: LineageOwner;
    contractRevision: string;
    sourceRevision: string;
    configRevision: number;
    contextRefs: string[];
    createdAt: string;
    updatedAt: string;
    state: 'OPEN' | 'FINALIZED';
    chargedBytes: number;
    joinDiscrepant: boolean;
    entries: LineageEntry[];
    terminal: LineageTerminal | null;
    ownerRelease?: OwnerRelease;
};
const REQUEST_KEYS = ['schema', 'canonicalId', 'tenantId', 'owner', 'contractRevision', 'sourceRevision', 'configRevision', 'contextRefs', 'createdAt', 'updatedAt', 'state', 'chargedBytes', 'joinDiscrepant', 'entries', 'terminal'];
const ENTRY_KEYS = ['ordinal', 'state', 'reservedAt', 'settledAt', 'join', 'observation'];
const TERMINAL_KEYS = ['disposition', 'finalizedAt', 'refs', 'gaps'];

function validEntry(value: unknown, expectedOrdinal: number): value is LineageEntry {
    if (!isObject(value) || !hasExactKeys(value, ENTRY_KEYS) || value.ordinal !== expectedOrdinal || !isIso(value.reservedAt)) return false;
    if (value.state === 'PORT_PENDING') return value.settledAt === null && value.join === 'NOT_CHECKED' && value.observation === null;
    if (value.state !== 'SETTLED' || !isIso(value.settledAt) || !['MATCHED', 'NOT_PRESENT', 'DISCREPANT'].includes(value.join as string)) return false;
    // The stored observation must be exactly its own allowlisted projection (nothing extra, nothing malformed).
    return isObject(value.observation) && JSON.stringify(projectObservation(value.observation, String(value.observation.observedAt))) === JSON.stringify(value.observation);
}
function validTerminal(value: unknown): value is LineageTerminal {
    if (!isObject(value) || !hasExactKeys(value, TERMINAL_KEYS) || oneOf(value.disposition, TERMINAL_DISPOSITIONS) === null || !isIso(value.finalizedAt)) return false;
    const refs = value.refs;
    if (!isObject(refs) || !hasExactKeys(refs, ['validation', 'guard', 'sot3', 'audit'])) return false;
    if (!Object.values(refs).every(ref => ref === null || safeString(ref, REF_RE) !== null)) return false;
    return Array.isArray(value.gaps) && value.gaps.length <= 8 && value.gaps.every(gap => safeString(gap, TOKEN_RE) !== null);
}

/** Strict structural validation of a stored request record. Returns null for anything contradictory or malformed. */
export function validateRequestRecord(value: unknown, expected?: { tenantId?: string; canonicalId?: string }): LineageRequestRecord | null {
    if (!isObject(value) || !(hasExactKeys(value, REQUEST_KEYS) || (hasExactKeys(value, [...REQUEST_KEYS, 'ownerRelease']) && validOwnerRelease(value.ownerRelease))) || value.schema !== REQUEST_SCHEMA) return null;
    if (safeString(value.canonicalId, ENVELOPE_ID_RE) === null || safeString(value.tenantId, ID_RE) === null) return null;
    if ((expected?.tenantId !== undefined && value.tenantId !== expected.tenantId) || (expected?.canonicalId !== undefined && value.canonicalId !== expected.canonicalId)) return null;
    if (!validOwner(value.owner) || safeString(value.contractRevision, REVISION_RE) === null || safeString(value.sourceRevision, REVISION_RE) === null) return null;
    if (!isCounter(value.configRevision) || value.configRevision < 1 || value.chargedBytes !== LINEAGE_REQUEST_SLOT_BYTES) return null;
    if (!Array.isArray(value.contextRefs) || value.contextRefs.length > 8 || !value.contextRefs.every(ref => safeString(ref, REF_RE) !== null)) return null;
    if (!isIso(value.createdAt) || !isIso(value.updatedAt) || (value.state !== 'OPEN' && value.state !== 'FINALIZED') || typeof value.joinDiscrepant !== 'boolean') return null;
    if (!Array.isArray(value.entries) || value.entries.length < 1 || value.entries.length > LINEAGE_MAX_ORDINALS) return null;
    if (!value.entries.every((entry, index) => validEntry(entry, index + 1))) return null;
    // Only the last ordinal can still be pending; an earlier pending ordinal can never have been advanced past.
    if (value.entries.slice(0, -1).some(entry => (entry as LineageEntry).state === 'PORT_PENDING')) return null;
    if (value.joinDiscrepant !== value.entries.some(entry => (entry as LineageEntry).join === 'DISCREPANT')) return null;
    if (value.state === 'FINALIZED' ? !validTerminal(value.terminal) : value.terminal !== null) return null;
    return value as unknown as LineageRequestRecord;
}

export type LineageArchiveRecord = {
    schema: typeof ARCHIVE_SCHEMA;
    canonicalId: string;
    tenantId: string;
    archivedAt: string;
    originRevision: number;
    originDigest: string;
    record: LineageRequestRecord;
};
export function recordDigest(record: LineageRequestRecord): string {
    return createHash('sha256').update(JSON.stringify(record), 'utf8').digest('hex');
}
/** Archive wrapper carrying the identical safe evidence plus its origin revision and digest. */
export function buildArchiveRecord(record: LineageRequestRecord, originRevision: number, archivedAt: string): LineageArchiveRecord {
    return { schema: ARCHIVE_SCHEMA, canonicalId: record.canonicalId, tenantId: record.tenantId, archivedAt, originRevision, originDigest: recordDigest(record), record };
}
export function validateArchiveRecord(value: unknown, expected?: { tenantId?: string; canonicalId?: string }): LineageArchiveRecord | null {
    if (!isObject(value) || !hasExactKeys(value, ['schema', 'canonicalId', 'tenantId', 'archivedAt', 'originRevision', 'originDigest', 'record']) || value.schema !== ARCHIVE_SCHEMA) return null;
    if (!isIso(value.archivedAt) || !isCounter(value.originRevision) || safeString(value.originDigest, SHA256_RE) === null) return null;
    if ((expected?.tenantId !== undefined && value.tenantId !== expected.tenantId) || (expected?.canonicalId !== undefined && value.canonicalId !== expected.canonicalId)) return null;
    const record = validateRequestRecord(value.record, { tenantId: String(value.tenantId), canonicalId: String(value.canonicalId) });
    if (!record || record.canonicalId !== value.canonicalId || recordDigest(record) !== value.originDigest) return null;
    return value as unknown as LineageArchiveRecord;
}

/** Eligibility for the explicit maintenance archive step: finalized, clean, and old enough. Elapsed time alone never qualifies. */
export function isArchiveEligible(record: LineageRequestRecord, now: number = Date.now(), minAgeMs: number = LINEAGE_ARCHIVE_MIN_AGE_MS): boolean {
    if (record.state !== 'FINALIZED' || !record.terminal || record.joinDiscrepant) return false;
    if (record.entries.some(entry => entry.state !== 'SETTLED' || entry.join === 'DISCREPANT')) return false;
    return now - Date.parse(record.terminal.finalizedAt) >= minAgeMs;
}

// -- safe response view ----------------------------------------------------------------------------------------------

export type LineageRecordingStatus = 'CONFIRMED' | 'POSSIBLE_CONTACT_PENDING' | 'JOIN_DISCREPANT';
export type SafeLineageView = {
    canonicalId: string;
    location: 'ACTIVE' | 'ARCHIVE';
    state: 'OPEN' | 'FINALIZED';
    recordingStatus: LineageRecordingStatus;
    providerContact: 'NONE_RECORDED' | 'POSSIBLE_OR_OBSERVED';
    automaticRetryAllowed: false;
    continuationHold: boolean;
    ownerKind: 'session' | 'service';
    contractRevision: string;
    sourceRevision: string;
    contextRefs: string[];
    createdAt: string;
    updatedAt: string;
    history: LineageEntry[];
    terminal: LineageTerminal | null;
};

/** Pure response projection: ordered ordinal history, terminal summary and recording status. Owner ids are not exposed. */
export function toSafeLineageView(record: LineageRequestRecord, location: 'ACTIVE' | 'ARCHIVE' = 'ACTIVE'): SafeLineageView {
    const pending = record.entries.some(entry => entry.state === 'PORT_PENDING');
    const recordingStatus: LineageRecordingStatus = record.joinDiscrepant ? 'JOIN_DISCREPANT' : pending ? 'POSSIBLE_CONTACT_PENDING' : 'CONFIRMED';
    const noContact = record.entries.every(entry => entry.state === 'SETTLED' && entry.observation !== null && ['not_reached', 'denied'].includes(entry.observation.attemptOutcome));
    return {
        canonicalId: record.canonicalId, location, state: record.state, recordingStatus,
        providerContact: noContact ? 'NONE_RECORDED' : 'POSSIBLE_OR_OBSERVED',
        automaticRetryAllowed: false, continuationHold: pending || record.joinDiscrepant, ownerKind: record.owner.kind,
        contractRevision: record.contractRevision, sourceRevision: record.sourceRevision, contextRefs: [...record.contextRefs],
        createdAt: record.createdAt, updatedAt: record.updatedAt,
        history: record.entries.map(entry => ({ ...entry, observation: entry.observation ? { ...entry.observation, gatewayReceiptIds: [...entry.observation.gatewayReceiptIds] } : null })),
        terminal: record.terminal ? { ...record.terminal, refs: { ...record.terminal.refs }, gaps: [...record.terminal.gaps] } : null,
    };
}

// -- concurrency guard, store access ---------------------------------------------------------------------------------

const inFlightTenants = new Set<string>();
let inFlightTotal = 0;
let testStoreHooks: AtomicSQLiteKeyedHooks | undefined;

/** Test-only seam (precedent: _testOnlyResetReplayLedger). Not reachable from HTTP, environment or serialized input. */
export function _testOnlySetStoreHooks(hooks: AtomicSQLiteKeyedHooks | undefined): void { testStoreHooks = hooks; }
export function _testOnlyGetStoreHooks(): AtomicSQLiteKeyedHooks | undefined { return testStoreHooks; }

function mapStoreError(error: unknown): LineageFailure {
    if (error instanceof AtomicSQLiteError) {
        switch (error.code) {
            case 'NOT_READY': return fail('NOT_READY', `STORE_${error.detail ?? 'NOT_READY'}`);
            case 'BUSY': return fail('BUSY', 'STORAGE_BUSY');
            case 'COMMIT_UNKNOWN': return fail('COMMIT_UNKNOWN', 'COMMIT_UNKNOWN');
            case 'CONFLICT': return fail('CONFLICT', 'STORAGE_CONFLICT');
            case 'CORRUPT': return fail('UNAVAILABLE', 'STORAGE_CORRUPT');
            case 'SCHEMA': return fail('UNAVAILABLE', 'STORAGE_REJECTED');
            default: return fail('UNAVAILABLE', 'STORAGE_IO');
        }
    }
    return fail('UNAVAILABLE', 'INTERNAL_ERROR');
}

/** One synchronous store operation under the per-tenant (1) and per-process (4) in-flight limits; over limit is BUSY, never queued. */
export function guarded<T>(config: LineageConfig, tenantId: string, operation: (store: SQLiteKeyedAtomicRecordStore, tenant: LineageTenantConfig) => LineageResult<T>): LineageResult<T> {
    const tenant = tenantConfig(config, tenantId);
    if (!tenant) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    if (inFlightTenants.has(tenantId) || inFlightTotal >= LINEAGE_MAX_IN_FLIGHT_PER_PROCESS) return fail('BUSY', 'IN_FLIGHT_LIMIT');
    inFlightTenants.add(tenantId);
    inFlightTotal += 1;
    try {
        return operation(createLineageStore(config), tenant);
    } catch (error) {
        return mapStoreError(error);
    } finally {
        inFlightTenants.delete(tenantId);
        inFlightTotal -= 1;
    }
}

type MetaCheck = { ok: true; meta: LineageMetadata; revision: number } | { ok: false; failure: LineageFailure };
/** Tenant metadata gate shared by every operation: absent means not provisioned, contradictory means the tenant is held. */
export function checkMetadata(config: LineageConfig, tenant: LineageTenantConfig, entry: AtomicSQLiteKeyedEntry): MetaCheck {
    if (entry.state === 'ABSENT') return { ok: false, failure: fail('NOT_READY', 'METADATA_MISSING') };
    if (entry.state === 'UNAVAILABLE') return { ok: false, failure: fail('UNAVAILABLE', 'TENANT_HELD') };
    const meta = validateMetadata(entry.value, tenant.tenantId);
    if (!meta) return { ok: false, failure: fail('UNAVAILABLE', 'TENANT_HELD') };
    if (metadataDrifted(config, tenant, meta)) return { ok: false, failure: fail('NOT_READY', 'CONFIG_DRIFT') };
    return { ok: true, meta, revision: entry.revision };
}

export type LineageRef = { canonicalId: string; contractRevision: string; sourceRevision: string };
function validRef(ref: unknown): ref is LineageRef {
    return isObject(ref) && safeString(ref.canonicalId, ENVELOPE_ID_RE) !== null
        && safeString(ref.contractRevision, REVISION_RE) !== null && safeString(ref.sourceRevision, REVISION_RE) !== null;
}
export function validIdentity(config: LineageConfig, identity: LineageIdentity): boolean {
    return isObject(identity) && typeof identity.tenantId === 'string' && !!tenantConfig(config, identity.tenantId) && validOwner(identity.owner);
}
/** Immutable owner/tenant/revision joins, re-checked on every mutating operation. */
function joinsHold(record: LineageRequestRecord, identity: LineageIdentity, ref: LineageRef, config: LineageConfig): LineageFailure | null {
    if (record.tenantId !== identity.tenantId || record.canonicalId !== ref.canonicalId) return fail('CONFLICT', 'JOIN_MISMATCH');
    if (!ownersEqual(record.owner, identity.owner)) return fail('CONFLICT', 'OWNER_MISMATCH');
    if (record.contractRevision !== ref.contractRevision || record.sourceRevision !== ref.sourceRevision) return fail('CONFLICT', 'REVISION_MISMATCH');
    if (record.configRevision !== config.revision) return fail('NOT_READY', 'CONFIG_DRIFT');
    return null;
}
function sizeGuard(record: LineageRequestRecord): LineageFailure | null {
    return byteLength(record) > LINEAGE_RECORD_BODY_MAX_BYTES ? fail('UNAVAILABLE', 'RECORD_TOO_LARGE') : null;
}

// -- operations ------------------------------------------------------------------------------------------------------

export type LineageReserveInput = LineageRef & { contextRefs?: string[] };
export type LineageReserveValue = { canonicalId: string; ordinal: number; view: SafeLineageView };

/**
 * Reserve the next ordinal in PORT_PENDING before port entry (one keyed transaction on [m, r, a]).
 * Failures: NOT_READY (config/store/tenant/metadata), CAPACITY (no free active slot at the first ordinal), BUSY,
 * CONFLICT (PORT_PENDING earlier ordinal, ORDINAL_LIMIT, ENVELOPE_FINALIZED, ENVELOPE_ARCHIVED, OWNER/REVISION/JOIN mismatch),
 * JOIN_DISCREPANT (envelope is on continuation hold), UNAVAILABLE (corrupt row/tenant held), COMMIT_UNKNOWN.
 */
export function reserve(config: LineageConfig, identity: LineageIdentity, input: LineageReserveInput): LineageResult<LineageReserveValue> {
    if (!validIdentity(config, identity)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    if (!validRef(input)) return fail('UNAVAILABLE', 'INVALID_INPUT');
    const contextRefs = (Array.isArray(input.contextRefs) ? input.contextRefs : []).slice(0, 8);
    if (!contextRefs.every(ref => safeString(ref, REF_RE) !== null)) return fail('UNAVAILABLE', 'INVALID_INPUT');
    return guarded(config, identity.tenantId, (store, tenant) => store.transactionKeys(
        [metadataKey(tenant.tenantId), requestKey(tenant.tenantId, input.canonicalId), archiveKey(tenant.tenantId, input.canonicalId)],
        ([metaEntry, requestEntry, archiveEntry]) => {
            const none = (failure: LineageFailure) => ({ writes: [], result: failure as LineageResult<LineageReserveValue> });
            const metaCheck = checkMetadata(config, tenant, metaEntry);
            if (!metaCheck.ok) return none(metaCheck.failure);
            if (metaCheck.meta.admissionControls === undefined && metaCheck.meta.activeUsed > 0) return none(fail('NOT_READY', 'CONTROL_MIGRATION_REQUIRED'));
            const controls = metaCheck.meta.admissionControls ?? [];
            const current = controls.find(c => c.ownerKey === ownerKey(identity));
            if (!current && controls.length >= 32) return none(fail('CAPACITY', 'ADMISSION_CAPACITY'));
            const control = current ?? initialControl(identity);
            if (requestEntry.state === 'PRESENT') {
                const prior = validateRequestRecord(requestEntry.value, { tenantId: tenant.tenantId, canonicalId: input.canonicalId });
                if (prior?.ownerRelease && ownersEqual(prior.owner, identity.owner)) return none(fail('CONFLICT', 'HELD_RELEASED'));
            }
            if (control.state === 'STOPPED') return none(fail('CONFLICT', 'ADMISSION_STOPPED'));
            if (blocksNewAdmission(control, input.canonicalId)) return none(fail('CONFLICT', 'ADMISSION_CONFLICT'));
            const ownerControls = current ? controls : [...controls, control];
            if (archiveEntry.state === 'UNAVAILABLE') return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            if (archiveEntry.state === 'PRESENT') return none(fail('CONFLICT', 'ENVELOPE_ARCHIVED'));
            if (requestEntry.state === 'UNAVAILABLE') return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const now = new Date().toISOString();
            if (requestEntry.state === 'ABSENT') {
                const nextMeta = metadataAfterReserve(metaCheck.meta);
                if (!nextMeta) return none(fail('CAPACITY', 'TENANT_CAPACITY'));
                const record: LineageRequestRecord = {
                    schema: REQUEST_SCHEMA, canonicalId: input.canonicalId, tenantId: tenant.tenantId, owner: identity.owner,
                    contractRevision: input.contractRevision, sourceRevision: input.sourceRevision, configRevision: config.revision,
                    contextRefs, createdAt: now, updatedAt: now, state: 'OPEN', chargedBytes: LINEAGE_REQUEST_SLOT_BYTES, joinDiscrepant: false,
                    entries: [{ ordinal: 1, state: 'PORT_PENDING', reservedAt: now, settledAt: null, join: 'NOT_CHECKED', observation: null }],
                    terminal: null,
                };
                const tooLarge = sizeGuard(record);
                if (tooLarge) return none(tooLarge);
                return {
                    writes: [
                        { id: metaEntry.id, expectedRevision: metaCheck.revision, value: { ...nextMeta, admissionControls: withExecution(ownerControls, identity, toSafeLineageView(record), 'replace') } },
                        { id: requestEntry.id, expectedRevision: null, value: record },
                    ],
                    result: ok({ canonicalId: record.canonicalId, ordinal: 1, view: toSafeLineageView(record) }),
                };
            }
            const record = validateRequestRecord(requestEntry.value, { tenantId: tenant.tenantId, canonicalId: input.canonicalId });
            if (!record) return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const mismatch = joinsHold(record, identity, input, config);
            if (mismatch) return none(mismatch);
            if (record.joinDiscrepant) return none(fail('JOIN_DISCREPANT', 'CONTINUATION_HELD', toSafeLineageView(record)));
            if (record.state === 'FINALIZED') return none(fail('CONFLICT', 'ENVELOPE_FINALIZED'));
            if (record.entries.some(entry => entry.state === 'PORT_PENDING')) return none(fail('CONFLICT', 'PORT_PENDING', toSafeLineageView(record)));
            if (record.entries.length >= LINEAGE_MAX_ORDINALS) return none(fail('CONFLICT', 'ORDINAL_LIMIT'));
            const ordinal = record.entries.length + 1;
            const next: LineageRequestRecord = {
                ...record, updatedAt: now < record.updatedAt ? record.updatedAt : now,
                entries: [...record.entries, { ordinal, state: 'PORT_PENDING', reservedAt: now, settledAt: null, join: 'NOT_CHECKED', observation: null }],
            };
            const tooLarge = sizeGuard(next);
            if (tooLarge) return none(tooLarge);
            return {
                writes: [{ id: metaEntry.id, expectedRevision: metaCheck.revision, value: { ...metaCheck.meta, admissionControls: withExecution(ownerControls, identity, toSafeLineageView(next)) } }, { id: requestEntry.id, expectedRevision: requestEntry.revision, value: next }],
                result: ok({ canonicalId: next.canonicalId, ordinal, view: toSafeLineageView(next) }),
            };
        },
        testStoreHooks,
    ));
}

export type LineageSettleValue = { canonicalId: string; ordinal: number; view: SafeLineageView };

/**
 * Settle a PORT_PENDING ordinal with the projected observation (one keyed transaction on [m, r]); consumes no new slot,
 * so it succeeds at tenant capacity. A canonical-id mismatch between envelope, evidence, receipt and manifest is stored as
 * JOIN_DISCREPANT (durable) and returns code JOIN_DISCREPANT with the view; the envelope is then held from continuation.
 * Failures: NOT_FOUND, CONFLICT (ORDINAL_UNKNOWN, ALREADY_SETTLED, OWNER/REVISION/JOIN mismatch), plus the common codes.
 */
export function settle(config: LineageConfig, identity: LineageIdentity, ref: LineageRef, ordinal: number, observation: unknown): LineageResult<LineageSettleValue> {
    if (!validIdentity(config, identity)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    if (!validRef(ref) || boundedInt(ordinal, 1, LINEAGE_MAX_ORDINALS) === null) return fail('UNAVAILABLE', 'INVALID_INPUT');
    const join = joinStatus(observation, ref.canonicalId);
    const projected = projectObservation(observation);
    return guarded(config, identity.tenantId, (store, tenant) => store.transactionKeys(
        [metadataKey(tenant.tenantId), requestKey(tenant.tenantId, ref.canonicalId)],
        ([metaEntry, requestEntry]) => {
            const none = (failure: LineageFailure) => ({ writes: [], result: failure as LineageResult<LineageSettleValue> });
            const metaCheck = checkMetadata(config, tenant, metaEntry);
            if (!metaCheck.ok) return none(metaCheck.failure);
            if (requestEntry.state === 'ABSENT') return none(fail('NOT_FOUND', 'ENVELOPE_UNKNOWN'));
            if (requestEntry.state === 'UNAVAILABLE') return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const record = validateRequestRecord(requestEntry.value, { tenantId: tenant.tenantId, canonicalId: ref.canonicalId });
            if (!record) return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const mismatch = joinsHold(record, identity, ref, config);
            if (mismatch) return none(mismatch);
            const target = record.entries[ordinal - 1];
            if (!target) return none(fail('CONFLICT', 'ORDINAL_UNKNOWN'));
            if (target.state !== 'PORT_PENDING') return none(fail('CONFLICT', 'ALREADY_SETTLED'));
            const now = new Date().toISOString();
            const entries = record.entries.map(entry => entry.ordinal === ordinal
                ? { ...entry, state: 'SETTLED' as const, settledAt: now, join, observation: { ...projected, observedAt: isIso(projected.observedAt) ? projected.observedAt : now } }
                : entry);
            const next: LineageRequestRecord = { ...record, updatedAt: now < record.updatedAt ? record.updatedAt : now, entries, joinDiscrepant: record.joinDiscrepant || join === 'DISCREPANT' };
            const tooLarge = sizeGuard(next);
            if (tooLarge) return none(tooLarge);
            const view = toSafeLineageView(next);
            return {
                writes: [...(metaCheck.meta.admissionControls ? [{ id: metaEntry.id, expectedRevision: metaCheck.revision, value: { ...metaCheck.meta, admissionControls: withExecution(metaCheck.meta.admissionControls, identity, toSafeLineageView(next)) } }] : []), { id: requestEntry.id, expectedRevision: requestEntry.revision, value: next }],
                result: join === 'DISCREPANT' ? fail('JOIN_DISCREPANT', 'CANONICAL_ID_MISMATCH', view) : ok({ canonicalId: next.canonicalId, ordinal, view }),
            };
        },
        testStoreHooks,
    ));
}

export type LineageTerminalInput = {
    disposition: string;
    validationRef?: string | null;
    guardRef?: string | null;
    sot3Ref?: string | null;
    auditRef?: string | null;
    /** Additional named gaps (safe tokens). Absent references become gaps automatically (VALIDATION_NOT_RECORDED, ...). */
    namedGaps?: string[];
};
export type LineageFinalizeValue = { canonicalId: string; view: SafeLineageView };

/**
 * Finalize the envelope (one keyed transaction on [m, r]). References that are absent become named gaps. Finalizing never
 * clears PORT_PENDING or JOIN_DISCREPANT: such an envelope stays visible, held, and is never archive-eligible.
 */
export function finalize(config: LineageConfig, identity: LineageIdentity, ref: LineageRef, terminal: LineageTerminalInput): LineageResult<LineageFinalizeValue> {
    if (!validIdentity(config, identity)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    const disposition = oneOf(terminal?.disposition, TERMINAL_DISPOSITIONS);
    if (!validRef(ref) || disposition === null) return fail('UNAVAILABLE', 'INVALID_INPUT');
    const refOf = (value: unknown): string | null => safeString(value, REF_RE);
    const refs = { validation: refOf(terminal.validationRef), guard: refOf(terminal.guardRef), sot3: refOf(terminal.sot3Ref), audit: refOf(terminal.auditRef) };
    const gaps: string[] = [];
    for (const name of GAP_NAMES) if (refs[name.toLowerCase() as keyof typeof refs] === null) gaps.push(`${name}_NOT_RECORDED`);
    for (const gap of (Array.isArray(terminal.namedGaps) ? terminal.namedGaps : []).slice(0, 4)) {
        const safe = safeString(gap, TOKEN_RE);
        if (safe !== null && !gaps.includes(safe)) gaps.push(safe);
    }
    return guarded(config, identity.tenantId, (store, tenant) => store.transactionKeys(
        [metadataKey(tenant.tenantId), requestKey(tenant.tenantId, ref.canonicalId)],
        ([metaEntry, requestEntry]) => {
            const none = (failure: LineageFailure) => ({ writes: [], result: failure as LineageResult<LineageFinalizeValue> });
            const metaCheck = checkMetadata(config, tenant, metaEntry);
            if (!metaCheck.ok) return none(metaCheck.failure);
            if (requestEntry.state === 'ABSENT') return none(fail('NOT_FOUND', 'ENVELOPE_UNKNOWN'));
            if (requestEntry.state === 'UNAVAILABLE') return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const record = validateRequestRecord(requestEntry.value, { tenantId: tenant.tenantId, canonicalId: ref.canonicalId });
            if (!record) return none(fail('UNAVAILABLE', 'RECORD_UNAVAILABLE'));
            const mismatch = joinsHold(record, identity, ref, config);
            if (mismatch) return none(mismatch);
            if (record.state === 'FINALIZED') return none(fail('CONFLICT', 'ALREADY_FINALIZED'));
            const now = new Date().toISOString();
            const next: LineageRequestRecord = { ...record, updatedAt: now, state: 'FINALIZED', terminal: { disposition, finalizedAt: now, refs, gaps } };
            const tooLarge = sizeGuard(next);
            if (tooLarge) return none(tooLarge);
            return {
                writes: [...(metaCheck.meta.admissionControls ? [{ id: metaEntry.id, expectedRevision: metaCheck.revision, value: { ...metaCheck.meta, admissionControls: withExecution(metaCheck.meta.admissionControls, identity, toSafeLineageView(next)) } }] : []), { id: requestEntry.id, expectedRevision: requestEntry.revision, value: next }],
                result: ok({ canonicalId: next.canonicalId, view: toSafeLineageView(next) }),
            };
        },
        testStoreHooks,
    ));
}

/**
 * Authorized readback: active row first, then archive (one keyed read on [m, r, a], no write). A foreign owner or an unknown id
 * is NOT_FOUND; a corrupt/oversize target, a contradictory tenant or a duplicate location is UNAVAILABLE, never an empty history.
 */
export function readLineage(config: LineageConfig, identity: LineageIdentity, canonicalId: string): LineageResult<SafeLineageView> {
    if (!validIdentity(config, identity)) return fail('NOT_READY', 'TENANT_NOT_CONFIGURED');
    if (safeString(canonicalId, ENVELOPE_ID_RE) === null) return fail('NOT_FOUND', 'ENVELOPE_UNKNOWN');
    return guarded(config, identity.tenantId, (store, tenant) => {
        const [metaEntry, requestEntry, archiveEntry] = store.readKeys([metadataKey(tenant.tenantId), requestKey(tenant.tenantId, canonicalId), archiveKey(tenant.tenantId, canonicalId)]);
        const metaCheck = checkMetadata(config, tenant, metaEntry);
        if (!metaCheck.ok) return metaCheck.failure;
        if (requestEntry.state === 'UNAVAILABLE' || archiveEntry.state === 'UNAVAILABLE') return fail('UNAVAILABLE', 'RECORD_UNAVAILABLE');
        if (requestEntry.state === 'PRESENT' && archiveEntry.state === 'PRESENT') return fail('UNAVAILABLE', 'DUPLICATE_LOCATION');
        if (requestEntry.state === 'PRESENT') {
            const record = validateRequestRecord(requestEntry.value, { tenantId: tenant.tenantId, canonicalId });
            if (!record) return fail('UNAVAILABLE', 'RECORD_UNAVAILABLE');
            return ownersEqual(record.owner, identity.owner) ? ok(toSafeLineageView(record, 'ACTIVE')) : fail('NOT_FOUND', 'ENVELOPE_UNKNOWN');
        }
        if (archiveEntry.state === 'PRESENT') {
            const archived = validateArchiveRecord(archiveEntry.value, { tenantId: tenant.tenantId, canonicalId });
            if (!archived) return fail('UNAVAILABLE', 'RECORD_UNAVAILABLE');
            return ownersEqual(archived.record.owner, identity.owner) ? ok(toSafeLineageView(archived.record, 'ARCHIVE')) : fail('NOT_FOUND', 'ENVELOPE_UNKNOWN');
        }
        return fail('NOT_FOUND', 'ENVELOPE_UNKNOWN');
    });
}

export type LineageCapacity = {
    tenantId: string; configRevision: number;
    activeUsed: number; activeSlots: number; archiveUsed: number; archiveSlots: number; activeBytes: number; archiveBytes: number;
};
/** Storage-only capacity probe ([m]); never touches a provider. Used after a BUSY outcome to confirm counts. */
export function readTenantCapacity(config: LineageConfig, tenantId: string): LineageResult<LineageCapacity> {
    return guarded(config, tenantId, (store, tenant) => {
        const [metaEntry] = store.readKeys([metadataKey(tenant.tenantId)]);
        const metaCheck = checkMetadata(config, tenant, metaEntry);
        if (!metaCheck.ok) return metaCheck.failure;
        const { activeUsed, activeSlots, archiveUsed, archiveSlots, activeBytes, archiveBytes, configRevision } = metaCheck.meta;
        return ok({ tenantId: tenant.tenantId, configRevision, activeUsed, activeSlots, archiveUsed, archiveSlots, activeBytes, archiveBytes });
    });
}

/**
 * Creates the missing metadata row of every configured tenant (one keyed insert each). Existing rows are left untouched.
 * This is an offline maintenance/test provisioning step only: it is never called from a request path, and the request path
 * treats an absent metadata row as NOT_READY precisely so that a deleted or corrupted row can never be silently reset to zero.
 */
export function provisionTenantMetadata(config: LineageConfig): LineageResult<{ created: string[]; existing: string[] }> {
    const created: string[] = [];
    const existing: string[] = [];
    try {
        const store = createLineageStore(config);
        for (const tenant of config.tenants) {
            const wasCreated = store.transactionKeys([metadataKey(tenant.tenantId)], ([entry]) => entry.state === 'ABSENT'
                ? { writes: [{ id: entry.id, expectedRevision: null, value: buildInitialMetadata(config, tenant) }], result: true }
                : { writes: [], result: false });
            (wasCreated ? created : existing).push(tenant.tenantId);
        }
        return ok({ created, existing });
    } catch (error) {
        return mapStoreError(error);
    }
}
