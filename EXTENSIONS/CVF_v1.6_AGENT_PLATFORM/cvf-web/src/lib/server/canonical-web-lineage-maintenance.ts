/**
 * Web attempt lineage explicit bounded maintenance (T3): init, archive, export, reconcile. Offline and operator-run.
 *
 * Reachable ONLY from the maintenance command (scripts/canonical-web-lineage-maintenance.ts) and tests: not imported by the
 * execute route, no daemon, timer, retry loop or automatic cleanup. Each operation is one synchronous pass bounded by the
 * configured slot counts.
 *
 * Every mutation goes through the keyed store (transactionKeys, one transaction per envelope, at most [m, r, a]). Candidate
 * discovery and reconcile enumerate ids by the prefixes 'r:<tenant>:' / 'a:<tenant>:' on a separate READ-ONLY handle, bounded by
 * the configured slots (+1 to detect overflow); the request path (canonical-web-lineage.ts) never enumerates.
 *
 * Contract (docs/concepts/CVF_WEB_ATTEMPT_LINEAGE_T3_PACKET_REQUIREMENTS_2026-11-12.md, section 2):
 *  - init:      offline initialization of an existing approved directory; never mkdir; no silent migration.
 *  - archive:   at most ten envelopes per run, one transaction each; only whole-envelope FINALIZED, clean, >= 1 h old.
 *               Pending, uncertain or join-discrepant envelopes are never reclaimed by elapsed time.
 *  - export:    only archived rows finalized >= 7 d ago. Export file -> readback verify -> durable receipt -> CAS delete and
 *               counter decrement in one transaction per row. A rerun recognizes the receipt and never frees twice. Any storage
 *               failure (COMMIT_UNKNOWN included) stops the batch. Without a verified destination and receipt the archive and its
 *               quota charge are retained.
 *  - reconcile: read-only report of counters versus actual rows and of pending/uncertain/discrepant envelopes; never repairs.
 *
 * Reports carry only reason tokens, ids and counts. Export files carry the already-allowlisted safe archive rows.
 *
 * SUPPORTED PLATFORM: init and reconcile run on Linux, Docker and native Windows. archive and export (retention/export
 * maintenance) are NOT supported on native Windows: they first run the archive/export platform check and, when it is unsupported,
 * return REFUSED with reason PLATFORM_UNSUPPORTED before any filesystem or journal access, so nothing is archived or released there.
 * Run archive and export from Linux/Docker against the same journal directory. The request path (canonical-web-lineage.ts) is
 * unaffected by this check.
 *
 * EXPORTED API: MAINTENANCE_MAX_BATCH; initializeLineage, archiveLineage, exportLineage, reconcileLineage; probeArchiveExportPlatform,
 * archiveExportPlatformCapability, PLATFORM_UNSUPPORTED_REASON, PLATFORM_UNSUPPORTED_MESSAGE; _testOnlySetMaintenanceHooks,
 * _testOnlySetArchiveExportPlatformCapability. The retire-released operation (canonical-web-lineage-maintenance-released.ts) reuses the
 * exported shared helpers (toStop, applyStop, baseReport, platformRefusal, resolveNow, batchLimit, selectTenants, withSnapshot,
 * readTenantSnapshot, metadataGate, maintenanceStoreHooks); it is gated by the same platform check as archive and export.
 */
import { createHash } from 'node:crypto';
import { closeSync, constants as fsConstants, linkSync, lstatSync, mkdtempSync, openSync, readdirSync, rmSync, writeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
    AtomicSQLiteError,
    type AtomicSQLiteKeyedEntry,
    type AtomicSQLiteKeyedHooks,
    type AtomicSQLiteKeyedWrite,
    SQLiteKeyedAtomicRecordStore,
} from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    LINEAGE_ARCHIVE_MIN_RETENTION_MS,
    LINEAGE_METADATA_ROW_MAX_BYTES,
    LINEAGE_REQUEST_ROW_MAX_BYTES,
    archiveKey,
    buildArchiveRecord,
    createLineageStore,
    isArchiveEligible,
    lineageRowByteLimit,
    metadataAfterArchive,
    metadataAfterArchiveRelease,
    metadataKey,
    parseLineageKey,
    provisionTenantMetadata,
    requestKey,
    validateArchiveRecord,
    validateMetadata,
    validateRequestRecord,
    type LineageArchiveRecord,
    type LineageConfig,
    type LineageMetadata,
    type LineageRequestRecord,
    type LineageTenantConfig,
} from './canonical-web-lineage';

import {
    ExportFileStop, EXPORT_SCHEMA, RECEIPT_SCHEMA, EXPORT_MAX_BYTES, RECEIPT_MAX_BYTES,
    exportFileName, receiptFileName, receiptDigestOf, parseReceipt, isForeignReceipt,
    readBoundedFile, writeDurableFile, verifyExportFile, syncDirectory, readReleaseProgress, writeReleaseProgress,
    type Receipt, type ReceiptEntry, type ExportFileHooks,
} from './canonical-web-lineage-export-files';

// -- constants and shared types --------------------------------------------------------------------------------------

export const MAINTENANCE_MAX_BATCH = 10;
const MAX_RECEIPT_FILES = 100;
const DATABASE_FILE = 'cvf-keyvalue-store.sqlite';

export type MaintenanceOperation = 'init' | 'archive' | 'export' | 'reconcile' | 'retire-released';
export type MaintenanceStatus = 'COMPLETED' | 'STOPPED' | 'REFUSED';
export type MaintenanceReportBase = { operation: MaintenanceOperation; status: MaintenanceStatus; reason: string | null; requiresReconciliation: boolean };

/** Internal control-flow signal for a refused precondition or a stop that needs an operator. Never leaves this module. */
class MaintenanceStop extends Error {
    constructor(readonly status: 'REFUSED' | 'STOPPED', readonly reason: string, readonly requiresReconciliation = false) { super(reason); }
}

/**
 * Converts the known failure families into a stop. Storage errors keep only their code/detail tokens; filesystem and SQLite
 * errors keep only their code token. Anything else (a programming error or a test crash seam) is not swallowed.
 */
export function toStop(error: unknown): MaintenanceStop | null {
    if (error instanceof MaintenanceStop) return error;
    if (error instanceof ExportFileStop) return new MaintenanceStop(error.status, error.reason, error.requiresReconciliation);
    if (error instanceof AtomicSQLiteError) {
        const reason = `STORE_${error.code}${error.detail ? `_${error.detail}` : ''}`;
        return new MaintenanceStop(error.code === 'NOT_READY' ? 'REFUSED' : 'STOPPED', reason, error.code === 'COMMIT_UNKNOWN');
    }
    const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
    if (typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code)) return new MaintenanceStop('STOPPED', `IO_${code}`);
    return null;
}

export function applyStop(report: MaintenanceReportBase, error: unknown): void {
    const stop = toStop(error);
    if (!stop) throw error;
    report.status = stop.status;
    report.reason = stop.reason;
    report.requiresReconciliation = report.requiresReconciliation || stop.requiresReconciliation;
}

