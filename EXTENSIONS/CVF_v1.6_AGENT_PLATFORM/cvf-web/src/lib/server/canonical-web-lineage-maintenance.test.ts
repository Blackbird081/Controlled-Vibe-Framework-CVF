import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    LINEAGE_CONFIG_ENV,
    archiveKey,
    buildArchiveRecord,
    finalize,
    metadataKey,
    parseLineageConfig,
    provisionTenantMetadata,
    readLineage,
    readTenantCapacity,
    requestKey,
    reserve,
    resolveSessionIdentity,
    settle,
    validateRequestRecord,
    type LineageCapacity,
    type LineageConfig,
    type LineageIdentity,
    type LineageRef,
} from './canonical-web-lineage';
import {
    MAINTENANCE_MAX_BATCH,
    PLATFORM_UNSUPPORTED_MESSAGE,
    PLATFORM_UNSUPPORTED_REASON,
    _testOnlySetMaintenanceHooks,
    _testOnlySetArchiveExportPlatformCapability,
    archiveLineage,
    exportLineage,
    initializeLineage,
    archiveExportPlatformCapability,
    probeArchiveExportPlatform,
    reconcileLineage,
} from './canonical-web-lineage-maintenance';
import { parseMaintenanceArgs, runMaintenanceCommand } from '../../../scripts/canonical-web-lineage-maintenance';

// Vitest runs from the cvf-web package root; jsdom's import.meta.url is not a file URL.
const nativeSource = path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts');
const lineageSource = path.resolve(process.cwd(), 'src/lib/server/canonical-web-lineage.ts');
const maintenanceSource = path.resolve(process.cwd(), 'src/lib/server/canonical-web-lineage-maintenance.ts');
const cliSource = path.resolve(process.cwd(), 'scripts/canonical-web-lineage-maintenance.ts');
const nodeRequire = createRequire(nativeSource);
const NAMESPACE = 'cvf-web-lineage-maint';
const DATABASE_FILE = 'cvf-keyvalue-store.sqlite';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const cleanups: (() => void)[] = [];
afterEach(() => {
    _testOnlySetMaintenanceHooks(undefined);
    _testOnlySetArchiveExportPlatformCapability(undefined);
    while (cleanups.length) cleanups.pop()!();
});

/**
 * POSIX pairing. init and reconcile run on every host (no no-follow custody on those paths). archive and export use the no-follow
 * custody and the archive/export platform check, so the describes that exercise them run only where posixCapable is true (Linux and
 * Docker). Those skips are not silent: the 'platform fail-closed' describe at the end of this file asserts, unconditionally (the
 * capability is forced on every host, and the real probe on native Windows), that archive and export refuse with PLATFORM_UNSUPPORTED
 * and leave the journal and the destination unchanged, and that init and reconcile still run.
 */
const posixCapable = probeArchiveExportPlatform().supported;

