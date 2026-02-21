import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { governanceApprove } from '@/lib/governance-engine';
import type { GovernanceApproveRequest } from '@/types/governance-engine';

/**
 * POST /api/governance/approve
 * Proxy to v1.6.1 Governance Engine — submit approval decision.
 * Requires auth (session cookie or service token).
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const session = await verifySessionCookie(request);
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredToken = process.env.CVF_SERVICE_TOKEN;
        const isServiceAllowed = configuredToken && serviceToken === configuredToken;

        if (!session && !isServiceAllowed) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.request_id || !body.approver_id || !body.decision) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: request_id, approver_id, decision',
                },
                { status: 400 },
            );
        }

        const validDecisions = ['APPROVED', 'REJECTED'];
        if (!validDecisions.includes(body.decision.toUpperCase())) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid decision: ${body.decision}. Use APPROVED or REJECTED.`,
                },
                { status: 400 },
            );
        }

        const payload: GovernanceApproveRequest = {
            request_id: body.request_id,
            approver_id: body.approver_id,
            decision: body.decision.toUpperCase(),
            comment: body.comment,
        };

        const result = await governanceApprove(payload);

        if (!result) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Governance Engine unavailable.',
                },
                { status: 503 },
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('[API] /governance/approve error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal error',
            },
            { status: 500 },
        );
    }
}