export function baseReport(operation: MaintenanceOperation): MaintenanceReportBase {
    return { operation, status: 'COMPLETED', reason: null, requiresReconciliation: false };
}

// -- platform capability ---------------------------------------------------------------------------------------------

/** The single refusal code for every maintenance operation on an unsupported platform. */
export const PLATFORM_UNSUPPORTED_REASON = 'PLATFORM_UNSUPPORTED';
/** Operator-facing startup/readiness line. Carries no paths, identifiers or counts. */
export const PLATFORM_UNSUPPORTED_MESSAGE = 'archive and export (retention/export maintenance) are unsupported on native Windows; run them from Linux/Docker against the same journal directory';
export type ArchiveExportPlatformCapability =
    | { supported: true }
    | { supported: false; reason: typeof PLATFORM_UNSUPPORTED_REASON; message: string };

const UNSUPPORTED: ArchiveExportPlatformCapability = { supported: false, reason: PLATFORM_UNSUPPORTED_REASON, message: PLATFORM_UNSUPPORTED_MESSAGE };
let probedCapability: ArchiveExportPlatformCapability | undefined;
let testCapability: ArchiveExportPlatformCapability | undefined;

/**
 * Capability probe, run before archive or export touches anything. Native Windows is never supported for these two: it has no O_NOFOLLOW
 * and its link and symlink behaviour does not match the no-follow, no-clobber export custody. init and reconcile never use it. On the other platforms one bounded
 * probe runs once per process in a fresh private temporary directory outside the journal: an O_NOFOLLOW exclusive create, a hard
 * link, and a link count of two. Any failure is PLATFORM_UNSUPPORTED. On Windows the probe performs no filesystem I/O at all.
 */
export function probeArchiveExportPlatform(): ArchiveExportPlatformCapability {
    if (probedCapability === undefined) probedCapability = runPlatformProbe();
    return probedCapability;
}
function runPlatformProbe(): ArchiveExportPlatformCapability {
    if (process.platform === 'win32' || typeof fsConstants.O_NOFOLLOW !== 'number') return UNSUPPORTED;
    let directory: string | undefined;
    let fd: number | undefined;
    try {
        directory = mkdtempSync(path.join(tmpdir(), 'cvf-lineage-probe-'));
        const first = path.join(directory, 'probe-a');
        fd = openSync(first, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600);
        writeSync(fd, 'probe');
        closeSync(fd);
        fd = undefined;
        linkSync(first, path.join(directory, 'probe-b'));
        const info = lstatSync(first);
        return info.isFile() && !info.isSymbolicLink() && info.nlink === 2 ? { supported: true } : UNSUPPORTED;
    } catch {
        return UNSUPPORTED;
    } finally {
        if (fd !== undefined) { try { closeSync(fd); } catch { /* best effort on a private probe file */ } }
        if (directory !== undefined) { try { rmSync(directory, { recursive: true, force: true }); } catch { /* best effort on a private probe directory */ } }
    }
}
/** Effective capability: the probe, unless a test has forced one. Every operation and the command line consult this first. */
export function archiveExportPlatformCapability(): ArchiveExportPlatformCapability {
    return testCapability ?? probeArchiveExportPlatform();
}
export function platformRefusal<T extends MaintenanceReportBase>(report: T): T {
    report.status = 'REFUSED';
    report.reason = PLATFORM_UNSUPPORTED_REASON;
    report.requiresReconciliation = false;
    return report;
}

// -- test seam -------------------------------------------------------------------------------------------------------

export type MaintenanceTestHooks = ExportFileHooks & {
    /** Hooks handed to the keyed store for one maintenance transaction (e.g. a failure after COMMIT). */
    store?: (context: { step: 'archive' | 'release' | 'retire' | 'reset'; id: string }) => AtomicSQLiteKeyedHooks | undefined;
    /** Runs after the export file is durably written and before its readback verification. */
    afterExportFile?: (file: string) => void;
    /** Runs after the receipt is durable and verified and before the first row is deleted. */
    afterReceipt?: (receiptFile: string) => void;
    /** Runs before the release transaction of entry <index> of a batch. */
    beforeRelease?: (index: number) => void;
};
let testHooks: MaintenanceTestHooks | undefined;
/** Test-only seam (precedent: _testOnlySetStoreHooks). Not reachable from the command line, environment or serialized input. */
export function _testOnlySetMaintenanceHooks(hooks: MaintenanceTestHooks | undefined): void { testHooks = hooks; }
/** Store hooks for one retire-released transaction (undefined outside tests). */
export function maintenanceStoreHooks(step: 'retire' | 'reset', id: string): AtomicSQLiteKeyedHooks | undefined { return testHooks?.store?.({ step, id }); }
/** Test-only seam: forces the platform capability so the fail-closed path runs on every host. Not reachable from the CLI or env. */
export function _testOnlySetArchiveExportPlatformCapability(capability: ArchiveExportPlatformCapability | undefined): void { testCapability = capability; }

// -- small helpers ---------------------------------------------------------------------------------------------------

function sha256(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
}
export function resolveNow(now: number | undefined): number {
    const value = now === undefined ? Date.now() : now;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 8.64e15) throw new MaintenanceStop('REFUSED', 'NOW_INVALID');
    return value;
}
export function batchLimit(requested: number | undefined): number {
    if (requested === undefined) return MAINTENANCE_MAX_BATCH;
    if (!Number.isSafeInteger(requested) || requested < 1 || requested > MAINTENANCE_MAX_BATCH) throw new MaintenanceStop('REFUSED', 'BATCH_LIMIT_INVALID');
    return requested;
}
export function selectTenants(config: LineageConfig, tenantId: string | undefined): LineageTenantConfig[] {
    if (tenantId === undefined) return config.tenants;
    const tenant = config.tenants.find(candidate => candidate.tenantId === tenantId);
    if (!tenant) throw new MaintenanceStop('REFUSED', 'TENANT_NOT_CONFIGURED');
    return [tenant];
}
function isDirectoryPath(directory: unknown): directory is string {
    return typeof directory === 'string' && directory.length > 0 && directory.length <= 512 && path.isAbsolute(directory)
        && !directory.startsWith('\\\\') && !directory.includes('\0');
}
function isErrno(error: unknown, code: string): boolean {
    return !!error && typeof error === 'object' && (error as { code?: unknown }).code === code;
}

/** Existing-directory custody check for the offline read handle. No filesystem mutation. Returns the database path. */
function checkReadCustody(directory: string): string {
    if (!isDirectoryPath(directory)) throw new MaintenanceStop('REFUSED', 'DIRECTORY_INVALID');
    try {
        const info = lstatSync(directory);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new MaintenanceStop('REFUSED', 'DIRECTORY_INVALID');
    } catch (error) {
        if (error instanceof MaintenanceStop) throw error;
        throw new MaintenanceStop('REFUSED', isErrno(error, 'ENOENT') || isErrno(error, 'ENOTDIR') ? 'DIRECTORY_MISSING' : 'DIRECTORY_INVALID');
    }
    const databasePath = path.join(directory, DATABASE_FILE);
    try {
        const info = lstatSync(databasePath);
        if (!info.isFile() || info.isSymbolicLink()) throw new MaintenanceStop('REFUSED', 'DATABASE_INVALID');
    } catch (error) {
        if (error instanceof MaintenanceStop) throw error;
        throw new MaintenanceStop('REFUSED', isErrno(error, 'ENOENT') ? 'DATABASE_MISSING' : 'DATABASE_INVALID');
    }
    return databasePath;
}

