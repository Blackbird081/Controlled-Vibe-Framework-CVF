import { NextResponse } from 'next/server';
import { loadGovernanceCheckRuns } from '@/lib/server/github-governance-checks';

export async function GET() {
    return NextResponse.json(await loadGovernanceCheckRuns(), {
        headers: { 'Cache-Control': 'no-store' },
    });
}
