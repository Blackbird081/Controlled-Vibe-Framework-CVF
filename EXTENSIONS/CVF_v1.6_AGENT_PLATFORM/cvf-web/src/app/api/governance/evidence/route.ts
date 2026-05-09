import { NextResponse } from 'next/server';
import { getGovernanceEvidenceReport } from '@/lib/server/governance-evidence';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getGovernanceEvidenceReport(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
