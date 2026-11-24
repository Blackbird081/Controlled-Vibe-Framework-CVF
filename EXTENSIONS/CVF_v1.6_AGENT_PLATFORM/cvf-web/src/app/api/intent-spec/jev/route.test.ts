import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { decideWebJevChoice } from '@/lib/server/jev-web-transport';
import { WebJevRefusal } from '@/lib/server/jev-web-store';

const fixture = vi.hoisted(() => ({
    role: 'admin',
    signedIn: true,
    status: vi.fn(),
    preference: vi.fn(),
    feedback: vi.fn(),
    ownsJourney: vi.fn(),
    acceptsTemplate: vi.fn(),
    offerKeyword: vi.fn(),
    recordChoice: vi.fn(),
    choose: vi.fn(),
    fields: vi.fn(),
    skills: vi.fn(),
}));

vi.mock('@/lib/intent-spec-actor', () => ({
    resolveIntentSpecActor: async () => ({ userId: 'fixture', teamId: 'team', orgId: 'org', role: fixture.role }),
}));
vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: async () => fixture.signedIn ? { authMode: 'session', role: fixture.role } : null,
}));
vi.mock('@/lib/server/jev-web-store', async importOriginal => ({
    ...await importOriginal<typeof import('@/lib/server/jev-web-store')>(),
    openWebJevStore: () => fixture,
}));
vi.mock('@/lib/server/jev-web-transport', async importOriginal => ({
    ...await importOriginal<typeof import('@/lib/server/jev-web-transport')>(),
    isWebJevAvailable: () => true,
    WebJevTransport: class {
        choose = fixture.choose;
        fields = fixture.fields;
        skills = fixture.skills;
    },
}));

const origin = 'http://localhost:3868';
const endpoint = origin + '/api/intent-spec/jev';
const goal = 'Write a standard operating procedure for handing over orders.';
const runId = '1cfb5c99-6d9d-45cf-b483-37541e9fd548';
const post = (payload: Record<string, unknown>, from = origin) => POST(new Request(endpoint, {
    method: 'POST', headers: { Host: 'localhost:3868', Origin: from, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
}));

describe('Home Jev route', () => {
    beforeEach(() => {
        fixture.role = 'admin';
        fixture.signedIn = true;
        fixture.status.mockReturnValue({ enabled: true, reason: null });
        fixture.ownsJourney.mockReturnValue(true);
        fixture.acceptsTemplate.mockReturnValue(true);
        fixture.choose.mockResolvedValue({ templateId: 'documentation', probability: 0.81, decision: 'preselect' });
    });
    afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });

    it('enforces the browser host for normalized production loopback requests', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const local = (origin: string, host: string, site = 'same-origin') => POST(new Request(endpoint, {
            method: 'POST', headers: { Origin: origin, Host: host, 'Sec-Fetch-Site': site }, body: '{}',
        }));
        expect((await local('http://localhost:3868', 'localhost:3868')).status).toBe(400);
        expect((await local('http://127.0.0.1:3868', '127.0.0.1:3868')).status).toBe(400);
        expect((await local('http://evil.test:3868', 'evil.test:3868')).status).toBe(403);
        expect((await local('http://localhost:3868', '127.0.0.1:3868')).status).toBe(403);
        expect((await local('http://127.0.0.1:3869', '127.0.0.1:3869')).status).toBe(403);
        expect((await local('http://127.0.0.1:3868', '127.0.0.1:3868', 'cross-site')).status).toBe(403);
        expect(fixture.choose).not.toHaveBeenCalled();
    });

    it.each(['developer', 'reviewer', 'viewer'])('refuses the %s role before provider use', async role => {
        fixture.role = role;
        expect((await GET(new Request(endpoint))).status).toBe(403);
        expect((await post({ action: 'choose', goal })).status).toBe(403);
        expect(fixture.choose).not.toHaveBeenCalled();
    });

    it('refuses cross-origin and over-specified writes', async () => {
        expect((await post({ action: 'choose', goal }, 'http://example.test')).status).toBe(403);
        expect((await post({ action: 'choose', goal, role: 'owner' })).status).toBe(400);
        expect(fixture.choose).not.toHaveBeenCalled();
    });

    it('uses the exact loopback browser host when Next normalizes the local URL', async () => {
        const local = (origin: string, host: string) => POST(new Request(endpoint, {
            method: 'POST',
            headers: { Origin: origin, Host: host, 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'choose', goal }),
        }));
        expect((await local('http://127.0.0.1:3868', '127.0.0.1:3868')).status).toBe(200);
        expect((await local('http://localhost:3868', '127.0.0.1:3868')).status).toBe(403);
        expect((await local('http://127.0.0.1:3869', '127.0.0.1:3869')).status).toBe(403);
    });

    it('returns the choice and retains only the local decision data', async () => {
        const result = await (await post({ action: 'choose', goal })).json();
        expect(result).toMatchObject({ decision: 'preselect', templateId: 'documentation', probability: 0.81 });
        expect(fixture.recordChoice).toHaveBeenCalledWith(expect.any(String), result.runId, {
            templateId: 'documentation', probability: 0.81, decision: 'preselect', keywordTemplateId: null,
        });
        expect(JSON.stringify(fixture.recordChoice.mock.calls)).not.toContain(goal);
    });

    it('keeps the existing keyword path available while the preference is off', async () => {
        fixture.status.mockReturnValue({ enabled: false, reason: 'selection_changes' });
        const result = await (await post({ action: 'choose', goal })).json();
        expect(result).toMatchObject({ decision: 'fallback', fallback: 'disabled', probability: null });
        expect(fixture.choose).not.toHaveBeenCalled();
    });

    it.each(['owner', 'admin', 'developer', 'reviewer', 'viewer'])('lets the %s role choose an outcome without Jev', async role => {
        fixture.role = role;
        const result = await (await post({ action: 'choose', goal, templateId: 'tos_review' })).json();
        expect(result).toMatchObject({ templateId: 'tos_review', probability: null, fallback: null });
        expect(result).not.toHaveProperty('runId');
        expect(fixture.choose).not.toHaveBeenCalled();
        expect(fixture.recordChoice).not.toHaveBeenCalled();
    });

    it('requires a signed-in session for the manual endpoint', async () => {
        fixture.signedIn = false;
        expect((await post({ action: 'choose', goal, templateId: 'tos_review' })).status).toBe(401);
    });

    it('falls back when the account has used its minute allowance', async () => {
        fixture.choose.mockRejectedValue(new WebJevRefusal('rate_limit'));
        const result = await (await post({ action: 'choose', goal })).json();
        expect(result).toMatchObject({ decision: 'fallback', fallback: 'rate_limit' });
    });

    it('refuses selection and fields for a template that was never offered', async () => {
        fixture.feedback.mockReturnValue(null);
        fixture.acceptsTemplate.mockReturnValue(false);
        const selection = await post({ action: 'feedback', runId, event: 'selection', templateId: 'documentation' });
        const fields = await post({ action: 'fields', runId, templateId: 'documentation', goal });
        expect(selection.status).toBe(400);
        expect(fields.status).toBe(400);
        expect(fixture.fields).not.toHaveBeenCalled();
    });

    it('returns fields only for a journey owned by the signed-in account', async () => {
        const input = { action: 'fields', runId, templateId: 'documentation', goal };
        fixture.ownsJourney.mockReturnValue(false);
        expect((await post(input)).status).toBe(404);
        expect(fixture.fields).not.toHaveBeenCalled();
        fixture.ownsJourney.mockReturnValue(true);
        const missing = [{ id: 'readerGoal', label: 'What should the reader be able to do after reading?' }];
        fixture.fields.mockResolvedValue(missing);
        expect(await (await post(input)).json()).toEqual({ missing });
    });

    it('returns required export field IDs if Jev cannot check the product brief fields', async () => {
        fixture.fields.mockRejectedValue(new WebJevRefusal('unavailable'));
        const response = await post({ action: 'fields', runId, templateId: 'app_builder_complete', goal });
        const result = await response.json();
        expect(result.fallback).toBe('unavailable');
        expect(result.missing.map((field: { id: string }) => field.id)).toEqual([
            'appName', 'appType', 'problem', 'targetUsers', 'coreFeatures', 'outOfScope', 'successCriteria',
        ]);
    });
});

