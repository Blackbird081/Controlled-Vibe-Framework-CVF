// Text Encoding Exception: Vietnamese worksheet fixtures.
/** @vitest-environment jsdom */
import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from './intent-spec-review';
import { createSpecConfirmationCandidate, MAX_CONFIRMATION_BYTES, renderDocumentaryWorksheet, reviewBindingKey, verifySpecConfirmationReadback, worksheetFileName, type SpecConfirmationCandidate } from './intent-spec-confirmation';
import { createHash } from 'node:crypto';
import { buildReviewedDraftPacket, synchronizeIntentSpecReview } from './intent-spec-review';
import { CANDIDATE_SCHEMA_V1, CANDIDATE_SCHEMA_V2 } from './intent-spec-confirmation';
import { createOpenItem, type OpenItemDraft } from './intent-spec-open-items';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
function reviewed() {
    let state = createIntentSpecReview({ problem: 'Synthetic fixture' }, 'Exact draft\r\nend');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision for ${decision.id}` });
    return acknowledgeIntentSpecReview(state);
}
const bytes = (value: string) => new TextEncoder().encode(value);

describe('portable content binding, without authenticated acceptance or storage claims', () => {
    it('binds exact review, draft, self-declared actor, language and time and verifies readback', async () => {
        const state = reviewed();
        const candidate = await createSpecConfirmationCandidate(state, 'en', 'Test reviewer', '2026-10-05T00:00:00.000Z');
        const file = JSON.parse(candidate.fileContent);
        expect(file.payload.review).toEqual(state);
        expect(file.payload.draft).toContain('Exact draft\r\nend');
        expect(file.payload.reviewer.verification).toBe('SELF_DECLARED');
        expect(file.payload.scope).toBe('SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY');
        expect(file.payloadSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(await verifySpecConfirmationReadback(candidate, bytes(candidate.fileContent))).toBe(true);
        expect(Object.isFrozen(candidate)).toBe(true);
    });
    it('refuses pending, stale viewing, missing actor and oversized payloads', async () => {
        await expect(createSpecConfirmationCandidate(createIntentSpecReview({}, 'draft'), 'en', 'Reviewer')).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
        const state = reviewed();
        await expect(createSpecConfirmationCandidate(state, 'en', ' ')).rejects.toThrow('REVIEWER_REQUIRED');
        await expect(createSpecConfirmationCandidate({ ...state, acknowledgedRevision: null }, 'en', 'Reviewer')).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
        await expect(createSpecConfirmationCandidate({ ...state, packetSource: 'x'.repeat(MAX_CONFIRMATION_BYTES) }, 'en', 'Reviewer')).rejects.toThrow('FILE_TOO_LARGE');
    });
    it('captures ownership before async hashing, so subsequent caller edits do not alter the file', async () => {
        const state = reviewed();
        const promise = createSpecConfirmationCandidate(state, 'en', 'Reviewer');
        state.values.problem = 'Caller mutation';
        state.decisions[0].answer = 'Caller mutation';
        const candidate = await promise;
        expect(candidate.fileContent).not.toContain('Caller mutation');
        expect(candidate.bindingKey).not.toBe(reviewBindingKey(state, 'en', 'Reviewer'));
    });
    it('rejects changed bytes, newline conversion, malformed JSON and another reviewer candidate', async () => {
        const candidate = await createSpecConfirmationCandidate(reviewed(), 'en', 'Reviewer');
        const other = await createSpecConfirmationCandidate(reviewed(), 'en', 'Other reviewer');
        for (const text of [candidate.fileContent.replace('Reviewer', 'Intruder'), candidate.fileContent.trim(), '{', other.fileContent]) {
            expect(await verifySpecConfirmationReadback(candidate, bytes(text))).toBe(false);
        }
    });
    it('includes state content and language in the key rather than trusting the same revision', () => {
        const state = reviewed();
        const key = reviewBindingKey(state, 'en', 'Reviewer');
        expect(reviewBindingKey({ ...state, packetSource: 'Different bytes' }, 'en', 'Reviewer')).not.toBe(key);
        expect(reviewBindingKey(state, 'vi', 'Reviewer')).not.toBe(key);
    });
    it('fails if cryptographic hashing is unavailable', async () => {
        vi.stubGlobal('crypto', { subtle: { digest: () => Promise.reject(new Error('Unavailable')) } });
        await expect(createSpecConfirmationCandidate(reviewed(), 'en', 'Reviewer')).rejects.toThrow('Unavailable');
    });
});

// NIS T1E: schema selection and item-bearing candidates. Synthetic fixtures only.
const T1E_VALUES = { problem: 'Synthetic fixture', targetUsers: 'Team leads', constraints: 'No employee scoring' };
const T1E_CLOCK = '2026-10-05T00:00:00.000Z';
function itemState(options: { acknowledge?: boolean; drafts?: OpenItemDraft[] } = {}) {
    let state = createIntentSpecReview(T1E_VALUES, 'Exact draft\r\nend');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision for ${decision.id}` });
    const drafts: OpenItemDraft[] = options.drafts ?? [
        { kind: 'UNKNOWN', status: 'OPEN', sourceFields: ['constraints'], text: 'Retention period is not decided.' },
        { kind: 'CONFLICT', status: 'RESOLVED', sourceFields: ['constraints', 'targetUsers'], text: 'Scoring ban versus lead review.', resolution: 'Leads review totals only; no per-person score.' },
    ];
    for (const draft of drafts) {
        const created = createOpenItem(draft, state.decisions.flatMap(decision => decision.openItems ?? []), state.values);
        if (!created.ok) throw new Error(created.error);
        const owner = state.decisions.find(decision => decision.id === 'data')!;
        state = updateReviewDecision(state, 'data', { openItems: [...(owner.openItems ?? []), created.value] });
    }
    return options.acknowledge === false ? state : acknowledgeIntentSpecReview(state);
}