type TenantSpec = { tenantId: string; activeSlots?: number; archiveSlots?: number };
function tempDir(prefix = 'cvf-web-lineage-maint-'): string {
    const directory = mkdtempSync(path.join(tmpdir(), prefix));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    return directory;
}
function rawConfig(directory: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: NAMESPACE,
        tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] as TenantSpec[],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' },
        ...overrides,
    };
}
function makeConfig(directory: string, overrides: Record<string, unknown> = {}): LineageConfig {
    const parsed = parseLineageConfig(JSON.stringify(rawConfig(directory, overrides)));
    if (!parsed.ok) throw new Error(`config ${parsed.reason}`);
    return parsed.config;
}
/** An initialized database with provisioned metadata, created through the production init path. */
function fixture(overrides: Record<string, unknown> = {}) {
    const directory = tempDir();
    const config = makeConfig(directory, overrides);
    expect(initializeLineage(config).status).toBe('COMPLETED');
    return { directory, config };
}
function identityFor(config: LineageConfig, orgId = 'org-a', id = 'default'): LineageIdentity {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId: `user-${id}`, orgId, teamId: 'team-1' });
    if (!resolved.ok) throw new Error(`identity ${resolved.reason}`);
    return resolved.value;
}
const ref = (canonicalId: string): LineageRef => ({ canonicalId, contractRevision: 'contract-1', sourceRevision: 'src-1' });
const invoked = { attemptOutcome: 'invoked', callbackAttemptIndex: 0, provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'], usageProvenance: 'unknown' };
const terminalRefs = { disposition: 'COMPLETED', validationRef: 'v-1', guardRef: 'g-1', sot3Ref: 's-1', auditRef: 'a-1' };

function seedPending(config: LineageConfig, id: string, orgId = 'org-a'): void {
    expect(reserve(config, identityFor(config, orgId, id), ref(id)).ok).toBe(true);
}
function seedSettledOpen(config: LineageConfig, id: string, observation: unknown = invoked, orgId = 'org-a'): void {
    seedPending(config, id, orgId);
    expect(settle(config, identityFor(config, orgId, id), ref(id), 1, observation).ok).toBe(true);
}
function seedFinalized(config: LineageConfig, id: string, orgId = 'org-a', observation: unknown = invoked): void {
    seedSettledOpen(config, id, observation, orgId);
    expect(finalize(config, identityFor(config, orgId, id), ref(id), terminalRefs).ok).toBe(true);
}
function seedDiscrepant(config: LineageConfig, id: string): void {
    seedPending(config, id);
    const settled = settle(config, identityFor(config, 'org-a', id), ref(id), 1, { ...invoked, canonicalExecutionId: 'some-other-envelope' });
    expect(settled.ok).toBe(false);
    expect(finalize(config, identityFor(config, 'org-a', id), ref(id), terminalRefs).ok).toBe(true);
}

type RawDb = { prepare(sql: string): { run(...a: unknown[]): unknown; all(...a: unknown[]): unknown[]; get(...a: unknown[]): unknown }; close(): void };
function withRaw<T>(directory: string, operate: (db: RawDb) => T): T {
    const Database = nodeRequire('better-sqlite3') as new (file: string) => RawDb;
    const db = new Database(path.join(directory, DATABASE_FILE));
    try { return operate(db); } finally { db.close(); }
}
function rawRows(directory: string): Record<string, { revision: number; item_json: string }> {
    const rows = withRaw(directory, db => db.prepare('SELECT id, revision, item_json FROM atomic_key_value_store WHERE namespace = ? ORDER BY id').all(NAMESPACE)) as { id: string; revision: number; item_json: string }[];
    const result: Record<string, { revision: number; item_json: string }> = {};
    for (const row of rows) result[row.id] = { revision: row.revision, item_json: row.item_json };
    return result;
}
function rowIds(directory: string, prefix: string): string[] {
    return Object.keys(rawRows(directory)).filter(id => id.startsWith(prefix));
}
function plantRaw(directory: string, id: string, json: string, revision = 0): void {
    withRaw(directory, db => db.prepare('INSERT OR REPLACE INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at) VALUES (?,?,?,?,?)')
        .run(NAMESPACE, id, revision, json, '2026-11-12T00:00:00.000Z'));
}
function deleteRaw(directory: string, id: string): void {
    withRaw(directory, db => db.prepare('DELETE FROM atomic_key_value_store WHERE namespace = ? AND id = ?').run(NAMESPACE, id));
}
function capacity(config: LineageConfig, tenantId = 'org-a'): LineageCapacity {
    const result = readTenantCapacity(config, tenantId);
    if (!result.ok) throw new Error(`capacity ${result.reason}`);
    return result.value;
}
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const afterArchiveAge = () => Date.now() + 2 * HOUR;
const afterRetention = () => Date.now() + 8 * DAY;

/** Seeds finalized envelopes and archives them through the production archive path. */
function archived(config: LineageConfig, ids: string[], orgId = 'org-a'): void {
    for (const id of ids) seedFinalized(config, id, orgId);
    const report = archiveLineage(config, { now: afterArchiveAge() });
    expect(report.status).toBe('COMPLETED');
    expect(report.archived).toBe(ids.length);
}

describe('init', () => {
    it('creates the database and zero-counter metadata for the configured tenants; a rerun is idempotent', () => {
        const directory = tempDir();
        const config = makeConfig(directory);
        const first = initializeLineage(config);
        expect(first).toMatchObject({ operation: 'init', status: 'COMPLETED', databaseCreated: true, requiresReconciliation: false });
        expect(first.tenants).toEqual([{ tenantId: 'org-a', action: 'CREATED' }, { tenantId: 'org-b', action: 'CREATED' }]);
        expect(capacity(config)).toMatchObject({ configRevision: 1, activeUsed: 0, archiveUsed: 0, activeBytes: 0, archiveBytes: 0, activeSlots: 12, archiveSlots: 12 });
        const before = rawRows(directory);
        const second = initializeLineage(config);
        expect(second).toMatchObject({ status: 'COMPLETED', databaseCreated: false });
        expect(second.tenants.map(tenant => tenant.action)).toEqual(['EXISTING', 'EXISTING']);
        expect(rawRows(directory)).toEqual(before);
    });

    it('refuses different configuration, contradictory metadata and a missing metadata row, writing nothing (no silent migration)', () => {
        const { directory, config } = fixture();
        seedPending(config, 'env-1');
        const before = rawRows(directory);
        expect(initializeLineage(makeConfig(directory, { revision: 2 }))).toMatchObject({ status: 'REFUSED', reason: 'CONFIG_MISMATCH_REVISION' });
        const slots = rawConfig(directory, { tenants: [{ tenantId: 'org-a', activeSlots: 11, archiveSlots: 12 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] });
        const resized = parseLineageConfig(JSON.stringify(slots));
        expect(resized.ok && initializeLineage(resized.config)).toMatchObject({ status: 'REFUSED', reason: 'CONFIG_MISMATCH_SLOTS' });
        const narrowed = parseLineageConfig(JSON.stringify(rawConfig(directory, { tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }] })));
        expect(narrowed.ok && initializeLineage(narrowed.config)).toMatchObject({ status: 'REFUSED', reason: 'UNCONFIGURED_TENANT_PRESENT' });
        expect(rawRows(directory)).toEqual(before);
        plantRaw(directory, metadataKey('org-b'), '{"schema":"nope"}');
        expect(initializeLineage(config)).toMatchObject({ status: 'REFUSED', reason: 'METADATA_INVALID' });
        deleteRaw(directory, metadataKey('org-a'));
        expect(initializeLineage(config)).toMatchObject({ status: 'REFUSED', reason: 'METADATA_MISSING_WITH_RECORDS' });
        expect(rawRows(directory)[metadataKey('org-a')]).toBeUndefined();
    });

    it('never creates a directory: a missing approved directory is refused', () => {
        const missing = path.join(tempDir(), 'does-not-exist');
        const report = initializeLineage(makeConfig(missing));
        expect(report.status).toBe('REFUSED');
        expect(report.reason).toBe('STORE_NOT_READY_DIRECTORY_MISSING');
        expect(existsSync(missing)).toBe(false);
    });
});

