import { NextRequest, NextResponse } from 'next/server';
import {
    listGovernanceJobs,
    submitGovernanceJob,
    type GovernanceAuthMode,
    type GovernanceJobRequest,
    type GovernanceRequestIpClass,
    type GovernanceRole,
} from '@/lib/server/web-governance-jobs';
import { verifySessionCookie } from '@/lib/middleware-auth';

export const dynamic = 'force-dynamic';

function requestIpClass(request: NextRequest): GovernanceRequestIpClass {
    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const host = request.headers.get('host') ?? '';
    if (
        forwardedFor.startsWith('127.') ||
        forwardedFor === '::1' ||
        host.startsWith('localhost') ||
        host.startsWith('127.0.0.1')
    ) {
        return 'loopback';
    }
    if (forwardedFor.startsWith('10.') || forwardedFor.startsWith('192.168.')) return 'private_network';
    return forwardedFor ? 'public_or_unknown' : 'not_recorded';
}

export async function GET() {
    return NextResponse.json(listGovernanceJobs(), {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({})) as Partial<GovernanceJobRequest>;
    const session = await verifySessionCookie(request);
    const role = session
        ? (session.role === 'developer' ? 'operator' : session.role)
        : 'anonymous_local';
    const authMode = session ? 'authenticated' : 'anonymous_local';
    const ipClass = requestIpClass(request);
    const localMode = ipClass === 'loopback' && authMode === 'anonymous_local';

    const result = await submitGovernanceJob({
        jobType: body.jobType ?? '',
        provider: body.provider,
        role: role as GovernanceRole,
        requestedBy: session?.user ?? body.requestedBy ?? 'web-operator',
        authMode: authMode as GovernanceAuthMode,
        localMode,
        requestIpClass: ipClass,
        uiRequestId: body.uiRequestId,
        timeoutMsOverride: body.timeoutMsOverride,
        costQuotaOverride: body.costQuotaOverride,
    });

    return NextResponse.json(result, {
        status: result.status === 'blocked_by_policy' ? 403 : 200,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
