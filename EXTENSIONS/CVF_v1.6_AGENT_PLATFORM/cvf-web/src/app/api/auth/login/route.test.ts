import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock @/lib/auth so cookies() is never actually called
vi.mock('@/lib/auth', () => ({
    createSession: vi.fn().mockResolvedValue({ user: 'admin', role: 'admin', issuedAt: 0, expiresAt: 0 }),
}));

import { POST } from './route';

const buildRequest = (body: any) =>
    new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });

describe('/api/auth/login', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv, CVF_ADMIN_USER: 'admin', CVF_ADMIN_PASS: 'secret', CVF_SESSION_SECRET: 'test' };
    });

    it('rejects missing credentials', async () => {
        const res = await POST(buildRequest({}));
        expect(res.status).toBe(400);
    });

    it('rejects wrong credentials', async () => {
        const res = await POST(buildRequest({ username: 'admin', password: 'wrong' }));
        expect(res.status).toBe(401);
    });

    it('returns success on valid credentials', async () => {
        const res = await POST(buildRequest({ username: 'admin', password: 'secret' }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.user).toBe('admin');
    });

    it('accepts editor role', async () => {
        const res = await POST(buildRequest({ username: 'admin', password: 'secret', role: 'editor' }));
        const json = await res.json();
        expect(json.role).toBe('editor');
    });

    it('returns 500 on malformed request body', async () => {
        const req = new Request('http://localhost/api/auth/login', {
            method: 'POST',
            body: 'not-json',
            headers: { 'Content-Type': 'application/json' },
        });
        const res = await POST(req);
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.success).toBe(false);
    });
});
