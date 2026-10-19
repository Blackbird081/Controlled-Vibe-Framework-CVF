/** @vitest-environment jsdom */
import { createHash, webcrypto } from 'node:crypto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const verifier = vi.hoisted(() => vi.fn());
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
import { resolveIntentSpecActor } from './intent-spec-actor';
import { prepareIntentSpecAcceptance, commitIntentSpecAcceptanceCandidate, type IntentSpecAcceptanceStorePort } from './intent-spec-acceptance';
import { createSpecConfirmationCandidate, MAX_CONFIRMATION_BYTES } from './intent-spec-confirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from './intent-spec-review';
import { buildReviewedDraftPacket } from './intent-spec-review';
import { createOpenItem, type OpenItemDraft } from './intent-spec-open-items';

const now = 1791158400000;
const bytes = (text: string) => new TextEncoder().encode(text);
const hash = (input: Uint8Array) => createHash('sha256').update(input).digest('hex');
beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    verifier.mockReset();
    verifier.mockResolvedValue({ userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture', expiresAt: now + 60000, authMode: 'session' });
});
afterEach(() => vi.unstubAllGlobals());
async function fixture() {
    let state = createIntentSpecReview({ coreFeatures: 'Synthetic reporting' }, 'Exact source packet\r\nend');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision for ${decision.id}` });
    const file = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(state), 'en', 'Self-declared fixture', new Date(now).toISOString());
    const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
    return { file, actor };
}
type MutablePayload = {
    schema: string; scope: string; extra?: string; reviewer: { verification: string };
    language: string; createdAt: string; draft: string;
    review: { revision: number; acknowledgedRevision: number | null; decisions: {
        id: string; disposition: string; answer: string; needsReconfirmation: boolean;
        sourceValues: Record<string, string>;
    }[] };
};
function modified(text: string, mutate: (payload: MutablePayload) => void): Uint8Array {
    const file = JSON.parse(text);
    mutate(file.payload);
    file.payloadSha256 = hash(bytes(JSON.stringify(file.payload)));
    return bytes(JSON.stringify(file) + '\n');
}
function memoryPort(): IntentSpecAcceptanceStorePort & { records: Map<string, Uint8Array> } {
    const records = new Map<string, Uint8Array>();
    return {
        records,
        async createIfAbsent(id, data) {
            const existing = records.get(id);
            if (existing && hash(existing) !== hash(data)) throw new Error('Conflict');
            records.set(id, new Uint8Array(data));
        },
        async read(id) { return records.get(id) ?? null; },
    };
}

describe('content and store-port contract, with synthetic identities and no durable backend', () => {
    it('binds resolved actor and exact bytes, then verifies readback without claiming durability', async () => {
        const { file, actor } = await fixture();
        const input = bytes(file.fileContent);
        const candidate = prepareIntentSpecAcceptance(actor, input, file.fileSha256, now);
        input.fill(0);
        const store = memoryPort();
        const result = await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        expect(result.state).toBe('STORE_PORT_READBACK_VERIFIED');
        expect(result.claimBoundary).toBe('NO_DURABILITY_OR_BUILD_AUTHORITY');
        expect(candidate.state).toBe('PENDING_STORE_COMMIT');
        const saved = JSON.parse(new TextDecoder().decode(store.records.get(candidate.id)));
        expect(saved.actor.userId).toBe('user_fixture');
        expect(saved.sourceFile).toBe(file.fileContent);
        expect(candidate.actor.userId).not.toBe('Self-declared fixture');
        expect(hash(store.records.get(candidate.id)!)).toBe(candidate.id);
    });
    it.each([
        (p: MutablePayload) => { p.schema = 'Other'; }, (p: MutablePayload) => { p.scope = 'BUILD_APPROVED'; },
        (p: MutablePayload) => { p.extra = 'Hidden'; }, (p: MutablePayload) => { p.reviewer.verification = 'AUTHENTICATED'; },
        (p: MutablePayload) => { p.language = 'unknown'; }, (p: MutablePayload) => { p.createdAt = 'yesterday'; },
        (p: MutablePayload) => { p.review.revision = 1.5; }, (p: MutablePayload) => { p.review.acknowledgedRevision = null; },
        (p: MutablePayload) => { p.review.decisions.pop(); }, (p: MutablePayload) => { p.review.decisions[1].id = 'workflow'; },
        (p: MutablePayload) => { p.review.decisions[0].disposition = 'CONFLICT'; },
        (p: MutablePayload) => { p.review.decisions[0].answer = 'unknown'; },
        (p: MutablePayload) => { p.review.decisions[0].needsReconfirmation = true; },
        (p: MutablePayload) => { p.review.decisions[0].sourceValues.coreFeatures = 'Different'; },
        (p: MutablePayload) => { p.draft += '\nHidden override'; },
    ])('rejects semantically invalid candidates even with recomputed self-consistent hashes (%#)', async mutate => {
        const { file, actor } = await fixture();
        const input = modified(file.fileContent, mutate);
        expect(() => prepareIntentSpecAcceptance(actor, input, hash(input), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });
    it('rejects malformed/duplicate JSON, bad UTF-8, BOM, wrong file identity and tampered payload hash', async () => {
        const { file, actor } = await fixture();
        const input = bytes(file.fileContent);
        expect(() => prepareIntentSpecAcceptance(actor, input, '0'.repeat(64), now)).toThrow();
        const tampered = JSON.parse(file.fileContent); tampered.payloadSha256 = '0'.repeat(64);
        for (const data of [bytes('{'), bytes(file.fileContent.replace('{"payload":', '{"payload":null,"payload":')),
            new Uint8Array([0xff]), bytes('\uFEFF' + file.fileContent), bytes(JSON.stringify(tampered) + '\n')]) {
            expect(() => prepareIntentSpecAcceptance(actor, data, hash(data), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        }
    });
    it('rejects oversized input without parsing it', async () => {
        const { actor } = await fixture();
        const input = new Uint8Array(MAX_CONFIRMATION_BYTES + 1);
        const parser = vi.spyOn(JSON, 'parse');
        expect(() => prepareIntentSpecAcceptance(actor, input, '0'.repeat(64), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        expect(parser).not.toHaveBeenCalled();
        parser.mockRestore();
    });
    it('rejects forged candidate/actor objects and another valid actor context before calling I/O', async () => {
        const { file, actor } = await fixture();
        const candidate = prepareIntentSpecAcceptance(actor, bytes(file.fileContent), file.fileSha256, now);
        const store = { createIfAbsent: vi.fn(), read: vi.fn() };
        await expect(commitIntentSpecAcceptanceCandidate(actor, { ...candidate }, store, () => now)).rejects.toThrow('OWNED_ACTOR_CANDIDATE_REQUIRED');
        const other = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
        await expect(commitIntentSpecAcceptanceCandidate(other, candidate, store, () => now)).rejects.toThrow('OWNED_ACTOR_CANDIDATE_REQUIRED');
        expect(store.createIfAbsent).not.toHaveBeenCalled();
    });
    it.each(['write', 'read', 'missing', 'changed', 'expired'])('never returns success when %s fails', async failure => {
        const { file, actor } = await fixture();
        const candidate = prepareIntentSpecAcceptance(actor, bytes(file.fileContent), file.fileSha256, now);
        const store = memoryPort();
        if (failure === 'write') store.createIfAbsent = async () => { throw new Error('Write failed'); };
        if (failure === 'read') store.read = async () => { throw new Error('Read failed'); };
        if (failure === 'missing') store.read = async () => null;
        if (failure === 'changed') store.read = async id => { const result = store.records.get(id)!; result[0] ^= 1; return result; };
        let calls = 0;
        const clock = () => failure === 'expired' && calls++ > 0 ? now + 60000 : now;
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, clock)).rejects.toThrow('STORE_COMMIT_UNCONFIRMED');
        expect(candidate.state).toBe('PENDING_STORE_COMMIT');
    });
    it('keeps owned expected bytes when an adapter mutates the write argument', async () => {
        const { file, actor } = await fixture();
        const candidate = prepareIntentSpecAcceptance(actor, bytes(file.fileContent), file.fileSha256, now);
        const store = memoryPort();
        const write = store.createIfAbsent.bind(store);
        store.createIfAbsent = async (id, data) => { await write(id, data); data.fill(0); };
        await expect(commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now)).resolves.toMatchObject({ state: 'STORE_PORT_READBACK_VERIFIED' });
    });
});

// NIS T1E: strict additive candidate v2 acceptance. Synthetic identities and an in-memory port only.
type Loose = Record<string, unknown>;
async function fixtureV2(extra: OpenItemDraft[] = []) {
    let state = createIntentSpecReview({ coreFeatures: 'Synthetic reporting', constraints: 'Corrections until Friday 17:00' }, 'Exact source packet\r\nend');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision for ${decision.id}` });
    const drafts: OpenItemDraft[] = [
        { kind: 'UNKNOWN', status: 'OPEN', sourceFields: ['constraints'], text: 'Timezone of the deadline is not decided.' },
        { kind: 'CONFLICT', status: 'RESOLVED', sourceFields: ['coreFeatures', 'constraints'], text: 'Reporting versus late corrections.', resolution: 'Corrections allowed until the deadline only.' },
        { kind: 'UNKNOWN', status: 'DELEGATED', sourceFields: [], text: 'Label wording is not decided.', delegation: 'Any plain label.' },
        ...extra,
    ];
    for (const draft of drafts) {
        const created = createOpenItem(draft, state.decisions.flatMap(decision => decision.openItems ?? []), state.values);
        if (!created.ok) throw new Error(created.error);
        const owner = state.decisions.find(decision => decision.id === 'data')!;
        state = updateReviewDecision(state, 'data', { openItems: [...(owner.openItems ?? []), created.value] });
    }
    state = acknowledgeIntentSpecReview(state);
    const file = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', new Date(now).toISOString());
    const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), now);
    return { file, actor, state };
}
/** Mutates the parsed payload and rebuilds the draft from the mutated review, so the validator rules are what reject it. */
function modifiedV2(text: string, mutate: (payload: Loose) => void, rebuildDraft = true): Uint8Array {
    const file = JSON.parse(text);
    mutate(file.payload);
    if (rebuildDraft) {
        try { file.payload.draft = buildReviewedDraftPacket(file.payload.review, file.payload.language); } catch { /* keep the stale draft; still rejected */ }
    }
    file.payloadSha256 = hash(bytes(JSON.stringify(file.payload)));
    return bytes(JSON.stringify(file) + '\n');
}
const reviewOf = (payload: Loose) => payload.review as { decisions: Loose[]; values: Record<string, string> };
const dataItems = (payload: Loose) => reviewOf(payload).decisions[2].openItems as Loose[];

