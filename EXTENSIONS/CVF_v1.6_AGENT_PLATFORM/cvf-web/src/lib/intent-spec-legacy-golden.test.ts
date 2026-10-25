// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
/** @vitest-environment jsdom */
// Frozen synthetic controls copied unchanged from a historical private capture.
// The fixture pins that source's raw hash; its chronology metadata is a historical
// claim, not independent public verification. Never regenerate outputs from this code.
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const verifier = vi.hoisted(() => vi.fn());
vi.mock('./middleware-auth', () => ({ verifySessionCookie: verifier }));
import { resolveIntentSpecActor } from './intent-spec-actor';
import { commitIntentSpecAcceptanceCandidate, prepareIntentSpecAcceptance, type IntentSpecAcceptanceStorePort } from './intent-spec-acceptance';
import { createSpecConfirmationCandidate, reviewBindingKey, verifySpecConfirmationReadback } from './intent-spec-confirmation';
import { createOpenItem } from './intent-spec-open-items';
import {
    acknowledgeIntentSpecReview, buildReviewedDraftPacket, createIntentSpecReview, updateReviewDecision,
    type IntentSpecReviewState, type ReviewLanguage,
} from './intent-spec-review';

interface Control {
    language: ReviewLanguage; reviewer: string; createdAt: string; stateJson: string; packetSource: string; draft: string;
    draftSha256: string; fileContent: string; fileSha256: string; bindingKey: string; bindingKeySha256: string; revision: number;
    acceptanceRecordId: string; acceptanceRecord: string; acceptanceRecordSha256: string;
    actor: { userId: string; orgId: string; teamId: string; role: string; assurance: string }; preparedAtMs: number;
}
const frozen = JSON.parse(readFileSync(
    path.resolve(__dirname, '../test/fixtures/intent-spec-legacy-controls.json'), 'utf-8')) as {
    sourceRawSha256: string; legacyProducerBase: string; capturedBeforeAnyTrackedEdit: boolean; controls: Record<'LG1' | 'LG2' | 'LG3', Control>;
};
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const bytes = (value: string) => new TextEncoder().encode(value);
const NOW = 1791158400000;

beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    verifier.mockReset();
    verifier.mockResolvedValue({ userId: 'user_fixture', user: 'Fixture', role: 'developer', orgId: 'org_fixture', teamId: 'team_fixture', expiresAt: 1791158460000, authMode: 'session' });
});
afterEach(() => vi.unstubAllGlobals());

