import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: verifySessionCookieMock,
}));

describe('/api/auth/me', () => {
    beforeEach(() => {
        verifySessionCookieMock.mockReset();
    });

    it('returns 401 when no session', async () => {
        verifySessionCookieMock.mockResolvedValueOnce(null);
        const req = new Request('http://localhost/api/auth/me');
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('returns user info when session valid', async () => {
        verifySessionCookieMock.mockResolvedValueOnce({
            user: 'alice',
            role: 'editor',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        const req = new Request('http://localhost/api/auth/me');
        const res = await GET(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user).toBe('alice');
        expect(data.role).toBe('editor');
    });
});
