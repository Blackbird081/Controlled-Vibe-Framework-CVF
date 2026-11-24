import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    LINEAGE_CONFIG_ENV,
    _testOnlySetStoreHooks,
    archiveKey,
    buildArchiveRecord,
    buildInitialMetadata,
    finalize,
    isArchiveEligible,
    loadLineageConfig,
    metadataAfterArchive,
    metadataAfterArchiveRelease,
    metadataAfterReserve,
    metadataKey,
    observationFromCanonicalEvidence,
    ownersEqual,
    parseLineageConfig,
    projectObservation,
    provisionTenantMetadata,
    readLineage,
    readTenantCapacity,
    requestKey,
    reserve,
    resolveServiceIdentity,
    resolveSessionIdentity,
    settle,
    toSafeLineageView,
    validateArchiveRecord,
    validateMetadata,
    validateRequestRecord,
    parseLineageKey,
    type LineageConfig,
    type LineageFailure,
    type LineageIdentity,
    type LineageRef,
    type LineageRequestRecord,
} from './canonical-web-lineage';

// Vitest runs from the cvf-web package root; jsdom's import.meta.url is not a file URL.
const nativeSource = path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts');
const lineageSource = path.resolve(process.cwd(), 'src/lib/server/canonical-web-lineage.ts');
const nodeRequire = createRequire(nativeSource);
const NAMESPACE = 'cvf-web-lineage-test';
const DATABASE_FILE = 'cvf-keyvalue-store.sqlite';

const cleanups: (() => void)[] = [];
afterEach(() => {
    _testOnlySetStoreHooks(undefined);
    while (cleanups.length) cleanups.pop()!();
});

