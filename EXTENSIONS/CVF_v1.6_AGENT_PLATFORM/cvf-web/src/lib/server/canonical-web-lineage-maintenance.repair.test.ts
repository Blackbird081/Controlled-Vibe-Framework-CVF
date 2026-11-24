import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { archiveKey, createLineageStore, finalize, parseLineageConfig, readTenantCapacity, reserve, resolveSessionIdentity, settle, type LineageConfig } from './canonical-web-lineage';
import {
    PLATFORM_UNSUPPORTED_MESSAGE,
    PLATFORM_UNSUPPORTED_REASON,
    _testOnlySetMaintenanceHooks,
    _testOnlySetArchiveExportPlatformCapability,
    archiveLineage,
    exportLineage,
    initializeLineage,
    probeArchiveExportPlatform,
    reconcileLineage,
} from './canonical-web-lineage-maintenance';
import { writeDurableFile } from './canonical-web-lineage-export-files';

const owned: string[] = [];
afterEach(() => {
    _testOnlySetMaintenanceHooks(undefined);
    _testOnlySetArchiveExportPlatformCapability(undefined);
    for (const directory of owned.splice(0)) rmSync(directory, { recursive: true, force: true });
});
function directory(): string {
    const value = mkdtempSync(path.join(tmpdir(), 'cvf-maint-repair-'));
    owned.push(value);
    return value;
}
const HOUR = 3600000;
const now = () => Date.now() + 8 * 24 * HOUR;
/**
 * POSIX pairing. The describes below replay receipts, use symlinks or call the no-follow custody, so they run only where
 * posixCapable is true (Linux and Docker). The 'platform fail-closed' describe at the end asserts, unconditionally, that these
 * paths refuse on an unsupported host with no change (forced on every host; the real probe and real custody on native Windows).
 */