describe.runIf(posixCapable)('archive', () => {
    it('moves only finalized, clean envelopes older than one hour; pending, uncertain, discrepant and open ones are never reclaimed', () => {
        const { directory, config } = fixture();
        seedFinalized(config, 'env-ok');
        seedPending(config, 'env-pending');
        seedFinalized(config, 'env-unknown', 'org-a', { attemptOutcome: 'unknown' });
        seedDiscrepant(config, 'env-discrepant');
        seedSettledOpen(config, 'env-open');
        const preRecord = JSON.parse(rawRows(directory)[requestKey('org-a', 'env-ok')].item_json);
        const preRevision = rawRows(directory)[requestKey('org-a', 'env-ok')].revision;

        const young = archiveLineage(config, { now: Date.now() });
        expect(young).toMatchObject({ status: 'COMPLETED', archived: 0, attempted: 0 });
        expect(young.classification).toMatchObject({ TOO_YOUNG: 1, PORT_PENDING: 1, UNCERTAIN_OUTCOME: 1, JOIN_DISCREPANT: 1, NOT_FINALIZED: 1 });

        const forever = Date.now() + 100 * 365 * DAY;
        const report = archiveLineage(config, { now: forever });
        expect(report).toMatchObject({ status: 'COMPLETED', archived: 1, attempted: 1 });
        expect(report.outcomes).toEqual([{ tenantId: 'org-a', canonicalId: 'env-ok', outcome: 'ARCHIVED', reason: 'ARCHIVED' }]);
        expect(report.classification).toMatchObject({ ELIGIBLE: 1, PORT_PENDING: 1, UNCERTAIN_OUTCOME: 1, JOIN_DISCREPANT: 1, NOT_FINALIZED: 1 });
        expect(rowIds(directory, 'r:org-a:').sort()).toEqual(['env-discrepant', 'env-open', 'env-pending', 'env-unknown'].map(id => requestKey('org-a', id)));
        expect(capacity(config)).toMatchObject({ activeUsed: 4, archiveUsed: 1, activeBytes: 4 * 16384, archiveBytes: 16384 });

        // The archive row keeps the identical safe evidence, the origin revision and digest; authorized readback finds it.
        const archive = JSON.parse(rawRows(directory)[archiveKey('org-a', 'env-ok')].item_json);
        expect(archive.record).toEqual(preRecord);
        expect(archive.originRevision).toBe(preRevision);
        expect(archive.originDigest).toBe(buildArchiveRecord(validateRequestRecord(preRecord)!, preRevision, archive.archivedAt).originDigest);
        const view = readLineage(config, identityFor(config, 'org-a', 'env-ok'), 'env-ok');
        expect(view.ok && view.value.location).toBe('ARCHIVE');
        expect(readLineage(config, identityFor(config, 'org-a', 'env-pending'), 'env-pending').ok).toBe(true);

        // Idempotent: nothing further is eligible.
        expect(archiveLineage(config, { now: forever }).archived).toBe(0);
    });

    it('archives at most ten envelopes per run, one transaction each', () => {
        const { config } = fixture();
        for (let index = 0; index < 12; index += 1) seedFinalized(config, `env-${String(index).padStart(2, '0')}`);
        const first = archiveLineage(config, { now: afterArchiveAge() });
        expect(MAINTENANCE_MAX_BATCH).toBe(10);
        expect(first).toMatchObject({ archived: 10, attempted: 10 });
        expect(capacity(config)).toMatchObject({ activeUsed: 2, archiveUsed: 10 });
        const second = archiveLineage(config, { now: afterArchiveAge() });
        expect(second.archived).toBe(2);
        expect(capacity(config)).toMatchObject({ activeUsed: 0, archiveUsed: 12 });
        expect(archiveLineage(config, { now: afterArchiveAge(), maxEnvelopes: 11 })).toMatchObject({ status: 'REFUSED', reason: 'BATCH_LIMIT_INVALID' });
    });

    it('an archive-full tenant stops archiving and stays held for new admission; another tenant is unaffected', () => {
        const { directory, config } = fixture({ tenants: [{ tenantId: 'org-a', activeSlots: 3, archiveSlots: 1 }, { tenantId: 'org-b', activeSlots: 3, archiveSlots: 3 }] });
        for (const id of ['env-a1', 'env-a2', 'env-a3']) seedFinalized(config, id, 'org-a');
        for (const id of ['env-b1', 'env-b2']) seedFinalized(config, id, 'org-b');
        const report = archiveLineage(config, { now: afterArchiveAge() });
        const a = report.tenants.find(tenant => tenant.tenantId === 'org-a')!;
        const b = report.tenants.find(tenant => tenant.tenantId === 'org-b')!;
        expect(a).toMatchObject({ status: 'ARCHIVE_FULL', archived: 1 });
        expect(b).toMatchObject({ status: 'OK', archived: 2 });
        expect(report.outcomes.filter(outcome => outcome.tenantId === 'org-a').map(outcome => outcome.reason)).toEqual(['ARCHIVED', 'ARCHIVE_FULL']);
        expect(rowIds(directory, 'r:org-a:')).toHaveLength(2);
        expect(capacity(config, 'org-a')).toMatchObject({ activeUsed: 2, archiveUsed: 1 });
        expect(capacity(config, 'org-b')).toMatchObject({ activeUsed: 0, archiveUsed: 2 });
        // Fill A's active allocation while its archive stays full: new admission is held (TENANT_CAPACITY), B keeps its own slots.
        seedPending(config, 'env-a-new');
        const held = reserve(config, identityFor(config, 'org-a'), ref('env-a-held'));
        expect(held).toMatchObject({ ok: false, code: 'CAPACITY', reason: 'TENANT_CAPACITY' });
        expect(archiveLineage(config, { now: afterArchiveAge() }).tenants.find(tenant => tenant.tenantId === 'org-a')!.status).toBe('ARCHIVE_FULL');
        expect(capacity(config, 'org-a')).toMatchObject({ activeUsed: 3, archiveUsed: 1 });
        expect(reserve(config, identityFor(config, 'org-b'), ref('env-b-new')).ok).toBe(true);
    });

    it('a failure before COMMIT leaves the active row, the archive key and both counters untouched', () => {
        const { directory, config } = fixture();
        seedFinalized(config, 'env-1');
        const before = rawRows(directory);
        _testOnlySetMaintenanceHooks({ store: () => ({ beforeCommit() { throw new Error('boom'); } }) });
        const report = archiveLineage(config, { now: afterArchiveAge() });
        expect(report).toMatchObject({ status: 'STOPPED', reason: 'STORE_IO', archived: 0, requiresReconciliation: false });
        expect(rawRows(directory)).toEqual(before);
    });

    it('COMMIT_UNKNOWN stops the batch and flags reconciliation; nothing further is attempted', () => {
        const { directory, config } = fixture();
        for (const id of ['env-1', 'env-2', 'env-3']) seedFinalized(config, id);
        let call = 0;
        _testOnlySetMaintenanceHooks({ store: () => { call += 1; return call === 2 ? { afterCommit() { throw new Error('lost'); } } : undefined; } });
        const report = archiveLineage(config, { now: afterArchiveAge() });
        expect(report).toMatchObject({ status: 'STOPPED', reason: 'STORE_COMMIT_UNKNOWN', requiresReconciliation: true, attempted: 2, archived: 1 });
        expect(call).toBe(2);
        _testOnlySetMaintenanceHooks(undefined);
        expect(rowIds(directory, 'a:org-a:')).toHaveLength(2);
        expect(rowIds(directory, 'r:org-a:')).toHaveLength(1);
        const reconciled = reconcileLineage(config);
        expect(reconciled.consistent).toBe(true);
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 2 });
    });
});

