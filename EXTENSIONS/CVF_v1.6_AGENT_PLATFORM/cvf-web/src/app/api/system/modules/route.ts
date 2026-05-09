import { NextResponse } from 'next/server';
import { getRuntimeModuleRegistry } from '@/lib/server/runtime-modules';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getRuntimeModuleRegistry(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
