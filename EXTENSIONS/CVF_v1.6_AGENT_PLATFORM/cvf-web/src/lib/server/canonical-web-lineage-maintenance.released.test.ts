import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
    LINEAGE_CONFIG_ENV,
    finalize,
    parseLineageConfig,
    readTenantCapacity,
    reserve,
    resolveSessionIdentity,
    settle,
    validateArchiveRecord,
    type LineageConfig,
    type LineageIdentity,
    type LineageRef,
} from './canonical-web-lineage';
import {
    PLATFORM_UNSUPPORTED_MESSAGE,
    PLATFORM_UNSUPPORTED_REASON,
    _testOnlySetArchiveExportPlatformCapability,
    _testOnlySetMaintenanceHooks,
    archiveLineage,
    initializeLineage,
    probeArchiveExportPlatform,
    reconcileLineage,
} from './canonical-web-lineage-maintenance';
import { retireReleasedLineage } from './canonical-web-lineage-maintenance-released';
import { HELD_RELEASE_MIN_AGE_MS, digest16, releaseHeldExecution } from './canonical-web-held-release';
import { controlOperation } from './canonical-web-admission-control';
import { parseMaintenanceArgs, runMaintenanceCommand } from '../../../scripts/canonical-web-lineage-maintenance';

// Vitest runs from the cvf-web package root; jsdom's import.meta.url is not a file URL.
const nativeSource = path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts');
const nodeRequire = createRequire(nativeSource);
const NAMESPACE = 'cvf-web-lineage-released';
const DATABASE_FILE = 'cvf-keyvalue-store.sqlite';
const HOUR = 3_600_000;
const posixCapable = probeArchiveExportPlatform().supported;

const cleanups: (() => void)[] = [];
afterEach(() => {
    _testOnlySetMaintenanceHooks(undefined);
    _testOnlySetArchiveExportPlatformCapability(undefined);
    vi.useRealTimers();
    while (cleanups.length) cleanups.pop()!();
});

