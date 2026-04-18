import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';

export async function GET(request: Request) {
    const session = await verifySessionCookie(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const response = NextResponse.json({
        authenticated: true,
        user: session.user,
        userId: session.userId,
        role: session.role,
        orgId: session.orgId,
        teamId: session.teamId,
        impersonation: session.impersonation ?? null,
    });
    if (session.impersonation) {
        response.headers.set('X-CVF-Impersonation-Active', 'true');
    }
    return response;
}
