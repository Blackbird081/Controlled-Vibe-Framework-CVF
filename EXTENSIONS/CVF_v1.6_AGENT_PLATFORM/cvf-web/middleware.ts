import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';

const LOGIN_PATH = '/login';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublicAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/public');
    const isLogin = pathname === LOGIN_PATH;
    const isAuthApi = pathname.startsWith('/api/auth');

    if (isPublicAsset || isLogin || isAuthApi) {
        return NextResponse.next();
    }

    const session = await verifySessionCookie(request);

    if (!session) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = LOGIN_PATH;
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/|favicon.ico).*)'],
};
