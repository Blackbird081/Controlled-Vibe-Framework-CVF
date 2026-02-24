import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { baseline_dsl, new_dsl } = body;

        if (!baseline_dsl || !new_dsl) {
            return NextResponse.json(
                { status: 'error', message: 'baseline_dsl and new_dsl are required' },
                { status: 400 }
            );
        }

        // Try server-side simulation first
        const result = await governanceFetchDirect('/api/v1/simulate');

        if (!result) {
            // Return fallback — client-side simulation handles this
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                data: { message: 'Server simulation unavailable, use client-side' },
            });
        }

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Simulation failed' },
            { status: 500 }
        );
    }
}