// -- offline read-only snapshot (the only place that enumerates) -----------------------------------------------------

interface RawStatement { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown }
interface RawDatabase { prepare(sql: string): RawStatement; exec(sql: string): unknown; close(): void }
type RawDatabaseConstructor = new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number }) => RawDatabase;
/** Read-only handle. Falls back to the copy of the driver the native store itself resolves when this package's copy has no compiled binding. */
function openReadOnly(databasePath: string): RawDatabase {
    const options = { readonly: true, fileMustExist: true, timeout: 0 };
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return new (require('better-sqlite3') as RawDatabaseConstructor)(databasePath, options);
    } catch (error) {
        if (!(error instanceof Error) || !/bindings file/i.test(error.message)) throw error;
    }
    const nativeRequire = createRequire(path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/package.json'));
    return new (nativeRequire('better-sqlite3') as RawDatabaseConstructor)(databasePath, options);
}

type RawRow = { id: string; revision: unknown; rtype: string; itype: string; bytes: unknown; json: string | null };
const SELECT_COLUMNS = `id, revision, typeof(revision) AS rtype, typeof(item_json) AS itype, length(CAST(item_json AS BLOB)) AS bytes,
    CASE WHEN typeof(item_json)='text' AND length(CAST(item_json AS BLOB)) <= ${LINEAGE_METADATA_ROW_MAX_BYTES} THEN item_json ELSE NULL END AS json`;

/** Same per-key classification as the keyed store: type/length are checked before any JSON.parse. */
function decodeRow(row: RawRow): AtomicSQLiteKeyedEntry {
    const id = row.id;
    if (row.rtype !== 'integer' || typeof row.revision !== 'number' || !Number.isSafeInteger(row.revision) || row.revision < 0
        || row.itype !== 'text' || typeof row.bytes !== 'number' || !Number.isSafeInteger(row.bytes)) return { id, state: 'UNAVAILABLE', code: 'CORRUPT' };
    if (row.bytes > lineageRowByteLimit(id)) return { id, state: 'UNAVAILABLE', code: 'OVERSIZE' };
    if (typeof row.json !== 'string') return { id, state: 'UNAVAILABLE', code: 'CORRUPT' };
    try {
        const value: unknown = JSON.parse(row.json);
        if (JSON.stringify(value) !== row.json) throw new Error('noncanonical');
        return { id, state: 'PRESENT', revision: row.revision, value };
    } catch { return { id, state: 'UNAVAILABLE', code: 'CORRUPT' }; }
}

type SnapshotReader = {
    /** One exact key, or ABSENT. */
    entry(id: string): AtomicSQLiteKeyedEntry;
    /** Ids with the prefix '<kind>:<tenantId>:' (or every 'm:' key when tenantId is null), at most `limit`, in id order. */
    range(kind: 'r' | 'a' | 'm', tenantId: string | null, limit: number): AtomicSQLiteKeyedEntry[];
};

/** One consistent read-only snapshot (a single deferred read transaction on a separate read-only handle). */
export function withSnapshot<T>(config: LineageConfig, read: (reader: SnapshotReader) => T): T {
    const databasePath = checkReadCustody(config.directory);
    let db: RawDatabase | undefined;
    let began = false;
    try {
        db = openReadOnly(databasePath);
        const single = db.prepare(`SELECT ${SELECT_COLUMNS} FROM atomic_key_value_store WHERE namespace = ? AND id = ?`);
        const ranged = db.prepare(`SELECT ${SELECT_COLUMNS} FROM atomic_key_value_store WHERE namespace = ? AND id >= ? AND id < ? ORDER BY id LIMIT ?`);
        const handle = db;
        handle.exec('BEGIN');
        began = true;
        const result = read({
            entry(id) {
                const row = single.get(config.namespace, id) as RawRow | undefined;
                return row ? decodeRow(row) : { id, state: 'ABSENT' };
            },
            range(kind, tenantId, limit) {
                // ':' (0x3A) < ';' (0x3B): the half-open range [prefix, prefix-with-;) is exactly the keys under the prefix.
                const prefix = tenantId === null ? `${kind}:` : `${kind}:${tenantId}:`;
                const upper = `${prefix.slice(0, -1)};`;
                return (ranged.all(config.namespace, prefix, upper, limit) as RawRow[]).map(decodeRow);
            },
        });
        handle.exec('COMMIT');
        began = false;
        return result;
    } finally {
        if (db) {
            if (began) { try { db.exec('ROLLBACK'); } catch { /* read-only snapshot; nothing to undo */ } }
            try { db.close(); } catch { /* already closed */ }
        }
    }
}

export type TenantSnapshot = {
    metadata: AtomicSQLiteKeyedEntry;
    active: AtomicSQLiteKeyedEntry[];
    archive: AtomicSQLiteKeyedEntry[];
    activeOverflow: boolean;
    archiveOverflow: boolean;
};
/** Bounded by the configured slot counts (+1 row to detect an overflow beyond the allocation). */
export function readTenantSnapshot(reader: SnapshotReader, tenant: LineageTenantConfig): TenantSnapshot {
    const metadata = reader.entry(metadataKey(tenant.tenantId));
    const active = reader.range('r', tenant.tenantId, tenant.activeSlots + 1);
    const archive = reader.range('a', tenant.tenantId, tenant.archiveSlots + 1);
    return { metadata, active, archive, activeOverflow: active.length > tenant.activeSlots, archiveOverflow: archive.length > tenant.archiveSlots };
}

// -- metadata gate and classification --------------------------------------------------------------------------------

export type MetadataGate = { ok: true; meta: LineageMetadata; revision: number } | { ok: false; reason: string };
/** Contradictory, unavailable, absent or drifted metadata holds that tenant; counters are never repaired here. */
export function metadataGate(config: LineageConfig, tenant: LineageTenantConfig, entry: AtomicSQLiteKeyedEntry): MetadataGate {
    if (entry.state === 'ABSENT') return { ok: false, reason: 'METADATA_MISSING' };
    if (entry.state === 'UNAVAILABLE') return { ok: false, reason: 'METADATA_UNAVAILABLE' };
    const meta = validateMetadata(entry.value, tenant.tenantId);
    if (!meta) return { ok: false, reason: 'METADATA_INVALID' };
    if (meta.configRevision !== config.revision || meta.activeSlots !== tenant.activeSlots || meta.archiveSlots !== tenant.archiveSlots) {
        return { ok: false, reason: 'CONFIG_DRIFT' };
    }
    return { ok: true, meta, revision: entry.revision };
}

function hasUncertainOutcome(record: LineageRequestRecord): boolean {
    return record.entries.some(entry => entry.observation !== null && entry.observation.attemptOutcome === 'unknown');
}

