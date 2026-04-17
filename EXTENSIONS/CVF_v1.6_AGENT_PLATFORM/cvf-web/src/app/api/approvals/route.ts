import { NextRequest, NextResponse } from 'next/server';
import { ApprovalRequest, getApprovalStore } from './store';

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
        const body = await request.json();

        if (!body.templateId || !body.intent) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: templateId, intent' },
                { status: 400 },
            );
        }

        const id = generateId();
        const record: ApprovalRequest = {
            id,
            templateId: String(body.templateId),
            templateName: String(body.templateName || body.templateId),
            intent: String(body.intent),
            reason: String(body.reason || ''),
            status: 'pending',
            submittedAt: new Date().toISOString(),
        };

        getApprovalStore().set(id, record);

        return NextResponse.json({
            success: true,
            id: record.id,
            status: record.status,
            submittedAt: record.submittedAt,
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
 * List all approval requests (for admin use).
 */
export async function GET() {
    const requests = Array.from(getApprovalStore().values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    return NextResponse.json({ success: true, data: requests });
}
