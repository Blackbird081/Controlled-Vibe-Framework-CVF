import { NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function GET() {
    try {
        const data = await governanceFetchDirect('/api/v1/overrides/active');

        if (data) {
            return NextResponse.json(data);
        }

        // Fallback: return empty list when engine unavailable
        return NextResponse.json({
            status: 'ok',
            data: {
                overrides: [],
                total: 0,
            },
        });
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch active overrides' },
            { status: 500 }
        );
    }
}
