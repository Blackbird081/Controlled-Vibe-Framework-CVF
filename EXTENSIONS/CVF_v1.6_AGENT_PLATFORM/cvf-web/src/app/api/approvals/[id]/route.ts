import { NextRequest, NextResponse } from 'next/server';

import { appendAuditEvent } from '@/lib/control-plane-events';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { verifySessionCookie } from '@/lib/middleware-auth';

import { getApprovalStore } from '../store';

/**
 * GET /api/approvals/[id]
 * Check the status of a submitted approval request.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const store = getApprovalStore();
    const record = store.get(id);

    if (!record) {
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

    if (!record) {
        return NextResponse.json({ success: false, error: 'Approval request not found.' }, { status: 404 });
    }

    if (record.status !== 'pending') {
        return NextResponse.json(
            { success: false, error: `Request is already ${record.status} and cannot be decided.` },
            { status: 409 },
        );
    }

    const body = await request.json();
    const action = body.action as string;
    if (action !== 'approved' && action !== 'rejected') {
        return NextResponse.json(
            { success: false, error: 'action must be "approved" or "rejected"' },
            { status: 400 },
        );
    }

    const now = new Date().toISOString();
    record.status = action;
    record.reviewedAt = now;
    record.reviewedBy = session.userId ?? session.user ?? 'admin';
    record.reviewComment = body.reviewComment ? String(body.reviewComment) : undefined;

    await appendAuditEvent({
        eventType: 'APPROVAL_DECIDED',
        actorId: record.reviewedBy,
        actorRole: session.role,
        targetResource: record.templateName,
        action: action.toUpperCase(),
        riskLevel: record.riskLevel ?? 'R1',
        outcome: action.toUpperCase(),
        payload: {
            approvalId: record.id,
            templateId: record.templateId,
            reviewComment: record.reviewComment ?? null,
        },
    });

    return NextResponse.json({ success: true, data: record });
}
