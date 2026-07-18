import { NextResponse } from 'next/server';
import { getCvfWorkspaceReadModel } from '@/lib/server/cvf-workspace-read-model';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getCvfWorkspaceReadModel(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