type TenantSpec = { tenantId: string; activeSlots?: number; archiveSlots?: number };
function tempDir(prefix = 'cvf-web-lineage-'): string {
    const directory = mkdtempSync(path.join(tmpdir(), prefix));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    return directory;
}
function makeConfig(directory: string, overrides: Record<string, unknown> = {}): LineageConfig {
    const raw = {
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: NAMESPACE,
        tenants: [{ tenantId: 'org-a', activeSlots: 3, archiveSlots: 3 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] as TenantSpec[],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' },
        ...overrides,
    };
    const parsed = parseLineageConfig(JSON.stringify(raw));
    if (!parsed.ok) throw new Error(`config ${parsed.reason}`);
    return parsed.config;
}
function fixture(overrides: Record<string, unknown> = {}) {
    const directory = tempDir();
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    const config = makeConfig(directory, overrides);
    const provisioned = provisionTenantMetadata(config);
    expect(provisioned.ok).toBe(true);
    return { directory, config };
}
function sessionIdentity(config: LineageConfig, orgId = 'org-a', userId = 'user-1', teamId = 'team-1'): LineageIdentity {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId, orgId, teamId });
    if (!resolved.ok) throw new Error(`identity ${resolved.reason}`);
    return resolved.value;
}
function serviceIdentity(config: LineageConfig): LineageIdentity {
    const resolved = resolveServiceIdentity(config, true);
    if (!resolved.ok) throw new Error(`identity ${resolved.reason}`);
    return resolved.value;
}
const ref = (canonicalId: string): LineageRef => ({ canonicalId, contractRevision: 'contract-1', sourceRevision: 'src-1' });
function rawDb(directory: string) {
    const Database = nodeRequire('better-sqlite3') as new (file: string) => {
        prepare(sql: string): { run(...a: unknown[]): unknown; all(...a: unknown[]): unknown[]; get(...a: unknown[]): unknown };
        close(): void;
    };
    const db = new Database(path.join(directory, DATABASE_FILE));
    cleanups.push(() => { try { db.close(); } catch { /* already closed */ } });
    return db;
}
function plantRaw(directory: string, id: string, json: string, revision = 0): void {
    rawDb(directory).prepare('INSERT OR REPLACE INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at) VALUES (?,?,?,?,?)')
        .run(NAMESPACE, id, revision, json, '2026-11-12T00:00:00.000Z');
}
function rawRow(directory: string, id: string): { revision: number; item_json: string } | undefined {
    return rawDb(directory).prepare('SELECT revision, item_json FROM atomic_key_value_store WHERE namespace = ? AND id = ?').get(NAMESPACE, id) as { revision: number; item_json: string } | undefined;
}
function allRawJson(directory: string): string {
    return (rawDb(directory).prepare('SELECT item_json FROM atomic_key_value_store').all() as { item_json: string }[]).map(row => row.item_json).join('\n');
}
function expectFailure(result: { ok: boolean }, code: string, reason?: string): LineageFailure {
    expect(result.ok).toBe(false);
    const failure = result as LineageFailure;
    expect(failure.code).toBe(code);
    if (reason !== undefined) expect(failure.reason).toBe(reason);
    return failure;
}
const invoked = { attemptOutcome: 'invoked', callbackAttemptIndex: 0, provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'], usageProvenance: 'unknown' };

function reserveSettle(config: LineageConfig, identity: LineageIdentity, id: string, ordinal: number, observation: unknown = invoked) {
    const reserved = reserve(config, identity, ref(id));
    expect(reserved.ok).toBe(true);
    if (reserved.ok) expect(reserved.value.ordinal).toBe(ordinal);
    const settled = settle(config, identity, ref(id), ordinal, observation);
    expect(settled.ok).toBe(true);
}

describe('configuration parsing', () => {
    const base = { schema: 'cvf.webLineageConfig.v1', revision: 1, directory: path.join(tmpdir(), 'x'), namespace: NAMESPACE, tenants: [{ tenantId: 'org-a' }] };
    it('applies 100/100 defaults and accepts at most five tenants within bounds', () => {
        const parsed = parseLineageConfig(JSON.stringify(base));
        expect(parsed.ok && parsed.config.tenants[0]).toEqual({ tenantId: 'org-a', activeSlots: 100, archiveSlots: 100 });
        const five = { ...base, tenants: ['a', 'b', 'c', 'd', 'e'].map(tenantId => ({ tenantId })) };
        expect(parseLineageConfig(JSON.stringify(five)).ok).toBe(true);
    });
    it('rejects every deviation as NOT_READY input without echoing values', () => {
        const bad: [string, unknown][] = [
            ['missing', undefined],
            ['not json', '{'],
            ['unknown key', { ...base, extra: 1 }],
            ['wrong schema', { ...base, schema: 'x' }],
            ['relative directory', { ...base, directory: 'relative/dir' }],
            ['unc directory', { ...base, directory: '\\\\host\\share' }],
            ['namespace prefix', { ...base, namespace: 'shared-namespace' }],
            ['six tenants', { ...base, tenants: ['a', 'b', 'c', 'd', 'e', 'f'].map(tenantId => ({ tenantId })) }],
            ['no tenants', { ...base, tenants: [] }],
            ['duplicate tenant', { ...base, tenants: [{ tenantId: 'a' }, { tenantId: 'a' }] }],
            ['slots above bound', { ...base, tenants: [{ tenantId: 'a', activeSlots: 101 }] }],
            ['zero slots', { ...base, tenants: [{ tenantId: 'a', archiveSlots: 0 }] }],
            ['tenant id with colon', { ...base, tenants: [{ tenantId: 'a:b' }] }],
            ['tenant extra key', { ...base, tenants: [{ tenantId: 'a', note: 1 }] }],
            ['principal unknown tenant', { ...base, servicePrincipal: { principalId: 'svc', tenantId: 'zzz' } }],
            ['principal extra key', { ...base, servicePrincipal: { principalId: 'svc', tenantId: 'org-a', token: 't' } }],
            ['revision zero', { ...base, revision: 0 }],
            ['too large', { ...base, namespace: NAMESPACE, pad: 'x'.repeat(9000) }],
        ];
        for (const [label, value] of bad) {
            const raw = value === undefined ? undefined : typeof value === 'string' ? value : JSON.stringify(value);
            const parsed = parseLineageConfig(raw);
            expect(parsed.ok, label).toBe(false);
        }
        expectFailure(loadLineageConfig({}), 'NOT_READY', 'CONFIG_MISSING');
        expect(loadLineageConfig({ [LINEAGE_CONFIG_ENV]: JSON.stringify(base) }).ok).toBe(true);
    });
});

describe('readiness: missing custody never falls back', () => {
    it('relative directory, missing directory, missing database and absent metadata are NOT_READY', () => {
        const home = tempDir();
        const missingDir = makeConfig(path.join(home, 'does-not-exist'));
        expectFailure(reserve(missingDir, sessionIdentity(missingDir), ref('env-1')), 'NOT_READY', 'STORE_DIRECTORY_MISSING');
        expect(existsSync(path.join(home, 'does-not-exist'))).toBe(false);

        const noDatabase = makeConfig(home);
        expectFailure(reserve(noDatabase, sessionIdentity(noDatabase), ref('env-1')), 'NOT_READY', 'STORE_DATABASE_MISSING');
        expect(existsSync(path.join(home, DATABASE_FILE))).toBe(false);

        const initialized = tempDir();
        SQLiteKeyedAtomicRecordStore.initialize(initialized);
        const noMetadata = makeConfig(initialized);
        expectFailure(reserve(noMetadata, sessionIdentity(noMetadata), ref('env-1')), 'NOT_READY', 'METADATA_MISSING');
        expectFailure(readLineage(noMetadata, sessionIdentity(noMetadata), 'env-1'), 'NOT_READY', 'METADATA_MISSING');
        // A request never creates tenant metadata (a deleted row can never be silently reset to zero).
        expect(rawRow(initialized, metadataKey('org-a'))).toBeUndefined();
    });
    it('unknown tenant and configuration drift are NOT_READY', () => {
        const { config, directory } = fixture();
        expectFailure(resolveSessionIdentity(config, { qualified: true, userId: 'u', teamId: 't', orgId: 'org-zzz' }), 'NOT_READY', 'TENANT_NOT_CONFIGURED');
        const rogue: LineageIdentity = { tenantId: 'org-zzz', owner: { kind: 'service', principalId: 'svc-1' } };
        expectFailure(reserve(config, rogue, ref('env-1')), 'NOT_READY', 'TENANT_NOT_CONFIGURED');
        const bumped = makeConfig(directory, { revision: 2 });
        expectFailure(reserve(bumped, sessionIdentity(bumped), ref('env-1')), 'NOT_READY', 'CONFIG_DRIFT');
        const resized = makeConfig(directory, { tenants: [{ tenantId: 'org-a', activeSlots: 4, archiveSlots: 3 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] });
        expectFailure(reserve(resized, sessionIdentity(resized), ref('env-1')), 'NOT_READY', 'CONFIG_DRIFT');
        expect(rawRow(directory, requestKey('org-a', 'env-1'))).toBeUndefined();
    });
});

describe('identity resolution', () => {
    it('refuses unqualified sessions and uses the verified org as tenant with immutable owner fields', () => {
        const { config } = fixture();
        for (const reason of ['NO_SESSION', 'DEVELOPMENT_FALLBACK', 'IMPERSONATED', 'EXPIRED']) {
            expectFailure(resolveSessionIdentity(config, { qualified: false, reason }), 'UNQUALIFIED');
        }
        const identity = sessionIdentity(config, 'org-b', 'u9', 't9');
        expect(identity).toEqual({ tenantId: 'org-b', owner: { kind: 'session', userId: 'u9', teamId: 't9', orgId: 'org-b' } });
        expectFailure(resolveSessionIdentity(config, { qualified: true, userId: 'bad user', teamId: 't', orgId: 'org-a' }), 'UNQUALIFIED');
    });
    it('requires the configured service principal; rotation keeps access and reassignment does not transfer history', () => {
        const { config, directory } = fixture();
        expectFailure(resolveServiceIdentity(config, false), 'UNQUALIFIED', 'SERVICE_NOT_VERIFIED');
        const unmapped = makeConfig(directory, { servicePrincipal: undefined });
        expectFailure(resolveServiceIdentity(unmapped, true), 'NOT_READY', 'SERVICE_PRINCIPAL_UNMAPPED');

        const service = serviceIdentity(config);
        reserveSettle(config, service, 'env-svc', 1);
        // Credential rotation does not change the configured principal, so the owner and the access are identical.
        const afterRotation = serviceIdentity(makeConfig(directory));
        expect(ownersEqual(service.owner, afterRotation.owner)).toBe(true);
        expect(readLineage(config, afterRotation, 'env-svc').ok).toBe(true);
        // Reassigning the principal id inside the tenant, or moving it to another tenant, exposes none of the history.
        const reassigned = makeConfig(directory, { servicePrincipal: { principalId: 'svc-2', tenantId: 'org-a' } });
        expectFailure(readLineage(reassigned, serviceIdentity(reassigned), 'env-svc'), 'NOT_FOUND');
        const moved = makeConfig(directory, { servicePrincipal: { principalId: 'svc-1', tenantId: 'org-b' } });
        expectFailure(readLineage(moved, serviceIdentity(moved), 'env-svc'), 'NOT_FOUND');
        // The stored owner is the principal id only.
        expect(allRawJson(directory)).toContain('"principalId":"svc-1"');
        expect(allRawJson(directory)).not.toMatch(/service:[0-9a-f]{16}|token|signature/i);
    });
    it('session and service owners (and different users) never read each other', () => {
        const { config } = fixture();
        const session = sessionIdentity(config);
        const service = serviceIdentity(config);
        reserveSettle(config, session, 'env-session', 1);
        reserveSettle(config, service, 'env-service', 1);
        expectFailure(readLineage(config, service, 'env-session'), 'NOT_FOUND', 'ENVELOPE_UNKNOWN');
        expectFailure(readLineage(config, session, 'env-service'), 'NOT_FOUND', 'ENVELOPE_UNKNOWN');
        expectFailure(readLineage(config, sessionIdentity(config, 'org-a', 'user-2'), 'env-session'), 'NOT_FOUND');
        expectFailure(readLineage(config, sessionIdentity(config, 'org-b'), 'env-session'), 'NOT_FOUND');
        expect(readLineage(config, session, 'env-session').ok).toBe(true);
    });
});

describe('reserve, settle, finalize and readback', () => {
    it('records three ordinals, charges exactly one slot, finalizes with named gaps and reads back in order', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        reserveSettle(config, identity, 'env-happy', 1, { ...invoked, callbackAttemptIndex: 0, canonicalExecutionId: 'env-happy', receiptCanonicalExecutionId: 'env-happy' });
        reserveSettle(config, identity, 'env-happy', 2, { ...invoked, callbackAttemptIndex: 1, usageProvenance: 'provider_reported_partial_or_complete', usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 } });
        reserveSettle(config, identity, 'env-happy', 3, { attemptOutcome: 'callback_error', callbackAttemptIndex: null, statusCode: 'provider_timeout', errorCode: 'TIMEOUT' });
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 1, activeBytes: 16384, archiveUsed: 0 });
        const fin = finalize(config, identity, ref('env-happy'), { disposition: 'COMPLETED', validationRef: 'validation-1', guardRef: 'guard-1' });
        expect(fin.ok).toBe(true);
        const read = readLineage(config, identity, 'env-happy');
        expect(read.ok).toBe(true);
        if (!read.ok) return;
        const view = read.value;
        expect(view).toMatchObject({ canonicalId: 'env-happy', location: 'ACTIVE', state: 'FINALIZED', recordingStatus: 'CONFIRMED', automaticRetryAllowed: false, continuationHold: false, ownerKind: 'session', providerContact: 'POSSIBLE_OR_OBSERVED' });
        expect(view.history.map(entry => entry.ordinal)).toEqual([1, 2, 3]);
        expect(view.history.map(entry => entry.observation?.attemptOutcome)).toEqual(['invoked', 'invoked', 'callback_error']);
        expect(view.history.map(entry => entry.observation?.callbackAttemptIndex)).toEqual([0, 1, null]);
        expect(view.history[0].join).toBe('MATCHED');
        expect(view.history[1].observation).toMatchObject({ actualUsageKnown: true, usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 } });
        expect(view.history[0].observation).toMatchObject({ actualUsageKnown: false, usage: null });
        expect(view.terminal).toMatchObject({ disposition: 'COMPLETED', refs: { validation: 'validation-1', guard: 'guard-1', sot3: null, audit: null }, gaps: ['SOT3_NOT_RECORDED', 'AUDIT_NOT_RECORDED'] });
        expect(Buffer.byteLength(rawRow(directory, requestKey('org-a', 'env-happy'))!.item_json)).toBeLessThanOrEqual(16384);
        expectFailure(finalize(config, identity, ref('env-happy'), { disposition: 'COMPLETED' }), 'CONFLICT', 'ALREADY_FINALIZED');
        expectFailure(reserve(config, identity, ref('env-happy')), 'CONFLICT', 'ENVELOPE_FINALIZED');
    });
    it('refuses a fifth ordinal', () => {
        const { config } = fixture();
        const identity = sessionIdentity(config);
        for (const ordinal of [1, 2, 3, 4]) reserveSettle(config, identity, 'env-four', ordinal);
        expectFailure(reserve(config, identity, ref('env-four')), 'CONFLICT', 'ORDINAL_LIMIT');
        const read = readLineage(config, identity, 'env-four');
        expect(read.ok && read.value.history).toHaveLength(4);
    });
    it('reserves and settles four ordinals, finalizes, and accepts the four-entry record through validation and archive within the byte limits', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        for (const ordinal of [1, 2, 3, 4]) reserveSettle(config, identity, 'env-four-ok', ordinal);
        expect(finalize(config, identity, ref('env-four-ok'), { disposition: 'COMPLETED', validationRef: 'v', guardRef: 'g', sot3Ref: 's', auditRef: 'a' }).ok).toBe(true);
        const read = readLineage(config, identity, 'env-four-ok');
        expect(read.ok && read.value.history.map(entry => [entry.ordinal, entry.state])).toEqual([[1, 'SETTLED'], [2, 'SETTLED'], [3, 'SETTLED'], [4, 'SETTLED']]);
        // Only one request slot is charged, at the first ordinal.
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 1, activeBytes: 16384 });
        const raw = JSON.parse(rawRow(directory, requestKey('org-a', 'env-four-ok'))!.item_json);
        const record = validateRequestRecord(raw);
        expect(record).not.toBeNull();
        expect(record!.entries).toHaveLength(4);
        const archived = buildArchiveRecord(record!, 1, '2026-11-12T00:00:00.000Z');
        expect(validateArchiveRecord(JSON.parse(JSON.stringify(archived)))).not.toBeNull();
        // A hand-built fifth entry is rejected by the same validator.
        const fifth = { ...raw, entries: [...raw.entries, { ...raw.entries[3], ordinal: 5 }] };
        expect(validateRequestRecord(fifth)).toBeNull();
    });
    it('a maximum-size four-entry envelope stays within the 15000-byte record body and the 16 KiB request and archive rows', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        const refs = ['r'.repeat(120), 's'.repeat(120), 't'.repeat(120)];
        const maximal = { attemptOutcome: 'invoked', callbackAttemptIndex: 99, provider: 'p'.repeat(64), model: 'm'.repeat(96), gatewayReceiptIds: refs, receiptDecision: 'fallback', manifestDigest: 'f'.repeat(64), manifestDisposition: 'not_built_precondition_stopped', usageProvenance: 'provider_reported_partial_or_complete', usage: { inputTokens: 999999999, outputTokens: 999999999, totalTokens: 999999999 }, statusCode: 'q'.repeat(64), httpStatus: 599, errorCode: 'e'.repeat(64) };
        const long = { canonicalId: 'c'.repeat(100), contractRevision: 'v'.repeat(80), sourceRevision: 'w'.repeat(80), contextRefs: Array.from({ length: 8 }, () => 'x'.repeat(120)) };
        expect(reserve(config, identity, long).ok).toBe(true);
        for (const ordinal of [1, 2, 3, 4]) {
            expect(settle(config, identity, long, ordinal, maximal).ok).toBe(true);
            if (ordinal < 4) expect(reserve(config, identity, long).ok).toBe(true);
        }
        expect(finalize(config, identity, long, { disposition: 'COMPLETED', validationRef: 'v'.repeat(120), guardRef: 'g'.repeat(120), sot3Ref: 's'.repeat(120), auditRef: 'a'.repeat(120), namedGaps: ['G1', 'G2', 'G3', 'G4', 'G5'] }).ok).toBe(true);
        const item = rawRow(directory, requestKey('org-a', long.canonicalId))!.item_json;
        expect(Buffer.byteLength(item)).toBeLessThan(15000);
        const archived = buildArchiveRecord(validateRequestRecord(JSON.parse(item))!, 4, '2026-11-12T00:00:00.000Z');
        expect(Buffer.byteLength(JSON.stringify(archived))).toBeLessThanOrEqual(16384);
    });
    it('a pending ordinal blocks the next ordinal of that envelope only, including after reopening', () => {
        const { config } = fixture();
        const identity = sessionIdentity(config);
        expect(reserve(config, identity, ref('env-pending')).ok).toBe(true);
        const blocked = expectFailure(reserve(config, identity, ref('env-pending')), 'CONFLICT', 'PORT_PENDING');
        expect(blocked.view?.recordingStatus).toBe('POSSIBLE_CONTACT_PENDING');
        expectFailure(reserve(config, identity, ref('env-other')), 'CONFLICT', 'ADMISSION_CONFLICT');
        expect(reserve(config, sessionIdentity(config, 'org-a', 'user-other'), ref('env-other')).ok).toBe(true);
        // Each operation reopens the database, so this is also the restart/reopen case: PORT_PENDING is read back as possible contact.
        const read = readLineage(config, identity, 'env-pending');
        expect(read.ok && read.value).toMatchObject({ recordingStatus: 'POSSIBLE_CONTACT_PENDING', continuationHold: true, providerContact: 'POSSIBLE_OR_OBSERVED' });
        expect(read.ok && read.value.history[0]).toMatchObject({ state: 'PORT_PENDING', observation: null });
        expect(settle(config, identity, ref('env-pending'), 1, invoked).ok).toBe(true);
        expect(reserve(config, identity, ref('env-pending')).ok).toBe(true);
    });
    it('rejects settle misuse and re-checks owner and revision joins on every operation without changing state', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        expect(reserve(config, identity, ref('env-join')).ok).toBe(true);
        const before = rawRow(directory, requestKey('org-a', 'env-join'));
        expectFailure(settle(config, identity, ref('env-join'), 2, invoked), 'CONFLICT', 'ORDINAL_UNKNOWN');
        expectFailure(settle(config, sessionIdentity(config, 'org-a', 'user-2'), ref('env-join'), 1, invoked), 'CONFLICT', 'OWNER_MISMATCH');
        expectFailure(settle(config, identity, { ...ref('env-join'), contractRevision: 'contract-2' }, 1, invoked), 'CONFLICT', 'REVISION_MISMATCH');
        expectFailure(reserve(config, identity, { ...ref('env-join'), sourceRevision: 'src-9' }), 'CONFLICT');
        expectFailure(settle(config, identity, ref('env-unknown'), 1, invoked), 'NOT_FOUND');
        expectFailure(settle(config, identity, ref('env-join'), 5, invoked), 'UNAVAILABLE', 'INVALID_INPUT');
        expect(rawRow(directory, requestKey('org-a', 'env-join'))).toEqual(before);
        expect(settle(config, identity, ref('env-join'), 1, invoked).ok).toBe(true);
        expectFailure(settle(config, identity, ref('env-join'), 1, invoked), 'CONFLICT', 'ALREADY_SETTLED');
    });
    it('keeps JOIN_DISCREPANT durable and holds continuation', () => {
        const { config } = fixture();
        const identity = sessionIdentity(config);
        expect(reserve(config, identity, ref('env-disc')).ok).toBe(true);
        const failure = expectFailure(settle(config, identity, ref('env-disc'), 1, { ...invoked, canonicalExecutionId: 'env-disc', receiptCanonicalExecutionId: 'env-other' }), 'JOIN_DISCREPANT', 'CANONICAL_ID_MISMATCH');
        expect(failure.view).toMatchObject({ recordingStatus: 'JOIN_DISCREPANT', continuationHold: true });
        expectFailure(reserve(config, identity, ref('env-disc')), 'JOIN_DISCREPANT', 'CONTINUATION_HELD');
        const read = readLineage(config, identity, 'env-disc');
        expect(read.ok && read.value).toMatchObject({ recordingStatus: 'JOIN_DISCREPANT', continuationHold: true });
        expect(read.ok && read.value.history[0].join).toBe('DISCREPANT');
    });
    it('maps a lost commit acknowledgement to COMMIT_UNKNOWN and readback resolves the durable state', () => {
        const { config } = fixture();
        const identity = sessionIdentity(config);
        _testOnlySetStoreHooks({ afterCommit() { throw new Error('LOST_ACK'); } });
        expectFailure(reserve(config, identity, ref('env-unknown')), 'COMMIT_UNKNOWN');
        _testOnlySetStoreHooks(undefined);
        const read = readLineage(config, identity, 'env-unknown');
        expect(read.ok && read.value.recordingStatus).toBe('POSSIBLE_CONTACT_PENDING');
        expectFailure(reserve(config, identity, ref('env-unknown')), 'CONFLICT', 'PORT_PENDING');
    });
});

