/**
 * Web attempt lineage maintenance: retire-released (W6). Offline, operator-run, one bounded pass; reachable only from the
 * maintenance command (scripts/canonical-web-lineage-maintenance.ts) and tests, never from the execute route.
 *
 * Why it exists: an owner who released a held execution (canonical-web-held-release.ts) leaves a request record carrying
 * `ownerRelease` that archive can never move (it is PORT_PENDING or uncertain, not FINALIZED), and the owner control keeps its
 * `heldRelease` count forever. After three releases the owner is locked out, and every released record keeps one tenant active slot.
 *
 * Pass 1 (retire): a request record that carries `ownerRelease` released at least LINEAGE_ARCHIVE_MIN_AGE_MS ago is moved, as is,
 * from the active to the archive key space in one keyed transaction on [metadata, request, archive] (same shape as archiveOne): the
 * archive row is the record verbatim (existing builder and digest), the active row is CAS-deleted, the counters move active to
 * archive, and an owner execution pointer that targets this record is cleared in the same write. Evidence is never deleted. A record
 * without `ownerRelease` is never touched, whatever its state (held, pending or unknown records stay exactly as they are).
 * Pass 2 (count reset): an owner control that has `heldRelease` loses it, by CAS on the metadata row, only when no active request
 * row of that owner still carries `ownerRelease` and the control has no active execution. It is never reset otherwise.
 *
 * KNOWN LIMIT: an archived OPEN released record is not finalized, so the existing export rule (finalized >= 7 d) never exports or
 * deletes it; it keeps one archive slot. A full archive allocation therefore stops retiring (ARCHIVE_FULL) and nothing is written.
 *
 * Without `apply` the operation is a dry run: it reads one snapshot, writes nothing and reports what an apply would do.
 * Reports carry reason tokens, canonical ids, a short owner digest prefix and counts. Never prompt text or secrets.
 */
import type { AtomicSQLiteKeyedEntry, AtomicSQLiteKeyedWrite, SQLiteKeyedAtomicRecordStore } from '../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    LINEAGE_ARCHIVE_MIN_AGE_MS,
    LINEAGE_REQUEST_ROW_MAX_BYTES,
    archiveKey,
    buildArchiveRecord,
    createLineageStore,
    metadataAfterArchive,
    metadataKey,
    parseLineageKey,
    requestKey,
    validateArchiveRecord,
    validateRequestRecord,
    type LineageConfig,
    type LineageMetadata,
    type LineageRequestRecord,
    type LineageTenantConfig,
} from './canonical-web-lineage';
import { ownerKey, validControls, type AdmissionControl } from './canonical-web-admission-control';
import {
    applyStop,
    archiveExportPlatformCapability,
    baseReport,
    batchLimit,
    maintenanceStoreHooks,
    metadataGate,
    platformRefusal,
    readTenantSnapshot,
    resolveNow,
    selectTenants,
    toStop,
    withSnapshot,
    type MaintenanceReportBase,
    type TenantSnapshot,
} from './canonical-web-lineage-maintenance';

export type RetireReleasedOptions = { now?: number; tenantId?: string; maxEnvelopes?: number; apply?: boolean };
export type RetireOutcome = { tenantId: string; canonicalId: string; outcome: 'RETIRED' | 'WOULD_RETIRE' | 'SKIPPED'; reason: string };
export type CountResetOutcome = { tenantId: string; owner: string; outcome: 'RESET' | 'WOULD_RESET' | 'NOT_RESET'; reason: string };
export type RetireTenantStatus = { tenantId: string; status: 'OK' | 'HELD' | 'ARCHIVE_FULL' | 'STOPPED'; reason: string | null };
export type RetireReleasedReport = MaintenanceReportBase & {
    dryRun: boolean;
    now: string | null;
    /** Active rows looked at across the examined tenants. */
    examined: number;
    retired: number;
    wouldRetire: number;
    /** Released-record candidates that were not retired (see skippedReasons). */
    skipped: number;
    /** Active rows without `ownerRelease`: never touched. */
    untouched: number;
    countsReset: number;
    wouldReset: number;
    skippedReasons: Record<string, number>;
    outcomes: RetireOutcome[];
    resets: CountResetOutcome[];
    tenants: RetireTenantStatus[];
};