/** Fake Date only (SQLite and the store keep real timers). Returns an advance function. */
function clock(): (delta: number) => number {
    let now = Date.parse('2026-11-16T00:00:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    return delta => { now += delta; vi.setSystemTime(now); return now; };
}
function tempDir(): string {
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-web-lineage-released-'));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    return directory;
}
/** org-b has four active slots so three released records plus one more still fit (a release needs a free slot). */
function rawConfig(directory: string, archiveSlots = 4): Record<string, unknown> {
    return {
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: NAMESPACE,
        tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }, { tenantId: 'org-b', activeSlots: 4, archiveSlots }],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' },
    };
}
function fixture(archiveSlots = 4): { directory: string; config: LineageConfig } {
    const directory = tempDir();
    const parsed = parseLineageConfig(JSON.stringify(rawConfig(directory, archiveSlots)));
    if (!parsed.ok) throw new Error(`config ${parsed.reason}`);
    expect(initializeLineage(parsed.config).status).toBe('COMPLETED');
    return { directory, config: parsed.config };
}
function identityFor(config: LineageConfig, user: string, orgId = 'org-b'): LineageIdentity {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId: user, orgId, teamId: 'team-1' });
    if (!resolved.ok) throw new Error(`identity ${resolved.reason}`);
    return resolved.value;
}
const ref = (canonicalId: string): LineageRef => ({ canonicalId, contractRevision: 'contract-1', sourceRevision: 'src-1' });
const invoked = { attemptOutcome: 'invoked', callbackAttemptIndex: 0, provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'], usageProvenance: 'unknown' };
const terminalRefs = { disposition: 'COMPLETED', validationRef: 'v-1', guardRef: 'g-1', sot3Ref: 's-1', auditRef: 'a-1' };

type RawDb = { prepare(sql: string): { run(...a: unknown[]): unknown; all(...a: unknown[]): unknown[]; get(...a: unknown[]): unknown }; close(): void };
function withRaw<T>(directory: string, operate: (db: RawDb) => T): T {
    const Database = nodeRequire('better-sqlite3') as new (file: string) => RawDb;
    const db = new Database(path.join(directory, DATABASE_FILE));
    try { return operate(db); } finally { db.close(); }
}
function rawRows(directory: string): Record<string, { revision: number; item_json: string }> {
    const rows = withRaw(directory, db => db.prepare('SELECT id, revision, item_json FROM atomic_key_value_store WHERE namespace = ? ORDER BY id').all(NAMESPACE)) as { id: string; revision: number; item_json: string }[];
    return Object.fromEntries(rows.map(row => [row.id, { revision: row.revision, item_json: row.item_json }]));
}
function rowIds(directory: string, prefix: string): string[] {
    return Object.keys(rawRows(directory)).filter(id => id.startsWith(prefix));
}
function plantRaw(directory: string, id: string, json: string): void {
    withRaw(directory, db => db.prepare('INSERT OR REPLACE INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at) VALUES (?,?,?,?,?)')
        .run(NAMESPACE, id, 0, json, '2026-11-12T00:00:00.000Z'));
}
/** Rewrites one row through a second connection (a concurrent writer) and bumps its revision. */
function mutateRaw(directory: string, id: string, change: (value: Record<string, unknown>) => void): void {
    withRaw(directory, db => {
        const row = db.prepare('SELECT revision, item_json FROM atomic_key_value_store WHERE namespace = ? AND id = ?').get(NAMESPACE, id) as { revision: number; item_json: string };
        const value = JSON.parse(row.item_json) as Record<string, unknown>;
        change(value);
        db.prepare('UPDATE atomic_key_value_store SET revision = ?, item_json = ? WHERE namespace = ? AND id = ?').run(row.revision + 1, JSON.stringify(value), NAMESPACE, id);
    });
}
function status(config: LineageConfig, identity: LineageIdentity) {
    const result = controlOperation(config, identity, { action: 'status' });
    if (!result.ok) throw new Error(result.reason);
    return result.value;
}
function capacity(config: LineageConfig, tenantId = 'org-b') {
    const result = readTenantCapacity(config, tenantId);
    if (!result.ok) throw new Error(`capacity ${result.reason}`);
    return result.value;
}
/** Reserves an execution, waits the release minimum and releases it as its owner. Returns the release time. */
function holdAndRelease(config: LineageConfig, identity: LineageIdentity, id: string, tick: (delta: number) => number): number {
    expect(reserve(config, identity, ref(id)).ok).toBe(true);
    tick(HELD_RELEASE_MIN_AGE_MS);
    expect(releaseHeldExecution(config, identity, id, status(config, identity).revision).ok).toBe(true);
    return Date.now();
}
function finalizedRecord(config: LineageConfig, identity: LineageIdentity, id: string): void {
    expect(reserve(config, identity, ref(id)).ok).toBe(true);
    expect(settle(config, identity, ref(id), 1, invoked).ok).toBe(true);
    expect(finalize(config, identity, ref(id), terminalRefs).ok).toBe(true);
}
const apply = (config: LineageConfig, now: number, extra: { maxEnvelopes?: number } = {}) => retireReleasedLineage(config, { now, apply: true, ...extra });

describe.runIf(posixCapable)('retire-released', () => {
    it('recovers an owner at the three-release limit and a full tenant: records archived verbatim, slots freed, count reset, owner admitted again', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const released = ['A', 'B', 'C'].map(id => holdAndRelease(config, owner, id, tick));
        finalizedRecord(config, owner, 'D');
        const before = rawRows(directory);
        expect(capacity(config)).toMatchObject({ activeUsed: 4, archiveUsed: 0 });
        expect(status(config, owner).heldRelease).toMatchObject({ count: 3, idDigest: digest16('C') });
        expect(reserve(config, owner, ref('E'))).toMatchObject({ ok: false, reason: 'TENANT_CAPACITY' });

        const report = apply(config, released[2] + HOUR);
        expect(report).toMatchObject({ operation: 'retire-released', status: 'COMPLETED', dryRun: false, examined: 4, retired: 3, skipped: 0, untouched: 1, countsReset: 1, requiresReconciliation: false });
        for (const id of ['A', 'B', 'C']) {
            const archived = validateArchiveRecord(JSON.parse(rawRows(directory)[`a:org-b:${id}`].item_json), { tenantId: 'org-b', canonicalId: id });
            expect(archived).not.toBeNull();
            expect(JSON.stringify(archived!.record)).toBe(before[`r:org-b:${id}`].item_json);
            expect(archived!.record.ownerRelease).toBeDefined();
        }
        expect(rowIds(directory, 'r:org-b:')).toEqual(['r:org-b:D']);
        expect(rawRows(directory)['r:org-b:D']).toEqual(before['r:org-b:D']);
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 3 });
        expect(status(config, owner).heldRelease).toBeUndefined();
        expect(reconcileLineage(config, { now: released[2] + HOUR }).consistent).toBe(true);

        expect(reserve(config, owner, ref('E')).ok).toBe(true);
        tick(HELD_RELEASE_MIN_AGE_MS);
        expect(releaseHeldExecution(config, owner, 'E', status(config, owner).revision).ok).toBe(true);
        expect(status(config, owner).heldRelease).toMatchObject({ count: 1, idDigest: digest16('E') });
    });

    it('skips a record released less than one hour ago and retires it at exactly one hour', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        const before = rawRows(directory);
        const young = apply(config, releasedAt + HOUR - 1);
        expect(young).toMatchObject({ status: 'COMPLETED', retired: 0, skipped: 1, countsReset: 0, skippedReasons: { TOO_YOUNG: 1 } });
        expect(rawRows(directory)).toEqual(before);
        expect(apply(config, releasedAt + HOUR)).toMatchObject({ retired: 1, skipped: 0 });
        expect(rowIds(directory, 'r:org-b:')).toEqual([]);
        expect(rowIds(directory, 'a:org-b:')).toEqual(['a:org-b:A']);
    });

    it('never touches a record without ownerRelease, whatever its state, and blocks nothing new', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const held = identityFor(config, 'held');
        const unknown = identityFor(config, 'unknown');
        const releasing = identityFor(config, 'releasing');
        expect(reserve(config, held, ref('P')).ok).toBe(true);
        expect(reserve(config, unknown, ref('U')).ok).toBe(true);
        expect(settle(config, unknown, ref('U'), 1, { attemptOutcome: 'unknown' }).ok).toBe(true);
        const releasedAt = holdAndRelease(config, releasing, 'R', tick);
        const before = rawRows(directory);
        const heldControlBefore = status(config, held);
        const unknownControlBefore = status(config, unknown);
        expect(reserve(config, held, ref('P2'))).toMatchObject({ ok: false, reason: 'ADMISSION_CONFLICT' });

        const report = apply(config, releasedAt + 90 * 24 * HOUR);
        expect(report).toMatchObject({ retired: 1, untouched: 2, skipped: 0 });
        for (const id of ['P', 'U']) expect(rawRows(directory)[`r:org-b:${id}`]).toEqual(before[`r:org-b:${id}`]);
        expect(rowIds(directory, 'a:org-b:')).toEqual(['a:org-b:R']);
        expect(status(config, held)).toMatchObject({ revision: heldControlBefore.revision, execution: heldControlBefore.execution });
        expect(status(config, unknown)).toMatchObject({ revision: unknownControlBefore.revision, execution: unknownControlBefore.execution });
        expect(reserve(config, held, ref('P2'))).toMatchObject({ ok: false, reason: 'ADMISSION_CONFLICT' });
        expect(reserve(config, releasing, ref('R2')).ok).toBe(true);
    });

    it('does not reset the count while a released record remains, then resets and clears the pointer once it is retired', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const released = ['A', 'B', 'C'].map(id => holdAndRelease(config, owner, id, tick));
        const partial = apply(config, released[2] + HOUR - 1);
        expect(partial).toMatchObject({ retired: 2, skippedReasons: { TOO_YOUNG: 1 }, countsReset: 0 });
        expect(partial.resets).toEqual([{ tenantId: 'org-b', owner: expect.any(String), outcome: 'NOT_RESET', reason: 'RELEASED_RECORD_REMAINS' }]);
        expect(status(config, owner)).toMatchObject({ heldRelease: { count: 3 }, execution: { canonicalId: 'C', active: true } });
        expect(rowIds(directory, 'r:org-b:')).toEqual(['r:org-b:C']);

        const revisionBefore = status(config, owner).revision;
        expect(apply(config, released[2] + HOUR)).toMatchObject({ retired: 1, countsReset: 1 });
        const after = status(config, owner);
        expect(after.heldRelease).toBeUndefined();
        expect(after.execution).toBeNull();
        expect(after.revision).toBe(revisionBefore + 2);
        expect(rowIds(directory, 'r:org-b:')).toEqual([]);
    });

    it('does not reset the count while the owner still has an active execution, and leaves that execution alone', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        expect(reserve(config, owner, ref('B')).ok).toBe(true);
        const before = rawRows(directory);
        const report = apply(config, releasedAt + 10 * HOUR);
        expect(report).toMatchObject({ retired: 1, untouched: 1, countsReset: 0 });
        expect(report.resets).toEqual([{ tenantId: 'org-b', owner: expect.any(String), outcome: 'NOT_RESET', reason: 'EXECUTION_ACTIVE' }]);
        expect(status(config, owner)).toMatchObject({ heldRelease: { count: 1 }, execution: { canonicalId: 'B', active: true } });
        expect(rawRows(directory)['r:org-b:B']).toEqual(before['r:org-b:B']);
    });

    it('never resets anything while an active row of the tenant cannot be read', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        plantRaw(directory, 'r:org-b:CORRUPT', '{"not":"a record"}');
        const report = apply(config, releasedAt + HOUR);
        expect(report).toMatchObject({ retired: 1, countsReset: 0, skippedReasons: { RECORD_UNAVAILABLE: 1 } });
        expect(report.resets).toEqual([{ tenantId: 'org-b', owner: expect.any(String), outcome: 'NOT_RESET', reason: 'ACTIVE_ROW_UNAVAILABLE' }]);
        expect(status(config, owner).heldRelease).toMatchObject({ count: 1 });
    });

    it('a dry run (the default) writes nothing and reports what an apply would do', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const released = ['A', 'B', 'C'].map(id => holdAndRelease(config, owner, id, tick));
        finalizedRecord(config, owner, 'D');
        const before = rawRows(directory);
        for (const options of [{ now: released[2] + HOUR }, { now: released[2] + HOUR, apply: false }]) {
            const report = retireReleasedLineage(config, options);
            expect(report).toMatchObject({ status: 'COMPLETED', dryRun: true, retired: 0, wouldRetire: 3, countsReset: 0, wouldReset: 1, untouched: 1 });
            expect(report.outcomes.map(outcome => outcome.outcome)).toEqual(['WOULD_RETIRE', 'WOULD_RETIRE', 'WOULD_RETIRE']);
            expect(report.resets).toMatchObject([{ outcome: 'WOULD_RESET' }]);
            expect(rawRows(directory)).toEqual(before);
        }
    });

    it('stops at a full archive with the reason and no partial write', () => {
        const tick = clock();
        const { directory, config } = fixture(1);
        const owner = identityFor(config, 'u1');
        finalizedRecord(config, owner, 'F');
        expect(archiveLineage(config, { now: Date.now() + 2 * HOUR })).toMatchObject({ archived: 1 });
        const releasedA = holdAndRelease(config, owner, 'A', tick);
        const releasedB = holdAndRelease(config, owner, 'B', tick);
        const before = rawRows(directory);
        const report = apply(config, releasedB + HOUR);
        expect(releasedA).toBeLessThan(releasedB);
        expect(report).toMatchObject({ retired: 0, skipped: 2, countsReset: 0, skippedReasons: { ARCHIVE_FULL: 2 } });
        expect(report.tenants.find(tenant => tenant.tenantId === 'org-b')).toMatchObject({ status: 'ARCHIVE_FULL' });
        expect(rawRows(directory)).toEqual(before);
        expect(retireReleasedLineage(config, { now: releasedB + HOUR })).toMatchObject({ wouldRetire: 0, skippedReasons: { ARCHIVE_FULL: 2 } });
    });

    it('aborts one record safely when it changed after the snapshot, and resets nothing when the control changed', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        _testOnlySetMaintenanceHooks({ store: context => context.step === 'retire' ? { afterOpen: () => mutateRaw(directory, 'r:org-b:A', value => { value.updatedAt = '2026-11-16T05:00:00.000Z'; }) } : undefined });
        const raced = apply(config, releasedAt + HOUR);
        expect(raced).toMatchObject({ retired: 0, skippedReasons: { CHANGED_SINCE_SNAPSHOT: 1 } });
        expect(rowIds(directory, 'a:org-b:')).toEqual([]);
        expect(rowIds(directory, 'r:org-b:')).toEqual(['r:org-b:A']);
        expect(capacity(config)).toMatchObject({ activeUsed: 1, archiveUsed: 0 });
        expect(raced.resets).toMatchObject([{ outcome: 'NOT_RESET', reason: 'RELEASED_RECORD_REMAINS' }]);

        _testOnlySetMaintenanceHooks({
            store: context => context.step === 'reset'
                ? { afterOpen: () => mutateRaw(directory, 'm:org-b', value => { const controls = value.admissionControls as { revision: number }[]; controls[0].revision += 1; }) }
                : undefined,
        });
        const racedReset = apply(config, releasedAt + HOUR);
        expect(racedReset).toMatchObject({ retired: 1, countsReset: 0 });
        expect(racedReset.resets).toMatchObject([{ outcome: 'NOT_RESET', reason: 'CHANGED_SINCE_SNAPSHOT' }]);
        expect(status(config, owner).heldRelease).toMatchObject({ count: 1 });
    });

    it('clears the owner execution pointer that targets the retired record', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        expect(status(config, owner).execution).toMatchObject({ canonicalId: 'A', active: true });
        expect(apply(config, releasedAt + HOUR, { maxEnvelopes: 1 })).toMatchObject({ retired: 1 });
        const after = status(config, owner);
        expect(after.execution).toBeNull();
        expect(rowIds(directory, 'a:org-b:')).toEqual(['a:org-b:A']);
        expect(reserve(config, owner, ref('A'))).toMatchObject({ ok: false, reason: 'ENVELOPE_ARCHIVED' });
    });

    it('respects the batch limit and reports the rest as skipped', () => {
        const tick = clock();
        const { config } = fixture();
        const owner = identityFor(config, 'u1');
        const released = ['A', 'B'].map(id => holdAndRelease(config, owner, id, tick));
        const report = apply(config, released[1] + HOUR, { maxEnvelopes: 1 });
        expect(report).toMatchObject({ retired: 1, skipped: 1, skippedReasons: { BATCH_LIMIT: 1 }, countsReset: 0 });
        expect(parseMaintenanceArgs(['retire-released', '--directory', '/x', '--max', '11']).ok).toBe(false);
    });
});