describe.runIf(posixCapable)('export', () => {
    it('exports aged archive rows to an existing destination, verifies the file, writes a durable receipt, then deletes and decrements', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2', 'env-3']);
        const before = rawRows(directory);
        const destination = tempDir('cvf-web-lineage-export-');

        const tooYoung = exportLineage(config, { destination, now: Date.now() + 6 * DAY });
        expect(tooYoung).toMatchObject({ status: 'COMPLETED', released: 0 });
        expect(readdirSync(destination)).toEqual([]);
        expect(capacity(config).archiveUsed).toBe(3);

        const report = exportLineage(config, { destination, now: afterRetention() });
        expect(report).toMatchObject({ status: 'COMPLETED', released: 3, requiresReconciliation: false });
        const batch = report.batches[0];
        expect(batch).toMatchObject({ kind: 'NEW', tenantId: 'org-a', entries: 3, released: 3 });
        const exportBytes = readFileSync(path.join(destination, batch.exportFile));
        const receipt = JSON.parse(readFileSync(path.join(destination, batch.receiptFile), 'utf8'));
        const exported = JSON.parse(exportBytes.toString('utf8'));
        expect(receipt.exportFileSha256).toBe(sha256(exportBytes));
        expect(receipt.exportFileBytes).toBe(exportBytes.length);
        expect(exported.entries.map((entry: { id: string }) => entry.id)).toEqual(['a:org-a:env-1', 'a:org-a:env-2', 'a:org-a:env-3']);
        for (const entry of exported.entries as { id: string; revision: number; originDigest: string; rowDigest: string; row: unknown }[]) {
            expect(entry.revision).toBe(before[entry.id].revision);
            expect(entry.rowDigest).toBe(sha256(before[entry.id].item_json));
            expect(JSON.stringify(entry.row)).toBe(before[entry.id].item_json);
            expect(entry.originDigest).toBe((entry.row as { originDigest: string }).originDigest);
        }
        expect(receipt.entries.map((entry: { canonicalId: string }) => entry.canonicalId)).toEqual(['env-1', 'env-2', 'env-3']);
        expect(rowIds(directory, 'a:org-a:')).toEqual([]);
        expect(capacity(config)).toMatchObject({ activeUsed: 0, archiveUsed: 0, archiveBytes: 0 });
        expect(reconcileLineage(config).consistent).toBe(true);
        expect(readdirSync(destination).filter(name => !name.includes('.progress-')).sort()).toEqual([batch.exportFile, batch.receiptFile].sort());
    });

    it('replaying the command recognizes the receipt and never frees capacity twice, even if the same id is archived again', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2']);
        const destination = tempDir('cvf-web-lineage-export-');
        expect(exportLineage(config, { destination, now: afterRetention() }).released).toBe(2);
        seedPending(config, 'env-keep');

        const replay = exportLineage(config, { destination, now: afterRetention() });
        expect(replay).toMatchObject({ status: 'COMPLETED', released: 0, alreadyReleased: 2 });
        expect(replay.batches).toHaveLength(1);
        expect(replay.batches[0]).toMatchObject({ kind: 'RECOGNIZED_RECEIPT', released: 0, alreadyReleased: 2 });
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 0 });

        // A later, different record with the same canonical id is a different row: the old receipt never touches it.
        archived(config, ['env-1']);
        const oldBatch = replay.batches[0];
        const again = exportLineage(config, { destination, now: afterRetention() });
        expect(again.released).toBe(1);
        expect(again.batches[0].entryOutcomes).toEqual([
            { canonicalId: 'env-1', outcome: 'ALREADY_RELEASED', reason: 'RELEASE_PREVIOUSLY_CONFIRMED' },
            { canonicalId: 'env-2', outcome: 'ALREADY_RELEASED', reason: 'RELEASE_PREVIOUSLY_CONFIRMED' },
        ]);
        expect(again.batches[1]).toMatchObject({ kind: 'NEW', released: 1 });
        expect(again.batches[1].batchId).not.toBe(oldBatch.batchId);
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 0 });
        expect(rowIds(directory, 'a:org-a:')).toEqual([]);
        expect(readdirSync(destination).filter(name => !name.includes('.progress-'))).toHaveLength(4);
    });

    it('a crash between the receipt and the delete is reconciled by the rerun without a double release', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2', 'env-3']);
        const destination = tempDir('cvf-web-lineage-export-');
        _testOnlySetMaintenanceHooks({ afterReceipt() { throw new Error('SIMULATED_CRASH'); } });
        expect(() => exportLineage(config, { destination, now: afterRetention() })).toThrow('SIMULATED_CRASH');
        _testOnlySetMaintenanceHooks(undefined);
        expect(readdirSync(destination)).toHaveLength(2);
        expect(rowIds(directory, 'a:org-a:')).toHaveLength(3);
        expect(capacity(config).archiveUsed).toBe(3);

        const rerun = exportLineage(config, { destination, now: afterRetention() });
        expect(rerun).toMatchObject({ status: 'COMPLETED', released: 3 });
        expect(rerun.batches).toHaveLength(1);
        expect(rerun.batches[0].kind).toBe('RECOGNIZED_RECEIPT');
        expect(capacity(config).archiveUsed).toBe(0);
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ released: 0, alreadyReleased: 3 });
        expect(capacity(config).archiveUsed).toBe(0);
        expect(reconcileLineage(config).consistent).toBe(true);
    });

    it('a crash in the middle of the deletes is finished by the rerun; rows already released are not decremented again', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2', 'env-3']);
        const destination = tempDir('cvf-web-lineage-export-');
        _testOnlySetMaintenanceHooks({ beforeRelease(index) { if (index === 2) throw new Error('SIMULATED_CRASH'); } });
        expect(() => exportLineage(config, { destination, now: afterRetention() })).toThrow('SIMULATED_CRASH');
        _testOnlySetMaintenanceHooks(undefined);
        expect(rowIds(directory, 'a:org-a:')).toHaveLength(1);
        expect(capacity(config).archiveUsed).toBe(1);
        const rerun = exportLineage(config, { destination, now: afterRetention() });
        expect(rerun.batches[0]).toMatchObject({ released: 1, alreadyReleased: 2 });
        expect(capacity(config).archiveUsed).toBe(0);
        expect(reconcileLineage(config).consistent).toBe(true);
    });

    it('COMMIT_UNKNOWN during a delete stops the batch for reconciliation; the rerun frees each row exactly once', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2', 'env-3']);
        const destination = tempDir('cvf-web-lineage-export-');
        let call = 0;
        _testOnlySetMaintenanceHooks({ store: () => { call += 1; return call === 1 ? { afterCommit() { throw new Error('lost'); } } : undefined; } });
        const stopped = exportLineage(config, { destination, now: afterRetention() });
        expect(stopped).toMatchObject({ status: 'STOPPED', reason: 'STORE_COMMIT_UNKNOWN', requiresReconciliation: true });
        expect(call).toBe(1);
        _testOnlySetMaintenanceHooks(undefined);
        // The first delete did commit; the other two were never attempted. The books are consistent.
        expect(rowIds(directory, 'a:org-a:')).toHaveLength(2);
        expect(reconcileLineage(config).consistent).toBe(true);
        const rerun = exportLineage(config, { destination, now: afterRetention() });
        expect(rerun.batches[0].entryOutcomes.map(outcome => outcome.outcome)).toEqual(['ALREADY_RELEASED', 'RELEASED', 'RELEASED']);
        expect(capacity(config).archiveUsed).toBe(0);
    });

    it('without a verified destination and receipt the archive and its quota charge are retained', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2']);
        const before = rawRows(directory);
        const file = path.join(tempDir(), 'a-file');
        writeFileSync(file, 'x');
        const missing = path.join(tempDir(), 'missing');
        const cases: [string | undefined, string][] = [
            [undefined, 'DESTINATION_REQUIRED'], [missing, 'DESTINATION_MISSING'], [file, 'DESTINATION_INVALID'],
            ['relative/dir', 'DESTINATION_INVALID'], [directory, 'DESTINATION_INSIDE_DATABASE_CUSTODY'],
        ];
        for (const [destination, reason] of cases) {
            expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ status: 'REFUSED', reason, released: 0 });
        }
        expect(existsSync(missing)).toBe(false);
        expect(rawRows(directory)).toEqual(before);

        // A readback failure of the export file keeps the archive and writes no receipt.
        const destination = tempDir('cvf-web-lineage-export-');
        _testOnlySetMaintenanceHooks({ afterExportFile(exportPath) { writeFileSync(exportPath, 'tampered'); } });
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ status: 'STOPPED', reason: 'EXPORT_READBACK_EXPORT_FILE_DIGEST_MISMATCH' });
        _testOnlySetMaintenanceHooks(undefined);
        expect(readdirSync(destination).filter(name => name.endsWith('.receipt.json'))).toEqual([]);
        expect(rawRows(directory)).toEqual(before);
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ status: 'REFUSED', reason: 'EXPORT_FILE_CONFLICT' });
        expect(rawRows(directory)).toEqual(before);
    });

    it('a receipt whose export file is gone or altered never authorizes a delete', () => {
        const { directory, config } = fixture();
        archived(config, ['env-1', 'env-2']);
        const before = rawRows(directory);
        const destination = tempDir('cvf-web-lineage-export-');
        _testOnlySetMaintenanceHooks({ afterReceipt() { throw new Error('SIMULATED_CRASH'); } });
        expect(() => exportLineage(config, { destination, now: afterRetention() })).toThrow('SIMULATED_CRASH');
        _testOnlySetMaintenanceHooks(undefined);
        const exportFile = readdirSync(destination).find(name => !name.endsWith('.receipt.json'))!;
        rmSync(path.join(destination, exportFile));
        const stopped = exportLineage(config, { destination, now: afterRetention() });
        expect(stopped).toMatchObject({ status: 'STOPPED', reason: 'RECEIPT_EXPORT_UNVERIFIED', released: 0 });
        expect(stopped.batches[0].retained).toBe(2);
        expect(rawRows(directory)).toEqual(before);
        const receiptFile = readdirSync(destination).find(name => name.endsWith('.receipt.json'))!;
        writeFileSync(path.join(destination, receiptFile), '{"broken":true}');
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ status: 'STOPPED', reason: 'RECEIPT_INVALID' });
        expect(rawRows(directory)).toEqual(before);
    });
});

