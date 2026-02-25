import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';

export async function GET(request: Request) {
    const session = await verifySessionCookie(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user: session.user, role: session.role });
}
