import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, justification, scope, expiryDays, riskAcknowledged } = body;

        if (!requestId || !justification || justification.trim().length < 50) {
            return NextResponse.json(
                { status: 'error', message: 'requestId and justification (min 50 chars) are required' },
                { status: 400 }
            );
        }

        if (!riskAcknowledged) {
            return NextResponse.json(
                { status: 'error', message: 'Risk acknowledgment is required' },
                { status: 400 }
            );
        }

        const result = await governanceFetchDirect('/api/v1/override');

        if (!result) {
            // Fallback: create local override record
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + Math.min(30, expiryDays || 7));
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                data: {
                    override_id: `ovr-${Date.now()}`,
                    request_id: requestId,
                    scope: scope || 'request',
                    expires_at: expiry.toISOString(),
                    status: 'PENDING_APPROVAL',
                },
            });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Override request failed' },
            { status: 500 }
        );
    }
}