describe('reconcile', () => {
    it('reports a counter mismatch without repairing it, and lists pending, uncertain and discrepant envelopes', () => {
        const { directory, config } = fixture();
        seedFinalized(config, 'env-ok');
        seedPending(config, 'env-pending');
        seedFinalized(config, 'env-unknown', 'org-a', { attemptOutcome: 'unknown' });
        seedDiscrepant(config, 'env-discrepant');
        const clean = reconcileLineage(config);
        expect(clean).toMatchObject({ status: 'COMPLETED', readOnly: true, repaired: false, consistent: true });
        const tenant = clean.tenants.find(item => item.tenantId === 'org-a')!;
        expect(tenant).toMatchObject({ pending: ['env-pending'], uncertain: ['env-unknown'], joinDiscrepant: ['env-discrepant'], mismatches: [], actual: { activeRows: 4, archiveRows: 0 } });

        const tampered = JSON.parse(rawRows(directory)[metadataKey('org-a')].item_json);
        tampered.activeUsed = 7;
        tampered.activeBytes = 7 * 16384;
        plantRaw(directory, metadataKey('org-a'), JSON.stringify(tampered), 3);
        const before = rawRows(directory);
        const report = reconcileLineage(config);
        expect(report.consistent).toBe(false);
        expect(report.repaired).toBe(false);
        expect(report.tenants.find(item => item.tenantId === 'org-a')!.mismatches).toEqual([{ field: 'activeUsed', recorded: 7, actual: 4 }]);
        expect(rawRows(directory)).toEqual(before);
        expect(capacity(config).activeUsed).toBe(7);
        expect(runMaintenanceCommand(['reconcile', '--directory', directory], { [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory)) }).exitCode).toBe(2);
    });

    it('distinguishes unavailable rows, held metadata, duplicate locations and unconfigured tenants; a missing database is refused, not created', () => {
        const { directory, config } = fixture();
        seedFinalized(config, 'env-ok');
        plantRaw(directory, requestKey('org-a', 'env-bad'), '{');
        plantRaw(directory, requestKey('org-a', 'env-big'), JSON.stringify({ pad: 'x'.repeat(20000) }));
        plantRaw(directory, archiveKey('org-b', 'env-z'), 'not json');
        plantRaw(directory, metadataKey('org-b'), '{');
        plantRaw(directory, metadataKey('org-z'), JSON.stringify({ schema: 'cvf.webLineageMeta.v1' }));
        const record = validateRequestRecord(JSON.parse(rawRows(directory)[requestKey('org-a', 'env-ok')].item_json))!;
        plantRaw(directory, archiveKey('org-a', 'env-ok'), JSON.stringify(buildArchiveRecord(record, 0, '2026-11-12T00:00:00.000Z')));
        const before = rawRows(directory);
        const report = reconcileLineage(config);
        expect(report.consistent).toBe(false);
        expect(report.unconfiguredMetadata).toEqual(['org-z']);
        const a = report.tenants.find(item => item.tenantId === 'org-a')!;
        expect(a.unavailable).toEqual(expect.arrayContaining([
            { location: 'ACTIVE', id: 'env-bad', code: 'CORRUPT' },
            { location: 'ACTIVE', id: 'env-big', code: 'OVERSIZE' },
        ]));
        expect(a.duplicateLocations).toEqual(['env-ok']);
        expect(a.mismatches).toEqual(expect.arrayContaining([{ field: 'activeUsed', recorded: 1, actual: 3 }, { field: 'archiveUsed', recorded: 0, actual: 1 }]));
        const b = report.tenants.find(item => item.tenantId === 'org-b')!;
        expect(b).toMatchObject({ metadata: 'UNAVAILABLE', recorded: null });
        expect(b.unavailable).toEqual([{ location: 'ARCHIVE', id: 'env-z', code: 'CORRUPT' }]);
        expect(rawRows(directory)).toEqual(before);

        const empty = tempDir();
        expect(reconcileLineage(makeConfig(empty))).toMatchObject({ status: 'REFUSED', reason: 'DATABASE_MISSING' });
        expect(existsSync(path.join(empty, DATABASE_FILE))).toBe(false);
        expect(reconcileLineage(config, { tenantId: 'org-q' })).toMatchObject({ status: 'REFUSED', reason: 'TENANT_NOT_CONFIGURED' });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
// Real independent processes. The child loads the production journal module through the TypeScript transpiler.
// ---------------------------------------------------------------------------------------------------------------------
const childScript = String.raw`
const fs=require('node:fs'),path=require('node:path');
const [moduleFile,ctl,mode,envelope,tenantId,count]=process.argv.slice(2);
const ts=require(path.join(process.cwd(),'node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>{mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);};
const lineage=require(moduleFile);
const config=lineage.parseLineageConfig(process.env.CVF_WEB_LINEAGE_CONFIG_JSON).config;
const emit=(event,extra={})=>process.stdout.write(JSON.stringify({event,pid:process.pid,...extra})+'\n');
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const waitFor=name=>{const end=Date.now()+20000;while(!fs.existsSync(path.join(ctl,name))){if(Date.now()>end)throw Error('TIMEOUT '+name);sleep(2);}};
const identity={tenantId,owner:{kind:'session',userId:'peer-'+envelope,teamId:'team-1',orgId:tenantId}};
const refOf=id=>({canonicalId:id,contractRevision:'contract-1',sourceRevision:'src-1'});
const observation={attemptOutcome:'invoked',callbackAttemptIndex:0,provider:'alibaba',model:'qwen-plus',gatewayReceiptIds:['rcpt-1'],usageProvenance:'unknown'};
let busy=0;
const retry=operation=>{
  for(let attempt=0;attempt<4000;attempt+=1){
    const result=operation();
    if(result.code!=='BUSY')return result;
    busy+=1;
    sleep(2);
  }
  return {code:'GAVE_UP'};
};
emit('READY');
process.stdin.once('data',()=>{
  if(mode==='holder'){
    lineage._testOnlySetStoreHooks({afterAcquire(){emit('ENTERED');waitFor('release-'+envelope);}});
    const result=lineage.reserve(config,identity,refOf(envelope));
    emit('COMPLETE',{code:result.code});
    process.exit(0);
  }
  emit('ARMED');
  waitFor('go');
  for(let index=0;index<Number(count);index+=1){
    const id=envelope+'-'+index;
    const steps=[
      ['reserve',()=>lineage.reserve(config,identity,refOf(id))],
      ['settle',()=>lineage.settle(config,identity,refOf(id),1,observation)],
      ['finalize',()=>lineage.finalize(config,identity,refOf(id),{disposition:'COMPLETED',validationRef:'v-1',guardRef:'g-1',sot3Ref:'s-1',auditRef:'a-1'})],
    ];
    for(const [name,operation] of steps){
      const result=retry(operation);
      if(result.code!=='OK'){emit('FAILED',{step:name,id,code:result.code,reason:result.reason||null});process.exit(1);}
    }
  }
  emit('COMPLETE',{code:'OK',busy});
  process.exit(0);
});`;
function spawnPeer(config: LineageConfig, ctl: string, mode: string, envelope: string, tenantId: string, count = 0) {
    const script = path.join(ctl, 'peer.js');
    if (!existsSync(script)) writeFileSync(script, childScript);
    const peer: ChildProcess = spawn(process.execPath, [script, lineageSource, ctl, mode, envelope, tenantId, String(count)], {
        cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, [LINEAGE_CONFIG_ENV]: JSON.stringify(config) },
    });
    cleanups.push(() => { peer.kill(); });
    const events: Record<string, unknown>[] = [];
    let buffer = '';
    let stderr = '';
    peer.stdout!.on('data', data => {
        buffer += String(data);
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) if (line) events.push(JSON.parse(line));
    });
    peer.stderr!.on('data', data => { stderr += String(data); });
    const wait = async (event: string): Promise<Record<string, unknown>> => {
        const end = Date.now() + 30000;
        while (!events.some(item => item.event === event)) {
            if (Date.now() > end || (peer.exitCode !== null && !events.some(item => item.event === event))) throw new Error(`PEER_${event}: ${stderr} ${JSON.stringify(events)}`);
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        return events.find(item => item.event === event)!;
    };
    const exited = async () => { if (peer.exitCode === null) await new Promise<void>(resolve => peer.once('exit', () => resolve())); };
    return { peer, wait, exited };
}

describe.runIf(posixCapable)('maintenance racing writers in an independent process', () => {
    it('a lock held by another process makes archive and export stop BUSY with nothing changed; the receipt lets the rerun finish', async () => {
        const { directory, config } = fixture();
        const ctl = tempDir('cvf-web-lineage-ctl-');
        for (const id of ['env-1', 'env-2']) seedFinalized(config, id);
        const before = rawRows(directory);

        const holder = spawnPeer(config, ctl, 'holder', 'env-held-1', 'org-a');
        await holder.wait('READY');
        holder.peer.stdin!.write('START');
        await holder.wait('ENTERED');
        const busy = archiveLineage(config, { now: afterArchiveAge() });
        expect(busy).toMatchObject({ status: 'STOPPED', reason: 'STORE_BUSY', archived: 0, requiresReconciliation: false });
        expect(rawRows(directory)).toEqual(before);
        writeFileSync(path.join(ctl, 'release-env-held-1'), 'go');
        expect((await holder.wait('COMPLETE')).code).toBe('OK');
        await holder.exited();

        expect(archiveLineage(config, { now: afterArchiveAge() }).archived).toBe(2);
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 2 });

        // Export: the receipt is durable before the first delete; a held lock stops the batch and the rerun completes it once.
        const destination = tempDir('cvf-web-lineage-export-');
        const second = spawnPeer(config, ctl, 'holder', 'env-held-2', 'org-a');
        await second.wait('READY');
        second.peer.stdin!.write('START');
        await second.wait('ENTERED');
        const blocked = exportLineage(config, { destination, now: afterRetention() });
        expect(blocked).toMatchObject({ status: 'STOPPED', reason: 'STORE_BUSY', released: 0 });
        expect(readdirSync(destination)).toHaveLength(2);
        expect(capacity(config).archiveUsed).toBe(2);
        writeFileSync(path.join(ctl, 'release-env-held-2'), 'go');
        expect((await second.wait('COMPLETE')).code).toBe('OK');
        await second.exited();
        const rerun = exportLineage(config, { destination, now: afterRetention() });
        expect(rerun).toMatchObject({ status: 'COMPLETED', released: 2 });
        expect(rerun.batches[0].kind).toBe('RECOGNIZED_RECEIPT');
        expect(capacity(config)).toMatchObject({ activeUsed: 2, archiveUsed: 0 });
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ released: 0, alreadyReleased: 2 });
        expect(reconcileLineage(config).tenants[0].mismatches).toEqual([]);
        process.stdout.write('LINEAGE_MAINTENANCE_BUSY_BARRIER ' + JSON.stringify({ archiveBusy: busy.reason, exportBusy: blocked.reason }) + '\n');
    }, 90000);

    it('archive and export loops concurrent with reserve/settle/finalize keep the counters atomic; every envelope is released exactly once', async () => {
        const seeded = 10;
        const workerCount = 20;
        const { directory, config } = fixture({ tenants: [{ tenantId: 'org-a', activeSlots: 40, archiveSlots: 40 }] });
        const ctl = tempDir('cvf-web-lineage-ctl-');
        const destination = tempDir('cvf-web-lineage-export-');
        for (let index = 0; index < seeded; index += 1) seedFinalized(config, `seed-${index}`);
        const worker = spawnPeer(config, ctl, 'worker', 'proc', 'org-a', workerCount);
        await worker.wait('READY');
        worker.peer.stdin!.write('START');
        await worker.wait('ARMED');
        writeFileSync(path.join(ctl, 'go'), 'go');

        const now = Date.now() + 10 * DAY;
        const stops: string[] = [];
        let released = 0;
        let iterations = 0;
        const cycle = () => {
            iterations += 1;
            for (const report of [archiveLineage(config, { now }), exportLineage(config, { destination, now })]) {
                if (report.status !== 'COMPLETED') stops.push(String(report.reason));
                if (report.operation === 'export') released += (report as { released: number }).released;
            }
        };
        do {
            cycle();
            await new Promise(resolve => setTimeout(resolve, 2));
        } while (worker.peer.exitCode === null);
        const done = await worker.wait('COMPLETE');
        expect(done.code).toBe('OK');
        for (let drain = 0; drain < 30 && (rowIds(directory, 'r:').length > 0 || rowIds(directory, 'a:').length > 0); drain += 1) cycle();

        // Only contention may stop a pass; every other stop reason would be a defect.
        expect(stops.filter(reason => !/BUSY/.test(reason))).toEqual([]);
        const exportedIds: string[] = [];
        for (const name of readdirSync(destination).filter(item => item.endsWith('.receipt.json'))) {
            const receipt = JSON.parse(readFileSync(path.join(destination, name), 'utf8')) as { entries: { canonicalId: string }[] };
            for (const entry of receipt.entries) exportedIds.push(entry.canonicalId);
        }
        const expected = [...Array.from({ length: seeded }, (_, index) => `seed-${index}`), ...Array.from({ length: workerCount }, (_, index) => `proc-${index}`)].sort();
        expect([...exportedIds].sort()).toEqual(expected);
        expect(released).toBe(expected.length);
        expect(rowIds(directory, 'r:')).toEqual([]);
        expect(rowIds(directory, 'a:')).toEqual([]);
        expect(capacity(config)).toMatchObject({ activeUsed: 0, archiveUsed: 0, activeBytes: 0, archiveBytes: 0 });
        expect(reconcileLineage(config).consistent).toBe(true);
        process.stdout.write('LINEAGE_MAINTENANCE_RACE ' + JSON.stringify({ iterations, releasedTotal: released, busyStops: stops.length, workerBusyRetries: done.busy }) + '\n');
    }, 120000);
});