describe('tenant capacity and isolation', () => {
    it('saturates tenant A without affecting tenant B and still settles and finalizes existing A requests', () => {
        const { config } = fixture();
        const a = sessionIdentity(config, 'org-a');
        const b = sessionIdentity(config, 'org-b', 'user-b', 'team-b');
        for (const id of ['a-1', 'a-2', 'a-3']) expect(reserve(config, id === 'a-1' ? a : sessionIdentity(config, 'org-a', id), ref(id)).ok).toBe(true);
        expectFailure(reserve(config, sessionIdentity(config, 'org-a', 'a-4'), ref('a-4')), 'CAPACITY', 'TENANT_CAPACITY');
        expect(rawRow(config.directory, requestKey('org-a', 'a-4'))).toBeUndefined();
        expect(reserve(config, b, ref('b-1')).ok).toBe(true);
        // Existing requests keep their settlement capacity, including a second ordinal and finalization.
        expect(settle(config, a, ref('a-1'), 1, invoked).ok).toBe(true);
        expect(reserve(config, a, ref('a-1')).ok).toBe(true);
        expect(settle(config, a, ref('a-1'), 2, invoked).ok).toBe(true);
        expect(finalize(config, a, ref('a-1'), { disposition: 'FAILED' }).ok).toBe(true);
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 3, activeSlots: 3, activeBytes: 3 * 16384 });
        const capacityB = readTenantCapacity(config, 'org-b');
        expect(capacityB.ok && capacityB.value).toMatchObject({ activeUsed: 1 });
    });
    it('unrelated corrupt and oversize rows do not affect a healthy envelope and are explicit when targeted', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        plantRaw(directory, requestKey('org-a', 'env-bad'), 'CORRUPT{');
        plantRaw(directory, requestKey('org-a', 'env-big'), JSON.stringify({ pad: 'x'.repeat(20000) }));
        const badBefore = rawRow(directory, requestKey('org-a', 'env-bad'));
        reserveSettle(config, identity, 'env-good', 1);
        expect(readLineage(config, identity, 'env-good').ok).toBe(true);
        expectFailure(readLineage(config, identity, 'env-bad'), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expectFailure(readLineage(config, identity, 'env-big'), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expectFailure(reserve(config, sessionIdentity(config, 'org-a', 'another-user'), ref('env-bad')), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expectFailure(settle(config, identity, ref('env-bad'), 1, invoked), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expectFailure(finalize(config, identity, ref('env-big'), { disposition: 'FAILED' }), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expect(rawRow(directory, requestKey('org-a', 'env-bad'))).toEqual(badBefore);
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value.activeUsed).toBe(1);
    });
    it('corrupt or contradictory metadata holds only that tenant and is never reset', () => {
        const { config, directory } = fixture();
        const a = sessionIdentity(config, 'org-a');
        const b = sessionIdentity(config, 'org-b', 'user-b', 'team-b');
        reserveSettle(config, a, 'a-existing', 1);
        reserveSettle(config, b, 'b-existing', 1);
        const contradictions: string[] = [
            'META_CORRUPT{',
            JSON.stringify({ schema: 'cvf.webLineageMeta.v1', tenantId: 'org-a' }),
            JSON.stringify({ ...buildInitialMetadata(config, config.tenants[0]), activeUsed: 99, activeBytes: 99 * 16384 }),
            JSON.stringify({ ...buildInitialMetadata(config, config.tenants[0]), activeUsed: 1, activeBytes: 5 }),
            JSON.stringify({ ...buildInitialMetadata(config, config.tenants[0]), archiveUsed: -1, archiveBytes: -16384 }),
        ];
        for (const bad of contradictions) {
            plantRaw(directory, metadataKey('org-a'), bad, 7);
            const planted = rawRow(directory, metadataKey('org-a'));
            expectFailure(reserve(config, a, ref('a-new')), 'UNAVAILABLE', 'TENANT_HELD');
            expectFailure(settle(config, a, ref('a-existing'), 1, invoked), 'UNAVAILABLE', 'TENANT_HELD');
            expectFailure(finalize(config, a, ref('a-existing'), { disposition: 'FAILED' }), 'UNAVAILABLE', 'TENANT_HELD');
            expectFailure(readLineage(config, a, 'a-existing'), 'UNAVAILABLE', 'TENANT_HELD');
            expectFailure(readTenantCapacity(config, 'org-a'), 'UNAVAILABLE', 'TENANT_HELD');
            expect(rawRow(directory, metadataKey('org-a'))).toEqual(planted);
            // Tenant B is healthy.
            expect(readLineage(config, b, 'b-existing').ok).toBe(true);
        }
        expect(reserve(config, sessionIdentity(config, 'org-b', 'user-b-new', 'team-b'), ref('b-new')).ok).toBe(true);
    });
    it('pure metadata helpers keep exact byte accounting and never go negative or over capacity', () => {
        const config = makeConfig(tempDir());
        let meta = buildInitialMetadata(config, config.tenants[0]);
        expect(validateMetadata(meta, 'org-a')).toEqual(meta);
        expect(validateMetadata(meta, 'org-b')).toBeNull();
        expect(metadataAfterArchive(meta)).toBeNull();
        expect(metadataAfterArchiveRelease(meta)).toBeNull();
        for (let i = 0; i < 3; i += 1) meta = metadataAfterReserve(meta)!;
        expect(meta).toMatchObject({ activeUsed: 3, activeBytes: 3 * 16384 });
        expect(metadataAfterReserve(meta)).toBeNull();
        const archived = metadataAfterArchive(meta)!;
        expect(archived).toMatchObject({ activeUsed: 2, activeBytes: 2 * 16384, archiveUsed: 1, archiveBytes: 16384 });
        expect(validateMetadata(archived, 'org-a')).toEqual(archived);
        expect(metadataAfterArchiveRelease(archived)).toMatchObject({ archiveUsed: 0, archiveBytes: 0, activeUsed: 2 });
    });
    it('enforces one in-flight operation per tenant and four per process without queueing', () => {
        const tenants = ['t-1', 't-2', 't-3', 't-4', 't-5'].map(tenantId => ({ tenantId, activeSlots: 5, archiveSlots: 5 }));
        const { config } = fixture({ tenants, servicePrincipal: { principalId: 'svc-1', tenantId: 't-1' } });
        // Same tenant: a nested operation started while the first is in flight is BUSY, not queued.
        let nested: unknown;
        _testOnlySetStoreHooks({ afterOpen() { _testOnlySetStoreHooks(undefined); nested = reserve(config, sessionIdentity(config, 't-1', 'other'), ref('env-nested')); } });
        expect(reserve(config, sessionIdentity(config, 't-1'), ref('env-outer')).ok).toBe(true);
        expectFailure(nested as { ok: boolean }, 'BUSY', 'IN_FLIGHT_LIMIT');
        expect(rawRow(config.directory, requestKey('t-1', 'env-nested'))).toBeUndefined();
        // Different tenants nest up to four, the fifth is refused.
        const outcomes: Record<string, unknown> = {};
        let depth = 1;
        _testOnlySetStoreHooks({
            afterOpen() {
                depth += 1;
                if (depth > 5) return;
                const tenantId = `t-${depth}`;
                outcomes[tenantId] = reserve(config, sessionIdentity(config, tenantId), ref(`env-${tenantId}`));
            },
        });
        expect(reserve(config, sessionIdentity(config, 't-1', 'chain-user'), ref('env-chain')).ok).toBe(true);
        expect((outcomes['t-2'] as { ok: boolean }).ok).toBe(true);
        expect((outcomes['t-3'] as { ok: boolean }).ok).toBe(true);
        expect((outcomes['t-4'] as { ok: boolean }).ok).toBe(true);
        expectFailure(outcomes['t-5'] as { ok: boolean }, 'BUSY', 'IN_FLIGHT_LIMIT');
        // The guard is released afterwards.
        _testOnlySetStoreHooks(undefined);
        expect(reserve(config, sessionIdentity(config, 't-5'), ref('env-after')).ok).toBe(true);
    });
});

describe('safe projection', () => {
    it('drops unknown, oversized and secret-bearing fields before anything is persisted', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        const evidence = {
            canonicalExecutionId: 'env-secret',
            attemptOutcome: 'invoked',
            usageProvenance: 'provider_reported_partial_or_complete',
            actualUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3, rawPrompt: 'SECRET_PROMPT' },
            receipt: { receiptId: 'rcpt-9', providerId: 'alibaba', selectedModelId: 'qwen-plus', decision: 'selected', credentialFingerprint: 'abcdef012345', canonicalExecutionId: 'env-secret', metadata: { prompt: 'SECRET_PROMPT' } },
            materialContextManifest: { manifestDigest: 'a'.repeat(64), canonicalExecutionId: 'env-secret', entries: [{ text: 'SECRET_MANIFEST_TEXT' }] },
            materialContextManifestDisposition: 'attached',
            providerDiagnostic: { code: 'provider_http_error', httpStatus: 502, credentialFingerprint: 'abcdef012345' },
            output: 'SECRET_MODEL_OUTPUT',
            token: 'tok_SECRET_TOKEN',
        };
        const raw = {
            ...observationFromCanonicalEvidence(evidence, { callbackAttemptIndex: 0, errorCode: 'raw error: boom with spaces SECRET_ERROR' }),
            prompt: 'SECRET_PROMPT', output: 'SECRET_MODEL_OUTPUT', rawError: 'SECRET_ERROR', headers: { authorization: 'Bearer SECRET_HEADER' },
            model: 'm'.repeat(200),
        };
        expect(reserve(config, identity, ref('env-secret')).ok).toBe(true);
        expect(settle(config, identity, ref('env-secret'), 1, raw).ok).toBe(true);
        const stored = allRawJson(directory);
        for (const marker of ['SECRET_PROMPT', 'SECRET_MODEL_OUTPUT', 'SECRET_ERROR', 'SECRET_HEADER', 'SECRET_MANIFEST_TEXT', 'tok_SECRET_TOKEN', 'abcdef012345', 'raw error']) {
            expect(stored, marker).not.toContain(marker);
        }
        const read = readLineage(config, identity, 'env-secret');
        const observation = read.ok ? read.value.history[0].observation : null;
        expect(observation).toMatchObject({
            attemptOutcome: 'invoked', provider: 'alibaba', model: null, gatewayReceiptIds: ['rcpt-9'], receiptDecision: 'selected',
            manifestDigest: 'a'.repeat(64), manifestDisposition: 'attached', statusCode: 'provider_http_error', httpStatus: 502, errorCode: null,
            actualUsageKnown: true, usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
        });
        expect(read.ok && read.value.history[0].join).toBe('MATCHED');
        expect(Object.keys(observation!).sort()).toEqual(['actualUsageKnown', 'attemptOutcome', 'callbackAttemptIndex', 'errorCode', 'gatewayReceiptIds', 'httpStatus', 'manifestDigest', 'manifestDisposition', 'model', 'observedAt', 'provider', 'receiptDecision', 'statusCode', 'usage', 'usageProvenance']);
    });
    it('projection is total: non-objects and hostile values collapse to safe defaults', () => {
        for (const hostile of [null, 'text', 42, [], { attemptOutcome: { toString: () => 'x' }, callbackAttemptIndex: -3, gatewayReceiptIds: ['ok-1', 'bad id', 7, 'ok-1', 'ok-2', 'ok-3', 'ok-4'], usage: { inputTokens: -1, outputTokens: 1.5 }, usageProvenance: 'made-up' }]) {
            const projected = projectObservation(hostile);
            expect(projected.attemptOutcome).toBe('unknown');
            expect(projected.callbackAttemptIndex).toBeNull();
            expect(projected.usage).toBeNull();
            expect(projected.actualUsageKnown).toBe(false);
            expect(projected.usageProvenance).toBe('unknown');
        }
        expect(projectObservation({ gatewayReceiptIds: ['ok-1', 'bad id', 7, 'ok-1', 'ok-2', 'ok-3', 'ok-4'] }).gatewayReceiptIds).toEqual(['ok-1', 'ok-2', 'ok-3']);
        // Usage that the provider did not report is never claimed as known.
        expect(projectObservation({ usageProvenance: 'unknown', usage: { totalTokens: 9 } })).toMatchObject({ actualUsageKnown: false, usage: { totalTokens: 9 } });
    });
    it('a maximum-size settled envelope stays within the 16 KiB request row', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        const refs = ['r'.repeat(120), 's'.repeat(120), 't'.repeat(120)];
        const maximal = { attemptOutcome: 'invoked', callbackAttemptIndex: 99, provider: 'p'.repeat(64), model: 'm'.repeat(96), gatewayReceiptIds: refs, receiptDecision: 'fallback', manifestDigest: 'f'.repeat(64), manifestDisposition: 'not_built_precondition_stopped', usageProvenance: 'provider_reported_partial_or_complete', usage: { inputTokens: 999999999, outputTokens: 999999999, totalTokens: 999999999 }, statusCode: 'q'.repeat(64), httpStatus: 599, errorCode: 'e'.repeat(64) };
        const long = { canonicalId: 'c'.repeat(100), contractRevision: 'v'.repeat(80), sourceRevision: 'w'.repeat(80), contextRefs: Array.from({ length: 8 }, () => 'x'.repeat(120)) };
        expect(reserve(config, identity, long).ok).toBe(true);
        for (const ordinal of [1, 2, 3]) {
            expect(settle(config, identity, long, ordinal, maximal).ok).toBe(true);
            if (ordinal < 3) expect(reserve(config, identity, long).ok).toBe(true);
        }
        expect(finalize(config, identity, long, { disposition: 'COMPLETED', validationRef: 'v'.repeat(120), guardRef: 'g'.repeat(120), sot3Ref: 's'.repeat(120), auditRef: 'a'.repeat(120), namedGaps: ['G1', 'G2', 'G3', 'G4', 'G5'] }).ok).toBe(true);
        const bytes = Buffer.byteLength(rawRow(directory, requestKey('org-a', long.canonicalId))!.item_json);
        expect(bytes).toBeLessThan(15000);
        const archived = buildArchiveRecord(validateRequestRecord(JSON.parse(rawRow(directory, requestKey('org-a', long.canonicalId))!.item_json))!, 3, '2026-11-12T00:00:00.000Z');
        expect(Buffer.byteLength(JSON.stringify(archived))).toBeLessThanOrEqual(16384);
    });
});

