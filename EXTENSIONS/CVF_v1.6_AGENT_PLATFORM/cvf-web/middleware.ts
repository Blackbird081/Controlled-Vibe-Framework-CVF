import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const LOGIN_PATH = '/login';

// Routes accessible without authentication
const PUBLIC_PATHS = ['/docs', '/help', '/skills', '/landing'];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    const isPublicAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/public');
    const isLogin = pathname === LOGIN_PATH;
    const isAuthApi = pathname.startsWith('/api/auth');
    const isPublicPage = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isPublicAsset || isLogin || isAuthApi || isPublicPage) {
        return NextResponse.next();
    }

    if (!req.auth) {
        // Unauthenticated root → landing page instead of login
        if (pathname === '/') {
            const landingUrl = req.nextUrl.clone();
            landingUrl.pathname = '/landing';
            return NextResponse.redirect(landingUrl);
        }
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = LOGIN_PATH;
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/|favicon.ico).*)'],
};