describe.runIf(posixCapable)('command line', () => {
    const configEnv = (directory: string, overrides: Record<string, unknown> = {}) => ({ [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory, overrides)) });

    it('runs init, archive, export and reconcile from an explicit directory and configuration, with exit codes', () => {
        const directory = tempDir();
        const destination = tempDir('cvf-web-lineage-export-');
        const configFile = path.join(tempDir(), 'lineage-config.json');
        writeFileSync(configFile, JSON.stringify(rawConfig(directory)));
        const initResult = runMaintenanceCommand(['init', '--directory', directory, '--config', configFile], {});
        expect(initResult.exitCode).toBe(0);
        expect(initResult.output).toMatchObject({ operation: 'init', status: 'COMPLETED', databaseCreated: true });
        const config = makeConfig(directory);
        seedFinalized(config, 'env-1');
        const env = configEnv(directory);
        const young = runMaintenanceCommand(['archive', '--directory', directory, '--max', '5'], env);
        expect(young).toMatchObject({ exitCode: 0, output: { operation: 'archive', archived: 0 } });
        const now = new Date(afterArchiveAge()).toISOString();
        const moved = runMaintenanceCommand(['archive', '--directory', directory, '--now', now, '--tenant', 'org-a'], env);
        expect(moved).toMatchObject({ exitCode: 0, output: { archived: 1 } });
        expect(runMaintenanceCommand(['export', '--directory', directory], env)).toMatchObject({ exitCode: 1, output: { status: 'REFUSED', reason: 'DESTINATION_REQUIRED' } });
        const exportNow = new Date(afterRetention()).toISOString();
        const exported = runMaintenanceCommand(['export', '--directory', directory, '--destination', destination, '--now', exportNow], env);
        expect(exported).toMatchObject({ exitCode: 0, output: { operation: 'export', released: 1 } });
        expect(runMaintenanceCommand(['reconcile', '--directory', directory, '--config', configFile], {})).toMatchObject({ exitCode: 0, output: { consistent: true, repaired: false } });
        expect(JSON.stringify(exported.output)).not.toMatch(/user-1|team-1/);
    });

});

