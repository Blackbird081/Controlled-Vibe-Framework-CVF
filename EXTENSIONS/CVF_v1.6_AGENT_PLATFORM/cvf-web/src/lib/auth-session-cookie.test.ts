import { encode } from '@auth/core/jwt';
import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getIdentity } from '@/app/api/auth/me/route';
import { GET as getProviders } from '@/app/api/providers/route';
import { verifiedJevCookieBinding } from '@/app/api/skills/suggest/handlers';
import { resolveVerifiedSessionProvenance } from './middleware-auth';

const secret = vi.hoisted(() => 'auth-session-cookie-regression-fixture');
vi.mock('@/auth', () => ({ auth: vi.fn(), authSecret: secret }));
vi.mock('@/lib/server/claude-cli-profile', () => ({
    isClaudeSubscriptionMode: () => true,
    claudeSubscriptionReadiness: () => null,
}));

const httpName = 'authjs.session-token';
const httpsName = '__Secure-authjs.session-token';
const binding = {
    provider: 'github', providerAccountId: 'fixture-github-subject',
    userId: 'fixture-admin', role: 'admin', orgId: 'fixture-org', teamId: 'fixture-team',
};

function encodeSession(salt: string) {
    return encode({ secret, salt, token: {
        name: 'Fixture Admin', authSource: 'oauth_bound', oauthProvider: binding.provider,
        oauthSubject: binding.providerAccountId, userId: 'old-id', role: 'viewer',
    } });
}

describe('request-bound Auth.js session cookies', () => {
    beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
        vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', JSON.stringify([binding]));
        vi.stubEnv('AUTH_URL', undefined);
        vi.stubEnv('NEXTAUTH_URL', undefined);
    });

    afterEach(() => vi.unstubAllEnvs());

    it.each([
        { label: 'HTTPS from the request', url: 'https://web.example.test', name: httpsName },
        { label: 'HTTP loopback', url: 'http://localhost:3000', name: httpName },
        { label: 'NEXTAUTH_URL behind a proxy', url: 'http://internal.example.test', name: httpsName,
            nextAuthUrl: 'https://web.example.test' },
        { label: 'AUTH_URL before NEXTAUTH_URL', url: 'http://internal.example.test', name: httpsName,
            authUrl: 'https://web.example.test', nextAuthUrl: 'http://localhost:3000' },
        { label: 'HTTP despite a forwarded proto header', url: 'http://localhost:3000', name: httpName,
            forwardedProto: 'https' },
    ])('returns the bound admin and qualifying provenance over $label', async ({ url, name, authUrl, nextAuthUrl, forwardedProto }) => {
        vi.stubEnv('AUTH_URL', authUrl);
        vi.stubEnv('NEXTAUTH_URL', nextAuthUrl);
        const headers = new Headers({ cookie: `${name}=${await encodeSession(name)}` });
        if (forwardedProto) headers.set('x-forwarded-proto', forwardedProto);
        const request = new Request(`${url}/api/auth/me`, { headers });

        const response = await getIdentity(request);

        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ authenticated: true, role: 'admin', userId: binding.userId });
        expect(await resolveVerifiedSessionProvenance(request)).toMatchObject({
            qualified: true, role: 'admin', userId: binding.userId,
        });
    });

    it('rejects the HTTP cookie on HTTPS', async () => {
        const request = new Request('https://web.example.test/api/auth/me', {
            headers: { cookie: `${httpName}=${await encodeSession(httpName)}` },
        });

        const response = await getIdentity(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ authenticated: false });
        expect(await resolveVerifiedSessionProvenance(request)).toEqual({ qualified: false, reason: 'NO_SESSION' });
        const jevRequest = new NextRequest('https://web.example.test/api/skills/suggest', { headers: request.headers });
        expect(verifiedJevCookieBinding(jevRequest)).toBeNull();
    });

    it.each([false, true])('binds the HTTPS Jev cookie with chunked=%s', async (chunked) => {
        const token = await encodeSession(httpsName);
        const split = Math.floor(token.length / 2);
        const cookie = chunked
            ? `${httpsName}.1=${token.slice(split)}; ${httpsName}.0=${token.slice(0, split)}`
            : `${httpsName}=${token}`;
        const request = new NextRequest('https://web.example.test/api/skills/suggest', { headers: { cookie } });

        expect(verifiedJevCookieBinding(request)).toBe(createHash('sha256').update(token).digest('hex'));
        expect(await resolveVerifiedSessionProvenance(request)).toMatchObject({ qualified: true, role: 'admin' });
    });

    it('admits a bound HTTPS session to the authenticated providers branch', async () => {
        const url = 'https://web.example.test/api/providers';
        expect((await getProviders(new NextRequest(url))).status).toBe(401);
        const headers = { cookie: `${httpsName}=${await encodeSession(httpsName)}` };

        expect((await getProviders(new NextRequest(url, { headers }))).status).toBe(200);
    });
});