type ActiveVerdict = { canonicalId: string; reason: string; record: LineageRequestRecord | null };
/**
 * Why an active row is or is not archive-eligible. Eligibility defers to the journal's own predicate (isArchiveEligible);
 * on top of it an envelope that recorded an `unknown` attempt outcome is held as uncertain: elapsed time never clears it.
 */
function classifyActive(entry: AtomicSQLiteKeyedEntry, tenantId: string, config: LineageConfig, nowMs: number): ActiveVerdict {
    const key = parseLineageKey(entry.id);
    const canonicalId = key && key.kind === 'request' && key.tenantId === tenantId && key.envelopeId ? key.envelopeId : entry.id;
    if (entry.state !== 'PRESENT' || !key || key.kind !== 'request' || key.tenantId !== tenantId || !key.envelopeId) {
        return { canonicalId, reason: 'RECORD_UNAVAILABLE', record: null };
    }
    const record = validateRequestRecord(entry.value, { tenantId, canonicalId: key.envelopeId });
    if (!record) return { canonicalId, reason: 'RECORD_UNAVAILABLE', record: null };
    if (record.entries.some(item => item.state === 'PORT_PENDING')) return { canonicalId, reason: 'PORT_PENDING', record };
    if (record.joinDiscrepant) return { canonicalId, reason: 'JOIN_DISCREPANT', record };
    if (hasUncertainOutcome(record)) return { canonicalId, reason: 'UNCERTAIN_OUTCOME', record };
    if (record.state !== 'FINALIZED') return { canonicalId, reason: 'NOT_FINALIZED', record };
    if (record.configRevision !== config.revision) return { canonicalId, reason: 'CONFIG_DRIFT', record };
    if (!isArchiveEligible(record, nowMs)) return { canonicalId, reason: 'TOO_YOUNG', record };
    return { canonicalId, reason: 'ELIGIBLE', record };
}

type ArchiveVerdict = {
    canonicalId: string; reason: string;
    archived: LineageArchiveRecord | null; revision: number; rowDigest: string; finalizedAt: string;
};
/** Export eligibility of an archive row: valid, finalized, and finalized at least seven days before `now`. */
function classifyArchive(entry: AtomicSQLiteKeyedEntry, tenantId: string, nowMs: number): ArchiveVerdict {
    const key = parseLineageKey(entry.id);
    const canonicalId = key && key.kind === 'archive' && key.tenantId === tenantId && key.envelopeId ? key.envelopeId : entry.id;
    const none = (reason: string): ArchiveVerdict => ({ canonicalId, reason, archived: null, revision: -1, rowDigest: '', finalizedAt: '' });
    if (entry.state !== 'PRESENT' || !key || key.kind !== 'archive' || key.tenantId !== tenantId || !key.envelopeId) return none('RECORD_UNAVAILABLE');
    const archived = validateArchiveRecord(entry.value, { tenantId, canonicalId: key.envelopeId });
    if (!archived) return none('RECORD_UNAVAILABLE');
    const terminal = archived.record.terminal;
    if (archived.record.state !== 'FINALIZED' || !terminal) return none('NOT_FINALIZED');
    const verdict = { canonicalId, archived, revision: entry.revision, rowDigest: sha256(JSON.stringify(entry.value)), finalizedAt: terminal.finalizedAt };
    if (nowMs - Date.parse(terminal.finalizedAt) < LINEAGE_ARCHIVE_MIN_RETENTION_MS) return { ...verdict, reason: 'RETENTION_NOT_MET' };
    return { ...verdict, reason: 'EXPORT_ELIGIBLE' };
}

function bump(summary: Record<string, number>, reason: string): void {
    summary[reason] = (summary[reason] ?? 0) + 1;
}

// -- init ------------------------------------------------------------------------------------------------------------

export type InitReport = MaintenanceReportBase & {
    databaseCreated: boolean;
    tenants: { tenantId: string; action: 'CREATED' | 'EXISTING' }[];
};

/**
 * Explicit offline initialization against an existing approved absolute directory (never mkdir). Creates the database and
 * schema if absent, then writes the tenant metadata rows (zero counters, config revision). Idempotent for the same
 * configuration; refuses, writing nothing, when the database already holds different configuration, contradictory metadata,
 * records without their metadata, or metadata for a tenant the configuration does not name (no silent migration).
 */
export function initializeLineage(config: LineageConfig): InitReport {
    const report: InitReport = { ...baseReport('init'), databaseCreated: false, tenants: [] };
    try {
        report.databaseCreated = SQLiteKeyedAtomicRecordStore.initialize(config.directory).created;
        const actions = withSnapshot(config, reader => {
            const result: { tenantId: string; action: 'CREATED' | 'EXISTING' }[] = [];
            for (const tenant of config.tenants) {
                const snapshot = readTenantSnapshot(reader, tenant);
                if (snapshot.metadata.state === 'UNAVAILABLE') throw new MaintenanceStop('REFUSED', 'METADATA_UNAVAILABLE');
                if (snapshot.metadata.state === 'ABSENT') {
                    if (snapshot.active.length + snapshot.archive.length > 0) throw new MaintenanceStop('REFUSED', 'METADATA_MISSING_WITH_RECORDS');
                    result.push({ tenantId: tenant.tenantId, action: 'CREATED' });
                    continue;
                }
                const meta = validateMetadata(snapshot.metadata.value, tenant.tenantId);
                if (!meta) throw new MaintenanceStop('REFUSED', 'METADATA_INVALID');
                if (meta.configRevision !== config.revision) throw new MaintenanceStop('REFUSED', 'CONFIG_MISMATCH_REVISION');
                if (meta.activeSlots !== tenant.activeSlots || meta.archiveSlots !== tenant.archiveSlots) throw new MaintenanceStop('REFUSED', 'CONFIG_MISMATCH_SLOTS');
                result.push({ tenantId: tenant.tenantId, action: 'EXISTING' });
            }
            const configured = new Set(config.tenants.map(tenant => tenant.tenantId));
            for (const entry of reader.range('m', null, config.tenants.length + 5)) {
                const key = parseLineageKey(entry.id);
                if (!key || key.kind !== 'metadata' || !configured.has(key.tenantId)) throw new MaintenanceStop('REFUSED', 'UNCONFIGURED_TENANT_PRESENT');
            }
            return result;
        });
        const provisioned = provisionTenantMetadata(config);
        if (!provisioned.ok) throw new MaintenanceStop('STOPPED', `PROVISION_${provisioned.code}_${provisioned.reason}`.slice(0, 80), provisioned.code === 'COMMIT_UNKNOWN');
        report.tenants = actions;
    } catch (error) { applyStop(report, error); }
    return report;
}

// -- archive ---------------------------------------------------------------------------------------------------------

