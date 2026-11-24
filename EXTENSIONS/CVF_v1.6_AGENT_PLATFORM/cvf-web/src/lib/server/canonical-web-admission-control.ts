import { createHash } from 'node:crypto';
import type { LineageIdentity, SafeLineageView } from './canonical-web-lineage';
import { blocksNewAdmission, HELD_RELEASE_CONTROL_BYTES, releaseHeldExecution, releasableAt, validHeldRelease, type HeldRelease } from './canonical-web-held-release';
export { blocksNewAdmission };

export type ExecutionProjection = {
    canonicalId: string; contractRevision: string; sourceRevision: string; state: 'OPEN' | 'FINALIZED'; active: boolean;
    recordingStatus: 'CONFIRMED' | 'UNCONFIRMED'; providerContact: 'POSSIBLE_OR_OBSERVED' | 'NOT_OBSERVED';
    continuationHold: boolean; pendingOrdinals: number; terminalDisposition: string | null; gaps: string[]; updatedAt: string;
};
export type AdmissionControl = { ownerKey: string; state: 'OPEN' | 'STOPPED'; revision: number; updatedAt: string | null; execution: ExecutionProjection | null; heldRelease?: HeldRelease };
export const OWNER_LIMIT = 32;
const token = /^[A-Za-z0-9._:+/-]{1,120}$/;
const iso = (x: unknown) => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) && !Number.isNaN(Date.parse(x));
const exact = (x: Record<string, unknown>, keys: string[]) => Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
export function ownerKey(identity: LineageIdentity): string {
    const o = identity.owner;
    return createHash('sha256').update(JSON.stringify(o.kind === 'session' ? ['session', o.orgId, o.teamId, o.userId] : ['service', identity.tenantId, o.principalId])).digest('hex');
}
export function initialControl(identity: LineageIdentity): AdmissionControl {
    return { ownerKey: ownerKey(identity), state: 'OPEN', revision: 0, updatedAt: null, execution: null };
}
export function validControls(value: unknown): value is AdmissionControl[] {
    if (!Array.isArray(value) || value.length > OWNER_LIMIT) return false;
    const seen = new Set<string>();
    return value.every(c => {
        if (!object(c) || !(exact(c, ['ownerKey','state','revision','updatedAt','execution']) || (exact(c, ['ownerKey','state','revision','updatedAt','execution','heldRelease']) && validHeldRelease(c.heldRelease))) || typeof c.ownerKey !== 'string' || !/^[a-f0-9]{64}$/.test(c.ownerKey) || seen.has(c.ownerKey)) return false;
        seen.add(c.ownerKey);
        if (!['OPEN','STOPPED'].includes(String(c.state)) || !Number.isSafeInteger(c.revision) || (c.revision as number) < 0 || !((c.revision === 0 && c.state === 'OPEN' && c.updatedAt === null) || ((c.revision as number) > 0 && iso(c.updatedAt))) || Buffer.byteLength(JSON.stringify(c)) > 1440 + (c.heldRelease ? HELD_RELEASE_CONTROL_BYTES : 0)) return false;
        if (c.execution === null) return true;
        const e = c.execution;
        return object(e) && exact(e, ['canonicalId','contractRevision','sourceRevision','state','active','recordingStatus','providerContact','continuationHold','pendingOrdinals','terminalDisposition','gaps','updatedAt']) &&
            ['canonicalId','contractRevision','sourceRevision'].every(k => typeof e[k] === 'string' && token.test(e[k] as string)) &&
            ['OPEN','FINALIZED'].includes(String(e.state)) && typeof e.active === 'boolean' && ['CONFIRMED','UNCONFIRMED'].includes(String(e.recordingStatus)) &&
            ['POSSIBLE_OR_OBSERVED','NOT_OBSERVED'].includes(String(e.providerContact)) && typeof e.continuationHold === 'boolean' && Number.isSafeInteger(e.pendingOrdinals) && (e.pendingOrdinals as number) >= 0 && (e.pendingOrdinals as number) <= 3 &&
            (e.terminalDisposition === null || ['COMPLETED','VALIDATION_FAILED','DENIED','CANCELLED','EXHAUSTED','FAILED'].includes(String(e.terminalDisposition))) && (e.state === 'OPEN' ? e.terminalDisposition === null && e.active === true : e.terminalDisposition !== null) && (e.active === true || (e.state === 'FINALIZED' && e.continuationHold === false && e.pendingOrdinals === 0 && e.recordingStatus === 'CONFIRMED')) && Array.isArray(e.gaps) && e.gaps.length <= 8 && e.gaps.every(g => typeof g === 'string' && token.test(g)) && iso(e.updatedAt);
    });
}
export function projectExecution(view: SafeLineageView): ExecutionProjection {
    const pending = view.history.filter(e => e.state === 'PORT_PENDING').length;
    const uncertain = view.continuationHold || view.history.some(e => e.observation?.attemptOutcome === 'unknown' || e.observation?.attemptOutcome === 'callback_error');
    return { canonicalId: view.canonicalId, contractRevision: view.contractRevision, sourceRevision: view.sourceRevision, state: view.state,
        active: view.state !== 'FINALIZED' || pending > 0 || uncertain, recordingStatus: uncertain || view.recordingStatus !== 'CONFIRMED' ? 'UNCONFIRMED' : 'CONFIRMED',
        providerContact: view.providerContact === 'NONE_RECORDED' ? 'NOT_OBSERVED' : 'POSSIBLE_OR_OBSERVED', continuationHold: uncertain,
        pendingOrdinals: pending, terminalDisposition: view.terminal?.disposition ?? null, gaps: view.terminal?.gaps ?? [], updatedAt: view.updatedAt };
}
export function withExecution(controls: AdmissionControl[], identity: LineageIdentity, view: SafeLineageView, mode: 'matching' | 'replace' = 'matching'): AdmissionControl[] {
    const key = ownerKey(identity);
    const next = controls.map(c => c.ownerKey === key && (mode === 'replace' || c.execution?.canonicalId === view.canonicalId) ? { ...c, execution: projectExecution(view) } : c);
    if (!validControls(next)) throw new Error('CONTROL_PROJECTION_INVALID');
    return next;
}