type Context = { config: LineageConfig; store: SQLiteKeyedAtomicRecordStore | null; nowMs: number; report: RetireReleasedReport; budget: { remaining: number } };
type Candidate = { canonicalId: string; revision: number; releasedAt: string };

function stamp(nowMs: number, previous: string | null): string {
    return new Date(Math.max(nowMs, previous === null ? 0 : Date.parse(previous))).toISOString();
}

type ReleasedVerdict = { canonicalId: string; reason: string; record: LineageRequestRecord | null };
/** Why an active row is or is not a retire candidate. Only a valid record that carries `ownerRelease` can be a candidate. */
function classifyReleased(entry: AtomicSQLiteKeyedEntry, tenantId: string, config: LineageConfig, nowMs: number): ReleasedVerdict {
    const key = parseLineageKey(entry.id);
    const canonicalId = key && key.kind === 'request' && key.tenantId === tenantId && key.envelopeId ? key.envelopeId : entry.id;
    if (entry.state !== 'PRESENT' || !key || key.kind !== 'request' || key.tenantId !== tenantId || !key.envelopeId) return { canonicalId, reason: 'RECORD_UNAVAILABLE', record: null };
    const record = validateRequestRecord(entry.value, { tenantId, canonicalId: key.envelopeId });
    if (!record) return { canonicalId, reason: 'RECORD_UNAVAILABLE', record: null };
    if (!record.ownerRelease) return { canonicalId, reason: 'NOT_RELEASED', record };
    if (record.configRevision !== config.revision) return { canonicalId, reason: 'CONFIG_DRIFT', record };
    // Fail closed: an unparseable release time (NaN age) is treated as too young, never as old enough.
    if (!(nowMs - Date.parse(record.ownerRelease.releasedAt) >= LINEAGE_ARCHIVE_MIN_AGE_MS)) return { canonicalId, reason: 'TOO_YOUNG', record };
    return { canonicalId, reason: 'CANDIDATE', record };
}

/** Clears the owner execution pointer that targets the retired record (if any); never touches `heldRelease`. */
function clearPointer(meta: LineageMetadata, tenantId: string, record: LineageRequestRecord, nowMs: number): { ok: true; meta: LineageMetadata } | { ok: false; reason: string } {
    const controls = meta.admissionControls;
    if (!controls) return { ok: true, meta };
    const key = ownerKey({ tenantId, owner: record.owner });
    const target = controls.find(control => control.ownerKey === key && control.execution?.canonicalId === record.canonicalId);
    if (!target) return { ok: true, meta };
    if (target.revision === Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'CONTROL_REVISION_EXHAUSTED' };
    const next = controls.map(control => control === target ? { ...control, revision: control.revision + 1, updatedAt: stamp(nowMs, control.updatedAt), execution: null } : control);
    if (!validControls(next)) return { ok: false, reason: 'CONTROL_PROJECTION_INVALID' };
    return { ok: true, meta: { ...meta, admissionControls: next } };
}

type RetireStep = { retired: boolean; reason: string; archiveFull: boolean };
/**
 * One released record, one keyed transaction on [m, r, a]: create the archive row (the record verbatim), CAS-delete the active row,
 * move both counters and clear the owner execution pointer if it targets this record. Everything is re-read and re-checked inside the
 * transaction; a row whose revision differs from the snapshot is left alone (CHANGED_SINCE_SNAPSHOT).
 */