function memoryPort(): IntentSpecAcceptanceStorePort & { records: Map<string, Uint8Array> } {
    const records = new Map<string, Uint8Array>();
    return { records, async createIfAbsent(id, data) { records.set(id, new Uint8Array(data)); }, async read(id) { return records.get(id) ?? null; } };
}
/** Same inputs as the frozen capture: values come from the frozen state itself, answers and packet are the fixed policy. */
function legacyState(control: Control, acknowledge = true): IntentSpecReviewState {
    const values = (JSON.parse(control.stateJson) as { values: Record<string, string> }).values;
    let state = createIntentSpecReview(values, 'Exact source packet\r\nend');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision for ${decision.id}` });
    return acknowledge ? acknowledgeIntentSpecReview(state) : state;
}
const ids = ['LG1', 'LG2', 'LG3'] as const;

describe('frozen legacy v1 controls captured from the unmodified producers', () => {
    it('pins historical capture metadata and three unchanged synthetic controls', () => {
        expect(frozen.sourceRawSha256).toBe('98a1d469d8ca5166ca5d44bedb19518d0e249aa8cc515af3861ae15312e6c554');
        expect(frozen.legacyProducerBase).toBe('a27c13fa7a30fbc76b755aac539ec65e6dcae49d');
        expect(frozen.capturedBeforeAnyTrackedEdit).toBe(true);
        expect(Object.keys(frozen.controls)).toEqual(['LG1', 'LG2', 'LG3']);
        for (const id of ids) {
            const control = frozen.controls[id];
            expect(JSON.parse(control.fileContent).payload.schema).toBe('cvf.intentSpecReviewCandidate.v1');
            expect(sha(control.fileContent)).toBe(control.fileSha256);
            expect(sha(control.draft)).toBe(control.draftSha256);
            expect(sha(control.bindingKey)).toBe(control.bindingKeySha256);
        }
    });

    it.each(ids)('AC-L1/L2/L8 %s: the current producers reproduce the frozen state, draft, file bytes and binding key', async id => {
        const control = frozen.controls[id];
        const state = legacyState(control);
        expect(JSON.stringify(state)).toBe(control.stateJson);
        expect(state.packetSource).toBe(control.packetSource);
        expect(state.revision).toBe(control.revision);
        const draft = buildReviewedDraftPacket(state, control.language);
        expect(draft).toBe(control.draft);
        expect(sha(draft)).toBe(control.draftSha256);
        expect(draft).not.toContain('Build readiness');
        expect(draft).not.toContain('User-declared open items');
        const file = await createSpecConfirmationCandidate(state, control.language, control.reviewer, control.createdAt);
        expect(file.fileContent).toBe(control.fileContent);
        expect(file.fileSha256).toBe(control.fileSha256);
        expect(file.bindingKey).toBe(control.bindingKey);
        expect(sha(file.bindingKey)).toBe(control.bindingKeySha256);
        expect(reviewBindingKey(state, control.language, control.reviewer)).toBe(control.bindingKey);
        expect(JSON.stringify(JSON.parse(file.fileContent).payload.review)).toBe(control.stateJson);
        expect(JSON.stringify(state)).not.toContain('openItems');
    });

    it.each(ids)('AC-L3 %s: the stored frozen bytes are accepted unchanged and reproduce the frozen record id and record', async id => {
        const control = frozen.controls[id];
        const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), NOW);
        expect({ ...actor }).toEqual(control.actor);
        const candidate = prepareIntentSpecAcceptance(actor, bytes(control.fileContent), control.fileSha256, control.preparedAtMs);
        expect(candidate.id).toBe(control.acceptanceRecordId);
        expect(candidate.revision).toBe(control.revision);
        const store = memoryPort();
        const receipt = await commitIntentSpecAcceptanceCandidate(actor, candidate, store, () => NOW);
        expect(receipt.state).toBe('STORE_PORT_READBACK_VERIFIED');
        const record = new TextDecoder().decode(store.records.get(candidate.id));
        expect(record).toBe(control.acceptanceRecord);
        expect(sha(record)).toBe(control.acceptanceRecordSha256);
        const readback = await createSpecConfirmationCandidate(legacyState(control), control.language, control.reviewer, control.createdAt);
        expect(await verifySpecConfirmationReadback(readback, bytes(control.fileContent))).toBe(true);
    });

    it('AC-L4: the frozen v1 file with an injected openItems key is rejected by the unchanged v1 key sets', async () => {
        const control = frozen.controls.LG1;
        const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), NOW);
        const file = JSON.parse(control.fileContent);
        const item = { id: 'U1', kind: 'UNKNOWN', text: 'A point.', sourceFields: [], sourceValues: {}, status: 'OPEN', resolution: '', delegation: '', needsReconfirmation: false };
        file.payload.review.decisions[0].openItems = [item];
        file.payload.draft = buildReviewedDraftPacket(file.payload.review, 'en');
        file.payloadSha256 = sha(JSON.stringify(file.payload));
        const input = bytes(JSON.stringify(file) + '\n');
        expect(() => prepareIntentSpecAcceptance(actor, input, sha(input), NOW)).toThrow('INVALID_SPEC_REVIEW_FILE');
    });

    it('AC-L7 (Local-corrected): adding then removing an item never rewinds the revision, and equal-revision item-free bytes match', async () => {
        const control = frozen.controls.LG1;
        const original = legacyState(control);
        const created = createOpenItem({ kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'A temporary point.' }, [], original.values);
        if (!created.ok) throw new Error(created.error);
        const added = updateReviewDecision(original, 'data', { openItems: [created.value] });
        expect(added.revision).toBe(original.revision + 1);
        expect(added.acknowledgedRevision).toBeNull();
        const removed = updateReviewDecision(added, 'data', { openItems: [] });
        // The revision only moves forward and acknowledgement is not restored by the removal.
        expect(removed.revision).toBe(original.revision + 2);
        expect(removed.revision).toBeGreaterThan(control.revision);
        expect(removed.acknowledgedRevision).toBeNull();
        // Normalized content equals the item-free shape: no openItems key anywhere, same decisions, values and packet.
        expect(JSON.stringify(removed.decisions)).toBe(JSON.stringify(original.decisions));
        expect(JSON.stringify(removed)).not.toContain('openItems');
        expect(removed.values).toEqual(original.values);
        expect(removed.packetSource).toBe(original.packetSource);
        // Bytes are compared only with an item-free control at the SAME revision, acknowledgement, clock, reviewer and actor.
        const viewedAgain = acknowledgeIntentSpecReview(removed);
        const sameRevisionControl: IntentSpecReviewState = { ...original, revision: viewedAgain.revision, acknowledgedRevision: viewedAgain.revision };
        expect(JSON.stringify(viewedAgain)).toBe(JSON.stringify(sameRevisionControl));
        const fromRemoved = await createSpecConfirmationCandidate(viewedAgain, control.language, control.reviewer, control.createdAt);
        const fromControl = await createSpecConfirmationCandidate(sameRevisionControl, control.language, control.reviewer, control.createdAt);
        expect(fromRemoved.fileContent).toBe(fromControl.fileContent);
        expect(fromRemoved.fileSha256).toBe(fromControl.fileSha256);
        expect(JSON.parse(fromRemoved.fileContent).payload.schema).toBe('cvf.intentSpecReviewCandidate.v1');
        const actor = await resolveIntentSpecActor(new Request('http://localhost/local-contract'), NOW);
        const idRemoved = prepareIntentSpecAcceptance(actor, bytes(fromRemoved.fileContent), fromRemoved.fileSha256, NOW).id;
        const idControl = prepareIntentSpecAcceptance(actor, bytes(fromControl.fileContent), fromControl.fileSha256, NOW).id;
        expect(idRemoved).toBe(idControl);
        // The frozen revision-7 bytes differ from the revision-9 bytes only by the revision and acknowledgement numbers.
        expect(fromRemoved.fileContent).not.toBe(control.fileContent);
    });

    it('a state that carries an item selects v2, which a legacy v1-only producer path would never emit', async () => {
        const control = frozen.controls.LG2;
        const original = legacyState(control, false);
        const created = createOpenItem({ kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'Một điểm chưa quyết.' }, [], original.values);
        if (!created.ok) throw new Error(created.error);
        const state = acknowledgeIntentSpecReview(updateReviewDecision(original, 'data', { openItems: [created.value] }));
        const file = await createSpecConfirmationCandidate(state, 'vi', control.reviewer, control.createdAt);
        expect(JSON.parse(file.fileContent).payload.schema).toBe('cvf.intentSpecReviewCandidate.v2');
        expect(file.fileContent).not.toBe(control.fileContent);
    });
});
