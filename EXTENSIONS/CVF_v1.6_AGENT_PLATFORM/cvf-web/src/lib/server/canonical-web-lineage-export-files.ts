/** Offline export custody only. Immutable receipt v1 stays compatible; progress never authorizes a deletion. */
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readSync, unlinkSync, writeSync, type Stats } from 'node:fs';
import path from 'node:path';
import { archiveKey, validateArchiveRecord, type LineageConfig } from './canonical-web-lineage';

export const EXPORT_SCHEMA = 'cvf.webLineageExport.v1';
export const RECEIPT_SCHEMA = 'cvf.webLineageExportReceipt.v1';
export const EXPORT_MAX_BYTES = 262144;
export const RECEIPT_MAX_BYTES = 65536;
const SHA256_RE = /^[a-f0-9]{64}$/;
const BATCH_ID_RE = /^[a-f0-9]{16}$/;
const ENVELOPE_ID_RE = /^[a-zA-Z0-9._-]{1,100}$/;
function sha256(value: string | Buffer): string { return createHash('sha256').update(value).digest('hex'); }
function isErrno(error: unknown, code: string): boolean {
    return !!error && typeof error === 'object' && (error as { code?: unknown }).code === code;
}
export class ExportFileStop extends Error {
    constructor(readonly status: 'REFUSED' | 'STOPPED', readonly reason: string, readonly requiresReconciliation = false) { super(reason); }
}
export type ExportFileHooks = {
    beforeFsync?: (kind: 'file' | 'directory', file: string) => void;
    afterTempCreated?: (file: string) => void;
};

export type ReceiptEntry = { canonicalId: string; revision: number; originDigest: string; rowDigest: string };
export type Receipt = {
    schema: typeof RECEIPT_SCHEMA;
    namespace: string;
    tenantId: string;
    configRevision: number;
    batchId: string;
    createdAt: string;
    exportFile: string;
    exportFileBytes: number;
    exportFileSha256: string;
    entries: ReceiptEntry[];
    receiptDigest: string;
};
const RECEIPT_KEYS = ['schema', 'namespace', 'tenantId', 'configRevision', 'batchId', 'createdAt', 'exportFile', 'exportFileBytes', 'exportFileSha256', 'entries', 'receiptDigest'];
const RECEIPT_ENTRY_KEYS = ['canonicalId', 'revision', 'originDigest', 'rowDigest'];

export function exportFileName(tenantId: string, batchId: string): string { return `lineage-export-${tenantId}-${batchId}.json`; }
export function receiptFileName(tenantId: string, batchId: string): string { return `lineage-export-${tenantId}-${batchId}.receipt.json`; }
export function receiptDigestOf(receipt: Omit<Receipt, 'receiptDigest'>): string {
    // Fixed key order: the digest never depends on how a reader happened to order the parsed object.
    return sha256(JSON.stringify({
        schema: receipt.schema, namespace: receipt.namespace, tenantId: receipt.tenantId, configRevision: receipt.configRevision,
        batchId: receipt.batchId, createdAt: receipt.createdAt, exportFile: receipt.exportFile, exportFileBytes: receipt.exportFileBytes,
        exportFileSha256: receipt.exportFileSha256,
        entries: receipt.entries.map(entry => ({ canonicalId: entry.canonicalId, revision: entry.revision, originDigest: entry.originDigest, rowDigest: entry.rowDigest })),
    }));
}
function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
    const actual = Object.keys(value).sort();
    const expected = [...keys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Strict receipt parse; null when malformed, foreign (other namespace/tenant) or when its own digest does not match. */
export function parseReceipt(text: string, config: LineageConfig, tenantId: string): Receipt | null {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return null; }
    if (!isPlainObject(parsed) || !exactKeys(parsed, RECEIPT_KEYS) || parsed.schema !== RECEIPT_SCHEMA) return null;
    if (parsed.namespace !== config.namespace || parsed.tenantId !== tenantId) return null;
    if (typeof parsed.batchId !== 'string' || !BATCH_ID_RE.test(parsed.batchId)) return null;
    if (typeof parsed.configRevision !== 'number' || !Number.isSafeInteger(parsed.configRevision) || parsed.configRevision < 1) return null;
    if (typeof parsed.createdAt !== 'string' || !Number.isFinite(Date.parse(parsed.createdAt))) return null;
    if (parsed.exportFile !== exportFileName(tenantId, parsed.batchId)) return null;
    if (typeof parsed.exportFileBytes !== 'number' || !Number.isSafeInteger(parsed.exportFileBytes) || parsed.exportFileBytes < 1 || parsed.exportFileBytes > EXPORT_MAX_BYTES) return null;
    if (typeof parsed.exportFileSha256 !== 'string' || !SHA256_RE.test(parsed.exportFileSha256)) return null;
    if (!Array.isArray(parsed.entries) || parsed.entries.length < 1 || parsed.entries.length > 10) return null;
    const seen = new Set<string>();
    for (const entry of parsed.entries) {
        if (!isPlainObject(entry) || !exactKeys(entry, RECEIPT_ENTRY_KEYS)) return null;
        if (typeof entry.canonicalId !== 'string' || !ENVELOPE_ID_RE.test(entry.canonicalId) || seen.has(entry.canonicalId)) return null;
        seen.add(entry.canonicalId);
        if (typeof entry.revision !== 'number' || !Number.isSafeInteger(entry.revision) || entry.revision < 0) return null;
        if (typeof entry.originDigest !== 'string' || !SHA256_RE.test(entry.originDigest) || typeof entry.rowDigest !== 'string' || !SHA256_RE.test(entry.rowDigest)) return null;
    }
    if (typeof parsed.receiptDigest !== 'string' || !SHA256_RE.test(parsed.receiptDigest)) return null;
    const receipt = parsed as unknown as Receipt;
    return receiptDigestOf(receipt) === receipt.receiptDigest ? receipt : null;
}