import { _testOnlyGetStoreHooks, archiveKey, checkMetadata, guarded, metadataKey, ownersEqual, requestKey, toSafeLineageView, validateArchiveRecord, validateRequestRecord, validIdentity, type LineageConfig, type LineageResult } from './canonical-web-lineage';
let statusSnapshotHook: (() => void) | undefined;
/** Tests only: mutate through a separate store between the lookup and authoritative read. */
export function _testOnlySetStatusSnapshotHook(hook: (() => void) | undefined): void { statusSnapshotHook = hook; }
export type ControlAction = { action: 'status' | 'stop' } | { action: 'resume'; expectedRevision: number } | { action: 'release_held'; expectedRevision: number; canonicalId: string };
type ControlSnapshot = {
    scope: 'verified_owner_canonical_web'; state: 'OPEN' | 'STOPPED'; revision: number; updatedAt: string | null; observedAt: string;
    ownerCapacity: { used: number; limit: number }; execution: ExecutionProjection | null; heldRelease?: HeldRelease; releasableAt?: string;
};
export function controlOperation(config: LineageConfig, identity: LineageIdentity, action: ControlAction): LineageResult<ControlSnapshot> {
    if (!validIdentity(config, identity)) return { ok: false, code: 'UNQUALIFIED', reason: 'INVALID_IDENTITY' };
    if (action.action === 'release_held') {
        const result = releaseHeldExecution(config, identity, action.canonicalId, action.expectedRevision);
        if (!result.ok) return result;
        const c = result.value.control;
        return { ok: true, code: 'OK', value: { scope: 'verified_owner_canonical_web', state: c.state, revision: c.revision, updatedAt: c.updatedAt, observedAt: new Date().toISOString(), ownerCapacity: { used: result.value.ownerCount, limit: OWNER_LIMIT }, execution: c.execution, heldRelease: c.heldRelease } };
    }
    return guarded(config, identity.tenantId, (store, tenant) => {
        const key = metadataKey(identity.tenantId);
        const apply = (entry: ReturnType<typeof store.readKeys>[number]) => {
            const checked = checkMetadata(config, tenant, entry);
            if (!checked.ok) return { writes: [], result: checked.failure };
            const meta = checked.meta;
            if (meta.admissionControls === undefined && meta.activeUsed > 0) return { writes: [], result: { ok: false as const, code: 'NOT_READY' as const, reason: 'CONTROL_MIGRATION_REQUIRED' } };
            const controls = meta.admissionControls ?? [];
            let item = controls.find(c => c.ownerKey === ownerKey(identity));
            const existing = !!item;
            item ??= initialControl(identity);
            if (action.action !== 'status' && !existing && controls.length >= OWNER_LIMIT) return { writes: [], result: { ok: false as const, code: 'CAPACITY' as const, reason: 'ADMISSION_CAPACITY' } };
            if (action.action === 'resume' && action.expectedRevision !== item.revision) return { writes: [], result: { ok: false as const, code: 'CONFLICT' as const, reason: 'ADMISSION_CONFLICT' } };
            const changes = action.action === 'stop' ? item.state !== 'STOPPED' : action.action === 'resume' ? item.state !== 'OPEN' : false;
            if (changes && item.revision === Number.MAX_SAFE_INTEGER) return { writes: [], result: { ok: false as const, code: 'UNAVAILABLE' as const, reason: 'CONTROL_REVISION_EXHAUSTED' } };
            if (changes) item = { ...item, state: action.action === 'stop' ? 'STOPPED' : 'OPEN', revision: item.revision + 1, updatedAt: new Date().toISOString() };
            const next = existing ? controls.map(c => c.ownerKey === item!.ownerKey ? item! : c) : [...controls, item];
            const writes = action.action === 'status' || (existing && !changes) ? [] : [{ id: entry.id, expectedRevision: checked.revision, value: { ...meta, admissionControls: next } }];
            const response = { scope: 'verified_owner_canonical_web' as const, state: item.state, revision: item.revision, updatedAt: item.updatedAt, observedAt: new Date().toISOString(), ownerCapacity: { used: action.action === 'status' ? controls.length : next.length, limit: OWNER_LIMIT }, execution: item.execution, ...(item.heldRelease ? { heldRelease: item.heldRelease } : {}), ...(releasableAt(item) ? { releasableAt: releasableAt(item) } : {}) };
            return { writes, result: { ok: true as const, code: 'OK' as const, value: response } };
        };
        if (action.action === 'status') {
            const preliminary = apply(store.readKeys([key])[0]).result;
            if (!preliminary.ok) return preliminary;
            const id = preliminary.value.execution?.canonicalId;
            statusSnapshotHook?.();
            const entries = id ? store.readKeys([key, requestKey(identity.tenantId, id), archiveKey(identity.tenantId, id)]) : store.readKeys([key]);
            const current = apply(entries[0]).result;
            if (!current.ok) return current;
            if (current.value.execution?.canonicalId !== id) return { ok: false, code: 'BUSY', reason: 'STATUS_POINTER_CHANGED' };
            if (!id || !current.value.execution) return current;
            const [, active, archive] = entries;
            const unavailable = (): LineageResult<ControlSnapshot> => ({ ok: false, code: 'UNAVAILABLE', reason: 'STATUS_RECORD_UNAVAILABLE' });
            if (active.state === 'UNAVAILABLE' || archive.state === 'UNAVAILABLE' || (active.state === 'PRESENT' && archive.state === 'PRESENT')) return unavailable();
            if (active.state === 'ABSENT' && archive.state === 'ABSENT') {
                const e = current.value.execution;
                return { ...current, value: { ...current.value, execution: { ...e, gaps: [...e.gaps, 'LINEAGE_UNAVAILABLE'],
                    ...(e.active ? { recordingStatus: 'UNCONFIRMED' as const, continuationHold: true } : {}) } } };
            }
            const expected = { tenantId: identity.tenantId, canonicalId: id };
            const record = active.state === 'PRESENT' ? validateRequestRecord(active.value, expected) :
                archive.state === 'PRESENT' ? validateArchiveRecord(archive.value, expected)?.record : null;
            if (!record || !ownersEqual(record.owner, identity.owner) || record.configRevision !== config.revision ||
                JSON.stringify(projectExecution(toSafeLineageView(record))) !== JSON.stringify(current.value.execution)) return unavailable();
            return current;
        }
        return store.transactionKeys<LineageResult<ControlSnapshot>>([key], ([entry]) => apply(entry), _testOnlyGetStoreHooks());
    });
}
