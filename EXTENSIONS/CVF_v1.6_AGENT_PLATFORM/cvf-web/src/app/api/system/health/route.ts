import { NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/server/system-health';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getSystemHealth(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