export type ArchiveOptions = { now?: number; tenantId?: string; maxEnvelopes?: number };
export type ArchiveEnvelopeOutcome = { tenantId: string; canonicalId: string; outcome: 'ARCHIVED' | 'NOT_ARCHIVED'; reason: string };
export type ArchiveTenantStatus = {
    tenantId: string;
    status: 'OK' | 'HELD' | 'ARCHIVE_FULL' | 'STOPPED';
    reason: string | null;
    eligibleFound: number;
    archived: number;
};
export type ArchiveReport = MaintenanceReportBase & {
    now: string | null;
    archived: number;
    attempted: number;
    outcomes: ArchiveEnvelopeOutcome[];
    /** Count of active envelopes per classification across the examined tenants (PORT_PENDING, TOO_YOUNG, ...). */
    classification: Record<string, number>;
    tenants: ArchiveTenantStatus[];
};

type ArchiveStep = { archived: boolean; reason: string; archiveFull: boolean };
/** One envelope, one keyed transaction on [m, r, a]: create the archive key, CAS-delete the active key, update both counters. */
function archiveOne(store: SQLiteKeyedAtomicRecordStore, config: LineageConfig, tenant: LineageTenantConfig, canonicalId: string, nowMs: number): ArchiveStep {
    const hooks = testHooks?.store?.({ step: 'archive', id: requestKey(tenant.tenantId, canonicalId) });
    return store.transactionKeys(
        [metadataKey(tenant.tenantId), requestKey(tenant.tenantId, canonicalId), archiveKey(tenant.tenantId, canonicalId)],
        ([metaEntry, requestEntry, archiveEntry]) => {
            const none = (reason: string, archiveFull = false) => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: { archived: false, reason, archiveFull } as ArchiveStep });
            const gate = metadataGate(config, tenant, metaEntry);
            if (!gate.ok) return none(gate.reason);
            if (requestEntry.state === 'ABSENT') return none('ALREADY_GONE');
            const verdict = classifyActive(requestEntry, tenant.tenantId, config, nowMs);
            if (verdict.reason !== 'ELIGIBLE' || !verdict.record || requestEntry.state !== 'PRESENT') return none(verdict.reason);
            if (archiveEntry.state !== 'ABSENT') return none('ARCHIVE_KEY_EXISTS');
            const nextMeta = metadataAfterArchive(gate.meta);
            if (!nextMeta) return gate.meta.activeUsed < 1 ? none('ACTIVE_COUNTER_ZERO') : none('ARCHIVE_FULL', true);
            const archived = buildArchiveRecord(verdict.record, requestEntry.revision, new Date(nowMs).toISOString());
            if (Buffer.byteLength(JSON.stringify(archived), 'utf8') > LINEAGE_REQUEST_ROW_MAX_BYTES) return none('ARCHIVE_ROW_TOO_LARGE');
            return {
                writes: [
                    { id: metaEntry.id, expectedRevision: gate.revision, value: nextMeta },
                    { id: archiveEntry.id, expectedRevision: null, value: archived },
                    { id: requestEntry.id, expectedRevision: requestEntry.revision, delete: true },
                ] as AtomicSQLiteKeyedWrite[],
                result: { archived: true, reason: 'ARCHIVED', archiveFull: false } as ArchiveStep,
            };
        },
        hooks,
    );
}

/**
 * Moves eligible finalized envelopes from the active to the archive key space: at most ten per run, one keyed transaction per
 * envelope. An archive-full tenant stops archiving (its active rows stay and keep holding new admission); pending, uncertain or
 * join-discrepant envelopes are never moved, whatever their age. A COMMIT_UNKNOWN or any storage failure stops the run.
 */
export function archiveLineage(config: LineageConfig, options: ArchiveOptions = {}): ArchiveReport {
    const report: ArchiveReport = { ...baseReport('archive'), now: null, archived: 0, attempted: 0, outcomes: [], classification: {}, tenants: [] };
    if (!archiveExportPlatformCapability().supported) return platformRefusal(report);
    try {
        const nowMs = resolveNow(options.now);
        report.now = new Date(nowMs).toISOString();
        let budget = batchLimit(options.maxEnvelopes);
        const tenants = selectTenants(config, options.tenantId);
        const store = createLineageStore(config);
        const discovered = withSnapshot(config, reader => tenants.map(tenant => ({ tenant, snapshot: readTenantSnapshot(reader, tenant) })));
        for (const { tenant, snapshot } of discovered) {
            const status: ArchiveTenantStatus = { tenantId: tenant.tenantId, status: 'OK', reason: null, eligibleFound: 0, archived: 0 };
            report.tenants.push(status);
            const gate = metadataGate(config, tenant, snapshot.metadata);
            if (!gate.ok) { status.status = 'HELD'; status.reason = gate.reason; continue; }
            const verdicts = snapshot.active.map(entry => classifyActive(entry, tenant.tenantId, config, nowMs));
            for (const verdict of verdicts) bump(report.classification, verdict.reason);
            const eligible = verdicts.filter(verdict => verdict.reason === 'ELIGIBLE' && verdict.record)
                .sort((left, right) => (left.record!.terminal!.finalizedAt + left.canonicalId).localeCompare(right.record!.terminal!.finalizedAt + right.canonicalId));
            status.eligibleFound = eligible.length;
            for (const candidate of eligible) {
                if (budget <= 0) break;
                budget -= 1;
                report.attempted += 1;
                let step: ArchiveStep;
                try {
                    step = archiveOne(store, config, tenant, candidate.canonicalId, nowMs);
                } catch (error) {
                    const stop = toStop(error);
                    if (!stop) throw error;
                    status.status = 'STOPPED';
                    status.reason = stop.reason;
                    throw stop;
                }
                report.outcomes.push({ tenantId: tenant.tenantId, canonicalId: candidate.canonicalId, outcome: step.archived ? 'ARCHIVED' : 'NOT_ARCHIVED', reason: step.reason });
                if (step.archived) { report.archived += 1; status.archived += 1; }
                if (step.archiveFull) { status.status = 'ARCHIVE_FULL'; status.reason = 'ARCHIVE_FULL'; break; }
            }
        }
    } catch (error) { applyStop(report, error); }
    return report;
}

// -- export ----------------------------------------------------------------------------------------------------------

export type ExportOptions = { destination?: string; now?: number; tenantId?: string; maxEnvelopes?: number };
export type ExportEntryOutcome = {
    canonicalId: string;
    outcome: 'RELEASED' | 'ALREADY_RELEASED' | 'SUPERSEDED' | 'RETAINED';
    reason: string;
};
export type ExportBatchReport = {
    tenantId: string;
    batchId: string;
    kind: 'NEW' | 'RECOGNIZED_RECEIPT';
    exportFile: string;
    receiptFile: string;
    receiptDirectorySynced: boolean;
    entries: number;
    released: number;
    alreadyReleased: number;
    retained: number;
    entryOutcomes: ExportEntryOutcome[];
};
export type ExportReport = MaintenanceReportBase & {
    now: string | null;
    batches: ExportBatchReport[];
    released: number;
    alreadyReleased: number;
    tenants: { tenantId: string; status: 'OK' | 'HELD'; reason: string | null }[];
};

