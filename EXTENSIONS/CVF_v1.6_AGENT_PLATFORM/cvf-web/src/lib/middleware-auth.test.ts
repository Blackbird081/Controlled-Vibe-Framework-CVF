import { describe, it, expect, vi } from 'vitest';

const authMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
    auth: authMock,
}));

import { verifySessionCookie } from './middleware-auth';

describe('middleware-auth', () => {
    describe('verifySessionCookie', () => {
        it('returns null when auth() has no session', async () => {
            authMock.mockResolvedValueOnce(null);
            const result = await verifySessionCookie();
            expect(result).toBeNull();
        });

        it('returns null when auth() has no user', async () => {
            authMock.mockResolvedValueOnce({ user: null, expires: new Date().toISOString() });
            const result = await verifySessionCookie();
            expect(result).toBeNull();
        });

        it('maps auth session to SessionCookie fields', async () => {
            authMock.mockResolvedValueOnce({
                user: {
                    name: 'Alice',
                    email: 'alice@example.com',
                    role: 'admin',
                    userId: 'usr_2',
                    orgId: 'org_cvf',
                    teamId: 'team_exec',
                },
                expires: new Date(Date.now() + 60000).toISOString(),
            });
            const result = await verifySessionCookie();
            expect(result).not.toBeNull();
            expect(result!.userId).toBe('usr_2');
            expect(result!.user).toBe('Alice');
            expect(result!.role).toBe('admin');
            expect(result!.orgId).toBe('org_cvf');
            expect(result!.teamId).toBe('team_exec');
            expect(result!.expiresAt).toBeGreaterThan(Date.now());
        });

        it('falls back to email and default role when role missing', async () => {
            authMock.mockResolvedValueOnce({
                user: { email: 'bob@example.com' },
                expires: new Date(Date.now() + 60000).toISOString(),
            });
            const result = await verifySessionCookie();
            expect(result).not.toBeNull();
            expect(result!.user).toBe('bob@example.com');
            expect(result!.role).toBe('developer');
            expect(result!.orgId).toBe('org_cvf');
            expect(result!.teamId).toBe('team_eng');
        });
    });
});
