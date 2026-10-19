/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash, webcrypto } from 'node:crypto';
const verifier = vi.hoisted(() => vi.fn());
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
vi.mock('./intent-spec-private-profile', async importOriginal => {
    const actual = await importOriginal<typeof import('./intent-spec-private-profile')>();
    return { ...actual, admitPrivateStoreProfile: vi.fn(actual.admitPrivateStoreProfile) };
});
import { handleReadReview, handleSaveReview, SAVE_BODY_LIMIT } from './intent-spec-review-api';
import { POST } from '../app/api/intent-spec/reviews/route';
import { GET } from '../app/api/intent-spec/reviews/[id]/route';
import { admitPrivateStoreProfile, isPrivateSecurity, measureSecurity, PRIVATE_PROFILE_ID } from './intent-spec-private-profile';
import { createSpecConfirmationCandidate } from './intent-spec-confirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from './intent-spec-review';
import { applyAdversary, FIXTURE_PREFIX, makePrivateRoot, removeFixture } from './intent-spec-security-fixture';
import { createOpenItem } from './intent-spec-open-items';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const admit = vi.mocked(admitPrivateStoreProfile);
let root: string;
let now: number;
const session = (patch: Record<string, unknown> = {}) => ({
    userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture',
    expiresAt: now + 600000, authMode: 'session', ...patch,
});
beforeEach(async () => {
    vi.stubGlobal('crypto', webcrypto); now = Date.now();
    verifier.mockReset(); verifier.mockResolvedValue(session());
    root = await fs.mkdtemp(path.join(os.tmpdir(), `${FIXTURE_PREFIX}api-`));
    admit.mockReset();
    // Fast adversarial cases use the portable adapter; the real measured profile is exercised separately below.
    admit.mockResolvedValue({ profile: PRIVATE_PROFILE_ID, root, security: undefined as never });
});
afterEach(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await removeFixture(root); });

async function candidate(answer = 'Synthetic reporting') {
    let review = createIntentSpecReview({ coreFeatures: answer }, 'Synthetic exact packet');
    for (const decision of review.decisions) review = updateReviewDecision(review, decision.id, { answer: `Decision ${decision.id}` });
    return createSpecConfirmationCandidate(acknowledgeIntentSpecReview(review), 'en', 'Fixture reviewer');
}
const post = (body: unknown, headers: Record<string, string> = {}, raw = false) => new Request('http://localhost/api/intent-spec/reviews', {
    method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json', ...headers },
    body: raw ? body as string : JSON.stringify(body),
});
const get = (id: string) => new Request(`http://localhost/api/intent-spec/reviews/${id}`);
const save = async (file?: Awaited<ReturnType<typeof candidate>>) => {
    const portable = file ?? await candidate();
    return { portable, response: await handleSaveReview(post({ candidate: portable.fileContent, expectedSha256: portable.fileSha256 })) };
};
const namespaceFiles = async () => (await fs.readdir(root)).flatMap(entry => [entry]);