/** Existing, non-symlink destination directory outside the database custody. Never created. */
function checkDestination(config: LineageConfig, destination: unknown): string {
    if (destination === undefined || destination === null || destination === '') throw new MaintenanceStop('REFUSED', 'DESTINATION_REQUIRED');
    if (!isDirectoryPath(destination)) throw new MaintenanceStop('REFUSED', 'DESTINATION_INVALID');
    try {
        const info = lstatSync(destination);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new MaintenanceStop('REFUSED', 'DESTINATION_INVALID');
    } catch (error) {
        if (error instanceof MaintenanceStop) throw error;
        throw new MaintenanceStop('REFUSED', isErrno(error, 'ENOENT') || isErrno(error, 'ENOTDIR') ? 'DESTINATION_MISSING' : 'DESTINATION_INVALID');
    }
    const resolvedDestination = path.resolve(destination);
    const relative = path.relative(path.resolve(config.directory), resolvedDestination);
    if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) throw new MaintenanceStop('REFUSED', 'DESTINATION_INSIDE_DATABASE_CUSTODY');
    return resolvedDestination;
}

type ReleaseStep = { outcome: ExportEntryOutcome['outcome']; reason: string };
/**
 * Release of one exported archive row: a single keyed transaction on [m, a]. The CAS delete and the counter decrement commit
 * together or not at all, and only for a row whose revision and digest equal the receipt entry. An absent row means the capacity
 * was already freed by an earlier run; it is never decremented again. A differing row is a different record, never touched.
 */
function releaseOne(store: SQLiteKeyedAtomicRecordStore, config: LineageConfig, tenant: LineageTenantConfig, entry: ReceiptEntry, exportVerified: boolean): ReleaseStep {
    const key = archiveKey(tenant.tenantId, entry.canonicalId);
    const hooks = testHooks?.store?.({ step: 'release', id: key });
    return store.transactionKeys(
        [metadataKey(tenant.tenantId), key],
        ([metaEntry, archiveEntry]) => {
            const none = (outcome: ReleaseStep['outcome'], reason: string) => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: { outcome, reason } as ReleaseStep });
            if (archiveEntry.state === 'ABSENT') return none('ALREADY_RELEASED', 'ARCHIVE_ROW_ABSENT');
            if (archiveEntry.state === 'UNAVAILABLE') return none('RETAINED', 'RECORD_UNAVAILABLE');
            const archived = validateArchiveRecord(archiveEntry.value, { tenantId: tenant.tenantId, canonicalId: entry.canonicalId });
            if (!archived || archiveEntry.revision !== entry.revision || archived.originDigest !== entry.originDigest
                || sha256(JSON.stringify(archiveEntry.value)) !== entry.rowDigest) return none('SUPERSEDED', 'ARCHIVE_ROW_DIFFERS_FROM_RECEIPT');
            if (!exportVerified) return none('RETAINED', 'EXPORT_UNVERIFIED');
            const gate = metadataGate(config, tenant, metaEntry);
            if (!gate.ok) return none('RETAINED', gate.reason);
            const nextMeta = metadataAfterArchiveRelease(gate.meta);
            if (!nextMeta) return none('RETAINED', 'ARCHIVE_COUNTER_ZERO');
            return {
                writes: [
                    { id: metaEntry.id, expectedRevision: gate.revision, value: nextMeta },
                    { id: archiveEntry.id, expectedRevision: archiveEntry.revision, delete: true },
                ] as AtomicSQLiteKeyedWrite[],
                result: { outcome: 'RELEASED', reason: 'RELEASED' } as ReleaseStep,
            };
        },
        hooks,
    );
}

/** Releases every entry of a verified (or unverified) receipt in order; a storage failure stops the batch and is returned. */
function releaseBatch(
    store: SQLiteKeyedAtomicRecordStore, config: LineageConfig, tenant: LineageTenantConfig, receipt: Receipt, exportVerified: boolean,
    batch: ExportBatchReport, destination: string, budget: { remaining: number },
): MaintenanceStop | null {
    for (let index = 0; index < receipt.entries.length; index += 1) {
        const entry = receipt.entries[index];
        const confirmed = readReleaseProgress(destination, receipt, index);
        if (confirmed) {
            batch.entryOutcomes.push({ canonicalId: entry.canonicalId,
                outcome: confirmed.outcome === 'RELEASED' ? 'ALREADY_RELEASED' : confirmed.outcome,
                reason: confirmed.outcome === 'RELEASED' ? 'RELEASE_PREVIOUSLY_CONFIRMED' : confirmed.reason });
            batch.alreadyReleased += 1;
            continue;
        }
        if (budget.remaining <= 0) break;
        testHooks?.beforeRelease?.(index);
        budget.remaining -= 1;
        let step: ReleaseStep;
        try {
            step = releaseOne(store, config, tenant, entry, exportVerified);
        } catch (error) {
            // BUSY, COMMIT_UNKNOWN or any storage failure stops the batch; the receipt lets a rerun finish it under CAS.
            const stop = toStop(error);
            if (!stop) throw error;
            return stop;
        }
        batch.entryOutcomes.push({ canonicalId: entry.canonicalId, outcome: step.outcome, reason: step.reason });
        if (step.outcome === 'RELEASED') batch.released += 1;
        else if (step.outcome === 'ALREADY_RELEASED' || step.outcome === 'SUPERSEDED') batch.alreadyReleased += 1;
        else batch.retained += 1;
        if (step.outcome !== 'RETAINED') {
            try { writeReleaseProgress(destination, receipt, index, step as { outcome: 'RELEASED' | 'ALREADY_RELEASED' | 'SUPERSEDED'; reason: string }, testHooks); }
            catch (error) { const stop = toStop(error); if (!stop) throw error; return stop; }
        }
    }
    return null;
}

function newBatchReport(receipt: Receipt, kind: ExportBatchReport['kind']): ExportBatchReport {
    return {
        tenantId: receipt.tenantId, batchId: receipt.batchId, kind, exportFile: receipt.exportFile, receiptFile: receiptFileName(receipt.tenantId, receipt.batchId),
        receiptDirectorySynced: false, entries: receipt.entries.length, released: 0, alreadyReleased: 0, retained: 0, entryOutcomes: [],
    };
}

function receiptFilesFor(destination: string, tenantId: string): string[] {
    const escaped = tenantId.replace(/[.]/g, '\\.');
    const pattern = new RegExp(`^lineage-export-${escaped}-[a-f0-9]{16}\\.receipt\\.json$`);
    const names = readdirSync(destination).filter(name => pattern.test(name)).sort();
    if (names.length > MAX_RECEIPT_FILES) throw new MaintenanceStop('REFUSED', 'TOO_MANY_RECEIPTS');
    return names;
}

/**
 * Exports aged archived rows into an existing approved destination, then (and only then) releases them.
 *  1. Recognize every existing receipt for the tenant in the destination and finish it row by row under CAS (the receipt is the
 *     replay key: rows already released are not decremented again, a differing row is left alone). An unverifiable export file
 *     keeps the archive and its quota charge and stops the run.
 *  2. Build at most ten new entries from archived rows finalized >= 7 days before `now`; write the export file, read it back and
 *     verify it, write and verify the durable receipt, and only then delete the exact rows and decrement the counters.
 * COMMIT_UNKNOWN or any other storage failure stops the batch for reconciliation (run `reconcile`); nothing is retried blindly.
 */
