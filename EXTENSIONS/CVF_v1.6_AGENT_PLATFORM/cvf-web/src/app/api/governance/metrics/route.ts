import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function GET(request: NextRequest) {
    try {
        const result = await governanceFetchDirect('/api/v1/metrics');

        if (!result) {
            // Return fallback mock metrics when engine unavailable
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                data: {
                    risk_index: 0,
                    approval_efficiency: 0,
                    stability_score: 0,
                    compliance_integrity: 0,
                },
            });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
