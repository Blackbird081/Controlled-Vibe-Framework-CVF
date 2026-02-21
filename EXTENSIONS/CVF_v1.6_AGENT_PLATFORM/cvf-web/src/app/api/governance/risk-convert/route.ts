import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { governanceRiskConvert } from '@/lib/governance-engine';

/**
 * POST /api/governance/risk-convert
 * Proxy to v1.6.1 Governance Engine — risk level conversion.
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

        if (!body.value) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required field: value',
                },
                { status: 400 },
            );
        }

        const direction = body.direction === 'from_cvf' ? 'from_cvf' : 'to_cvf';
        const result = await governanceRiskConvert(body.value, direction);

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
        console.error('[API] /governance/risk-convert error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal error',
            },
            { status: 500 },
        );
    }
}