export function exportLineage(config: LineageConfig, options: ExportOptions = {}): ExportReport {
    const report: ExportReport = { ...baseReport('export'), now: null, batches: [], released: 0, alreadyReleased: 0, tenants: [] };
    if (!archiveExportPlatformCapability().supported) return platformRefusal(report);
    const finish = (batch: ExportBatchReport, stop: MaintenanceStop | null): void => {
        report.released += batch.released;
        report.alreadyReleased += batch.alreadyReleased;
        if (stop) throw stop;
        if (batch.entryOutcomes.some(outcome => outcome.reason === 'EXPORT_UNVERIFIED')) throw new MaintenanceStop('STOPPED', 'RECEIPT_EXPORT_UNVERIFIED');
    };
    try {
        const destination = checkDestination(config, options.destination);
        const nowMs = resolveNow(options.now);
        report.now = new Date(nowMs).toISOString();
        const budget = { remaining: batchLimit(options.maxEnvelopes) };
        const tenants = selectTenants(config, options.tenantId);
        const store = createLineageStore(config);

        for (const tenant of tenants) {
            // Phase 1: recognize and finish every receipt already present for this tenant.
            for (const name of receiptFilesFor(destination, tenant.tenantId)) {
                const bytes = readBoundedFile(path.join(destination, name), RECEIPT_MAX_BYTES);
                const receipt = bytes ? parseReceipt(bytes.toString('utf8'), config, tenant.tenantId) : null;
                if (!receipt) {
                    // A receipt of another namespace is not ours; a malformed one is never trusted for a deletion nor silently skipped.
                    if (bytes && isForeignReceipt(bytes, config)) continue;
                    throw new MaintenanceStop('STOPPED', 'RECEIPT_INVALID');
                }
                const batch = newBatchReport(receipt, 'RECOGNIZED_RECEIPT');
                report.batches.push(batch);
                const exportProblem = verifyExportFile(destination, receipt, true, testHooks);
                if (exportProblem) {
                    batch.retained = receipt.entries.length;
                    throw new MaintenanceStop('STOPPED', 'RECEIPT_EXPORT_UNVERIFIED');
                }
                // The bytes actually fsynced must still be this receipt, not a stale readable predecessor.
                const durableReceipt = readBoundedFile(path.join(destination, name), RECEIPT_MAX_BYTES, true, testHooks);
                if (!durableReceipt || !bytes || !durableReceipt.equals(bytes)) throw new MaintenanceStop('STOPPED', 'RECEIPT_READBACK_MISMATCH');
                syncDirectory(destination, testHooks);
                batch.receiptDirectorySynced = true;
                finish(batch, releaseBatch(store, config, tenant, receipt, true, batch, destination, budget));
            }

            // Phase 2: a new batch of aged archive rows.
            if (budget.remaining <= 0) { report.tenants.push({ tenantId: tenant.tenantId, status: 'OK', reason: null }); continue; }
            const snapshot = withSnapshot(config, reader => readTenantSnapshot(reader, tenant));
            const gate = metadataGate(config, tenant, snapshot.metadata);
            if (!gate.ok) { report.tenants.push({ tenantId: tenant.tenantId, status: 'HELD', reason: gate.reason }); continue; }
            report.tenants.push({ tenantId: tenant.tenantId, status: 'OK', reason: null });
            const eligible = snapshot.archive.map(entry => ({ entry, verdict: classifyArchive(entry, tenant.tenantId, nowMs) }))
                .filter(item => item.verdict.reason === 'EXPORT_ELIGIBLE' && item.verdict.archived)
                .sort((left, right) => (left.verdict.finalizedAt + left.verdict.canonicalId).localeCompare(right.verdict.finalizedAt + right.verdict.canonicalId))
                .slice(0, budget.remaining);
            if (eligible.length === 0) continue;

            const entries = eligible.map(item => ({
                id: item.entry.id, canonicalId: item.verdict.canonicalId, revision: item.verdict.revision,
                originDigest: item.verdict.archived!.originDigest, rowDigest: item.verdict.rowDigest, row: (item.entry as { value: unknown }).value,
            }));
            const batchId = sha256(JSON.stringify({
                namespace: config.namespace, tenantId: tenant.tenantId,
                entries: entries.map(entry => ({ canonicalId: entry.canonicalId, revision: entry.revision, originDigest: entry.originDigest, rowDigest: entry.rowDigest })),
            })).slice(0, 16);
            const exportName = exportFileName(tenant.tenantId, batchId);
            const exportBytes = Buffer.from(`${JSON.stringify({ schema: EXPORT_SCHEMA, namespace: config.namespace, tenantId: tenant.tenantId, configRevision: config.revision, batchId, entries })}\n`, 'utf8');
            if (exportBytes.length > EXPORT_MAX_BYTES) throw new MaintenanceStop('REFUSED', 'EXPORT_TOO_LARGE');
            const receiptBody: Omit<Receipt, 'receiptDigest'> = {
                schema: RECEIPT_SCHEMA, namespace: config.namespace, tenantId: tenant.tenantId, configRevision: config.revision, batchId,
                createdAt: new Date(nowMs).toISOString(), exportFile: exportName, exportFileBytes: exportBytes.length, exportFileSha256: sha256(exportBytes),
                entries: entries.map(entry => ({ canonicalId: entry.canonicalId, revision: entry.revision, originDigest: entry.originDigest, rowDigest: entry.rowDigest })),
            };
            const receipt: Receipt = { ...receiptBody, receiptDigest: receiptDigestOf(receiptBody) };

            // 1. export file, 2. readback verification, 3. durable receipt, 4. receipt readback. No row is touched before step 4.
            const exportPath = path.join(destination, exportName);
            writeDurableFile(exportPath, exportBytes, 'EXPORT_FILE_CONFLICT', testHooks);
            testHooks?.afterExportFile?.(exportPath);
            const exportProblem = verifyExportFile(destination, receipt, true, testHooks);
            if (exportProblem) throw new MaintenanceStop('STOPPED', `EXPORT_READBACK_${exportProblem}`);
            const receiptPath = path.join(destination, receiptFileName(tenant.tenantId, batchId));
            const receiptBytes = Buffer.from(`${JSON.stringify(receipt)}\n`, 'utf8');
            const directorySynced = writeDurableFile(receiptPath, receiptBytes, 'RECEIPT_CONFLICT', testHooks);
            const stored = readBoundedFile(receiptPath, RECEIPT_MAX_BYTES);
            const reread = stored ? parseReceipt(stored.toString('utf8'), config, tenant.tenantId) : null;
            if (!reread || reread.receiptDigest !== receipt.receiptDigest) throw new MaintenanceStop('STOPPED', 'RECEIPT_READBACK_MISMATCH');
            testHooks?.afterReceipt?.(receiptPath);

            const batch = newBatchReport(receipt, 'NEW');
            batch.receiptDirectorySynced = directorySynced;
            report.batches.push(batch);
            finish(batch, releaseBatch(store, config, tenant, receipt, true, batch, destination, budget));
        }
    } catch (error) { applyStop(report, error); }
    return report;
}

