/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifySessionCookie, type SessionCookie } from './middleware-auth';

// helpers to create signed cookies
function base64urlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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

async function makeSignedToken(payload: SessionCookie, secret: string): Promise<string> {
    const json = JSON.stringify(payload);
    const base = base64urlEncode(json);
    // We need to decode the base back to json to get the correct signature
    // because the code does base64urlDecode(base) and signs that json
    const decodedJson = atob(base.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base.length % 4)) % 4));
    const sig = await hmacSha256Hex(secret, decodedJson);
    return `${base}.${sig}`;
}

const DEFAULT_SECRET = 'cvf-default-session-secret-2026-change-me';

function fakeRequest(cookieValue?: string): Request {
    const headers = new Headers();
    if (cookieValue) {
        headers.set('cookie', `cvf_session=${cookieValue}`);
    }
    return new Request('http://localhost/', { headers });
}

type RequestWithCookiesApi = Request & {
    cookies: {
        get: (name: string) => { value: string } | undefined;
    };
};

function fakeRequestWithCookiesApi(cookieValue?: string): RequestWithCookiesApi {
    const req = fakeRequest() as RequestWithCookiesApi;
    req.cookies = {
        get: (name: string) => {
            if (name === 'cvf_session' && cookieValue) {
                return { value: cookieValue };
            }
            return undefined;
        },
    };
    return req;
}

describe('middleware-auth', () => {
    let envBackup: string | undefined;

    beforeEach(() => {
        envBackup = process.env.CVF_SESSION_SECRET;
        delete process.env.CVF_SESSION_SECRET;
    });

    afterEach(() => {
        if (envBackup !== undefined) {
            process.env.CVF_SESSION_SECRET = envBackup;
        } else {
            delete process.env.CVF_SESSION_SECRET;
        }
    });

    describe('verifySessionCookie', () => {
        it('returns null when no cookie is present', async () => {
            const req = fakeRequest();
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('returns null for empty cookie value', async () => {
            const req = fakeRequest('');
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('returns null when cookie has no dot separator', async () => {
            const req = fakeRequest('no-dot-here');
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('returns null for invalid signature', async () => {
            const payload: SessionCookie = {
                user: 'alice',
                role: 'admin',
                expiresAt: Date.now() + 60000,
            };
            const json = JSON.stringify(payload);
            const base = base64urlEncode(json);
            const req = fakeRequest(`${base}.invalidsignature`);
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('returns session for valid signed cookie', async () => {
            const payload: SessionCookie = {
                user: 'alice',
                role: 'admin',
                expiresAt: Date.now() + 60000,
            };
            const token = await makeSignedToken(payload, DEFAULT_SECRET);
            const req = fakeRequest(token);
            const result = await verifySessionCookie(req);
            expect(result).not.toBeNull();
            expect(result!.user).toBe('alice');
            expect(result!.role).toBe('admin');
        });

        it('returns null for expired session', async () => {
            const payload: SessionCookie = {
                user: 'bob',
                role: 'viewer',
                expiresAt: Date.now() - 1000, // expired
            };
            const token = await makeSignedToken(payload, DEFAULT_SECRET);
            const req = fakeRequest(token);
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('uses CVF_SESSION_SECRET env var when set', async () => {
            const customSecret = 'my-custom-secret-123';
            process.env.CVF_SESSION_SECRET = customSecret;

            const payload: SessionCookie = {
                user: 'charlie',
                role: 'editor',
                expiresAt: Date.now() + 60000,
            };
            const token = await makeSignedToken(payload, customSecret);
            const req = fakeRequest(token);
            const result = await verifySessionCookie(req);
            expect(result).not.toBeNull();
            expect(result!.user).toBe('charlie');
        });

        it('rejects cookie signed with wrong secret', async () => {
            process.env.CVF_SESSION_SECRET = 'correct-secret';

            const payload: SessionCookie = {
                user: 'eve',
                role: 'admin',
                expiresAt: Date.now() + 60000,
            };
            const token = await makeSignedToken(payload, 'wrong-secret');
            const req = fakeRequest(token);
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('parses cookie from Cookie header among multiple cookies', async () => {
            const payload: SessionCookie = {
                user: 'dave',
                role: 'admin',
                expiresAt: Date.now() + 60000,
            };
            const token = await makeSignedToken(payload, DEFAULT_SECRET);
            const headers = new Headers();
            headers.set('cookie', `other=value; cvf_session=${token}; another=123`);
            const req = new Request('http://localhost/', { headers });
            const result = await verifySessionCookie(req);
            expect(result).not.toBeNull();
            expect(result!.user).toBe('dave');
        });

        it('works with NextRequest-style cookies API', async () => {
            const payload: SessionCookie = {
                user: 'frank',
                role: 'viewer',
                expiresAt: Date.now() + 60000,
            };
            const token = await makeSignedToken(payload, DEFAULT_SECRET);
            const req = fakeRequestWithCookiesApi(token);
            const result = await verifySessionCookie(req);
            expect(result).not.toBeNull();
            expect(result!.user).toBe('frank');
        });

        it('returns null when cookies API returns undefined', async () => {
            const req = fakeRequestWithCookiesApi(undefined);
            expect(await verifySessionCookie(req)).toBeNull();
        });

        it('returns null for malformed JSON payload', async () => {
            const badJson = 'not-valid-json';
            const base = base64urlEncode(badJson);
            const decoded = atob(base.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base.length % 4)) % 4));
            const sig = await hmacSha256Hex(DEFAULT_SECRET, decoded);
            const req = fakeRequest(`${base}.${sig}`);
            expect(await verifySessionCookie(req)).toBeNull();
        });
    });
});