// Usage and configuration refusals refuse before any operation runs, so they are platform-independent and run on every host.
describe('command line refusals', () => {
    const configEnv = (directory: string, overrides: Record<string, unknown> = {}) => ({ [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory, overrides)) });

    it('refuses unknown commands, malformed flags, a missing configuration and a directory that differs from the configuration', () => {
        const directory = tempDir();
        const env = configEnv(directory);
        const refusals: [string[], Record<string, string | undefined>, string][] = [
            [[], env, 'USAGE_COMMAND_REQUIRED'],
            [['purge', '--directory', directory], env, 'USAGE_COMMAND_UNKNOWN'],
            [['init'], env, 'USAGE_DIRECTORY_REQUIRED'],
            [['init', '--directory'], env, 'USAGE_FLAG_VALUE_MISSING'],
            [['init', '--directory', directory, '--directory', directory], env, 'USAGE_FLAG_DUPLICATE'],
            [['init', '--directory', directory, '--force', 'yes'], env, 'USAGE_FLAG_UNKNOWN'],
            [['archive', '--directory', directory, '--now', 'yesterday'], env, 'USAGE_NOW_INVALID'],
            [['archive', '--directory', directory, '--max', '11'], env, 'USAGE_MAX_INVALID'],
            [['archive', '--directory', directory, '--destination', directory], env, 'USAGE_DESTINATION_ONLY_FOR_EXPORT'],
            [['init', '--directory', directory], {}, 'CONFIG_MISSING'],
            [['init', '--directory', directory, '--config', path.join(directory, 'absent.json')], env, 'CONFIG_FILE_UNREADABLE'],
            [['init', '--directory', path.join(directory, 'other')], env, 'DIRECTORY_MISMATCH'],
            [['init', '--directory', 'relative'], env, 'DIRECTORY_MISMATCH'],
        ];
        for (const [argv, environment, reason] of refusals) {
            const result = runMaintenanceCommand(argv, environment);
            expect(result.exitCode).toBe(1);
            expect(result.output.reason).toBe(reason);
        }
        expect(parseMaintenanceArgs(['export', '--directory', directory, '--destination', directory]).ok).toBe(true);
        expect(readdirSync(directory)).toEqual([]);
    });
});