function retireOne(store: SQLiteKeyedAtomicRecordStore, config: LineageConfig, tenant: LineageTenantConfig, candidate: Candidate, nowMs: number): RetireStep {
    const hooks = maintenanceStoreHooks('retire', requestKey(tenant.tenantId, candidate.canonicalId));
    return store.transactionKeys(
        [metadataKey(tenant.tenantId), requestKey(tenant.tenantId, candidate.canonicalId), archiveKey(tenant.tenantId, candidate.canonicalId)],
        ([metaEntry, requestEntry, archiveEntry]) => {
            const none = (reason: string, archiveFull = false) => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: { retired: false, reason, archiveFull } as RetireStep });
            const gate = metadataGate(config, tenant, metaEntry);
            if (!gate.ok) return none(gate.reason);
            if (requestEntry.state === 'ABSENT') return none('ALREADY_GONE');
            if (requestEntry.state !== 'PRESENT') return none('RECORD_UNAVAILABLE');
            if (requestEntry.revision !== candidate.revision) return none('CHANGED_SINCE_SNAPSHOT');
            const verdict = classifyReleased(requestEntry, tenant.tenantId, config, nowMs);
            if (verdict.reason !== 'CANDIDATE' || !verdict.record) return none(verdict.reason);
            if (archiveEntry.state !== 'ABSENT') return none('ARCHIVE_KEY_EXISTS');
            const counted = metadataAfterArchive(gate.meta);
            if (!counted) return gate.meta.activeUsed < 1 ? none('ACTIVE_COUNTER_ZERO') : none('ARCHIVE_FULL', true);
            const archived = buildArchiveRecord(verdict.record, requestEntry.revision, new Date(nowMs).toISOString());
            if (!validateArchiveRecord(archived, { tenantId: tenant.tenantId, canonicalId: candidate.canonicalId })) return none('ARCHIVE_ROW_INVALID');
            if (Buffer.byteLength(JSON.stringify(archived), 'utf8') > LINEAGE_REQUEST_ROW_MAX_BYTES) return none('ARCHIVE_ROW_TOO_LARGE');
            const cleared = clearPointer(counted, tenant.tenantId, verdict.record, nowMs);
            if (!cleared.ok) return none(cleared.reason);
            return {
                writes: [
                    { id: metaEntry.id, expectedRevision: gate.revision, value: cleared.meta },
                    { id: archiveEntry.id, expectedRevision: null, value: archived },
                    { id: requestEntry.id, expectedRevision: requestEntry.revision, delete: true },
                ] as AtomicSQLiteKeyedWrite[],
                result: { retired: true, reason: 'RETIRED', archiveFull: false } as RetireStep,
            };
        },
        hooks,
    );
}

function skip(context: Context, tenantId: string, canonicalId: string, reason: string): void {
    context.report.skipped += 1;
    context.report.skippedReasons[reason] = (context.report.skippedReasons[reason] ?? 0) + 1;
    context.report.outcomes.push({ tenantId, canonicalId, outcome: 'SKIPPED', reason });
}

/** Pass 1 for one tenant. Returns the ids retired (or, in a dry run, the ids an apply would retire). */
function retireTenant(context: Context, tenant: LineageTenantConfig, snapshot: TenantSnapshot, meta: LineageMetadata, status: RetireTenantStatus): Set<string> {
    const { report, config, nowMs } = context;
    const done = new Set<string>();
    const candidates: Candidate[] = [];
    for (const entry of snapshot.active) {
        report.examined += 1;
        const verdict = classifyReleased(entry, tenant.tenantId, config, nowMs);
        if (verdict.reason === 'NOT_RELEASED') { report.untouched += 1; continue; }
        if (verdict.reason === 'CANDIDATE' && entry.state === 'PRESENT' && verdict.record?.ownerRelease) {
            candidates.push({ canonicalId: verdict.canonicalId, revision: entry.revision, releasedAt: verdict.record.ownerRelease.releasedAt });
        } else {
            skip(context, tenant.tenantId, verdict.canonicalId, verdict.reason);
        }
    }
    candidates.sort((left, right) => (left.releasedAt + left.canonicalId).localeCompare(right.releasedAt + right.canonicalId));
    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        if (context.budget.remaining <= 0) { skip(context, tenant.tenantId, candidate.canonicalId, 'BATCH_LIMIT'); continue; }
        context.budget.remaining -= 1;
        let step: RetireStep;
        if (context.store) {
            try {
                step = retireOne(context.store, config, tenant, candidate, nowMs);
            } catch (error) {
                const stop = toStop(error);
                if (!stop) throw error;
                status.status = 'STOPPED';
                status.reason = stop.reason;
                throw stop;
            }
        } else {
            const full = meta.archiveUsed + done.size + 1 > tenant.archiveSlots;
            step = full ? { retired: false, reason: 'ARCHIVE_FULL', archiveFull: true } : { retired: true, reason: 'WOULD_RETIRE', archiveFull: false };
        }
        if (step.retired) {
            done.add(candidate.canonicalId);
            if (context.store) report.retired += 1; else report.wouldRetire += 1;
            report.outcomes.push({ tenantId: tenant.tenantId, canonicalId: candidate.canonicalId, outcome: context.store ? 'RETIRED' : 'WOULD_RETIRE', reason: step.reason });
        } else {
            skip(context, tenant.tenantId, candidate.canonicalId, step.reason);
        }
        if (step.archiveFull) {
            status.status = 'ARCHIVE_FULL';
            status.reason = 'ARCHIVE_FULL';
            for (const rest of candidates.slice(index + 1)) skip(context, tenant.tenantId, rest.canonicalId, 'ARCHIVE_FULL');
            break;
        }
    }
    return done;
}

