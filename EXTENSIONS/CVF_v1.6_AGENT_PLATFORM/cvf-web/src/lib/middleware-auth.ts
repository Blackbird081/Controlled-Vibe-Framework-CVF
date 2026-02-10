import { NextRequest } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'cvf_session';

function getSecret(): string {
    return process.env.CVF_SESSION_SECRET || 'cvf-dev-secret-change-me';
}

export type SessionCookie = {
    user: string;
    role: string;
    expiresAt: number;
};

function parseCookieFromHeader(request: NextRequest | Request): string | undefined {
    // NextRequest has cookies API; plain Request doesn't.
    // @ts-ignore
    const cookieStore = (request as any).cookies;
    if (cookieStore && typeof cookieStore.get === 'function') {
        return cookieStore.get(COOKIE_NAME)?.value;
    }
    const headerValue = request.headers.get('cookie') || request.headers.get('Cookie');
    if (!headerValue) return undefined;
    const cookies = headerValue.split(';').map(c => c.trim());
    for (const c of cookies) {
        if (c.startsWith(`${COOKIE_NAME}=`)) {
            return c.substring(COOKIE_NAME.length + 1);
        }
    }
    return undefined;
}

export function verifySessionCookie(request: NextRequest | Request): SessionCookie | null {
    const token = parseCookieFromHeader(request);
    if (!token) return null;
    const [base, sig] = token.split('.');
    if (!base || !sig) return null;
    const json = Buffer.from(base, 'base64url').toString();
    const expected = crypto.createHmac('sha256', getSecret()).update(json).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        const payload = JSON.parse(json) as SessionCookie;
        if (payload.expiresAt < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}
