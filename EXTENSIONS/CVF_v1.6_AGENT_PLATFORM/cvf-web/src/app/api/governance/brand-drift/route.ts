import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function GET(request: NextRequest) {
    try {
        const result = await governanceFetchDirect('/api/v1/brand-drift');

        if (!result) {
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                data: {
                    drift_score: 0,
                    status: 'COMPLIANT',
                    changed_fields: [],
                    last_checked: new Date().toISOString(),
                },
            });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Failed to check brand drift' },
            { status: 500 }
        );
    }
}