describe('NIS T1E candidate schema selection and open-item projection', () => {
    it('keeps schema v1 and the original payload key order for a state without items', async () => {
        const file = await createSpecConfirmationCandidate(reviewed(), 'en', 'Self-declared fixture', T1E_CLOCK);
        const payload = JSON.parse(file.fileContent).payload;
        expect(payload.schema).toBe(CANDIDATE_SCHEMA_V1);
        expect(payload.schema).toBe('cvf.intentSpecReviewCandidate.v1');
        expect(Object.keys(payload)).toEqual(['schema', 'scope', 'reviewer', 'createdAt', 'language', 'review', 'draft']);
        expect(JSON.stringify(payload)).not.toContain('openItems');
    });

    it('AC-V1: any open item selects schema v2 with the same seven payload keys and the unchanged scope', async () => {
        const state = itemState();
        const file = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', T1E_CLOCK);
        const parsed = JSON.parse(file.fileContent);
        expect(parsed.payload.schema).toBe(CANDIDATE_SCHEMA_V2);
        expect(Object.keys(parsed.payload)).toEqual(['schema', 'scope', 'reviewer', 'createdAt', 'language', 'review', 'draft']);
        expect(parsed.payload.scope).toBe('SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY');
        expect(Object.keys(parsed.payload.review)).toEqual(['revision', 'values', 'packetSource', 'acknowledgedRevision', 'decisions']);
        const withItems = parsed.payload.review.decisions.filter((decision: Record<string, unknown>) => 'openItems' in decision);
        expect(withItems.map((decision: { id: string }) => decision.id)).toEqual(['data']);
        expect(Object.keys(withItems[0])).toEqual(['id', 'answer', 'disposition', 'needsReconfirmation', 'sourceValues', 'openItems']);
        expect(Object.keys(withItems[0].openItems[0])).toEqual(['id', 'kind', 'text', 'sourceFields', 'sourceValues', 'status', 'resolution', 'delegation', 'needsReconfirmation']);
        expect(parsed.payload.draft).toContain('Retention period is not decided.');
        expect(parsed.payload.draft).toContain('Build readiness: NOT_ASSESSED');
        expect(createHash('sha256').update(JSON.stringify(parsed.payload)).digest('hex')).toBe(parsed.payloadSha256);
        expect(await verifySpecConfirmationReadback(file, bytes(file.fileContent))).toBe(true);
    });

    it('is deterministic for equal state, and binds the items into the binding key', async () => {
        const state = itemState();
        const first = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', T1E_CLOCK);
        const second = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', T1E_CLOCK);
        expect(second.fileContent).toBe(first.fileContent);
        expect(second.fileSha256).toBe(first.fileSha256);
        expect(first.bindingKey).toBe(reviewBindingKey(state, 'en', 'Self-declared fixture'));
        const other = itemState({ drafts: [{ kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'A different unknown.' }] });
        const otherFile = await createSpecConfirmationCandidate(other, 'en', 'Self-declared fixture', T1E_CLOCK);
        expect(otherFile.bindingKey).not.toBe(first.bindingKey);
        expect(await verifySpecConfirmationReadback(first, bytes(otherFile.fileContent))).toBe(false);
        expect(first.bindingKey).toContain('openItems');
    });

    it('AC-B3: open and delegated items never block confirmation, but a decision-level conflict still does', async () => {
        const state = itemState({ drafts: [
            { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'One.' }, { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'Two.' },
            { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'Three.' }, { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'Four.' },
            { kind: 'UNKNOWN', status: 'DELEGATED', sourceFields: [], text: 'Five.', delegation: 'Any common label.' },
        ] });
        const file = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', T1E_CLOCK);
        expect(JSON.parse(file.fileContent).payload.schema).toBe(CANDIDATE_SCHEMA_V2);
        const conflicted = acknowledgeIntentSpecReview(updateReviewDecision(state, 'access', { disposition: 'CONFLICT' }));
        await expect(createSpecConfirmationCandidate(conflicted, 'en', 'Self-declared fixture', T1E_CLOCK)).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
    });

    it('AC-B5: a stale item blocks creation until it is explicitly reconfirmed and the revision is viewed again', async () => {
        const state = itemState();
        const changed = { ...T1E_VALUES, constraints: 'No employee scoring or ranking' };
        let stale = synchronizeIntentSpecReview(state, changed, 'Exact draft\r\nend');
        await expect(createSpecConfirmationCandidate(acknowledgeIntentSpecReview(stale), 'en', 'Self-declared fixture', T1E_CLOCK)).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
        for (const id of ['data', 'exceptions', 'boundaries'] as const) stale = updateReviewDecision(stale, id, { reconfirm: true });
        await expect(createSpecConfirmationCandidate(acknowledgeIntentSpecReview(stale), 'en', 'Self-declared fixture', T1E_CLOCK)).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
        for (const item of stale.decisions.find(decision => decision.id === 'data')!.openItems!) {
            stale = updateReviewDecision(stale, 'data', { reconfirmItem: item.id });
        }
        const file = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(stale), 'en', 'Self-declared fixture', T1E_CLOCK);
        expect(JSON.parse(file.fileContent).payload.review.decisions[2].openItems[0].sourceValues.constraints).toBe('No employee scoring or ranking');
    });

    it('refuses a state whose items bypassed the update path (duplicate ids, stale snapshot, bad shape)', async () => {
        const state = itemState();
        const data = state.decisions.find(decision => decision.id === 'data')!;
        const forge = (items: unknown[]) => ({ ...state, decisions: state.decisions.map(decision => (decision.id === 'data' ? { ...decision, openItems: items as never } : decision)) });
        const [a, b] = data.openItems!;
        const forged = [
            forge([a, { ...b, id: a.id, kind: a.kind }]), forge([{ ...a, sourceValues: { constraints: 'Forged.' } }, b]),
            forge([{ ...a, extra: 1 }, b]), forge([{ ...a, text: 'tbd' }, b]),
        ];
        for (const bad of forged) await expect(createSpecConfirmationCandidate(bad, 'en', 'Self-declared fixture', T1E_CLOCK)).rejects.toThrow('CURRENT_REVIEW_REQUIRED');
    });

    it('v1 bytes for an item-free state do not depend on the new helpers (key order and draft are unchanged)', async () => {
        const state = reviewed();
        const file = await createSpecConfirmationCandidate(state, 'vi', 'Self-declared fixture', T1E_CLOCK);
        const payload = JSON.parse(file.fileContent).payload;
        expect(payload.draft).toBe(buildReviewedDraftPacket(state, 'vi'));
        expect(JSON.stringify(payload.review)).toBe(JSON.stringify(JSON.parse(JSON.stringify(state))));
        expect(Object.keys(payload.review.decisions[0])).toEqual(['id', 'answer', 'disposition', 'needsReconfirmation', 'sourceValues']);
    });
});