describe('archive-facing helpers and active-then-archive readback', () => {
    function finalizedRecord(config: LineageConfig, id: string): { record: LineageRequestRecord; revision: number } {
        const identity = sessionIdentity(config);
        reserveSettle(config, identity, id, 1);
        expect(finalize(config, identity, ref(id), { disposition: 'COMPLETED', validationRef: 'v', guardRef: 'g', sot3Ref: 's', auditRef: 'a' }).ok).toBe(true);
        const [entry] = createStore(config).readKeys([requestKey('org-a', id)]);
        if (entry.state !== 'PRESENT') throw new Error('expected present');
        return { record: validateRequestRecord(entry.value)!, revision: entry.revision };
    }
    function createStore(config: LineageConfig) {
        return new SQLiteKeyedAtomicRecordStore(config.directory, config.namespace, { maxRowBytes: 49152, maxRowBytesFor: id => (id.startsWith('m:') ? 49152 : 16384) });
    }
    it('reads an archived envelope after an archive move and blocks reserve on that id; tampering is UNAVAILABLE', () => {
        const { config, directory } = fixture();
        const identity = sessionIdentity(config);
        const { record, revision } = finalizedRecord(config, 'env-arch');
        expect(isArchiveEligible(record, Date.parse(record.terminal!.finalizedAt) + 3_600_000)).toBe(true);
        expect(isArchiveEligible(record, Date.parse(record.terminal!.finalizedAt) + 1000)).toBe(false);
        const store = createStore(config);
        // The maintenance transaction shape: [m, r, a] -> archive write, CAS delete and counters in one commit (three keys).
        store.transactionKeys([metadataKey('org-a'), requestKey('org-a', 'env-arch'), archiveKey('org-a', 'env-arch')], ([meta, request, archive]) => {
            if (meta.state !== 'PRESENT' || request.state !== 'PRESENT' || archive.state !== 'ABSENT') throw new Error('unexpected');
            const next = metadataAfterArchive(validateMetadata(meta.value)!)!;
            return {
                writes: [
                    { id: meta.id, expectedRevision: meta.revision, value: next },
                    { id: request.id, expectedRevision: request.revision, delete: true as const },
                    { id: archive.id, expectedRevision: null, value: buildArchiveRecord(record, revision, '2026-11-12T01:00:00.000Z') },
                ],
                result: 0,
            };
        });
        const read = readLineage(config, identity, 'env-arch');
        expect(read.ok && read.value).toMatchObject({ location: 'ARCHIVE', state: 'FINALIZED', recordingStatus: 'CONFIRMED' });
        expect(read.ok && read.value.history).toHaveLength(1);
        expectFailure(readLineage(config, serviceIdentity(config), 'env-arch'), 'NOT_FOUND');
        expectFailure(reserve(config, identity, ref('env-arch')), 'CONFLICT', 'ENVELOPE_ARCHIVED');
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 0, archiveUsed: 1, archiveBytes: 16384 });
        // Tampered archive evidence (digest no longer matches) is unavailable, not empty.
        const archiveRow = rawRow(directory, archiveKey('org-a', 'env-arch'))!;
        plantRaw(directory, archiveKey('org-a', 'env-arch'), archiveRow.item_json.replace('"disposition":"COMPLETED"', '"disposition":"FAILED"'), archiveRow.revision);
        expectFailure(readLineage(config, identity, 'env-arch'), 'UNAVAILABLE', 'RECORD_UNAVAILABLE');
        expect(validateArchiveRecord(JSON.parse(archiveRow.item_json))).not.toBeNull();
    });
    it('archive eligibility never accepts pending, discrepant, open or young envelopes', () => {
        const { config } = fixture();
        const identity = sessionIdentity(config);
        const { record } = finalizedRecord(config, 'env-elig');
        const later = Date.parse(record.terminal!.finalizedAt) + 4_000_000;
        expect(isArchiveEligible(record, later)).toBe(true);
        expect(isArchiveEligible({ ...record, joinDiscrepant: true }, later)).toBe(false);
        expect(isArchiveEligible({ ...record, state: 'OPEN', terminal: null }, later)).toBe(false);
        expect(isArchiveEligible({ ...record, entries: [{ ...record.entries[0], state: 'PORT_PENDING', settledAt: null, join: 'NOT_CHECKED', observation: null }] }, later)).toBe(false);
        expect(reserve(config, identity, ref('env-open')).ok).toBe(true);
        const open = readLineage(config, identity, 'env-open');
        expect(open.ok && open.value.continuationHold).toBe(true);
    });
    it('exposes key builders that round-trip and a view that hides owner identifiers', () => {
        expect(parseLineageKey(requestKey('org-a', 'env-1'))).toEqual({ kind: 'request', tenantId: 'org-a', envelopeId: 'env-1' });
        expect(parseLineageKey(archiveKey('org-a', 'env-1'))).toEqual({ kind: 'archive', tenantId: 'org-a', envelopeId: 'env-1' });
        expect(parseLineageKey(metadataKey('org-a'))).toEqual({ kind: 'metadata', tenantId: 'org-a', envelopeId: null });
        expect(parseLineageKey('x:org-a')).toBeNull();
        const { config } = fixture();
        const { record } = finalizedRecord(config, 'env-view');
        expect(JSON.stringify(toSafeLineageView(record))).not.toMatch(/user-1|team-1|org-a/);
    });
});