export function isForeignReceipt(bytes: Buffer, config: LineageConfig): boolean {
    try {
        const probe: unknown = JSON.parse(bytes.toString('utf8'));
        return isPlainObject(probe) && typeof probe.namespace === 'string' && probe.namespace !== config.namespace;
    } catch { return false; }
}


function sameFile(left: Stats, right: Stats): boolean {
    return left.dev === right.dev && left.ino === right.ino && right.isFile() && !right.isSymbolicLink();
}
function assertIdentity(file: string, info: Stats): void {
    if (!sameFile(info, lstatSync(file))) throw new ExportFileStop('STOPPED', 'FILE_IDENTITY_CHANGED');
}
function noFollow(): number {
    if (typeof constants.O_NOFOLLOW !== 'number') throw new ExportFileStop('STOPPED', 'NOFOLLOW_UNSUPPORTED');
    return constants.O_NOFOLLOW;
}
/** File descriptor identity is checked before reading/syncing; no symlink is followed. */
export function readBoundedFile(file: string, maxBytes: number, durable = false, hooks?: ExportFileHooks): Buffer | null {
    let fd: number | undefined;
    try {
        const before = lstatSync(file);
        if (!before.isFile() || before.isSymbolicLink()) throw new ExportFileStop('STOPPED', 'FILE_NOT_REGULAR');
        if (before.size > maxBytes) return null;
        fd = openSync(file, constants.O_RDONLY | noFollow());
        const info = fstatSync(fd);
        if (!sameFile(before, info)) throw new ExportFileStop('STOPPED', 'FILE_IDENTITY_CHANGED');
        if (info.size > maxBytes) return null;
        if (durable) { hooks?.beforeFsync?.('file', file); fsyncSync(fd); }
        const buffer = Buffer.alloc(maxBytes + 1);
        let length = 0;
        while (length < buffer.length) {
            const count = readSync(fd, buffer, length, buffer.length - length, length);
            if (count === 0) break;
            length += count;
        }
        if (length > maxBytes) return null;
        const bytes = buffer.subarray(0, length);
        assertIdentity(file, info);
        return bytes;
    } catch (error) {
        if (error instanceof ExportFileStop) throw error;
        if (isErrno(error, 'ENOENT')) return null;
        if (durable) throw new ExportFileStop('STOPPED', 'FILE_DURABILITY_UNCONFIRMED');
        throw error;
    } finally { if (fd !== undefined) closeSync(fd); }
}
/** Unsupported or failed directory sync is a stop, never a downgraded durability claim. */
export function syncDirectory(directory: string, hooks?: ExportFileHooks): void {
    let fd: number | undefined;
    try {
        const before = lstatSync(directory);
        if (!before.isDirectory() || before.isSymbolicLink()) throw new Error('directory');
        fd = openSync(directory, constants.O_RDONLY | noFollow());
        const info = fstatSync(fd);
        if (!info.isDirectory() || before.dev !== info.dev || before.ino !== info.ino) throw new Error('identity');
        hooks?.beforeFsync?.('directory', directory);
        fsyncSync(fd);
        const after = lstatSync(directory);
        if (!after.isDirectory() || after.isSymbolicLink() || after.dev !== info.dev || after.ino !== info.ino) throw new Error('identity');
    } catch { throw new ExportFileStop('STOPPED', 'DIRECTORY_DURABILITY_UNCONFIRMED'); }
    finally { if (fd !== undefined) closeSync(fd); }
}
/** Unique exclusive file, inode checks and atomic no-clobber hard-link publication. */
export function writeDurableFile(file: string, bytes: Buffer, conflictReason: string, hooks?: ExportFileHooks): boolean {
    const existing = readBoundedFile(file, bytes.length, true, hooks);
    if (existing !== null) {
        if (!existing.equals(bytes)) throw new ExportFileStop('REFUSED', conflictReason);
        syncDirectory(path.dirname(file), hooks);
        return true;
    }
    // Oversized existing files also conflict; never replace them or a symlink.
    try { lstatSync(file); throw new ExportFileStop('REFUSED', conflictReason); }
    catch (error) { if (!isErrno(error, 'ENOENT')) throw error; }
    const temp = `${file}.tmp-${randomBytes(16).toString('hex')}`;
    let fd: number | undefined;
    let owned: Stats | undefined;
    try {
        fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow(), 0o600);
        owned = fstatSync(fd);
        if (!owned.isFile() || owned.nlink !== 1) throw new ExportFileStop('STOPPED', 'TEMP_IDENTITY_INVALID');
        hooks?.afterTempCreated?.(temp);
        assertIdentity(temp, owned);
        let offset = 0;
        while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset);
        hooks?.beforeFsync?.('file', temp);
        fsyncSync(fd);
        assertIdentity(temp, owned);
        // link fails on every existing destination, including a dangling symlink.
        try { linkSync(temp, file); }
        catch (error) { if (isErrno(error, 'EEXIST')) throw new ExportFileStop('REFUSED', conflictReason); throw error; }
        assertIdentity(file, owned);
        syncDirectory(path.dirname(file), hooks);
        return true;
    } finally {
        if (fd !== undefined) closeSync(fd);
        if (owned) {
            // A swapped path belongs to someone else; leave it untouched.
            try { if (sameFile(owned, lstatSync(temp))) unlinkSync(temp); }
            catch (error) { if (!isErrno(error, 'ENOENT')) throw error; }
        }
    }
}

