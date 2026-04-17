import { NextRequest, NextResponse } from 'next/server';
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
        templateId: record.templateId,
        templateName: record.templateName,
    });
}
