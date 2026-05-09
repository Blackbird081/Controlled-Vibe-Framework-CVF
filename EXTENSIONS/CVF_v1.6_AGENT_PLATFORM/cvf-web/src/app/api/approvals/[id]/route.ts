import { NextRequest, NextResponse } from 'next/server';

import { appendAuditEvent } from '@/lib/control-plane-events';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { verifySessionCookie } from '@/lib/middleware-auth';

import { approvalRecordMatchesActor, approvalRecordMatchesScope, buildApprovalActorBinding } from '../approval-binding';
import { getApprovalStore, type ApprovalRequestRecord } from '../store';

/**
 * GET /api/approvals/[id]
 * Check the status of a submitted approval request.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await verifySessionCookie(_request);
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const approvalActor = buildApprovalActorBinding({ session });
    const { id } = await params;
    const store = getApprovalStore();
    const record = store.get(id);

    const canReadRecord = record && (
        approvalRecordMatchesActor(record, approvalActor)
        || (canAccessAdmin(session.role) && approvalRecordMatchesScope(record, approvalActor))
    );

    if (!record || !canReadRecord) {
        return NextResponse.json(
            { success: false, error: 'Approval request not found.' },
            { status: 404 },
        );
    }

    return NextResponse.json({
        success: true,
        id: record.id,
        status: record.status,
        submittedAt: record.submittedAt,
        expiresAt: record.expiresAt,
        templateId: record.templateId,
        templateName: record.templateName,
    });
}

/**
 * PATCH /api/approvals/[id]
 * Admin decides on a pending approval request (approve or reject).
 * Persists decision to the in-memory store and emits APPROVAL_DECIDED audit event.
 * C4.4 — requires admin session.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await verifySessionCookie(request);
    if (!session || !canAccessAdmin(session.role)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const store = getApprovalStore();
    const record = store.get(id);
    const approvalActor = buildApprovalActorBinding({ session });

    if (!record || !approvalRecordMatchesScope(record, approvalActor)) {
        return NextResponse.json({ success: false, error: 'Approval request not found.' }, { status: 404 });
    }

    if (record.status !== 'pending') {
        return NextResponse.json(
            { success: false, error: `Request is already ${record.status} and cannot be decided.` },
            { status: 409 },
        );
    }

    const body = await request.json();
    const requestedAction = String(body.action);
    if (requestedAction !== 'approved' && requestedAction !== 'rejected') {
        return NextResponse.json(
            { success: false, error: 'action must be "approved" or "rejected"' },
            { status: 400 },
        );
    }

    const action = requestedAction;
    const now = new Date().toISOString();
    const reviewerId = session.userId ?? session.user ?? 'admin';
    const updatedRecord: ApprovalRequestRecord = {
        ...record,
        status: action,
        reviewedAt: now,
        reviewedBy: reviewerId,
        reviewComment: body.reviewComment ? String(body.reviewComment) : undefined,
    };
    store.set(id, updatedRecord);

    await appendAuditEvent({
        eventType: 'APPROVAL_DECIDED',
        actorId: reviewerId,
        actorRole: session.role,
        targetResource: updatedRecord.templateName,
        action: action.toUpperCase(),
        riskLevel: updatedRecord.riskLevel ?? 'R1',
        outcome: action.toUpperCase(),
        payload: {
            approvalId: updatedRecord.id,
            templateId: updatedRecord.templateId,
            reviewComment: updatedRecord.reviewComment ?? null,
        },
    });

    return NextResponse.json({ success: true, data: updatedRecord });
}