const posixCapable = probeArchiveExportPlatform().supported;
function fixture(count = 3): { config: LineageConfig; destination: string } {
    const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1,
        directory: directory(), namespace: 'cvf-web-lineage-repair', tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' } }));
    if (!parsed.ok) throw new Error(parsed.reason);
    const config = parsed.config;
    expect(initializeLineage(config).status).toBe('COMPLETED');
    add(config, Array.from({ length: count }, (_, index) => `env-${index}`));
    return { config, destination: directory() };
}
function add(config: LineageConfig, ids: string[]): void {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId: 'user-1', teamId: 'team-1', orgId: 'org-a' });
    if (!resolved.ok) throw new Error(resolved.reason);
    for (const id of ids) {
        const ref = { canonicalId: id, contractRevision: 'contract-1', sourceRevision: 'src-1' };
        expect(reserve(config, resolved.value, ref).ok).toBe(true);
        expect(settle(config, resolved.value, ref, 1, { attemptOutcome: 'invoked', callbackAttemptIndex: 0,
            provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'], usageProvenance: 'unknown' }).ok).toBe(true);
        expect(finalize(config, resolved.value, ref, { disposition: 'COMPLETED', validationRef: 'v-1', guardRef: 'g-1', sot3Ref: 's-1', auditRef: 'a-1' }).ok).toBe(true);
    }
    expect(archiveLineage(config, { now: Date.now() + 2 * HOUR }).archived).toBe(ids.length);
}
function used(config: LineageConfig): number {
    const result = readTenantCapacity(config, 'org-a');
    if (!result.ok) throw new Error(result.reason);
    return result.value.archiveUsed;
}
function crashBeforeRelease(config: LineageConfig, destination: string): void {
    _testOnlySetMaintenanceHooks({ afterReceipt() { throw new Error('CRASH_BEFORE_RELEASE'); } });
    expect(() => exportLineage(config, { destination, now: now() })).toThrow('CRASH_BEFORE_RELEASE');
    _testOnlySetMaintenanceHooks(undefined);
}
function markers(destination: string): string[] { return readdirSync(destination).filter(name => name.includes('.progress-')); }

describe.runIf(posixCapable)('export repair durability', () => {
    it.each([1, 2])('directory sync failure number %s after file sync retains every archive and quota', failAt => {
        const { config, destination } = fixture();
        let directorySyncs = 0;
        let fileSyncs = 0;
        let attempts = 0;
        _testOnlySetMaintenanceHooks({
            beforeFsync(kind) {
                if (kind === 'file') fileSyncs += 1;
                else if (++directorySyncs === failAt) throw new Error('UNSUPPORTED_DIRECTORY_SYNC');
            },
            store() { attempts += 1; return undefined; },
        });
        const report = exportLineage(config, { destination, now: now() });
        expect(report).toMatchObject({ status: 'STOPPED', reason: 'DIRECTORY_DURABILITY_UNCONFIRMED', released: 0 });
        expect(fileSyncs).toBeGreaterThanOrEqual(failAt);
        expect(attempts).toBe(0);
        expect(used(config)).toBe(3);
        expect(markers(destination)).toEqual([]);
    });
    it('a recognized readable receipt must re-confirm both files and directory before any transaction', () => {
        const { config, destination } = fixture();
        crashBeforeRelease(config, destination);
        let files = 0;
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ beforeFsync(kind) {
            if (kind === 'file') files += 1;
            else throw new Error('UNSUPPORTED');
        }, store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({
            status: 'STOPPED', reason: 'DIRECTORY_DURABILITY_UNCONFIRMED', released: 0,
        });
        expect(files).toBe(2);
        expect(attempts).toBe(0);
        expect(used(config)).toBe(3);
        _testOnlySetMaintenanceHooks(undefined);
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({ status: 'COMPLETED', released: 3 });
    });
    it.each(['remove-export', 'replace-receipt'])('replay refuses a file changed at the durability boundary: %s', fault => {
        const { config, destination } = fixture(1);
        crashBeforeRelease(config, destination);
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ beforeFsync(kind, file) {
            if (kind !== 'file') return;
            if (fault === 'remove-export' && !file.endsWith('.receipt.json')) unlinkSync(file);
            if (fault === 'replace-receipt' && file.endsWith('.receipt.json')) writeFileSync(file, '{}');
        }, store() { attempts += 1; return undefined; } });
        const report = exportLineage(config, { destination, now: now() });
        expect(report.status).toBe('STOPPED');
        expect(report.reason).toBe(fault === 'remove-export' ? 'RECEIPT_EXPORT_UNVERIFIED' : 'RECEIPT_READBACK_MISMATCH');
        expect(attempts).toBe(0);
        expect(used(config)).toBe(1);
    });
    it('a missing export still explicitly stops after all release progress is confirmed', () => {
        const { config, destination } = fixture(1);
        const first = exportLineage(config, { destination, now: now() });
        expect(first.released).toBe(1);
        unlinkSync(path.join(destination, first.batches[0].exportFile));
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({ status: 'STOPPED', reason: 'RECEIPT_EXPORT_UNVERIFIED' });
        expect(attempts).toBe(0);
    });
    it('progress durability failure after actual release reports reconciliation and safely rechecks on the next bounded run', () => {
        const { config, destination } = fixture(2);
        _testOnlySetMaintenanceHooks({ beforeFsync(kind, file) {
            if (kind === 'file' && file.includes('.progress-')) throw new Error('DISK_FAILURE');
        } });
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({
            status: 'STOPPED', reason: 'PROGRESS_DURABILITY_UNCONFIRMED', requiresReconciliation: true, released: 1,
        });
        expect(used(config)).toBe(1);
        expect(markers(destination)).toHaveLength(0);
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 })).toMatchObject({ released: 0, alreadyReleased: 1 });
        expect(attempts).toBe(1);
        expect(used(config)).toBe(1);
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 }).released).toBe(1);
        expect(attempts).toBe(2);
        expect(reconcileLineage(config).consistent).toBe(true);
    });
});