describe('Home Jev fixed thresholds', () => {
    it('excludes zero-probability padding without backfilling the top three', () => {
        expect(decideWebJevChoice('no_match', [
            { id: 'no_match', probability: 1 }, { id: 'documentation', probability: 0 },
            { id: 'faq', probability: 0 }, { id: 'review', probability: 0 },
        ])).toMatchObject({ decision: 'clarify', candidates: [] });
    });
    it('suppresses candidates when no_match ranks first', () => {
        expect(decideWebJevChoice('no_match', [
            { id: 'no_match', probability: .4 }, { id: 'documentation', probability: .3 },
            { id: 'faq', probability: .2 }, { id: 'review', probability: .1 },
        ])).toMatchObject({ decision: 'clarify', topNoMatch: true, candidates: [] });
    });
    it('uses the ranked leader even if the selected answer differs', () => {
        const noMatchLeads = [{ id: 'no_match', probability: .5 }, { id: 'documentation', probability: .3 }];
        expect(decideWebJevChoice('documentation', noMatchLeads)).toMatchObject({ topNoMatch: true, candidates: [] });
        const templateLeads = [{ id: 'documentation', probability: .5 }, { id: 'no_match', probability: .3 }];
        expect(decideWebJevChoice('no_match', templateLeads)).toMatchObject({ topNoMatch: false, candidates: ['documentation'] });
    });
    const rank = (second: number, third: string) => [
        { id: 'documentation', probability: 0.70 },
        { id: 'review', probability: second },
        { id: third, probability: 0 },
    ];
    it('accepts the exact probability and margin thresholds', () => {
        expect(decideWebJevChoice('documentation', rank(0.40, 'faq')).decision).toBe('preselect');
    });
    it('preselects when no_match is tied at zero and ranks third', () => {
        expect(decideWebJevChoice('documentation', [
            ...rank(0.25, 'no_match'), { id: 'faq', probability: 0 },
        ]).decision).toBe('preselect');
    });
    it('asks when no_match wins even with high confidence and a wide margin', () => {
        expect(decideWebJevChoice('no_match', [
            { id: 'no_match', probability: 0.98 }, { id: 'documentation', probability: 0.02 },
        ]).decision).toBe('clarify');
    });
    it('asks when the lead is below the fixed margin', () => {
        expect(decideWebJevChoice('documentation', rank(0.41, 'faq')).decision).toBe('clarify');
    });
});
