import { auth } from '@/auth';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const INTERNAL_AUDIT_HEADER = 'x-cvf-internal-audit';

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

    if (pathname.startsWith('/admin')) {
        const role = (req.auth.user as { role?: string } | undefined)?.role;
        if (!canAccessAdmin(role)) {
            const auditUrl = new URL('/api/admin/audit', req.url);
            void fetch(auditUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [INTERNAL_AUDIT_HEADER]: process.env.CVF_INTERNAL_AUDIT_SECRET || 'cvf-internal-audit',
                },
                body: JSON.stringify({
                    eventType: 'ADMIN_ACCESS_DENIED',
                    actorId: (req.auth.user as { email?: string } | undefined)?.email || 'unknown-user',
                    actorRole: role || 'unknown',
                    targetResource: pathname,
                    action: 'READ_ADMIN_ROUTE',
                    outcome: 'REDIRECTED',
                    payload: {
                        source: 'middleware',
                    },
                }),
            }).catch(() => undefined);

            const homeUrl = req.nextUrl.clone();
            homeUrl.pathname = '/';
            return NextResponse.redirect(homeUrl);
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/|favicon.ico).*)'],
};
