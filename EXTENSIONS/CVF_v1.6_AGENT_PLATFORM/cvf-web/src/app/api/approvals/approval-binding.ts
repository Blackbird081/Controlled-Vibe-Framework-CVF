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

function sortStringRecord(input?: Record<string, string>): Record<string, string> | undefined {
    if (!input) {
        return undefined;
    }

    const entries = Object.entries(input)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([k, v]) => [k, String(v ?? '').trim()] as [string, string]);
    return Object.fromEntries(entries);
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
    return {
        templateId: String(request.templateId || request.templateName || 'unknown'),
        templateName: String(request.templateName || request.templateId || 'unknown'),
        intent: String(request.intent || '').trim(),
        inputs: sortStringRecord(request.inputs),
        provider: String(provider || ''),
        model: request.model ? String(request.model).trim() : undefined,
        cvfPhase: cvfPhase ? String(cvfPhase).trim() : undefined,
        cvfRiskLevel: cvfRiskLevel ? String(cvfRiskLevel).trim() : undefined,
        knowledgeCollectionId: request.knowledgeCollectionId ? String(request.knowledgeCollectionId) : null,
        actorId: actor?.actorId,
        actorOrgId: actor?.actorOrgId ?? null,
        actorTeamId: actor?.actorTeamId ?? null,
        actorAuthMode: actor?.actorAuthMode,
    };
}

export function computeApprovalRequestHash(snapshot: ApprovalRequestSnapshot): string {
    return createHash('sha256')
        .update(JSON.stringify(snapshot))
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
