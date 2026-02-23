import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
    await destroySession();
    return NextResponse.json({ success: true });
}

// GET: allow browser navigation to /api/auth/logout to clear session + redirect to login
export async function GET() {
    await destroySession();
    const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    // Also wipe legacy cookies just in case
    response.cookies.set('cvf_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('cvf_auth', '', { maxAge: 0, path: '/' });
    response.cookies.set('cvf_session', '', { maxAge: 0, path: '/' });
    return response;
}