/** Readback verification of an export file against a receipt: bytes, digest, identity and per-row digests. Returns null when valid. */
export function verifyExportFile(destination: string, receipt: Receipt, durable = false, hooks?: ExportFileHooks): string | null {
    const bytes = readBoundedFile(path.join(destination, receipt.exportFile), EXPORT_MAX_BYTES, durable, hooks);
    if (!bytes) return 'EXPORT_FILE_MISSING';
    if (bytes.length !== receipt.exportFileBytes || sha256(bytes) !== receipt.exportFileSha256) return 'EXPORT_FILE_DIGEST_MISMATCH';
    let parsed: unknown;
    try { parsed = JSON.parse(bytes.toString('utf8')); } catch { return 'EXPORT_FILE_INVALID'; }
    if (!isPlainObject(parsed) || !exactKeys(parsed, ['schema', 'namespace', 'tenantId', 'configRevision', 'batchId', 'entries'])) return 'EXPORT_FILE_INVALID';
    if (parsed.schema !== EXPORT_SCHEMA || parsed.namespace !== receipt.namespace || parsed.tenantId !== receipt.tenantId
        || parsed.configRevision !== receipt.configRevision || parsed.batchId !== receipt.batchId) return 'EXPORT_FILE_INVALID';
    if (!Array.isArray(parsed.entries) || parsed.entries.length !== receipt.entries.length) return 'EXPORT_FILE_INVALID';
    for (let index = 0; index < receipt.entries.length; index += 1) {
        const expected = receipt.entries[index];
        const entry = parsed.entries[index];
        if (!isPlainObject(entry) || !exactKeys(entry, ['id', 'canonicalId', 'revision', 'originDigest', 'rowDigest', 'row'])) return 'EXPORT_FILE_INVALID';
        if (entry.id !== archiveKey(receipt.tenantId, expected.canonicalId) || entry.canonicalId !== expected.canonicalId || entry.revision !== expected.revision
            || entry.originDigest !== expected.originDigest || entry.rowDigest !== expected.rowDigest) return 'EXPORT_FILE_MISMATCH';
        if (sha256(JSON.stringify(entry.row)) !== expected.rowDigest) return 'EXPORT_FILE_MISMATCH';
        const archived = validateArchiveRecord(entry.row, { tenantId: receipt.tenantId, canonicalId: expected.canonicalId });
        if (!archived || archived.originDigest !== expected.originDigest) return 'EXPORT_FILE_MISMATCH';
    }
    return null;
}