/** Fixture without any maintenance call: the journal request path (reserve/settle/finalize) works on every host. */
function bareFixture() {
    const directory = tempDir();
    const config = makeConfig(directory);
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    expect(provisionTenantMetadata(config).ok).toBe(true);
    return { directory, config };
}
function forceUnsupported(): void {
    _testOnlySetArchiveExportPlatformCapability({ supported: false, reason: PLATFORM_UNSUPPORTED_REASON, message: PLATFORM_UNSUPPORTED_MESSAGE });
}

describe('platform fail-closed: archive and export refuse on an unsupported platform; init and reconcile still run', () => {
    it('the capability reports one explicit reason and the operator line', () => {
        forceUnsupported();
        expect(archiveExportPlatformCapability()).toEqual({
            supported: false, reason: 'PLATFORM_UNSUPPORTED', message: 'archive and export (retention/export maintenance) are unsupported on native Windows; run them from Linux/Docker against the same journal directory',
        });
    });
    it('init is not gated: under the forced archive/export refusal it creates a valid database and metadata', () => {
        forceUnsupported();
        const directory = tempDir();
        const config = makeConfig(directory);
        expect(initializeLineage(config)).toMatchObject({ operation: 'init', status: 'COMPLETED', databaseCreated: true });
        expect(readdirSync(directory)).toContain(DATABASE_FILE);
        expect(capacity(config)).toMatchObject({ activeUsed: 0, archiveUsed: 0 });
    });
    it('reconcile is not gated: it reports a consistent journal read-only under the forced refusal', () => {
        const { directory, config } = bareFixture();
        seedFinalized(config, 'env-1');
        const before = rawRows(directory);
        forceUnsupported();
        expect(reconcileLineage(config)).toMatchObject({ operation: 'reconcile', status: 'COMPLETED', readOnly: true, repaired: false, consistent: true });
        expect(rawRows(directory)).toEqual(before);
    });
    it('archive refuses and moves no finalized envelope', () => {
        const { directory, config } = bareFixture();
        for (const id of ['env-1', 'env-2']) seedFinalized(config, id);
        const before = rawRows(directory);
        forceUnsupported();
        expect(archiveLineage(config, { now: afterArchiveAge() })).toMatchObject({
            operation: 'archive', status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', archived: 0, attempted: 0, requiresReconciliation: false,
        });
        expect(rawRows(directory)).toEqual(before);
    });
    it('export refuses before reading receipts, the destination or the journal, and releases nothing', () => {
        const { directory, config } = bareFixture();
        seedFinalized(config, 'env-1');
        const destination = tempDir('cvf-web-lineage-export-');
        writeFileSync(path.join(destination, 'keep.txt'), 'KEEP');
        const before = rawRows(directory);
        forceUnsupported();
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({
            operation: 'export', status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', released: 0, batches: [], requiresReconciliation: false,
        });
        expect(readdirSync(destination)).toEqual(['keep.txt']);
        expect(readFileSync(path.join(destination, 'keep.txt'), 'utf8')).toBe('KEEP');
        expect(rawRows(directory)).toEqual(before);
    });
    it('the command line: init and reconcile exit 0, archive and export exit 1 with the directories unchanged', () => {
        const directory = tempDir();
        const destination = tempDir('cvf-web-lineage-export-');
        const env = { [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory)) };
        forceUnsupported();
        expect(runMaintenanceCommand(['archive', '--directory', directory], env)).toEqual({
            exitCode: 1, output: { operation: 'archive', status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', requiresReconciliation: false },
        });
        expect(runMaintenanceCommand(['export', '--directory', directory, '--destination', destination], env)).toMatchObject({ exitCode: 1, output: { reason: 'PLATFORM_UNSUPPORTED' } });
        expect(readdirSync(directory)).toEqual([]);
        expect(readdirSync(destination)).toEqual([]);
        expect(runMaintenanceCommand(['init', '--directory', directory], env)).toMatchObject({ exitCode: 0, output: { operation: 'init', status: 'COMPLETED', databaseCreated: true } });
        expect(runMaintenanceCommand(['reconcile', '--directory', directory], env)).toMatchObject({ exitCode: 0, output: { operation: 'reconcile', consistent: true } });
    });
    // Native Windows only: the real probe, not the forced seam, must refuse archive and export with zero change.
    it.runIf(!posixCapable)('on this unsupported host the real probe refuses archive and export with zero change', () => {
        expect(probeArchiveExportPlatform()).toEqual({ supported: false, reason: 'PLATFORM_UNSUPPORTED', message: PLATFORM_UNSUPPORTED_MESSAGE });
        const { directory, config } = bareFixture();
        seedFinalized(config, 'env-1');
        const destination = tempDir('cvf-web-lineage-export-');
        const before = rawRows(directory);
        expect(archiveLineage(config, { now: afterArchiveAge() })).toMatchObject({ status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', archived: 0 });
        expect(exportLineage(config, { destination, now: afterRetention() })).toMatchObject({ status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', released: 0 });
        expect(rawRows(directory)).toEqual(before);
        expect(readdirSync(destination)).toEqual([]);
    });
});

describe('implementation guards', () => {
    const strip = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    it('has no daemon, timer, directory creation, namespace-wide store read or execute-route coupling', () => {
        const source = readFileSync(maintenanceSource, 'utf8');
        const code = strip(source);
        expect(code).not.toMatch(/mkdirSync|\.mkdir\(|readAll\(|setInterval|setTimeout|setImmediate|cron|deriveServiceTokenIdentity|api\/execute|\bawait\b|async /);
        expect(source).not.toContain('\r');
        expect(strip(readFileSync(cliSource, 'utf8'))).not.toMatch(/mkdirSync|setInterval|setTimeout/);
        expect(readFileSync(cliSource, 'utf8')).not.toContain('\r');
        // The request-path journal and the execute route must not know the maintenance module.
        expect(readFileSync(lineageSource, 'utf8')).not.toContain('lineage-maintenance');
        const route = path.resolve(process.cwd(), 'src/app/api/execute/route.ts');
        expect(readFileSync(route, 'utf8')).not.toContain('lineage-maintenance');
    });
    it('mutates only through keyed transactions: the read-only handle never writes', () => {
        const code = strip(readFileSync(maintenanceSource, 'utf8'));
        expect(code).toMatch(/readonly: true, fileMustExist: true/);
        expect(code).not.toMatch(/\b(INSERT|UPDATE|DELETE|CREATE TABLE|PRAGMA)\b/);
        expect(SQLiteKeyedAtomicRecordStore.prototype.transactionKeys).toBeTypeOf('function');
    });
    // POSIX pairing: calls the real init path; the fail-closed init refusal is covered in 'platform fail-closed' above.
    it('provisioning through the journal remains available for the init path', () => {
        const directory = tempDir();
        const config = makeConfig(directory);
        SQLiteKeyedAtomicRecordStore.initialize(directory);
        expect(provisionTenantMetadata(config).ok).toBe(true);
        expect(initializeLineage(config)).toMatchObject({ status: 'COMPLETED', databaseCreated: false });
    });
});
