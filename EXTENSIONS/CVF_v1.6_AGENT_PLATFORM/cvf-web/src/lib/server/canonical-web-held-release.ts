import { createHash } from 'node:crypto';
import { _testOnlyGetStoreHooks, checkMetadata, guarded, metadataKey, ownersEqual, requestKey, toSafeLineageView, validateRequestRecord, validIdentity,
    type LineageConfig, type LineageFailure, type LineageIdentity, type LineageRef, type LineageResult, type SafeLineageView } from './canonical-web-lineage';
import { ownerKey, projectExecution, validControls, withExecution, type AdmissionControl } from './canonical-web-admission-control';

export const HELD_RELEASE_MIN_AGE_MS = 300000;
export const EXECUTION_ADMISSION_MAX_AGE_MS = 240000;
export type OwnerRelease = { releasedAt: string; controlRevision: number };
export type HeldRelease = { count: number; idDigest: string; releasedAt: string };
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const iso = (x: unknown) => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x));
export const digest16 = (id: string): string => createHash('sha256').update(id).digest('hex').slice(0, 16);
export function validOwnerRelease(x: unknown): x is OwnerRelease {
    return object(x) && Object.keys(x).length === 2 && iso(x.releasedAt) && Number.isSafeInteger(x.controlRevision) && (x.controlRevision as number) > 0;
}
export function validHeldRelease(x: unknown): x is HeldRelease {
    return object(x) && Object.keys(x).length === 3 && iso(x.releasedAt) && Number.isSafeInteger(x.count) && (x.count as number) >= 1 && (x.count as number) <= 3 && typeof x.idDigest === 'string' && /^[a-f0-9]{16}$/.test(x.idDigest);
}
export const HELD_RELEASE_CONTROL_BYTES = Buffer.byteLength(JSON.stringify({ heldRelease: { count: 3, idDigest: 'f'.repeat(16), releasedAt: '2000-01-01T00:00:00.000Z' } })) - 1;
export function blocksNewAdmission(control: AdmissionControl, canonicalId: string): boolean {
    const e = control.execution;
    return !!(e?.active && e.canonicalId !== canonicalId && control.heldRelease?.idDigest !== digest16(e.canonicalId));
}
const refused = (reason: string): LineageFailure => ({ ok: false, code: 'CONFLICT', reason });
export function releasableAt(control: AdmissionControl): string | undefined {
    const e = control.execution;
    if (!e?.active || control.heldRelease?.idDigest === digest16(e.canonicalId)) return undefined;
    const at = Date.parse(e.updatedAt) + HELD_RELEASE_MIN_AGE_MS;
    return Date.now() < at ? new Date(at).toISOString() : undefined;
}
export function releaseHeldExecution(config: LineageConfig, identity: LineageIdentity, canonicalId: string, expectedRevision: number): LineageResult<{ control: AdmissionControl; ownerCount: number }> {
    if (!validIdentity(config, identity) || !/^[A-Za-z0-9._-]{1,100}$/.test(canonicalId)) return refused('RELEASE_NOT_APPLICABLE');
    return guarded(config, identity.tenantId, (store, tenant) => store.transactionKeys<LineageResult<{ control: AdmissionControl; ownerCount: number }>>(
        [metadataKey(identity.tenantId), requestKey(identity.tenantId, canonicalId)], ([metaEntry, recordEntry]) => {
            const none = (result: LineageFailure) => ({ writes: [], result });
            const checked = checkMetadata(config, tenant, metaEntry); if (!checked.ok) return none(checked.failure);
            const controls = checked.meta.admissionControls ?? [];
            const current = controls.find(c => c.ownerKey === ownerKey(identity));
            const record = recordEntry.state === 'PRESENT' ? validateRequestRecord(recordEntry.value, { tenantId: identity.tenantId, canonicalId }) : null;
            if (!current?.execution?.active || current.execution.canonicalId !== canonicalId || current.revision !== expectedRevision || !record || !ownersEqual(record.owner, identity.owner) || record.configRevision !== config.revision || record.ownerRelease ||
                JSON.stringify(projectExecution(toSafeLineageView(record))) !== JSON.stringify(current.execution)) return none(refused('RELEASE_NOT_APPLICABLE'));
            const now = Date.now(), at = Date.parse(record.updatedAt) + HELD_RELEASE_MIN_AGE_MS;
            if (now < at) return none({ ...refused('RELEASE_TOO_EARLY'), releasableAt: new Date(at).toISOString() } as LineageFailure);
            if ((current.heldRelease?.count ?? 0) >= 3 || checked.meta.activeUsed >= checked.meta.activeSlots) return none({ ok: false, code: 'CAPACITY', reason: 'HELD_RELEASE_LIMIT' });
            if (current.revision === Number.MAX_SAFE_INTEGER) return none({ ok: false, code: 'UNAVAILABLE', reason: 'CONTROL_REVISION_EXHAUSTED' });
            const releasedAt = new Date(now).toISOString(), revision = current.revision + 1;
            const nextRecord = { ...record, ownerRelease: { releasedAt, controlRevision: revision } };
            if (Buffer.byteLength(JSON.stringify(nextRecord)) > 15000) return none({ ok: false, code: 'UNAVAILABLE', reason: 'RECORD_TOO_LARGE' });
            const control = { ...current, revision, updatedAt: releasedAt, heldRelease: { count: (current.heldRelease?.count ?? 0) + 1, idDigest: digest16(canonicalId), releasedAt } };
            const next = controls.map(c => c.ownerKey === control.ownerKey ? control : c);
            if (!validControls(next)) return none({ ok: false, code: 'UNAVAILABLE', reason: 'CONTROL_PROJECTION_INVALID' });
            return { writes: [{ id: metaEntry.id, expectedRevision: checked.revision, value: { ...checked.meta, admissionControls: next } }, { id: recordEntry.id, expectedRevision: recordEntry.state === 'PRESENT' ? recordEntry.revision : null, value: nextRecord }], result: { ok: true as const, code: 'OK' as const, value: { control, ownerCount: next.length } } };
        }, _testOnlyGetStoreHooks()));
}
/** Synchronous admission only; a successful transaction is not proof of physical provider start. */
export function admitProviderCall(config: LineageConfig, identity: LineageIdentity, ref: LineageRef, ordinal: number): LineageResult<SafeLineageView> {
    if (!validIdentity(config, identity) || !/^[A-Za-z0-9._-]{1,100}$/.test(ref.canonicalId) || !Number.isSafeInteger(ordinal)) return refused('INVALID_CALL_ADMISSION');
    return guarded(config, identity.tenantId, (store, tenant) => store.transactionKeys<LineageResult<SafeLineageView>>(
        [metadataKey(identity.tenantId), requestKey(identity.tenantId, ref.canonicalId)], ([metaEntry, recordEntry]) => {
            const none = (result: LineageFailure) => ({ writes: [], result });
            const checked = checkMetadata(config, tenant, metaEntry); if (!checked.ok) return none(checked.failure);
            const record = recordEntry.state === 'PRESENT' ? validateRequestRecord(recordEntry.value, { tenantId: identity.tenantId, canonicalId: ref.canonicalId }) : null;
            if (!record || !ownersEqual(record.owner, identity.owner) || record.configRevision !== config.revision || record.contractRevision !== ref.contractRevision || record.sourceRevision !== ref.sourceRevision) return none(refused('INVALID_CALL_ADMISSION'));
            if (record.ownerRelease) return none(refused('HELD_RELEASED'));
            if (record.state !== 'OPEN' || record.entries[ordinal - 1]?.state !== 'PORT_PENDING' || ordinal !== record.entries.length) return none(refused('INVALID_CALL_ADMISSION'));
            const controls = checked.meta.admissionControls ?? [], control = controls.find(c => c.ownerKey === ownerKey(identity));
            if (!control || control.execution?.canonicalId !== record.canonicalId) return none(refused('INVALID_CALL_ADMISSION'));
            const now = Date.now();
            if (now - Date.parse(record.createdAt) >= EXECUTION_ADMISSION_MAX_AGE_MS) return none(refused('EXECUTION_DEADLINE_EXCEEDED'));
            const next = { ...record, updatedAt: new Date(Math.max(now, Date.parse(record.updatedAt))).toISOString() }, view = toSafeLineageView(next);
            return { writes: [{ id: metaEntry.id, expectedRevision: checked.revision, value: { ...checked.meta, admissionControls: withExecution(controls, identity, view) } }, { id: recordEntry.id, expectedRevision: recordEntry.state === 'PRESENT' ? recordEntry.revision : null, value: next }], result: { ok: true as const, code: 'OK' as const, value: view } };
        }, _testOnlyGetStoreHooks()));
}