describe('implementation guards', () => {
    it('source contains no namespace scan, directory creation, token hash or token storage', () => {
        const source = readFileSync(lineageSource, 'utf8');
        const code = source.slice(source.indexOf("import { createHash }")).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        expect(code).not.toMatch(/readAll\(|mkdirSync|\.mkdir\(|deriveServiceTokenIdentity|service-token-auth|process\.env\.CVF_SERVICE_TOKEN|ORDER BY|SELECT /);
        expect(code).not.toMatch(/\bawait\b|async /);
        expect(source).not.toContain('\r');
    });
});

// ---------------------------------------------------------------------------------------------------------------------
// Real independent processes. The child loads the production module through the TypeScript transpiler (plain JS script).
// ---------------------------------------------------------------------------------------------------------------------
const childScript = String.raw`
const fs=require('node:fs'),path=require('node:path');
const [moduleFile,ctl,mode,envelope,tenantId]=process.argv.slice(2);
const ts=require(path.join(process.cwd(),'node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>{mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);};
const lineage=require(moduleFile);
const config=lineage.parseLineageConfig(process.env.CVF_WEB_LINEAGE_CONFIG_JSON).config;
const emit=(event,extra={})=>process.stdout.write(JSON.stringify({event,pid:process.pid,...extra})+'\n');
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const waitFor=name=>{const end=Date.now()+15000;while(!fs.existsSync(path.join(ctl,name))){if(Date.now()>end)throw Error('TIMEOUT '+name);sleep(2);}};
emit('READY');
process.stdin.once('data',()=>{
  const identity={tenantId,owner:{kind:'session',userId:'peer-'+envelope,teamId:'team-1',orgId:tenantId}};
  const ref={canonicalId:envelope,contractRevision:'contract-1',sourceRevision:'src-1'};
  if(mode==='holder')lineage._testOnlySetStoreHooks({afterAcquire(){emit('ENTERED');waitFor('release');}});
  emit('ARMED');
  if(mode==='racer')waitFor('go');
  const result=lineage.reserve(config,identity,ref);
  emit('COMPLETE',{code:result.code,reason:result.reason||null});
  process.exit(0);
});`;
function spawnPeer(config: LineageConfig, ctl: string, mode: string, envelope: string, tenantId: string) {
    const script = path.join(ctl, 'peer.js');
    if (!existsSync(script)) writeFileSync(script, childScript);
    const peer: ChildProcess = spawn(process.execPath, [script, lineageSource, ctl, mode, envelope, tenantId], {
        cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, [LINEAGE_CONFIG_ENV]: JSON.stringify(config) },
    });
    cleanups.push(() => { peer.kill(); });
    const events: Record<string, unknown>[] = [];
    let buffer = ''; let stderr = '';
    peer.stdout!.on('data', data => { buffer += String(data); const lines = buffer.split('\n'); buffer = lines.pop()!; for (const line of lines) if (line) events.push(JSON.parse(line)); });
    peer.stderr!.on('data', data => { stderr += String(data); });
    const wait = async (event: string): Promise<Record<string, unknown>> => {
        const end = Date.now() + 20000;
        while (!events.some(e => e.event === event)) {
            if (Date.now() > end || (peer.exitCode !== null && !events.some(e => e.event === event))) throw new Error(`PEER_${event}: ${stderr}`);
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        return events.find(e => e.event === event)!;
    };
    const exited = async () => { if (peer.exitCode === null) await new Promise<void>(resolve => peer.once('exit', () => resolve())); };
    return { peer, wait, exited };
}
function peerConfig(directory: string): LineageConfig {
    // Two active slots; the parent consumes the first, so exactly one slot remains for the race.
    return makeConfig(directory, { tenants: [{ tenantId: 'org-a', activeSlots: 2, archiveSlots: 2 }], servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' } });
}

describe('independent processes racing the final active slot of one tenant', () => {
    it('a lock holder makes the competing fresh envelope BUSY without a write; the storage-only probe then shows the slot consumed', async () => {
        const directory = tempDir(); SQLiteKeyedAtomicRecordStore.initialize(directory);
        const config = peerConfig(directory); provisionTenantMetadata(config);
        const ctl = tempDir('cvf-web-lineage-ctl-');
        expect(reserve(config, serviceIdentity(config), ref('env-first')).ok).toBe(true);
        const holder = spawnPeer(config, ctl, 'holder', 'env-holder', 'org-a');
        const contender = spawnPeer(config, ctl, 'plain', 'env-contender', 'org-a');
        await holder.wait('READY'); await contender.wait('READY');
        holder.peer.stdin!.write('START');
        await holder.wait('ENTERED');
        contender.peer.stdin!.write('START');
        const lost = await contender.wait('COMPLETE');
        expect(lost.code).toBe('BUSY');
        writeFileSync(path.join(ctl, 'release'), 'go');
        expect((await holder.wait('COMPLETE')).code).toBe('OK');
        await holder.exited(); await contender.exited();
        // Explicit storage-only probe (not a provider retry): the final slot is consumed, and the loser left no record.
        const capacity = readTenantCapacity(config, 'org-a');
        expect(capacity.ok && capacity.value).toMatchObject({ activeUsed: 2, activeSlots: 2 });
        expect(rawRow(directory, requestKey('org-a', 'env-contender'))).toBeUndefined();
        expectFailure(reserve(config, sessionIdentity(config, 'org-a', 'another-owner'), ref('env-contender')), 'CAPACITY', 'TENANT_CAPACITY');
        process.stdout.write('LINEAGE_REAL_PEER_BARRIER ' + JSON.stringify({ holderPid: holder.peer.pid, contenderPid: contender.peer.pid, loser: lost.code }) + '\n');
    }, 60000);

    it('two unsynchronized processes with fresh envelopes: exactly one reserves, the other is BUSY or CAPACITY, repeated three times', async () => {
        const outcomes: string[] = [];
        for (let round = 0; round < 3; round += 1) {
            const directory = tempDir(); SQLiteKeyedAtomicRecordStore.initialize(directory);
            const config = peerConfig(directory); provisionTenantMetadata(config);
            const ctl = tempDir('cvf-web-lineage-ctl-');
            expect(reserve(config, serviceIdentity(config), ref('env-first')).ok).toBe(true);
            const first = spawnPeer(config, ctl, 'racer', `env-a-${round}`, 'org-a');
            const second = spawnPeer(config, ctl, 'racer', `env-b-${round}`, 'org-a');
            await first.wait('READY'); await second.wait('READY');
            first.peer.stdin!.write('START'); second.peer.stdin!.write('START');
            await first.wait('ARMED'); await second.wait('ARMED');
            writeFileSync(path.join(ctl, 'go'), 'go');
            const results = [await first.wait('COMPLETE'), await second.wait('COMPLETE')];
            await first.exited(); await second.exited();
            const winners = results.filter(r => r.code === 'OK');
            const losers = results.filter(r => r.code !== 'OK');
            expect(winners).toHaveLength(1);
            expect(losers).toHaveLength(1);
            expect(['BUSY', 'CAPACITY']).toContain(losers[0].code);
            const capacity = readTenantCapacity(config, 'org-a');
            expect(capacity.ok && capacity.value.activeUsed).toBe(2);
            const created = [`env-a-${round}`, `env-b-${round}`].filter(id => rawRow(directory, requestKey('org-a', id)));
            expect(created).toHaveLength(1);
            outcomes.push(String(losers[0].code));
        }
        process.stdout.write('LINEAGE_REAL_PEER_RACE ' + JSON.stringify({ rounds: 3, loserCodes: outcomes }) + '\n');
    }, 90000);
});