describe('POST /api/intent-spec/reviews', () => {
    it('saves exact confirmed content under the request actor and reads it back by ID', async () => {
        const { portable, response } = await save();
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body).toMatchObject({ ok: true, state: 'STORE_PORT_READBACK_VERIFIED', claimBoundary: 'NO_DURABILITY_OR_BUILD_AUTHORITY', scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', sourceFileSha256: portable.fileSha256, assurance: 'LOCAL_TEST_SESSION' });
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        const read = await handleReadReview(get(body.id), body.id);
        const saved = await read.json();
        expect(read.status).toBe(200);
        expect(saved).toMatchObject({ ok: true, id: body.id, revision: portable.revision, language: 'en', claimBoundary: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', reviewer: { name: 'Fixture reviewer', verification: 'SELF_DECLARED' } });
        expect(saved.draft).toBe(JSON.parse(portable.fileContent).payload.draft);
        const record = JSON.parse(new TextDecoder().decode(await fs.readFile(path.join(root, (await fs.readdir(root))[0], `${body.id}.json`))));
        expect(record.actor).toMatchObject({ userId: 'user_fixture', orgId: 'org_fixture', teamId: 'team_fixture', role: 'developer', assurance: 'LOCAL_TEST_SESSION' });
        expect(record.sourceFile).toBe(portable.fileContent);
    });
    it('is wired through the actual route module exports', async () => {
        const portable = await candidate();
        const response = await POST(post({ candidate: portable.fileContent, expectedSha256: portable.fileSha256 }));
        const { id } = await response.json();
        expect(response.status).toBe(201);
        expect((await GET(get(id), { params: Promise.resolve({ id }) })).status).toBe(200);
    });
    it.each([
        ['missing Origin', { origin: '' }], ['foreign Origin', { origin: 'https://evil.example' }],
        ['cross-site fetch metadata', { 'sec-fetch-site': 'cross-site' }],
    ])('refuses %s before any session or store work', async (_name, headers) => {
        const portable = await candidate();
        const request = post({ candidate: portable.fileContent, expectedSha256: portable.fileSha256 }, headers);
        if (!(headers as Record<string, string>).origin) request.headers.delete('origin');
        const response = await handleSaveReview(request);
        expect(response.status).toBe(403);
        expect(verifier).not.toHaveBeenCalled();
        expect(await namespaceFiles()).toEqual([]);
    });
    it.each([
        ['no session', null], ['expired', session({ expiresAt: now - 1 })], ['viewer', session({ role: 'viewer' })],
        ['unknown actor', session({ userId: 'unknown-user' })], ['client auth mode', session({ authMode: 'client' })],
        ['impersonated', session({ impersonation: { realActorId: 'other' }, realUserId: 'other' })],
    ])('refuses %s without writing', async (_name, value) => {
        verifier.mockResolvedValue(value);
        const { response } = await save();
        expect(response.status).toBe(401);
        expect(await namespaceFiles()).toEqual([]);
    });
    it('rejects a self-declared actor, extra fields and malformed or oversized bodies', async () => {
        const portable = await candidate();
        const good = { candidate: portable.fileContent, expectedSha256: portable.fileSha256 };
        for (const body of [{ ...good, userId: 'victim' }, { ...good, actor: { role: 'owner' } }, { candidate: good.candidate }, { ...good, expectedSha256: 'ABC' }, { candidate: 1, expectedSha256: good.expectedSha256 }, [good], null]) {
            expect((await handleSaveReview(post(body))).status).toBe(400);
        }
        expect((await handleSaveReview(post('{not json', {}, true))).status).toBe(400);
        expect((await handleSaveReview(post(JSON.stringify(good), { 'content-type': 'text/plain' }, true))).status).toBe(415);
        expect((await handleSaveReview(post(JSON.stringify(good), { 'content-length': String(SAVE_BODY_LIMIT + 1) }, true))).status).toBe(413);
        const big = new Uint8Array(SAVE_BODY_LIMIT + 10).fill(97);
        const streamed = new Request('http://localhost/api/intent-spec/reviews', {
            method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: big, duplex: 'half',
        } as RequestInit);
        expect((await handleSaveReview(streamed)).status).toBe(413);
        expect(await namespaceFiles()).toEqual([]);
    });
    it('rejects a changed hash and non-canonical or tampered candidate bytes', async () => {
        const portable = await candidate();
        expect((await handleSaveReview(post({ candidate: portable.fileContent, expectedSha256: sha('other') }))).status).toBe(422);
        const edited = portable.fileContent.replace('Fixture reviewer', 'Changed reviewer');
        expect((await handleSaveReview(post({ candidate: edited, expectedSha256: sha(edited) }))).status).toBe(422);
        expect(await namespaceFiles()).toEqual([]);
    });
    it('rejects stale-acknowledged and unfinished reviews even when their hashes are internally valid', async () => {
        const portable = await candidate();
        const forge = (change: (payload: Record<string, any>) => void) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
            const payload = JSON.parse(portable.fileContent).payload; change(payload);
            const content = JSON.stringify({ payload, payloadSha256: sha(JSON.stringify(payload)) }) + '\n';
            return { candidate: content, expectedSha256: sha(content) };
        };
        for (const body of [forge(p => { p.review.acknowledgedRevision = 0; }), forge(p => { p.review.decisions[0].disposition = 'OPEN'; })]) {
            expect((await handleSaveReview(post(body))).status).toBe(422);
        }
        expect(await namespaceFiles()).toEqual([]);
    });
    it('reports unavailable and writes nothing when the profile is unconfigured, unsupported or insecure', async () => {
        const { ProfileError } = await vi.importActual<typeof import('./intent-spec-private-profile')>('./intent-spec-private-profile');
        for (const code of ['PROFILE_DISABLED', 'PROFILE_UNSUPPORTED_PLATFORM', 'PROFILE_ROOT_INSECURE'] as const) {
            admit.mockRejectedValue(new ProfileError(code));
            const { response } = await save();
            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ ok: false, error: 'STORE_UNAVAILABLE' });
        }
        expect(await namespaceFiles()).toEqual([]);
    });
    it('reports an unconfirmed result, not success, when the store fails', async () => {
        admit.mockResolvedValue({ profile: PRIVATE_PROFILE_ID, root: path.join(root, 'missing-root'), security: undefined as never });
        const { response } = await save();
        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ ok: false, error: 'STORE_COMMIT_UNCONFIRMED', state: 'UNCONFIRMED' });
    });
});