describe.runIf(posixCapable)('bounded receipt replay', () => {
    it('max=1 advances partial legacy receipts across runs and completed receipts cannot starve new work', () => {
        const { config, destination } = fixture();
        crashBeforeRelease(config, destination);
        for (let remaining = 2; remaining >= 0; remaining -= 1) {
            let attempts = 0;
            _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
            const report = exportLineage(config, { destination, now: now(), maxEnvelopes: 1 });
            expect(report).toMatchObject({ status: 'COMPLETED', released: 1 });
            expect(attempts).toBe(1);
            expect(used(config)).toBe(remaining);
        }
        expect(markers(destination)).toHaveLength(3);
        _testOnlySetMaintenanceHooks(undefined);
        add(config, ['later']);
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 })).toMatchObject({ released: 1, alreadyReleased: 3 });
        expect(attempts).toBe(1);
        expect(used(config)).toBe(0);
        expect(reconcileLineage(config).consistent).toBe(true);
    });
    it('COMMIT_UNKNOWN never advances progress; absent inspection consumes the next single attempt before progress resumes', () => {
        const { config, destination } = fixture(2);
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return { afterCommit() { throw new Error('LOST'); } }; } });
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({ reason: 'STORE_COMMIT_UNKNOWN', requiresReconciliation: true });
        expect(attempts).toBe(1);
        expect(used(config)).toBe(1);
        expect(markers(destination)).toHaveLength(0);
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        const absent = exportLineage(config, { destination, now: now(), maxEnvelopes: 1 });
        expect(absent).toMatchObject({ released: 0, alreadyReleased: 1 });
        expect(absent.batches[0].entryOutcomes).toEqual([{ canonicalId: 'env-0', outcome: 'ALREADY_RELEASED', reason: 'ARCHIVE_ROW_ABSENT' }]);
        expect(attempts).toBe(2);
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 }).released).toBe(1);
        expect(attempts).toBe(3);
        expect(used(config)).toBe(0);
    });
    it('a superseded row consumes one attempt, its marker never authorizes deletion, and the following entry progresses', () => {
        const { config, destination } = fixture(2);
        crashBeforeRelease(config, destination);
        const store = createLineageStore(config);
        const key = archiveKey('org-a', 'env-0');
        store.transactionKeys([key], ([entry]) => {
            if (entry.state !== 'PRESENT') throw new Error('fixture');
            return { writes: [{ id: key, expectedRevision: entry.revision, value: entry.value }], result: true };
        });
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        const report = exportLineage(config, { destination, now: now(), maxEnvelopes: 1 });
        expect(report.batches[0].entryOutcomes[0].outcome).toBe('SUPERSEDED');
        expect(attempts).toBe(1);
        expect(used(config)).toBe(2);
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 }).released).toBe(1);
        expect(attempts).toBe(2);
        expect(used(config)).toBe(1);
    });
    it('malformed or foreign-bound progress stops without unbudgeted SQL', () => {
        const { config, destination } = fixture(1);
        expect(exportLineage(config, { destination, now: now() }).released).toBe(1);
        const marker = path.join(destination, markers(destination)[0]);
        const content = JSON.parse(readFileSync(marker, 'utf8'));
        content.receiptDigest = '0'.repeat(64);
        writeFileSync(marker, JSON.stringify(content));
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now(), maxEnvelopes: 1 })).toMatchObject({ reason: 'PROGRESS_INVALID', released: 0 });
        expect(attempts).toBe(0);
    });
});