describe('retire-released command line and platform gate', () => {
    it('parses the mode flag only for retire-released and refuses an unknown mode', () => {
        const base = ['--directory', '/tmp/journal'];
        expect(parseMaintenanceArgs(['retire-released', ...base])).toMatchObject({ ok: true, args: { command: 'retire-released', mode: undefined } });
        expect(parseMaintenanceArgs(['retire-released', ...base, '--mode', 'apply'])).toMatchObject({ ok: true, args: { mode: 'apply' } });
        expect(parseMaintenanceArgs(['retire-released', ...base, '--mode', 'dry-run'])).toMatchObject({ ok: true, args: { mode: 'dry-run' } });
        expect(parseMaintenanceArgs(['retire-released', ...base, '--mode', 'now'])).toEqual({ ok: false, reason: 'USAGE_MODE_INVALID' });
        expect(parseMaintenanceArgs(['archive', ...base, '--mode', 'apply'])).toEqual({ ok: false, reason: 'USAGE_MODE_ONLY_FOR_RETIRE_RELEASED' });
        expect(parseMaintenanceArgs(['retire-released', ...base, '--destination', '/tmp'])).toEqual({ ok: false, reason: 'USAGE_DESTINATION_ONLY_FOR_EXPORT' });
    });

    it('refuses on an unsupported platform before any journal access, in the operation and on the command line', () => {
        const directory = tempDir();
        const env = { [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory)) };
        _testOnlySetArchiveExportPlatformCapability({ supported: false, reason: PLATFORM_UNSUPPORTED_REASON, message: PLATFORM_UNSUPPORTED_MESSAGE });
        const parsed = parseLineageConfig(env[LINEAGE_CONFIG_ENV]);
        if (!parsed.ok) throw new Error('config');
        expect(retireReleasedLineage(parsed.config, { apply: true })).toMatchObject({ operation: 'retire-released', status: 'REFUSED', reason: PLATFORM_UNSUPPORTED_REASON, retired: 0, countsReset: 0 });
        expect(runMaintenanceCommand(['retire-released', '--directory', directory, '--mode', 'apply'], env)).toEqual({
            exitCode: 1, output: { operation: 'retire-released', status: 'REFUSED', reason: PLATFORM_UNSUPPORTED_REASON, requiresReconciliation: false },
        });
    });

    it.runIf(posixCapable)('runs dry-run by default and apply on request through the command', () => {
        const tick = clock();
        const { directory, config } = fixture();
        const owner = identityFor(config, 'u1');
        const releasedAt = holdAndRelease(config, owner, 'A', tick);
        const env = { [LINEAGE_CONFIG_ENV]: JSON.stringify(rawConfig(directory)) };
        const now = new Date(releasedAt + HOUR).toISOString();
        const before = rawRows(directory);
        expect(runMaintenanceCommand(['retire-released', '--directory', directory, '--now', now], env)).toMatchObject({ exitCode: 0, output: { dryRun: true, wouldRetire: 1, retired: 0 } });
        expect(rawRows(directory)).toEqual(before);
        const applied = runMaintenanceCommand(['retire-released', '--directory', directory, '--now', now, '--mode', 'apply', '--tenant', 'org-b'], env);
        expect(applied).toMatchObject({ exitCode: 0, output: { dryRun: false, retired: 1, countsReset: 1 } });
        expect(JSON.stringify(applied.output)).not.toMatch(/u1|team-1/);
        expect(rowIds(directory, 'a:org-b:')).toEqual(['a:org-b:A']);
    });
});
