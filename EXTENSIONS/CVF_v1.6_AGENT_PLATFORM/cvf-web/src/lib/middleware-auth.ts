import { NextRequest } from 'next/server';

const COOKIE_NAME = 'cvf_session';

function getSecret(): string {
    if (!process.env.CVF_SESSION_SECRET && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ CVF_SESSION_SECRET not set! Using insecure fallback. Set this env var in production.');
    }
    return process.env.CVF_SESSION_SECRET || 'cvf-default-session-secret-2026-change-me';
}

export type SessionCookie = {
    user: string;
    role: string;
    expiresAt: number;
};

type CookieStore = {
    get: (name: string) => { value?: string } | undefined;
};

type CookieCapableRequest = {
    cookies?: CookieStore;
};

function parseCookieFromHeader(request: NextRequest | Request): string | undefined {
    // NextRequest has cookies API; plain Request doesn't.
    const cookieStore = (request as CookieCapableRequest).cookies;
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

// Web Crypto helpers (Edge-compatible, no Node.js crypto needed)
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function base64urlDecode(str: string): string {
    // Pad the base64url string
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    return binary;
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

export async function verifySessionCookie(request: NextRequest | Request): Promise<SessionCookie | null> {
    const token = parseCookieFromHeader(request);
    if (!token) return null;
    const [base, sig] = token.split('.');
    if (!base || !sig) return null;
    const json = base64urlDecode(base);
    const expected = await hmacSha256Hex(getSecret(), json);
    if (!timingSafeEqual(sig, expected)) return null;
    try {
        const payload = JSON.parse(json) as SessionCookie;
        if (payload.expiresAt < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}
