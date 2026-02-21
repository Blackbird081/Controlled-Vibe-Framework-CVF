import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { governanceLedger } from '@/lib/governance-engine';

/**
 * GET /api/governance/ledger?limit=50
 * Proxy to v1.6.1 Governance Engine — query immutable ledger.
 * Requires auth (session cookie or service token).
 */
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const limit = Math.min(
            Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1),
            500,
        );

        const result = await governanceLedger(limit);

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
        console.error('[API] /governance/ledger error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal error',
            },
            { status: 500 },
        );
    }
}
