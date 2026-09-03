import { createHash } from 'node:crypto';

import type { AIProvider, ExecutionRequest } from '@/lib/ai';
import type { SessionCookie } from '@/lib/middleware-auth';

import type { ApprovalRequestRecord, ApprovalRequestSnapshot } from './store';

export type ApprovalActorBinding = {
    actorId: string;
    actorOrgId: string | null;
    actorTeamId: string | null;
    actorAuthMode: 'session' | 'service';
};

type ApprovalSnapshotInput = Omit<Partial<ExecutionRequest>, 'provider'> & {
    provider?: AIProvider | string;
    phase?: string;
    riskLevel?: string;
};

function normalizeOptionalString(value: unknown): string | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    const normalized = String(value).trim();
    return normalized || undefined;
}

function normalizeNullableString(value: unknown): string | null {
    return normalizeOptionalString(value) ?? null;
}

function compareOrdinal(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
}

function sortStringRecord(input?: Record<string, string>): Record<string, string> | undefined {
    if (!input) {
        return undefined;
    }

    const entries = Object.entries(input)
        .sort(([left], [right]) => compareOrdinal(left, right))
        .map(([k, v]) => [k, String(v ?? '').trim()] as [string, string]);
    return Object.fromEntries(entries);
}

const APPROVAL_SNAPSHOT_KEYS = [
    'actorAuthMode',
    'actorId',
    'actorOrgId',
    'actorTeamId',
    'cvfPhase',
    'cvfRiskLevel',
    'inputs',
    'intent',
    'knowledgeCollectionId',
    'model',
    'provider',
    'templateId',
    'templateName',
] as const satisfies readonly (keyof ApprovalRequestSnapshot)[];

const APPROVAL_SNAPSHOT_KEY_SET = new Set<string>(APPROVAL_SNAPSHOT_KEYS);
const REQUIRED_STRING_KEYS = new Set<string>(['intent', 'templateId', 'templateName']);
const OPTIONAL_STRING_KEYS = new Set<string>([
    'actorId',
    'cvfPhase',
    'cvfRiskLevel',
    'model',
    'provider',
]);
const NULLABLE_STRING_KEYS = new Set<string>([
    'actorOrgId',
    'actorTeamId',
    'knowledgeCollectionId',
]);

function assertPlainDataObject(value: unknown, label: string): asserts value is Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`${label} must be a plain object`);
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError(`${label} must be a plain object`);
    }

    for (const key of Reflect.ownKeys(value)) {
        if (typeof key === 'symbol') {
            throw new TypeError(`${label} must not contain symbol keys`);
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
            throw new TypeError(`${label}.${key} must be an enumerable data property`);
        }
        if (descriptor.value === undefined) {
            throw new TypeError(`${label}.${key} must not be undefined`);
        }
    }
}

function readDataProperty(input: Record<string, unknown>, key: string): unknown {
    return Object.getOwnPropertyDescriptor(input, key)?.value;
}

function isIntegerIndexKey(key: string): boolean {
    const numeric = Number(key);
    return Number.isInteger(numeric)
        && numeric >= 0
        && numeric < 0xffffffff
        && String(numeric) === key;
}

function projectApprovalRequestSnapshot(input: unknown): ApprovalRequestSnapshot {
    assertPlainDataObject(input, 'approval request snapshot');

    for (const key of Object.keys(input)) {
        if (!APPROVAL_SNAPSHOT_KEY_SET.has(key)) {
            throw new TypeError(`approval request snapshot contains unknown key: ${key}`);
        }
    }

    for (const key of REQUIRED_STRING_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(input, key) || typeof readDataProperty(input, key) !== 'string') {
            throw new TypeError(`approval request snapshot.${key} must be a string`);
        }
    }

    const projectedEntries: [string, unknown][] = [];
    for (const key of APPROVAL_SNAPSHOT_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(input, key)) {
            continue;
        }

        const value = readDataProperty(input, key);
        if (REQUIRED_STRING_KEYS.has(key) || OPTIONAL_STRING_KEYS.has(key)) {
            if (typeof value !== 'string') {
                throw new TypeError(`approval request snapshot.${key} must be a string`);
            }
        } else if (NULLABLE_STRING_KEYS.has(key)) {
            if (value !== null && typeof value !== 'string') {
                throw new TypeError(`approval request snapshot.${key} must be a string or null`);
            }
        } else if (key === 'actorAuthMode') {
            if (value !== 'session' && value !== 'service') {
                throw new TypeError('approval request snapshot.actorAuthMode is invalid');
            }
        } else if (key === 'inputs') {
            assertPlainDataObject(value, 'approval request snapshot.inputs');
            for (const inputKey of Object.keys(value)) {
                if (isIntegerIndexKey(inputKey)) {
                    throw new TypeError('approval request snapshot.inputs must not contain integer-index keys');
                }
            }
            const inputEntries = Object.keys(value)
                .sort(compareOrdinal)
                .map((inputKey) => {
                    const inputValue = readDataProperty(value, inputKey);
                    if (typeof inputValue !== 'string') {
                        throw new TypeError(`approval request snapshot.inputs.${inputKey} must be a string`);
                    }
                    return [inputKey, inputValue] as [string, string];
                });
            projectedEntries.push([key, Object.fromEntries(inputEntries)]);
            continue;
        }
        projectedEntries.push([key, value]);
    }

    return Object.fromEntries(projectedEntries) as unknown as ApprovalRequestSnapshot;
}

