import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'cvf_auth';
const LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    if (pathname === LOGIN_PATH) {
        return NextResponse.next();
    }

    const authCookie = request.cookies.get(AUTH_COOKIE);
    if (authCookie?.value === '1') {
        return NextResponse.next();
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/((?!_next/|api/|favicon.ico).*)'],
};
