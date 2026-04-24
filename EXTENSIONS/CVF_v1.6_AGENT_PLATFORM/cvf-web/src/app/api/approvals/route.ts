import { NextRequest, NextResponse } from 'next/server';

import { appendAuditEvent } from '@/lib/control-plane-events';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { buildGovernanceEnvelope } from '@/lib/web-governance-envelope';

import {
    approvalRecordMatchesActor,
    approvalRecordMatchesScope,
    buildApprovalActorBinding,
    buildApprovalRequestSnapshot,
    computeApprovalRequestHash,
} from './approval-binding';
import { ApprovalRequestRecord, getApprovalStore } from './store';

const EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateId(): string {
    return `apr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * POST /api/approvals
 * Non-coder submits an approval request after receiving NEEDS_APPROVAL.
 * Returns the created request with id + status='pending'.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await verifySessionCookie(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.templateId || !body.intent) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: templateId, intent' },
                { status: 400 },
            );
        }

        const approvalActor = buildApprovalActorBinding({ session });
        if (!approvalActor) {
            return NextResponse.json({ success: false, error: 'Unable to resolve approval actor.' }, { status: 401 });
        }

        const requestPhase = body.cvfPhase ? String(body.cvfPhase) : body.phase ? String(body.phase) : undefined;
        const requestRiskLevel = body.cvfRiskLevel ? String(body.cvfRiskLevel) : body.riskLevel ? String(body.riskLevel) : undefined;
        const requestProvider = body.provider
            ? String(body.provider)
            : String(process.env.DEFAULT_AI_PROVIDER || 'openai');
        const id = generateId();
        const now = new Date();
        const govEnvelope = buildGovernanceEnvelope({
            routeId: '/api/approvals',
            surfaceClass: 'governance-execution',
            evidenceMode: 'live',
            riskLevel: requestRiskLevel ?? null,
            phase: requestPhase ?? null,
        });
        const requestSnapshot = buildApprovalRequestSnapshot({
            templateId: String(body.templateId),
            templateName: String(body.templateName || body.templateId),
            intent: String(body.intent),
            inputs: body.inputs && typeof body.inputs === 'object'
                ? Object.fromEntries(
                    Object.entries(body.inputs as Record<string, unknown>).map(([key, value]) => [key, String(value ?? '')]),
                )
                : undefined,
            provider: requestProvider,
            model: body.model ? String(body.model) : undefined,
            cvfPhase: requestPhase,
            cvfRiskLevel: requestRiskLevel,
            knowledgeCollectionId: body.knowledgeCollectionId ? String(body.knowledgeCollectionId) : undefined,
        }, requestProvider, approvalActor);
        const record: ApprovalRequestRecord = {
            id,
            templateId: String(body.templateId),
            templateName: String(body.templateName || body.templateId),
            intent: String(body.intent),
            toolId: body.toolId ? String(body.toolId) : undefined,
            toolPayload: body.toolPayload && typeof body.toolPayload === 'object' ? body.toolPayload as Record<string, unknown> : undefined,
            riskLevel: requestRiskLevel,
            phase: requestPhase,
            reason: String(body.reason || '').trim(),
            requestContext: {
                policySnapshotId: govEnvelope.policySnapshotId,
                envelopeId: govEnvelope.envelopeId,
            },
            requestSnapshot,
            expiresAt: new Date(now.getTime() + EXPIRY_MS).toISOString(),
            status: 'pending',
            submittedAt: now.toISOString(),
            submittedByActorId: approvalActor.actorId,
            submittedByOrgId: approvalActor.actorOrgId,
            submittedByTeamId: approvalActor.actorTeamId,
            submittedByAuthMode: approvalActor.actorAuthMode,
        };
        record.requestHash = computeApprovalRequestHash(requestSnapshot);

        getApprovalStore().set(id, record);

        return NextResponse.json({
            success: true,
            id: record.id,
            status: record.status,
            submittedAt: record.submittedAt,
            expiresAt: record.expiresAt,
            policySnapshotId: govEnvelope.policySnapshotId,
            governanceEnvelope: govEnvelope,
            message: 'Your request has been submitted for review. An admin will evaluate it and you will see the result here.',
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        );
    }
}

/**
 * GET /api/approvals
 * List all approval requests. Lazily expires pending requests past their expiresAt.
 * Emits APPROVAL_EXPIRED audit event for each newly expired request (C4.2).
 */
export async function GET() {
    const session = await verifySessionCookie();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const store = getApprovalStore();
    const now = new Date();
    const approvalActor = buildApprovalActorBinding({ session });
    const isAdmin = canAccessAdmin(session.role);

    const expirePromises: Promise<unknown>[] = [];
    for (const record of store.values()) {
        if (record.status === 'pending' && new Date(record.expiresAt) < now) {
            store.set(record.id, {
                ...record,
                status: 'expired',
            });
            expirePromises.push(
                appendAuditEvent({
                    eventType: 'APPROVAL_EXPIRED',
                    actorId: 'system',
                    actorRole: 'system',
                    targetResource: record.templateName,
                    action: 'AUTO_EXPIRE',
                    riskLevel: record.riskLevel,
                    outcome: 'EXPIRED',
                    payload: { approvalId: record.id, templateId: record.templateId },
                }),
            );
        }
    }

    await Promise.all(expirePromises);

    const requests = Array.from(store.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    ).filter(record => (
        isAdmin
            ? approvalRecordMatchesScope(record, approvalActor)
            : approvalRecordMatchesActor(record, approvalActor)
    ));

    return NextResponse.json({ success: true, data: requests });
}
