import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { GET } from './route';

const secret = 'test-secret';

function makeSessionCookie(user = 'tester', role = 'admin') {
    const payload = {
        user,
        role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60,
    };
    const json = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', secret).update(json).digest('hex');
    const base = Buffer.from(json).toString('base64url');
    return `${base}.${sig}`;
}

describe('/api/auth/me', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv, CVF_SESSION_SECRET: secret };
    });

    it('returns 401 when no session', async () => {
        const req = new Request('http://localhost/api/auth/me');
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('returns user info when session valid', async () => {
        const req = new Request('http://localhost/api/auth/me', {
            headers: { cookie: `cvf_session=${makeSessionCookie('alice', 'editor')}` },
        });
        const res = await GET(req as any);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user).toBe('alice');
        expect(data.role).toBe('editor');
    });
});
