import { afterEach, describe, it, expect, vi } from 'vitest';

const authMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const getTokenMock = vi.hoisted(() => vi.fn());
const getActiveImpersonationSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
    auth: authMock,
    authSecret: 'test-secret',
}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}));

vi.mock('next-auth/jwt', () => ({
    getToken: getTokenMock,
}));

vi.mock('@/lib/policy-reader', () => ({
    getActiveImpersonationSession: getActiveImpersonationSessionMock,
}));

import { resolveVerifiedSessionProvenance, verifySessionCookie } from './middleware-auth';

afterEach(() => vi.unstubAllEnvs());

function fakeRequest(cookieHeader = ''): Request {
    return new Request('http://localhost/api/auth/me', {
        headers: { cookie: cookieHeader },
    });
}

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

    describe('verifySessionCookie with a supplied request', () => {
        it('calls getToken with the request and configured secret instead of auth()', async () => {
            getTokenMock.mockResolvedValueOnce(null);
            const request = fakeRequest();

            await verifySessionCookie(request);

            expect(getTokenMock).toHaveBeenCalledTimes(1);
            expect(getTokenMock).toHaveBeenCalledWith({ req: request, secret: 'test-secret' });
            expect(authMock).not.toHaveBeenCalled();
        });

        it('returns null when getToken resolves to null', async () => {
            getTokenMock.mockResolvedValueOnce(null);
            const result = await verifySessionCookie(fakeRequest());
            expect(result).toBeNull();
        });

        it('maps request token claims to SessionCookie fields including expiry', async () => {
            const expSeconds = Math.floor(Date.now() / 1000) + 3600;
            getTokenMock.mockResolvedValueOnce({
                name: 'Bob Developer',
                email: 'dev@cvf.local',
                role: 'developer',
                userId: 'usr_3',
                orgId: 'org_cvf',
                teamId: 'team_eng',
                exp: expSeconds,
            });

            const result = await verifySessionCookie(fakeRequest());

            expect(result).not.toBeNull();
            expect(result!.userId).toBe('usr_3');
            expect(result!.user).toBe('Bob Developer');
            expect(result!.role).toBe('developer');
            expect(result!.orgId).toBe('org_cvf');
            expect(result!.teamId).toBe('team_eng');
            expect(result!.expiresAt).toBe(expSeconds * 1000);
            expect(result!.authMode).toBe('session');
        });

        it('falls back to email and default role/org/team when claims are missing', async () => {
            getTokenMock.mockResolvedValueOnce({
                email: 'bob@example.com',
                exp: Math.floor(Date.now() / 1000) + 60,
            });

            const result = await verifySessionCookie(fakeRequest());

            expect(result).not.toBeNull();
            expect(result!.user).toBe('bob@example.com');
            expect(result!.role).toBe('developer');
            expect(result!.orgId).toBe('org_cvf');
            expect(result!.teamId).toBe('team_eng');
        });

        it('overlays the impersonated user for a request carrying a valid impersonation cookie', async () => {
            getTokenMock.mockResolvedValueOnce({
                name: 'John Owner',
                email: 'owner@cvf.local',
                role: 'owner',
                userId: 'usr_1',
                orgId: 'org_cvf',
                teamId: 'team_exec',
                exp: Math.floor(Date.now() / 1000) + 3600,
            });
            getActiveImpersonationSessionMock.mockResolvedValueOnce({
                sessionId: 'imp-session-2',
                realActorId: 'usr_1',
                impersonatedUserId: 'usr_3',
                startedAt: '2026-04-18T00:00:00.000Z',
                expiresAt: '2026-04-18T01:00:00.000Z',
                status: 'started',
            });

            const request = fakeRequest('cvf_impersonation=imp-session-2');
            const result = await verifySessionCookie(request);

            expect(result).not.toBeNull();
            expect(result!.userId).toBe('usr_3');
            expect(result!.realUserId).toBe('usr_1');
            expect(result!.realRole).toBe('owner');
            expect(result!.impersonation?.sessionId).toBe('imp-session-2');
        });
    });

    describe('production OAuth binding', () => {
        const binding = JSON.stringify([{
            provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
            role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
        }]);

        function productionProfile() {
            vi.stubEnv('NODE_ENV', 'production');
            vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', binding);
        }

        it('rejects a legacy/default-bearing token without an OAuth binding marker', async () => {
            productionProfile();
            getTokenMock.mockResolvedValueOnce({ userId: 'usr_1', role: 'owner', exp: 9999999999 });
            expect(await verifySessionCookie(fakeRequest())).toBeNull();
        });

        it('derives role and CVF identity from the current binding, not token claims', async () => {
            productionProfile();
            getTokenMock.mockResolvedValueOnce({
                authSource: 'oauth_bound', oauthProvider: 'github', oauthSubject: 'subject-1',
                userId: 'forged', role: 'owner', orgId: 'forged', teamId: 'forged', exp: 9999999999,
            });
            const result = await verifySessionCookie(fakeRequest());
            expect(result).toMatchObject({
                userId: 'cvf-user-1', role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
            });
        });

        it('rejects a formerly bound subject after its binding is removed', async () => {
            productionProfile();
            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', '[]');
            getTokenMock.mockResolvedValueOnce({
                authSource: 'oauth_bound', oauthProvider: 'github', oauthSubject: 'subject-1', exp: 9999999999,
            });
            expect(await verifySessionCookie(fakeRequest())).toBeNull();
        });

        it('rejects an ambient session without current OAuth binding metadata', async () => {
            productionProfile();
            authMock.mockResolvedValueOnce({
                user: { userId: 'usr_1', role: 'owner' }, expires: new Date(Date.now() + 60000).toISOString(),
            });
            expect(await verifySessionCookie()).toBeNull();
        });
    });

    describe('resolveVerifiedSessionProvenance', () => {
        const bindingJson = JSON.stringify([{
            provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
            role: 'reviewer', orgId: 'org_bound', teamId: 'team_sec',
        }]);
        const NOW = 1_800_000_000_000;
        const FUTURE_EXP = Math.floor(NOW / 1000) + 3600;

        function configureBinding(raw: string = bindingJson, nodeEnv = 'production') {
            vi.stubEnv('NODE_ENV', nodeEnv);
            vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', raw);
        }

        function boundToken(overrides: Record<string, unknown> = {}) {
            return {
                authSource: 'oauth_bound', oauthProvider: 'github', oauthSubject: 'subject-1',
                userId: 'forged-user', role: 'owner', orgId: 'forged-org', teamId: 'forged-team',
                exp: FUTURE_EXP, ...overrides,
            };
        }

        it('qualifies a complete, unexpired, non-impersonated bound token with binding values only', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken());
            getActiveImpersonationSessionMock.mockResolvedValue(null);

            const result = await resolveVerifiedSessionProvenance(fakeRequest(), NOW);

            expect(getTokenMock).toHaveBeenCalledWith({ req: expect.any(Request), secret: 'test-secret' });
            expect(result).toEqual({
                qualified: true,
                userId: 'cvf-user-1',
                orgId: 'org_bound',
                teamId: 'team_sec',
                role: 'reviewer',
                oauthProvider: 'github',
                oauthSubject: 'subject-1',
                expiresAt: FUTURE_EXP * 1000,
            });
        });

        it('qualifies under NODE_ENV test only when an explicit matching binding is configured', async () => {
            configureBinding(bindingJson, 'test');
            getTokenMock.mockResolvedValueOnce(boundToken());
            const result = await resolveVerifiedSessionProvenance(fakeRequest(), NOW);
            expect(result).toMatchObject({ qualified: true, userId: 'cvf-user-1', orgId: 'org_bound' });
        });

        it('returns NO_SESSION when no token exists', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(null);
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'NO_SESSION' });
        });

        it('returns NOT_OAUTH_BOUND for a local_mock token', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken({ authSource: 'local_mock' }));
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'NOT_OAUTH_BOUND' });
        });

        it('returns NOT_OAUTH_BOUND for a token without any authSource marker', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce({ userId: 'usr_1', role: 'owner', exp: FUTURE_EXP });
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'NOT_OAUTH_BOUND' });
        });

        it('returns NOT_OAUTH_BOUND when the token provider differs from the configured provider', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken({ oauthProvider: 'google' }));
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'NOT_OAUTH_BOUND' });
        });

        it('returns NOT_OAUTH_BOUND when no OAuth provider is configured', async () => {
            configureBinding();
            vi.stubEnv('CVF_OAUTH_PROVIDER', '');
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'NOT_OAUTH_BOUND' });
        });

        it('returns BINDING_MISSING in production when the subject has no configured binding', async () => {
            configureBinding('[]');
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'BINDING_MISSING' });
        });

        it('returns BINDING_INCOMPLETE because the strict parser rejects incomplete binding entries', async () => {
            // parseOAuthIdentityBindings throws on a missing/empty field; the resolver
            // must convert that into an unqualified result instead of throwing.
            configureBinding(JSON.stringify([{
                provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
                role: 'reviewer', orgId: 'org_bound', teamId: '',
            }]));
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'BINDING_INCOMPLETE' });
        });

        it('returns BINDING_INCOMPLETE for unparseable binding configuration', async () => {
            configureBinding('{not json');
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'BINDING_INCOMPLETE' });
        });

        it('returns EXPIRED when the token expiry is not after now', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken({ exp: Math.floor(NOW / 1000) }));
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'EXPIRED' });
        });

        it('returns EXPIRED when the token has no expiry', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken({ exp: undefined }));
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'EXPIRED' });
        });

        it('returns IMPERSONATED when an active impersonation session exists for the real actor', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken());
            getActiveImpersonationSessionMock.mockResolvedValueOnce({
                sessionId: 'imp-session-9',
                realActorId: 'cvf-user-1',
                impersonatedUserId: 'usr_3',
                startedAt: '2026-04-18T00:00:00.000Z',
                expiresAt: '2026-04-18T01:00:00.000Z',
                status: 'started',
            });

            const result = await resolveVerifiedSessionProvenance(fakeRequest('cvf_impersonation=imp-session-9'), NOW);

            expect(getActiveImpersonationSessionMock).toHaveBeenCalledWith('imp-session-9');
            expect(result).toEqual({ qualified: false, reason: 'IMPERSONATED' });
        });

        it('ignores an impersonation session that belongs to a different real actor', async () => {
            configureBinding();
            getTokenMock.mockResolvedValueOnce(boundToken());
            getActiveImpersonationSessionMock.mockResolvedValueOnce({
                sessionId: 'imp-session-10',
                realActorId: 'someone-else',
                impersonatedUserId: 'usr_3',
                startedAt: '2026-04-18T00:00:00.000Z',
                expiresAt: '2026-04-18T01:00:00.000Z',
                status: 'started',
            });

            const result = await resolveVerifiedSessionProvenance(fakeRequest('cvf_impersonation=imp-session-10'), NOW);

            expect(result).toMatchObject({ qualified: true, userId: 'cvf-user-1' });
        });

        it('returns DEVELOPMENT_FALLBACK under test/development when no matching binding is configured', async () => {
            vi.stubEnv('NODE_ENV', 'test');
            vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', '');
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'DEVELOPMENT_FALLBACK' });

            vi.stubEnv('NODE_ENV', 'development');
            getTokenMock.mockResolvedValueOnce(boundToken());
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'DEVELOPMENT_FALLBACK' });
        });

        it('never treats legacy fallback identities as qualified while verifySessionCookie still returns them', async () => {
            vi.stubEnv('NODE_ENV', 'test');
            vi.stubEnv('CVF_OAUTH_PROVIDER', '');
            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', '');
            getTokenMock.mockResolvedValue({ email: 'bob@example.com', exp: FUTURE_EXP });

            const legacy = await verifySessionCookie(fakeRequest());
            const provenance = await resolveVerifiedSessionProvenance(fakeRequest(), NOW);

            expect(legacy).toMatchObject({ userId: 'unknown-user', orgId: 'org_cvf', teamId: 'team_eng' });
            expect(provenance.qualified).toBe(false);
            getTokenMock.mockReset();
        });

        it('re-reads configuration on every call so a changed or removed binding changes the result', async () => {
            configureBinding();
            getTokenMock.mockResolvedValue(boundToken());

            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toMatchObject({ qualified: true, role: 'reviewer', teamId: 'team_sec' });

            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', JSON.stringify([{
                provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
                role: 'viewer', orgId: 'org_bound', teamId: 'team_ops',
            }]));
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toMatchObject({ qualified: true, role: 'viewer', teamId: 'team_ops' });

            vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', '[]');
            expect(await resolveVerifiedSessionProvenance(fakeRequest(), NOW))
                .toEqual({ qualified: false, reason: 'BINDING_MISSING' });

            getTokenMock.mockReset();
        });

        it('does not change verifySessionCookie output for a bound production token', async () => {
            configureBinding();
            getTokenMock.mockResolvedValue(boundToken());

            const legacy = await verifySessionCookie(fakeRequest());
            const provenance = await resolveVerifiedSessionProvenance(fakeRequest(), NOW);

            expect(legacy).toMatchObject({ userId: 'cvf-user-1', orgId: 'org_bound', teamId: 'team_sec', role: 'reviewer' });
            expect(provenance).toMatchObject({ qualified: true, userId: 'cvf-user-1' });
            getTokenMock.mockReset();
        });
    });
});
