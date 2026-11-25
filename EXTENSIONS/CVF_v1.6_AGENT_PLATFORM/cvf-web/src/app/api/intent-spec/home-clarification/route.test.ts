// Text Encoding Exception: the test checks part of the exact English prompt, which has a smart apostrophe.
import { encode } from '@auth/core/jwt';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const fixtures = vi.hoisted(() => ({ secret: 'home-clarification-fixture', appendCost: vi.fn(), fetch: vi.fn() }));
vi.mock('@/auth', () => ({ auth: vi.fn(), authSecret: fixtures.secret }));
vi.mock('@/lib/control-plane-events', () => ({ appendCostEvent: fixtures.appendCost }));

const url = 'http://localhost:3000/api/intent-spec/home-clarification';
const origin = 'http://127.0.0.1:3000';
const draft = { language: 'en', goal: 'Create an inventory board', extra: 'Show dates', answers: ['Filter by branch'] };
const questions = ['Which branches?', 'Who checks entries?', 'Which dates?', 'Who updates it?', 'What is the first result?', 'Who prints it?'];
const replyText = `## Goal and scope\nMake an inventory board.\n\n## Open questions\n${questions.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

let work: string;
const binding = (id: string) => ({ provider: 'github', providerAccountId: id, userId: id, role: 'viewer', orgId: 'org', teamId: 'team' });

async function request(method = 'POST', payload = draft, options: { account?: string; source?: string; target?: string } = {}) {
    const { account = 'first-user', source = origin, target = url } = options;
    const name = target.startsWith('https:') ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const token = account ? await encode({ secret: fixtures.secret, salt: name,
        token: { authSource: 'oauth_bound', oauthProvider: 'github', oauthSubject: account } }) : '';
    return new Request(target, { method, headers: { cookie: token ? `${name}=${token}` : '', origin: source,
        host: new URL(source).host, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' },
        ...(method === 'POST' && { body: JSON.stringify(payload) }) });
}

function providerReply(content = replyText) {
    return Response.json({ model: 'gpt-6-luna', choices: [{ message: { content }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 200, prompt_tokens_details: { cached_tokens: 20 } } });
}

describe('Home specification AI clarification API', () => {
    beforeEach(() => {
        work = mkdtempSync(join(tmpdir(), 'cvf-home-clarification-'));
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('AUTH_URL', undefined);
        vi.stubEnv('NEXTAUTH_URL', undefined);
        vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
        vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', JSON.stringify([binding('first-user'), binding('second-user')]));
        vi.stubEnv('OPENAI_API_KEY', 'synthetic-server-credential');
        vi.stubEnv('CVF_OPENAI_API_KEY', undefined);
        vi.stubEnv('CVF_HOME_CLARIFICATION_BUDGET_DIRECTORY', work);
        vi.stubEnv('CVF_HOME_CLARIFICATION_DAILY_USER_LIMIT', undefined);
        vi.stubEnv('CVF_HOME_CLARIFICATION_DAILY_SITE_USD', undefined);
        vi.stubEnv('CVF_STORAGE_ADAPTER_TYPE', 'file');
        fixtures.appendCost.mockReset().mockResolvedValue({});
        fixtures.fetch.mockReset().mockImplementation(() => Promise.resolve(providerReply()));
        vi.stubGlobal('fetch', fixtures.fetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        rmSync(work, { recursive: true, force: true });
    });

    it('never exposes the server credential and refuses to call when it is missing', async () => {
        vi.stubEnv('OPENAI_API_KEY', undefined);
        const response = await POST(await request());
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ status: 'missing_key' });
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('requires a verified session and the same browser origin before any call', async () => {
        expect((await POST(await request('POST', draft, { account: '' }))).status).toBe(401);
        expect((await POST(await request('POST', draft, { source: 'https://elsewhere.example.test' }))).status).toBe(403);
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('reads the HTTPS cookie before checking whether hosted storage is available', async () => {
        const source = 'https://cvf.example.test';
        const result = await POST(await request('POST', draft, { source, target: `${source}/api/intent-spec/home-clarification` }));
        expect(await result.json()).toEqual({ status: 'unavailable' });
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('sends just the entered text with the measured model settings and records usage without that text', async () => {
        const response = await POST(await request());
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.clarification.questions).toEqual(questions.slice(0, 5));
        expect(result.clarification.summary.join(' ')).toContain('Make an inventory board.');
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
        const [endpoint, settings] = fixtures.fetch.mock.calls[0];
        expect(endpoint).toBe('https://api.openai.com/v1/chat/completions');
        expect(new Headers(settings.headers).get('authorization')).toBe('Bearer synthetic-server-credential');
        expect(JSON.parse(settings.body)).toMatchObject({ model: 'gpt-6-luna', reasoning_effort: 'high', store: false,
            messages: [{ role: 'system', content: expect.stringContaining('using only the user’s words') },
                { role: 'user', content: 'Create an inventory board\nShow dates\nFilter by branch' }] });
        expect(fixtures.appendCost).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', model: 'gpt-6-luna',
            userId: 'first-user', inputTokens: 100, outputTokens: 200, estimatedCostUSD: 0.000109 }));
        expect(JSON.stringify(fixtures.appendCost.mock.calls)).not.toContain(draft.goal);
    });

    it.each(['The socket is sparking.', 'Please book me a taxi.'])('never sends an unsafe or external action request: %s', async (goal) => {
        const response = await POST(await request('POST', { ...draft, goal }));
        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({ status: 'outside_scope' });
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('records usage but returns no partial text if the provider sends the wrong format', async () => {
        fixtures.fetch.mockImplementationOnce(() => Promise.resolve(providerReply('```text\nNot a clarification.\n```')));
        const response = await POST(await request());
        expect(await response.json()).toEqual({ status: 'format_error' });
        expect(fixtures.appendCost).toHaveBeenCalledTimes(1);
    });

    it('returns a readable status for timeouts and never sends a retry', async () => {
        fixtures.fetch.mockRejectedValueOnce(new DOMException('deadline', 'TimeoutError'));
        const response = await POST(await request());
        expect(await response.json()).toEqual({ status: 'timeout' });
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns a failure without substituting another model', async () => {
        fixtures.fetch.mockResolvedValueOnce(Response.json({ error: { code: 'model_not_found' } }, { status: 404 }));
        expect(await (await POST(await request())).json()).toEqual({ status: 'provider_error' });
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
    });

    it('shares the configured account limit across overlapping requests', async () => {
        vi.stubEnv('CVF_HOME_CLARIFICATION_DAILY_USER_LIMIT', '1');
        const calls = await Promise.all([request(), request()]);
        const results = await Promise.all(calls.map(POST));
        expect(results.map(result => result.status).sort()).toEqual([200, 429]);
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
    });

    it('reserves site spend across different accounts before provider usage is known', async () => {
        vi.stubEnv('CVF_HOME_CLARIFICATION_DAILY_SITE_USD', '0.0055');
        let complete!: (reply: Response) => void;
        fixtures.fetch.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
        const left = POST(await request());
        await vi.waitFor(() => expect(fixtures.fetch).toHaveBeenCalledTimes(1));
        const right = await POST(await request('POST', draft, { account: 'second-user' }));
        expect(right.status).toBe(429);
        complete(providerReply());
        expect((await left).status).toBe(200);
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
    });
});
