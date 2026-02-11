import crypto from 'crypto';
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'cvf_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Deterministic fallback secret for when CVF_SESSION_SECRET is not set.
// In production, set CVF_SESSION_SECRET env var for proper security.
const FALLBACK_SECRET = 'cvf-default-session-secret-2026-change-me';

function getSecret(): string {
    return process.env.CVF_SESSION_SECRET || FALLBACK_SECRET;
}

export type SessionPayload = {
    user: string;
    role: 'admin' | 'editor' | 'viewer';
    issuedAt: number;
    expiresAt: number;
};

function sign(payload: SessionPayload, secret: string): string {
    const json = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret).update(json).digest('hex');
    const base = Buffer.from(json).toString('base64url');
    return `${base}.${hmac}`;
}

function verify(token: string, secret: string): SessionPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base, sig] = parts;
    const json = Buffer.from(base, 'base64url').toString();
    const expected = crypto.createHmac('sha256', secret).update(json).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        const payload = JSON.parse(json) as SessionPayload;
        if (payload.expiresAt < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

export async function createSession(user: string, role: SessionPayload['role'] = 'admin') {
    const now = Date.now();
    const payload: SessionPayload = {
        user,
        role,
        issuedAt: now,
        expiresAt: now + DEFAULT_TTL_SECONDS * 1000,
    };
    const secret = getSecret();
    const token = sign(payload, secret);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: DEFAULT_TTL_SECONDS,
        path: '/',
    });
    return payload;
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromHeaders(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verify(token, getSecret());
}

export async function requireSession(): Promise<SessionPayload | null> {
    return getSessionFromHeaders();
}

export async function getClientIdentifier(requestHeaders?: Headers): Promise<string> {
    const hdrs = requestHeaders || (await headers());
    const forwarded = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return hdrs.get('cf-connecting-ip') || 'unknown';
}
