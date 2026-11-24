import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { isLoopbackHostname } from '@/lib/server/browser-origin';
import { draftRouteHandlers } from '@/lib/server/html-draft-recovery-api';
import { jobRouteHandlers } from '@/lib/server/html-job-api';
import { POST as exportArtifact } from './artifacts/export/route';
import { POST as submitHomeJev } from './intent-spec/jev/route';
import { POST as saveReview } from './intent-spec/reviews/route';
import { skillSuggestionHandlers } from './skills/suggest/handlers';

const { owner, session } = vi.hoisted(() => {
    const owner = { userId: 'fixture', teamId: 'fixture-team', orgId: 'fixture-org' };
    const session = async () => ({
        ...owner, user: 'Fixture owner', role: 'owner' as const,
        expiresAt: Date.now() + 60_000, authMode: 'session' as const,
    });
    return { owner, session };
});

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: session }));
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: session }));
vi.mock('@/lib/server/html-job-synthetic-profile', () => ({ resolveHtmlJobSyntheticProfile: () => ({}) }));
vi.mock('@/lib/server/ncr-html-pilot-runtime-profile', () => ({ loadHtmlPilotRuntimeProfile: async () => ({ owner }) }));

it('recognizes only the supported loopback hostnames', () => {
    for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
        expect(isLoopbackHostname(hostname)).toBe(true);
    }
    for (const hostname of ['example.com', '127.0.0.2', 'localhost.example.com', '']) {
        expect(isLoopbackHostname(hostname)).toBe(false);
    }
});

const endpoint = '/api/artifacts/export';
const cases = [
    { name: 'home Jev', path: '/api/intent-spec/jev', post: submitHomeJev, status: 400, code: 'JEV_INVALID_REQUEST' },
    { name: 'skill suggestion', path: '/api/skills/suggest', post: skillSuggestionHandlers().POST, status: 422, code: 'INVALID_REQUEST' },
    { name: 'spec review', path: '/api/intent-spec/reviews', post: saveReview, status: 400, code: 'INVALID_BODY' },
    { name: 'HTML draft', path: '/api/artifacts/drafts', post: draftRouteHandlers().POST, status: 503, code: 'DRAFT_PROFILE_DISABLED' },
    { name: 'HTML job', path: '/api/artifacts/jobs', post: jobRouteHandlers().POST, status: 503, code: 'JOB_PROFILE_DISABLED' },
    { name: 'selected artifact export', path: endpoint, post: exportArtifact, status: 400, code: 'Missing required artifact export fields.' },
    { name: 'pilot artifact export', path: endpoint, post: exportArtifact, pilot: true, status: 422, code: 'PILOT_JOB_SELECTOR_REQUIRED' },
];

describe.each(cases)('$name origin check', ({ path, post, pilot, status, code }) => {
    describe.each(['127.0.0.1', 'localhost'])('browser host %s', hostname => {
        const host = `${hostname}:3898`;
        const origin = `http://${host}`;
        const request = (from: string | null, site: string | null, requestHost: string | null = host) => {
            const headers = new Headers({
                'Content-Type': 'application/json', Cookie: 'authjs.session-token=fixture',
            });
            if (requestHost !== null) headers.set('Host', requestHost);
            if (from !== null) headers.set('Origin', from);
            if (site !== null) headers.set('Sec-Fetch-Site', site);
            if (pilot) headers.set('X-CVF-HTML-Pilot', '1');
            // Next can normalize request.url to localhost while retaining the browser's Host.
            return new NextRequest(`http://localhost:3898${path}`, { method: 'POST', headers, body: '{}' });
        };

        it.each(['same-origin', null])('passes a matching origin with Sec-Fetch-Site %s', async site => {
            const response = await post(request(origin, site));
            const body = await response.json();
            expect([response.status, body.code ?? body.error]).toEqual([status, code]);
        });

        it.each([
            { name: 'a foreign origin', from: 'https://fixture.invalid', site: 'same-origin' },
            { name: 'a different port', from: `http://${hostname}:3899`, site: 'same-origin' },
            { name: 'a different scheme', from: `https://${host}`, site: 'same-origin' },
            { name: 'the other loopback host', from: `http://${hostname === 'localhost' ? '127.0.0.1' : 'localhost'}:3898`, site: 'same-origin' },
            { name: 'a missing Origin', from: null, site: 'same-origin' },
            { name: 'cross-site fetch metadata', from: origin, site: 'cross-site' },
        ])('refuses $name', async ({ from, site }) => {
            const response = await post(request(from, site));
            const body = await response.json();
            expect([response.status, body.code ?? body.error]).toEqual([403, 'ORIGIN_REFUSED']);
        });

        it('requires a Host header for a loopback request', async () => {
            const response = await post(request(origin, 'same-origin', null));
            const body = await response.json();
            expect([response.status, body.code ?? body.error]).toEqual([403, 'ORIGIN_REFUSED']);
        });
    });
});
