import { describe, it, expect, vi } from 'vitest';

const authMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const getActiveImpersonationSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
    auth: authMock,
}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}));

vi.mock('@/lib/policy-reader', () => ({
    getActiveImpersonationSession: getActiveImpersonationSessionMock,
}));

import { verifySessionCookie } from './middleware-auth';

describe('middleware-auth', () => {
    describe('verifySessionCookie', () => {
        it('returns null when auth() has no session', async () => {
            cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
            getActiveImpersonationSessionMock.mockResolvedValue(null);
            authMock.mockResolvedValueOnce(null);
            const result = await verifySessionCookie();
            expect(result).toBeNull();
        });

        it('returns null when auth() has no user', async () => {
            cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
            getActiveImpersonationSessionMock.mockResolvedValue(null);
            authMock.mockResolvedValueOnce({ user: null, expires: new Date().toISOString() });
            const result = await verifySessionCookie();
            expect(result).toBeNull();
        });

        it('maps auth session to SessionCookie fields', async () => {
            cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
            getActiveImpersonationSessionMock.mockResolvedValue(null);
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
            expect(result!.authMode).toBe('session');
        });

        it('falls back to email and default role when role missing', async () => {
            cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
            getActiveImpersonationSessionMock.mockResolvedValue(null);
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

        it('overlays the impersonated user when a valid impersonation session exists', async () => {
            cookiesMock.mockResolvedValue({
                get: vi.fn().mockReturnValue({ value: 'imp-session-1' }),
            });
            getActiveImpersonationSessionMock.mockResolvedValue({
                sessionId: 'imp-session-1',
                realActorId: 'usr_1',
                impersonatedUserId: 'usr_3',
                startedAt: '2026-04-18T00:00:00.000Z',
                expiresAt: '2026-04-18T01:00:00.000Z',
                status: 'started',
            });
            authMock.mockResolvedValueOnce({
                user: {
                    name: 'John Owner',
                    email: 'owner@cvf.local',
                    role: 'owner',
                    userId: 'usr_1',
                    orgId: 'org_cvf',
                    teamId: 'team_exec',
                },
                expires: new Date(Date.now() + 60000).toISOString(),
            });

            const result = await verifySessionCookie();

            expect(result).not.toBeNull();
            expect(result!.userId).toBe('usr_3');
            expect(result!.role).toBe('developer');
            expect(result!.realUserId).toBe('usr_1');
            expect(result!.realRole).toBe('owner');
            expect(result!.impersonation?.sessionId).toBe('imp-session-1');
        });
    });
});