export type ConfirmedRelease = { outcome: 'RELEASED' | 'ALREADY_RELEASED' | 'SUPERSEDED'; reason: string };
const PROGRESS_SCHEMA = 'cvf.webLineageExportProgress.v1';
function progressFile(destination: string, receipt: Receipt, index: number): string {
    return path.join(destination, `${receiptFileName(receipt.tenantId, receipt.batchId)}.progress-${index}.json`);
}
/** Immutable per-entry confirmation: no mutable counter, no receipt-format migration, at most ten markers per receipt. */
export function readReleaseProgress(destination: string, receipt: Receipt, index: number): ConfirmedRelease | null {
    const bytes = readBoundedFile(progressFile(destination, receipt, index), 2048);
    if (!bytes) {
        try { lstatSync(progressFile(destination, receipt, index)); }
        catch (error) { if (isErrno(error, 'ENOENT')) return null; throw error; }
        throw new ExportFileStop('STOPPED', 'PROGRESS_INVALID');
    }
    let value: unknown;
    try { value = JSON.parse(bytes.toString('utf8')); } catch { throw new ExportFileStop('STOPPED', 'PROGRESS_INVALID'); }
    if (!isPlainObject(value) || !exactKeys(value, ['schema', 'receiptDigest', 'entry', 'outcome', 'reason'])
        || value.schema !== PROGRESS_SCHEMA || value.receiptDigest !== receipt.receiptDigest
        || JSON.stringify(value.entry) !== JSON.stringify(receipt.entries[index])
        || !['RELEASED', 'ALREADY_RELEASED', 'SUPERSEDED'].includes(String(value.outcome))
        || (value.outcome === 'RELEASED' && value.reason !== 'RELEASED')
        || (value.outcome === 'ALREADY_RELEASED' && value.reason !== 'ARCHIVE_ROW_ABSENT')
        || (value.outcome === 'SUPERSEDED' && value.reason !== 'ARCHIVE_ROW_DIFFERS_FROM_RECEIPT')) {
        throw new ExportFileStop('STOPPED', 'PROGRESS_INVALID');
    }
    return { outcome: value.outcome as ConfirmedRelease['outcome'], reason: value.reason as string };
}
export function writeReleaseProgress(destination: string, receipt: Receipt, index: number, step: ConfirmedRelease, hooks?: ExportFileHooks): void {
    const bytes = Buffer.from(JSON.stringify({ schema: PROGRESS_SCHEMA, receiptDigest: receipt.receiptDigest,
        entry: receipt.entries[index], outcome: step.outcome, reason: step.reason }) + '\n');
    try { writeDurableFile(progressFile(destination, receipt, index), bytes, 'PROGRESS_CONFLICT', hooks); }
    catch { throw new ExportFileStop('STOPPED', 'PROGRESS_DURABILITY_UNCONFIRMED', true); }
}
