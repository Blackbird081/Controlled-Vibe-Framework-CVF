import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

function clearAuthCookies(response: NextResponse) {
    response.cookies.set('cvf_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('cvf_auth', '', { maxAge: 0, path: '/' });
    response.cookies.set('cvf_session', '', { maxAge: 0, path: '/' });
    response.cookies.set('authjs.session-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('__Secure-authjs.session-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
}

export async function POST() {
    await destroySession();
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
}

// GET: allow browser navigation to /api/auth/logout to clear session + redirect to login
export async function GET() {
    await destroySession();
    const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    clearAuthCookies(response);
    return response;
}