describe('NIS T1E candidate v2: strict acceptance of explicit open items', () => {
    it('AC-V2: accepts a valid v2 file, binds the revision, and verifies readback through the synthetic port', async () => {
        const { file, actor, state } = await fixtureV2();
        const input = bytes(file.fileContent);
        const candidate = prepareIntentSpecAcceptance(actor, input, file.fileSha256, now);
        expect(candidate.revision).toBe(state.revision);
        const store = memoryPort();
        const receipt = await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => now);
        expect(receipt.state).toBe('STORE_PORT_READBACK_VERIFIED');
        const saved = JSON.parse(new TextDecoder().decode(store.records.get(candidate.id)));
        expect(saved.sourceFile).toBe(file.fileContent);
        expect(JSON.parse(saved.sourceFile).payload.schema).toBe('cvf.intentSpecReviewCandidate.v2');
        expect(hash(store.records.get(candidate.id)!)).toBe(candidate.id);
    });

    it('AC-V3: rejects an edited item text with a recomputed payload hash when the stored draft is left as it was', async () => {
        const { file, actor } = await fixtureV2();
        const input = modifiedV2(file.fileContent, payload => { dataItems(payload)[0].text = 'Changed after the fact.'; }, false);
        expect(() => prepareIntentSpecAcceptance(actor, input, hash(input), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });

    const itemMutations: [string, (payload: Loose) => void][] = [
        ['extra item key', p => { dataItems(p)[0].extra = 'x'; }],
        ['missing item key', p => { delete dataItems(p)[0].delegation; }],
        ['reordered item keys', p => { const items = dataItems(p); items[0] = Object.fromEntries(Object.entries(items[0]).reverse()); }],
        ['duplicate id across decisions', p => { reviewOf(p).decisions[3].openItems = [{ ...dataItems(p)[0] }]; }],
        ['id X1', p => { dataItems(p)[0].id = 'X1'; }],
        ['id U0', p => { dataItems(p)[0].id = 'U0'; }],
        ['id U100', p => { dataItems(p)[0].id = 'U100'; }],
        ['id prefix disagrees with kind', p => { dataItems(p)[0].kind = 'CONFLICT'; }],
        ['invalid kind', p => { dataItems(p)[0].kind = 'OTHER'; }],
        ['invalid status', p => { dataItems(p)[0].status = 'DONE'; }],
        ['conflict citing one field', p => { dataItems(p)[1].sourceFields = ['coreFeatures']; dataItems(p)[1].sourceValues = { coreFeatures: reviewOf(p).values.coreFeatures }; }],
        ['delegated with empty boundary', p => { dataItems(p)[2].delegation = ''; }],
        ['resolved with empty resolution', p => { dataItems(p)[1].resolution = ''; }],
        ['open with a resolution', p => { dataItems(p)[0].resolution = 'Unexpected.'; }],
        ['open with a delegation', p => { dataItems(p)[0].delegation = 'Unexpected.'; }],
        ['snapshot keys differ from cited fields', p => { dataItems(p)[0].sourceValues = { coreFeatures: 'x' }; }],
        ['snapshot differs from the stored brief', p => { dataItems(p)[0].sourceValues = { constraints: 'Forged snapshot.' }; }],
        ['needsReconfirmation true', p => { dataItems(p)[0].needsReconfirmation = true; }],
        ['more than six cited fields', p => { dataItems(p)[0].sourceFields = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']; }],
        ['duplicate cited fields', p => { dataItems(p)[0].sourceFields = ['constraints', 'constraints']; }],
        ['text over 2000 characters', p => { dataItems(p)[0].text = 'x'.repeat(2001); }],
        ['placeholder text', p => { dataItems(p)[0].text = 'tbd'; }],
        ['cited field absent from the brief', p => { dataItems(p)[0].sourceFields = ['ghost']; dataItems(p)[0].sourceValues = { ghost: '' }; }],
        ['prototype key as cited field', p => { dataItems(p)[0].sourceFields = ['__proto__']; dataItems(p)[0].sourceValues = JSON.parse('{"__proto__":""}'); }],
        ['empty openItems key', p => { reviewOf(p).decisions[0].openItems = []; }],
        ['openItems not an array', p => { reviewOf(p).decisions[0].openItems = 'x'; }],
        ['fifty-one items', p => {
            const base = dataItems(p)[2];
            for (let n = 0; n < 48; n += 1) dataItems(p).push({ ...base, id: `U${n + 10}`, sourceFields: [], sourceValues: {}, text: `Extra ${n}.`, status: 'OPEN', delegation: '' });
        }],
    ];
    it.each(itemMutations)('AC-V4: rejects %s even with a rebuilt draft and recomputed hashes', async (_name, mutate) => {
        const { file, actor } = await fixtureV2();
        const input = modifiedV2(file.fileContent, mutate);
        expect(() => prepareIntentSpecAcceptance(actor, input, hash(input), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });

    it('AC-V4: the baseline for those mutations is accepted, and exactly fifty items are accepted while fifty-one are not', async () => {
        const { file, actor } = await fixtureV2();
        const untouched = modifiedV2(file.fileContent, () => undefined);
        expect(() => prepareIntentSpecAcceptance(actor, untouched, hash(untouched), now)).not.toThrow();
        const fifty = modifiedV2(file.fileContent, p => {
            const base = dataItems(p)[2];
            for (let n = 0; n < 47; n += 1) dataItems(p).push({ ...base, id: `U${n + 10}`, sourceFields: [], sourceValues: {}, text: `Extra ${n}.`, status: 'OPEN', delegation: '' });
        });
        expect(() => prepareIntentSpecAcceptance(actor, fifty, hash(fifty), now)).not.toThrow();
    });

    it('AC-V5: one canonical encoding per state: v2 needs items, v1 admits none, unknown versions and pending decisions are rejected', async () => {
        const { file, actor } = await fixtureV2();
        const noItems = modifiedV2(file.fileContent, p => { for (const decision of reviewOf(p).decisions) delete decision.openItems; });
        expect(() => prepareIntentSpecAcceptance(actor, noItems, hash(noItems), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        const v1WithItems = modifiedV2(file.fileContent, p => { p.schema = 'cvf.intentSpecReviewCandidate.v1'; });
        expect(() => prepareIntentSpecAcceptance(actor, v1WithItems, hash(v1WithItems), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        const v3 = modifiedV2(file.fileContent, p => { p.schema = 'cvf.intentSpecReviewCandidate.v3'; });
        expect(() => prepareIntentSpecAcceptance(actor, v3, hash(v3), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        const pending = modifiedV2(file.fileContent, p => { reviewOf(p).decisions[0].disposition = 'OPEN'; });
        expect(() => prepareIntentSpecAcceptance(actor, pending, hash(pending), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        const staleAck = modifiedV2(file.fileContent, p => { (p.review as Loose).acknowledgedRevision = 0; });
        expect(() => prepareIntentSpecAcceptance(actor, staleAck, hash(staleAck), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });

    it('AC-V6: rejects an invented build grant or readiness assertion even with rebuilt and rehashed bytes', async () => {
        const { file, actor } = await fixtureV2();
        const mutations: ((payload: Loose) => void)[] = [
            p => { p.buildReady = true; }, p => { p.scope = 'BUILD_APPROVED'; }, p => { p.reviewer = { name: 'Self-declared fixture', verification: 'AUTHENTICATED' }; },
        ];
        for (const mutate of mutations) {
            const input = modifiedV2(file.fileContent, mutate);
            expect(() => prepareIntentSpecAcceptance(actor, input, hash(input), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        }
        const forgedDraft = modifiedV2(file.fileContent, p => { p.draft = `${p.draft as string}\nBuild readiness: READY_FOR_BUILD`; }, false);
        expect(() => prepareIntentSpecAcceptance(actor, forgedDraft, hash(forgedDraft), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
        const readinessLines = (JSON.parse(file.fileContent).payload.draft as string).match(/Build readiness: .*/g);
        expect(readinessLines).toEqual(['Build readiness: NOT_ASSESSED']);
    });

    it('AC-L4: a v1-labelled file with an openItems key is rejected by the unchanged v1 key sets', async () => {
        const { file, actor } = await fixture();
        const input = modified(file.fileContent, p => {
            (p.review.decisions[0] as unknown as Loose).openItems = [{ id: 'U1' }];
        });
        expect(() => prepareIntentSpecAcceptance(actor, input, hash(input), now)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });
});