// -- reconcile -------------------------------------------------------------------------------------------------------

export type ReconcileOptions = { tenantId?: string; now?: number };
export type ReconcileMismatch = { field: 'activeUsed' | 'archiveUsed'; recorded: number; actual: number };
export type ReconcileTenantReport = {
    tenantId: string;
    metadata: 'OK' | 'MISSING' | 'UNAVAILABLE' | 'INVALID' | 'CONFIG_DRIFT';
    recorded: { activeUsed: number; archiveUsed: number; activeSlots: number; archiveSlots: number } | null;
    actual: { activeRows: number; archiveRows: number };
    mismatches: ReconcileMismatch[];
    activeOverflow: boolean;
    archiveOverflow: boolean;
    pending: string[];
    uncertain: string[];
    joinDiscrepant: string[];
    unavailable: { location: 'ACTIVE' | 'ARCHIVE'; id: string; code: string }[];
    duplicateLocations: string[];
    archiveEligible: number;
    exportEligible: number;
    consistent: boolean;
};
export type ReconcileReport = MaintenanceReportBase & {
    readOnly: true;
    repaired: false;
    now: string | null;
    consistent: boolean;
    unconfiguredMetadata: string[];
    tenants: ReconcileTenantReport[];
};

function reconcileTenant(config: LineageConfig, tenant: LineageTenantConfig, snapshot: TenantSnapshot, nowMs: number): ReconcileTenantReport {
    const gate = metadataGate(config, tenant, snapshot.metadata);
    const metadata: ReconcileTenantReport['metadata'] = gate.ok ? 'OK'
        : gate.reason === 'METADATA_MISSING' ? 'MISSING' : gate.reason === 'METADATA_UNAVAILABLE' ? 'UNAVAILABLE' : gate.reason === 'CONFIG_DRIFT' ? 'CONFIG_DRIFT' : 'INVALID';
    // CONFIG_DRIFT still carries valid counters, which are worth comparing; the other failures have nothing trustworthy.
    const counters = snapshot.metadata.state === 'PRESENT' ? validateMetadata(snapshot.metadata.value, tenant.tenantId) : null;
    const detail: ReconcileTenantReport = {
        tenantId: tenant.tenantId, metadata,
        recorded: counters ? { activeUsed: counters.activeUsed, archiveUsed: counters.archiveUsed, activeSlots: counters.activeSlots, archiveSlots: counters.archiveSlots } : null,
        actual: { activeRows: snapshot.active.length, archiveRows: snapshot.archive.length },
        mismatches: [], activeOverflow: snapshot.activeOverflow, archiveOverflow: snapshot.archiveOverflow,
        pending: [], uncertain: [], joinDiscrepant: [], unavailable: [], duplicateLocations: [],
        archiveEligible: 0, exportEligible: 0, consistent: true,
    };
    // Every row counts toward the charge, including a corrupt one (its bytes and quota charge are preserved).
    if (counters) {
        if (counters.activeUsed !== snapshot.active.length) detail.mismatches.push({ field: 'activeUsed', recorded: counters.activeUsed, actual: snapshot.active.length });
        if (counters.archiveUsed !== snapshot.archive.length) detail.mismatches.push({ field: 'archiveUsed', recorded: counters.archiveUsed, actual: snapshot.archive.length });
    }
    const activeIds = new Set<string>();
    for (const entry of snapshot.active) {
        const verdict = classifyActive(entry, tenant.tenantId, config, nowMs);
        activeIds.add(verdict.canonicalId);
        if (verdict.reason === 'RECORD_UNAVAILABLE') {
            detail.unavailable.push({ location: 'ACTIVE', id: verdict.canonicalId, code: entry.state === 'UNAVAILABLE' ? entry.code : entry.state === 'PRESENT' ? 'INVALID' : 'ABSENT' });
        } else if (verdict.reason === 'PORT_PENDING') {
            detail.pending.push(verdict.canonicalId);
        } else if (verdict.reason === 'JOIN_DISCREPANT') {
            detail.joinDiscrepant.push(verdict.canonicalId);
        } else if (verdict.reason === 'UNCERTAIN_OUTCOME') {
            detail.uncertain.push(verdict.canonicalId);
        } else if (verdict.reason === 'ELIGIBLE') {
            detail.archiveEligible += 1;
        }
    }
    for (const entry of snapshot.archive) {
        const verdict = classifyArchive(entry, tenant.tenantId, nowMs);
        if (verdict.reason === 'RECORD_UNAVAILABLE') {
            detail.unavailable.push({ location: 'ARCHIVE', id: verdict.canonicalId, code: entry.state === 'UNAVAILABLE' ? entry.code : 'INVALID' });
        } else if (verdict.reason === 'EXPORT_ELIGIBLE') {
            detail.exportEligible += 1;
        }
        if (activeIds.has(verdict.canonicalId)) detail.duplicateLocations.push(verdict.canonicalId);
    }
    detail.consistent = metadata === 'OK' && detail.mismatches.length === 0 && !detail.activeOverflow && !detail.archiveOverflow
        && detail.unavailable.length === 0 && detail.duplicateLocations.length === 0;
    return detail;
}

/**
 * Read-only reconciliation report for one or all configured tenants, from one consistent snapshot per call. The only operation
 * that enumerates a tenant's keys; bounded by the configured slot counts. It never writes: counters are reported, never repaired.
 * `consistent` is false for any counter mismatch, unavailable row, duplicate location, overflow or held metadata; pending,
 * uncertain and join-discrepant envelopes are listed as findings that need an operator but do not by themselves make counters wrong.
 */
export function reconcileLineage(config: LineageConfig, options: ReconcileOptions = {}): ReconcileReport {
    const report: ReconcileReport = { ...baseReport('reconcile'), readOnly: true, repaired: false, now: null, consistent: false, unconfiguredMetadata: [], tenants: [] };
    try {
        const nowMs = resolveNow(options.now);
        report.now = new Date(nowMs).toISOString();
        const tenants = selectTenants(config, options.tenantId);
        const configured = new Set(config.tenants.map(tenant => tenant.tenantId));
        const gathered = withSnapshot(config, reader => ({
            snapshots: tenants.map(tenant => ({ tenant, snapshot: readTenantSnapshot(reader, tenant) })),
            metadataIds: reader.range('m', null, config.tenants.length + 5),
        }));
        for (const { tenant, snapshot } of gathered.snapshots) report.tenants.push(reconcileTenant(config, tenant, snapshot, nowMs));
        for (const entry of gathered.metadataIds) {
            const key = parseLineageKey(entry.id);
            if (!key || key.kind !== 'metadata' || !configured.has(key.tenantId)) report.unconfiguredMetadata.push(key ? key.tenantId : entry.id);
        }
        report.consistent = report.tenants.every(tenant => tenant.consistent) && report.unconfiguredMetadata.length === 0;
    } catch (error) { applyStop(report, error); }
    return report;
}