// NIS T1J: render-only documentary worksheet bound to the owned candidate. Synthetic fixtures only.
const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const sourceBlock = (sheet: string) => sheet.slice(sheet.indexOf('## 2.'), sheet.indexOf('## 3.'));
const afterSource = (sheet: string) => sheet.slice(sheet.indexOf('## 3.'));

describe('NIS T1J documentary worksheet renderer', () => {
    it('exports an owned candidate with many separate backtick runs within the candidate size cap', async () => {
        let state = createIntentSpecReview({ problem: 'Large valid draft' }, '` '.repeat(180000));
        for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Answer ${decision.id}` });
        const candidate = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(state), 'en', 'Reviewer', T1E_CLOCK);
        expect(bytes(candidate.fileContent).length).toBeLessThan(MAX_CONFIRMATION_BYTES);
        expect(renderDocumentaryWorksheet(candidate)).toContain(JSON.parse(candidate.fileContent).payload.draft);
    });
    it('binds exact source SHA, bytes, revision, language, reviewer and time, and keeps the draft verbatim', async () => {
        const state = itemState();
        const candidate = await createSpecConfirmationCandidate(state, 'en', 'Self-declared fixture', T1E_CLOCK);
        const sheet = renderDocumentaryWorksheet(candidate);
        const draft = JSON.parse(candidate.fileContent).payload.draft as string;
        expect(sheet).toContain(`| SHA-256 (whole JSON file) | ${candidate.fileSha256} |`);
        expect(candidate.fileSha256).toBe(sha256Hex(candidate.fileContent));
        expect(sheet).toContain(`| UTF-8 byte count of the JSON file | ${bytes(candidate.fileContent).length} |`);
        expect(sheet).toContain(`| Revision | ${state.revision} |`);
        expect(sheet).toContain('| Language | en |');
        expect(sheet).toContain('| Reviewer (self-declared, unverified) | Self-declared fixture |');
        expect(sheet).toContain(`| Candidate timestamp | ${T1E_CLOCK} |`);
        expect(sheet).toContain(`cvf-spec-review-r${state.revision}.json`);
        expect(worksheetFileName(state.revision)).toBe(`cvf-spec-review-r${state.revision}-worksheet.md`);
        expect(sourceBlock(sheet)).toContain(draft);
        expect(sourceBlock(sheet)).toContain('Retention period is not decided.');
        expect(sourceBlock(sheet)).toContain('Leads review totals only; no per-person score.');
    });

    it('preserves Unicode, multiline and CRLF draft content and survives backtick runs in the draft', async () => {
        const packet = 'Dòng một\r\nDòng hai ``` và ````` kết thúc\n日本語';
        let state = createIntentSpecReview({ problem: 'Gói tiếng Việt đầy đủ' }, packet);
        for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Quyết định ${decision.id}` });
        const candidate = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(state), 'vi', 'Người review', T1E_CLOCK);
        const sheet = renderDocumentaryWorksheet(candidate);
        const draft = JSON.parse(candidate.fileContent).payload.draft as string;
        expect(draft).toContain(packet);
        expect(sheet).toContain('``````text\n' + draft + '\n``````\n');
        expect(sheet).toContain('| Ngôn ngữ | vi |');
        expect(sheet).toContain('Review kỹ thuật CHƯA được thực hiện');
    });

    it('is deterministic, leaves the candidate untouched and uses LF for its own lines', async () => {
        const candidate = await createSpecConfirmationCandidate(itemState(), 'en', 'Self-declared fixture', T1E_CLOCK);
        const before = JSON.stringify(candidate);
        const first = renderDocumentaryWorksheet(candidate);
        expect(renderDocumentaryWorksheet(candidate)).toBe(first);
        expect(JSON.stringify(candidate)).toBe(before);
        expect(Object.isFrozen(candidate)).toBe(true);
        expect(first.replace(sourceBlock(first), '')).not.toContain('\r');
        expect(first.endsWith('\n')).toBe(true);
    });

    it('leaves every manual section UNFILLED and invents no requirement, readiness or policy', async () => {
        const candidate = await createSpecConfirmationCandidate(itemState(), 'en', 'Self-declared fixture', T1E_CLOCK);
        const sheet = renderDocumentaryWorksheet(candidate);
        expect(sheet.match(/^UNFILLED - manual entry$/gm)).toHaveLength(6);
        expect(sheet).toContain('Technical review has NOT been performed.');
        expect(sheet).toContain('not build readiness');
        const manual = afterSource(sheet);
        for (const forbidden of [/twelve/i, /12[- ]month/i, /build[- ]ready\b/i, /\bREADY\b/]) expect(manual).not.toMatch(forbidden);
        expect(manual).not.toContain('Retention period');
        expect(manual).toContain('unresolved; do not assume one');
        expect(manual).toContain('source statements');
        expect(manual).toContain('raw entry');
    });

    it('does not extract from the draft: different drafts yield identical instructions and sections', async () => {
        const a = await createSpecConfirmationCandidate(itemState(), 'en', 'Self-declared fixture', T1E_CLOCK);
        const b = await createSpecConfirmationCandidate(reviewed(), 'en', 'Self-declared fixture', T1E_CLOCK);
        expect(a.fileContent).not.toBe(b.fileContent);
        expect(afterSource(renderDocumentaryWorksheet(a))).toBe(afterSource(renderDocumentaryWorksheet(b)));
    });

    it('rejects a candidate whose bytes cannot be read instead of rendering a partial worksheet', async () => {
        const good = await createSpecConfirmationCandidate(reviewed(), 'en', 'Reviewer', T1E_CLOCK);
        const broken = (fileContent: string): SpecConfirmationCandidate => ({ ...good, fileContent });
        const payload = JSON.parse(good.fileContent).payload;
        for (const content of ['{', '{}', JSON.stringify({ payload: { ...payload, draft: 3 } }), JSON.stringify({ payload: { ...payload, language: 'fr' } })]) {
            expect(() => renderDocumentaryWorksheet(broken(content))).toThrow('CANDIDATE_UNREADABLE');
        }
    });

    it('keeps candidate bytes identical to the controls captured from the unmodified preimage', async () => {
        const v1 = await createSpecConfirmationCandidate(reviewed(), 'en', 'Self-declared fixture', T1E_CLOCK);
        const v2 = await createSpecConfirmationCandidate(itemState(), 'en', 'Self-declared fixture', T1E_CLOCK);
        let plain = createIntentSpecReview(T1E_VALUES, 'Gói tiếng Việt\nđầy đủ');
        for (const decision of plain.decisions) plain = updateReviewDecision(plain, decision.id, { answer: `Decision for ${decision.id}` });
        const noItems = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(plain), 'vi', 'Self-declared fixture', T1E_CLOCK);
        expect(JSON.parse(v1.fileContent).payload.schema).toBe(CANDIDATE_SCHEMA_V1);
        expect(JSON.parse(v2.fileContent).payload.schema).toBe(CANDIDATE_SCHEMA_V2);
        expect(JSON.parse(noItems.fileContent).payload.schema).toBe(CANDIDATE_SCHEMA_V1);
        // Pre-mutation capture at preimage c73dcae3...: .cvf/runtime/nis-t1j-worker-20261006/legacy-preimage-capture.json
        expect([v1.fileSha256, bytes(v1.fileContent).length]).toEqual(['bcdef4b7c988d01860780178a73a2808755f7f4004e2e5301ed27729b857b0c5', 3980]);
        expect([v2.fileSha256, bytes(v2.fileContent).length]).toEqual(['77e67c4c4d7b23a2134b12156edac44899e96c7c2a3876296a1c9b27e3cdf4af', 6136]);
        expect([noItems.fileSha256, bytes(noItems.fileContent).length]).toEqual(['b24473a689abe03783999c6233dc975505231e1817a9ecec793c8a802eefd12e', 4693]);
    });
});