export function buildApprovalActorBinding(input: {
    session?: Pick<SessionCookie, 'userId' | 'user' | 'orgId' | 'teamId'> | null;
    serviceIdentity?: string | null;
}): ApprovalActorBinding | null {
    if (input.session) {
        return {
            actorId: normalizeOptionalString(input.session.userId ?? input.session.user) ?? 'unknown-user',
            actorOrgId: normalizeNullableString(input.session.orgId),
            actorTeamId: normalizeNullableString(input.session.teamId),
            actorAuthMode: 'session',
        };
    }

    const serviceIdentity = normalizeOptionalString(input.serviceIdentity);
    if (serviceIdentity) {
        return {
            actorId: serviceIdentity,
            actorOrgId: null,
            actorTeamId: null,
            actorAuthMode: 'service',
        };
    }

    return null;
}

export function buildApprovalRequestSnapshot(
    request: ApprovalSnapshotInput,
    provider: AIProvider | string,
    actor?: ApprovalActorBinding | null,
): ApprovalRequestSnapshot {
    const cvfPhase = request.cvfPhase ?? request.phase;
    const cvfRiskLevel = request.cvfRiskLevel ?? request.riskLevel;
    const snapshot: ApprovalRequestSnapshot = {
        templateId: String(request.templateId || request.templateName || 'unknown'),
        templateName: String(request.templateName || request.templateId || 'unknown'),
        intent: String(request.intent || '').trim(),
        provider: String(provider || ''),
        knowledgeCollectionId: request.knowledgeCollectionId ? String(request.knowledgeCollectionId) : null,
        actorOrgId: actor?.actorOrgId ?? null,
        actorTeamId: actor?.actorTeamId ?? null,
    };

    const inputs = sortStringRecord(request.inputs);
    const model = normalizeOptionalString(request.model);
    const normalizedPhase = normalizeOptionalString(cvfPhase);
    const normalizedRiskLevel = normalizeOptionalString(cvfRiskLevel);
    if (inputs !== undefined) snapshot.inputs = inputs;
    if (model !== undefined) snapshot.model = model;
    if (normalizedPhase !== undefined) snapshot.cvfPhase = normalizedPhase;
    if (normalizedRiskLevel !== undefined) snapshot.cvfRiskLevel = normalizedRiskLevel;
    if (actor?.actorId !== undefined) snapshot.actorId = actor.actorId;
    if (actor?.actorAuthMode !== undefined) snapshot.actorAuthMode = actor.actorAuthMode;

    return projectApprovalRequestSnapshot(snapshot);
}

export function computeApprovalRequestHash(snapshot: ApprovalRequestSnapshot): string {
    const projection = projectApprovalRequestSnapshot(snapshot);
    return createHash('sha256')
        .update(JSON.stringify(projection), 'utf8')
        .digest('hex');
}

function resolveRecordActorBinding(record: ApprovalRequestRecord): ApprovalActorBinding | null {
    const actorId = normalizeOptionalString(record.submittedByActorId ?? record.requestSnapshot?.actorId);
    const actorAuthMode = record.submittedByAuthMode ?? record.requestSnapshot?.actorAuthMode;
    if (!actorId || !actorAuthMode) {
        return null;
    }

    return {
        actorId,
        actorOrgId: normalizeNullableString(record.submittedByOrgId ?? record.requestSnapshot?.actorOrgId),
        actorTeamId: normalizeNullableString(record.submittedByTeamId ?? record.requestSnapshot?.actorTeamId),
        actorAuthMode,
    };
}

export function approvalRecordMatchesActor(
    record: ApprovalRequestRecord,
    actor: ApprovalActorBinding | null | undefined,
): boolean {
    if (!actor) {
        return false;
    }

    const recordActor = resolveRecordActorBinding(record);
    if (!recordActor) {
        return false;
    }

    return recordActor.actorId === actor.actorId
        && recordActor.actorAuthMode === actor.actorAuthMode
        && recordActor.actorOrgId === actor.actorOrgId
        && recordActor.actorTeamId === actor.actorTeamId;
}

export function approvalRecordMatchesScope(
    record: ApprovalRequestRecord,
    actor: ApprovalActorBinding | null | undefined,
): boolean {
    if (!actor) {
        return false;
    }

    const recordActor = resolveRecordActorBinding(record);
    if (!recordActor) {
        return false;
    }

    return recordActor.actorOrgId === actor.actorOrgId
        && recordActor.actorTeamId === actor.actorTeamId;
}
