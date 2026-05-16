import { NextResponse } from 'next/server';
import { getRuntimeObservabilitySnapshot } from '@/lib/server/runtime-observability';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getRuntimeObservabilitySnapshot(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
