import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const days = searchParams.get('days') || '30';

        const result = await governanceFetchDirect(`/api/v1/trends?days=${days}`);

        if (!result) {
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                data: { points: [] },
            });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch trends' },
            { status: 500 }
        );
    }
}