type ResetDecision = { control: AdmissionControl; reason: string | null };
/**
 * Which owner controls may lose `heldRelease`: none while an active row of that owner still carries `ownerRelease` or the control
 * has an active execution. An active row that cannot be read could belong to any owner, so it blocks every reset of the tenant.
 * `assumeRetired` lets a dry run judge the state an apply would leave behind.
 */
function resetDecisions(tenant: LineageTenantConfig, snapshot: TenantSnapshot, meta: LineageMetadata, assumeRetired: Set<string>): ResetDecision[] {
    const released = new Set<string>();
    let unreadable = snapshot.activeOverflow;
    for (const entry of snapshot.active) {
        const key = parseLineageKey(entry.id);
        const record = entry.state === 'PRESENT' && key && key.kind === 'request' && key.envelopeId ? validateRequestRecord(entry.value, { tenantId: tenant.tenantId, canonicalId: key.envelopeId }) : null;
        if (!record) { unreadable = true; continue; }
        if (record.ownerRelease && !assumeRetired.has(record.canonicalId)) released.add(ownerKey({ tenantId: tenant.tenantId, owner: record.owner }));
    }
    return (meta.admissionControls ?? []).filter(control => control.heldRelease !== undefined).map(control => {
        const execution = control.execution;
        const executionActive = !!execution && execution.active && !assumeRetired.has(execution.canonicalId);
        const reason = unreadable ? 'ACTIVE_ROW_UNAVAILABLE' : released.has(control.ownerKey) ? 'RELEASED_RECORD_REMAINS' : executionActive ? 'EXECUTION_ACTIVE' : null;
        return { control, reason };
    });
}

type ResetStep = { reset: boolean; reason: string };
/** CAS on the metadata row: the control must still equal the snapshot value (a new release or execution changes it). */
function resetOne(store: SQLiteKeyedAtomicRecordStore, config: LineageConfig, tenant: LineageTenantConfig, snapshotControl: AdmissionControl, nowMs: number): ResetStep {
    const hooks = maintenanceStoreHooks('reset', metadataKey(tenant.tenantId));
    return store.transactionKeys(
        [metadataKey(tenant.tenantId)],
        ([metaEntry]) => {
            const none = (reason: string) => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: { reset: false, reason } as ResetStep });
            const gate = metadataGate(config, tenant, metaEntry);
            if (!gate.ok) return none(gate.reason);
            const controls = gate.meta.admissionControls ?? [];
            const current = controls.find(control => control.ownerKey === snapshotControl.ownerKey);
            if (!current) return none('CONTROL_GONE');
            if (JSON.stringify(current) !== JSON.stringify(snapshotControl)) return none('CHANGED_SINCE_SNAPSHOT');
            if (current.revision === Number.MAX_SAFE_INTEGER) return none('CONTROL_REVISION_EXHAUSTED');
            const next = controls.map(control => control === current
                ? { ownerKey: current.ownerKey, state: current.state, revision: current.revision + 1, updatedAt: stamp(nowMs, current.updatedAt), execution: current.execution }
                : control);
            if (!validControls(next)) return none('CONTROL_PROJECTION_INVALID');
            return {
                writes: [{ id: metaEntry.id, expectedRevision: gate.revision, value: { ...gate.meta, admissionControls: next } }] as AtomicSQLiteKeyedWrite[],
                result: { reset: true, reason: 'RESET' } as ResetStep,
            };
        },
        hooks,
    );
}