describe.runIf(posixCapable)('no-follow no-clobber export custody', () => {
    it('a planted predictable temp symlink cannot truncate the victim', () => {
        const root = directory();
        const file = path.join(root, 'export.json');
        const victim = path.join(directory(), 'victim');
        writeFileSync(victim, 'KEEP');
        symlinkSync(victim, `${file}.tmp`);
        expect(writeDurableFile(file, Buffer.from('export'), 'CONFLICT')).toBe(true);
        expect(readFileSync(victim, 'utf8')).toBe('KEEP');
        expect(lstatSync(`${file}.tmp`).isSymbolicLink()).toBe(true);
        expect(readFileSync(file, 'utf8')).toBe('export');
    });
    it('a swapped exclusive temp is detected and cleanup leaves the foreign path untouched', () => {
        const file = path.join(directory(), 'export.json');
        const victim = path.join(directory(), 'victim');
        writeFileSync(victim, 'KEEP');
        let swapped = '';
        expect(() => writeDurableFile(file, Buffer.from('export'), 'CONFLICT', { afterTempCreated(temp) {
            swapped = temp; unlinkSync(temp); symlinkSync(victim, temp);
        } })).toThrow('FILE_IDENTITY_CHANGED');
        expect(readFileSync(victim, 'utf8')).toBe('KEEP');
        expect(lstatSync(swapped).isSymbolicLink()).toBe(true);
        expect(existsSync(file)).toBe(false);
    });
    it('a racing destination symlink cannot be clobbered or followed', () => {
        const file = path.join(directory(), 'export.json');
        const victim = path.join(directory(), 'victim');
        writeFileSync(victim, 'KEEP');
        expect(() => writeDurableFile(file, Buffer.from('export'), 'CONFLICT', { afterTempCreated() { symlinkSync(victim, file); } })).toThrow('CONFLICT');
        expect(readFileSync(victim, 'utf8')).toBe('KEEP');
        expect(lstatSync(file).isSymbolicLink()).toBe(true);
    });
    it.each(['receipt', 'progress'])('existing %s symlink refuses replay without touching victim or capacity', kind => {
        const { config, destination } = fixture(1);
        if (kind === 'receipt') crashBeforeRelease(config, destination);
        else expect(exportLineage(config, { destination, now: now() }).released).toBe(1);
        const name = readdirSync(destination).find(item => kind === 'receipt' ? item.endsWith('.receipt.json') : item.includes('.progress-'))!;
        const file = path.join(destination, name);
        const victim = path.join(directory(), 'victim');
        writeFileSync(victim, readFileSync(file));
        const before = readFileSync(victim);
        unlinkSync(file); symlinkSync(victim, file);
        const occupancy = used(config);
        let attempts = 0;
        _testOnlySetMaintenanceHooks({ store() { attempts += 1; return undefined; } });
        expect(exportLineage(config, { destination, now: now() })).toMatchObject({ status: 'STOPPED', reason: 'FILE_NOT_REGULAR', released: 0 });
        expect(readFileSync(victim)).toEqual(before);
        expect(attempts).toBe(0);
        expect(used(config)).toBe(occupancy);
    });
});

describe('platform fail-closed: receipt replay and export custody refuse on an unsupported platform', () => {
    const forceUnsupported = () => _testOnlySetArchiveExportPlatformCapability({ supported: false, reason: PLATFORM_UNSUPPORTED_REASON, message: PLATFORM_UNSUPPORTED_MESSAGE });
    it('export refuses before scanning or replaying a planted receipt, progress marker or export file', () => {
        const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1,
            directory: directory(), namespace: 'cvf-web-lineage-repair', tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }],
            servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' } }));
        if (!parsed.ok) throw new Error(parsed.reason);
        const destination = directory();
        const receipt = path.join(destination, `lineage-export-org-a-${'0'.repeat(16)}.receipt.json`);
        const marker = `${receipt}.progress-0.json`;
        writeFileSync(receipt, '{"planted":true}');
        writeFileSync(marker, '{"planted":true}');
        forceUnsupported();
        expect(exportLineage(parsed.config, { destination, now: now() })).toMatchObject({ status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', released: 0, batches: [] });
        expect(readdirSync(destination).sort()).toEqual([path.basename(receipt), path.basename(marker)].sort());
        expect(readFileSync(receipt, 'utf8')).toBe('{"planted":true}');
        expect(readFileSync(marker, 'utf8')).toBe('{"planted":true}');
    });
    it('archive refuses on an uninitialized directory without creating a database', () => {
        const dir = directory();
        const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1,
            directory: dir, namespace: 'cvf-web-lineage-repair', tenants: [{ tenantId: 'org-a', activeSlots: 12, archiveSlots: 12 }] }));
        if (!parsed.ok) throw new Error(parsed.reason);
        forceUnsupported();
        expect(archiveLineage(parsed.config, { now: Date.now() + 2 * HOUR })).toMatchObject({ status: 'REFUSED', reason: 'PLATFORM_UNSUPPORTED', archived: 0 });
        expect(readdirSync(dir)).toEqual([]);
    });
    // Native Windows only: the real no-follow custody must refuse before creating anything (no O_NOFOLLOW on this host).
    it.runIf(!posixCapable)('the export-file custody refuses with NOFOLLOW_UNSUPPORTED and creates no file', () => {
        const dir = directory();
        expect(() => writeDurableFile(path.join(dir, 'export.json'), Buffer.from('export'), 'CONFLICT')).toThrow('NOFOLLOW_UNSUPPORTED');
        expect(readdirSync(dir)).toEqual([]);
    });
});