describe('GET /api/intent-spec/reviews/[id]', () => {
    it('requires a current actor and gives another actor the same answer as a missing record', async () => {
        const { response } = await save();
        const { id } = await response.json();
        verifier.mockResolvedValue(null);
        expect((await handleReadReview(get(id), id)).status).toBe(401);
        verifier.mockResolvedValue(session({ userId: 'other_fixture' }));
        const other = await handleReadReview(get(id), id);
        const missing = await handleReadReview(get('0'.repeat(64)), '0'.repeat(64));
        expect(other.status).toBe(404);
        expect(await other.json()).toEqual(await missing.json());
        expect((await handleReadReview(get('../x'), '../x')).status).toBe(404);
        expect((await handleReadReview(get(id.toUpperCase()), id.toUpperCase())).status).toBe(404);
    });
    it('is unavailable when no profile is configured and fails closed on corrupt committed bytes', async () => {
        const { response } = await save();
        const { id } = await response.json();
        const file = path.join(root, (await fs.readdir(root))[0], `${id}.json`);
        await fs.writeFile(file, 'corrupt');
        const corrupt = await handleReadReview(get(id), id);
        expect(corrupt.status).toBe(500);
        expect(await corrupt.json()).toEqual({ ok: false, error: 'STORED_RECORD_UNREADABLE' });
        const { ProfileError } = await vi.importActual<typeof import('./intent-spec-private-profile')>('./intent-spec-private-profile');
        admit.mockRejectedValue(new ProfileError('PROFILE_DISABLED'));
        expect((await handleReadReview(get(id), id)).status).toBe(503);
    });
});

describe.runIf(process.platform === 'win32')('with the real measured WINDOWS_SINGLE_HOST_PRIVATE_V1 profile', () => {
    let privateRoot: string;
    beforeEach(async () => {
        const actual = await vi.importActual<typeof import('./intent-spec-private-profile')>('./intent-spec-private-profile');
        admit.mockImplementation(actual.admitPrivateStoreProfile);
        privateRoot = await makePrivateRoot('api-private');
    });
    afterEach(async () => { await removeFixture(privateRoot); });
    it('saves and reopens through a measured private root and leaves a private namespace', async () => {
        vi.stubEnv('CVF_INTENT_SPEC_STORE_PROFILE', PRIVATE_PROFILE_ID); vi.stubEnv('CVF_INTENT_SPEC_STORE_ROOT', privateRoot);
        const { response } = await save();
        expect(response.status).toBe(201);
        const { id } = await response.json();
        expect((await handleReadReview(get(id), id)).status).toBe(200);
        const [namespace] = await fs.readdir(privateRoot);
        expect(isPrivateSecurity(await measureSecurity(path.join(privateRoot, namespace)))).toBe(true);
    });
    it('is unavailable without explicit configuration or with an insecure root, and writes nothing', async () => {
        const { response } = await save();
        expect(response.status).toBe(503);
        vi.stubEnv('CVF_INTENT_SPEC_STORE_PROFILE', PRIVATE_PROFILE_ID); vi.stubEnv('CVF_INTENT_SPEC_STORE_ROOT', privateRoot);
        await applyAdversary(privateRoot, 'EXTRA_ALLOW');
        expect((await save()).response.status).toBe(503);
        expect(await fs.readdir(privateRoot)).toEqual([]);
    });
});