/** Pass 2 for one tenant: a fresh snapshot (apply) or the pass 1 snapshot with the planned retirements assumed (dry run). */
function resetTenant(context: Context, tenant: LineageTenantConfig, firstSnapshot: TenantSnapshot, firstMeta: LineageMetadata, retired: Set<string>, status: RetireTenantStatus): void {
    const { config, report, store, nowMs } = context;
    let snapshot = firstSnapshot;
    let meta = firstMeta;
    if (store) {
        snapshot = withSnapshot(config, reader => readTenantSnapshot(reader, tenant));
        const gate = metadataGate(config, tenant, snapshot.metadata);
        if (!gate.ok) { status.status = 'HELD'; status.reason = gate.reason; return; }
        meta = gate.meta;
    }
    for (const decision of resetDecisions(tenant, snapshot, meta, store ? new Set<string>() : retired)) {
        const owner = decision.control.ownerKey.slice(0, 12);
        if (decision.reason !== null) { report.resets.push({ tenantId: tenant.tenantId, owner, outcome: 'NOT_RESET', reason: decision.reason }); continue; }
        if (!store) {
            report.wouldReset += 1;
            report.resets.push({ tenantId: tenant.tenantId, owner, outcome: 'WOULD_RESET', reason: 'WOULD_RESET' });
            continue;
        }
        let step: ResetStep;
        try {
            step = resetOne(store, config, tenant, decision.control, nowMs);
        } catch (error) {
            const stop = toStop(error);
            if (!stop) throw error;
            status.status = 'STOPPED';
            status.reason = stop.reason;
            throw stop;
        }
        if (step.reset) report.countsReset += 1;
        report.resets.push({ tenantId: tenant.tenantId, owner, outcome: step.reset ? 'RESET' : 'NOT_RESET', reason: step.reason });
    }
}

/**
 * Operator maintenance: retires released request records into the archive key space and resets the release count of owners that
 * no longer hold a released or active record. At most MAINTENANCE_MAX_BATCH records per run, one keyed transaction each. Without
 * `apply` nothing is written. Same platform gate as archive and export (PLATFORM_UNSUPPORTED before any journal access).
 */
export function retireReleasedLineage(config: LineageConfig, options: RetireReleasedOptions = {}): RetireReleasedReport {
    const report: RetireReleasedReport = {
        ...baseReport('retire-released'), dryRun: options.apply !== true, now: null, examined: 0, retired: 0, wouldRetire: 0, skipped: 0, untouched: 0,
        countsReset: 0, wouldReset: 0, skippedReasons: {}, outcomes: [], resets: [], tenants: [],
    };
    if (!archiveExportPlatformCapability().supported) return platformRefusal(report);
    try {
        const nowMs = resolveNow(options.now);
        report.now = new Date(nowMs).toISOString();
        const budget = { remaining: batchLimit(options.maxEnvelopes) };
        const tenants = selectTenants(config, options.tenantId);
        const context: Context = { config, store: options.apply === true ? createLineageStore(config) : null, nowMs, report, budget };
        const discovered = withSnapshot(config, reader => tenants.map(tenant => ({ tenant, snapshot: readTenantSnapshot(reader, tenant) })));
        for (const { tenant, snapshot } of discovered) {
            const status: RetireTenantStatus = { tenantId: tenant.tenantId, status: 'OK', reason: null };
            report.tenants.push(status);
            const gate = metadataGate(config, tenant, snapshot.metadata);
            if (!gate.ok) { status.status = 'HELD'; status.reason = gate.reason; continue; }
            const retired = retireTenant(context, tenant, snapshot, gate.meta, status);
            resetTenant(context, tenant, snapshot, gate.meta, retired, status);
        }
    } catch (error) { applyStop(report, error); }
    return report;
}