// NIS T1E: portable synthetic round trip of the additive v2 candidate through the unchanged route handlers.
async function t1eCandidate() {
    let review = createIntentSpecReview({ coreFeatures: 'Synthetic reporting', constraints: 'Corrections until Friday 17:00' }, 'Synthetic exact packet');
    for (const decision of review.decisions) review = updateReviewDecision(review, decision.id, { answer: `Decision ${decision.id}` });
    const drafts = [
        { kind: 'UNKNOWN' as const, status: 'OPEN' as const, sourceFields: ['constraints'], text: 'Retention period is not decided.' },
        { kind: 'UNKNOWN' as const, status: 'OPEN' as const, sourceFields: [], text: 'Deadline timezone is not decided.' },
        { kind: 'UNKNOWN' as const, status: 'OPEN' as const, sourceFields: [], text: 'Holiday behavior is not decided.' },
        { kind: 'UNKNOWN' as const, status: 'OPEN' as const, sourceFields: [], text: 'Export file format is not decided.' },
        { kind: 'CONFLICT' as const, status: 'RESOLVED' as const, sourceFields: ['coreFeatures', 'constraints'], text: 'Reporting versus late corrections.', resolution: 'Corrections allowed until the deadline only.' },
    ];
    for (const draft of drafts) {
        const created = createOpenItem(draft, review.decisions.flatMap(decision => decision.openItems ?? []), review.values);
        if (!created.ok) throw new Error(created.error);
        const owner = review.decisions.find(decision => decision.id === 'data')!;
        review = updateReviewDecision(review, 'data', { openItems: [...(owner.openItems ?? []), created.value] });
    }
    return createSpecConfirmationCandidate(acknowledgeIntentSpecReview(review), 'en', 'Fixture reviewer');
}

describe('NIS T1E synthetic v2 save and reopen', () => {
    it('saves a v2 candidate with open items under the request actor, reads it back and reopens the stored draft', async () => {
        const portable = await t1eCandidate();
        expect(JSON.parse(portable.fileContent).payload.schema).toBe('cvf.intentSpecReviewCandidate.v2');
        const response = await handleSaveReview(post({ candidate: portable.fileContent, expectedSha256: portable.fileSha256 }));
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body).toMatchObject({ ok: true, state: 'STORE_PORT_READBACK_VERIFIED', claimBoundary: 'NO_DURABILITY_OR_BUILD_AUTHORITY', scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', sourceFileSha256: portable.fileSha256, revision: portable.revision, assurance: 'LOCAL_TEST_SESSION' });
        const read = await handleReadReview(get(body.id), body.id);
        const saved = await read.json();
        expect(read.status).toBe(200);
        expect(saved).toMatchObject({ ok: true, id: body.id, revision: portable.revision, language: 'en', claimBoundary: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY' });
        expect(saved.draft).toBe(JSON.parse(portable.fileContent).payload.draft);
        for (const id of ['U1', 'U2', 'U3', 'U4']) expect(saved.draft).toContain(`### ${id} [Unknown] Open`);
        expect(saved.draft).toContain('Effective decision (user-entered):');
        expect(saved.draft).toContain('> Corrections allowed until the deadline only.');
        expect(saved.draft.trimEnd().endsWith('Build readiness: NOT_ASSESSED')).toBe(true);
        const record = JSON.parse(new TextDecoder().decode(await fs.readFile(path.join(root, (await fs.readdir(root))[0], `${body.id}.json`))));
        expect(record.sourceFile).toBe(portable.fileContent);
        expect(record.actor).toMatchObject({ userId: 'user_fixture', assurance: 'LOCAL_TEST_SESSION' });
    });

    it('keeps v1 and v2 records of the same actor distinct and both reopenable, and refuses a stale-marked v2 file', async () => {
        const legacy = await candidate();
        const v2 = await t1eCandidate();
        const first = await (await handleSaveReview(post({ candidate: legacy.fileContent, expectedSha256: legacy.fileSha256 }))).json();
        const second = await (await handleSaveReview(post({ candidate: v2.fileContent, expectedSha256: v2.fileSha256 }))).json();
        expect(first.id).not.toBe(second.id);
        expect((await handleReadReview(get(first.id), first.id)).status).toBe(200);
        expect((await handleReadReview(get(second.id), second.id)).status).toBe(200);
        const forged = JSON.parse(v2.fileContent);
        forged.payload.review.decisions[2].openItems[0].needsReconfirmation = true;
        forged.payloadSha256 = sha(JSON.stringify(forged.payload));
        const content = JSON.stringify(forged) + '\n';
        expect((await handleSaveReview(post({ candidate: content, expectedSha256: sha(content) }))).status).toBe(422);
    });
});
