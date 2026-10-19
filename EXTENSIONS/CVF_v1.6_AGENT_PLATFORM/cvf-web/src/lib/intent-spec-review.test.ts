// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
import { describe, expect, it } from 'vitest';
import {
    acknowledgeIntentSpecReview, buildReviewedDraftPacket, createIntentSpecReview,
    getPendingReviewDecisions, isCurrentReviewAcknowledged, synchronizeIntentSpecReview,
    updateReviewDecision, type IntentSpecReviewState,
} from './intent-spec-review';
import {
    buildIntentReviewAppendix, decisionNeedsReview, getReviewOpenItems, previewOpenItems, type ReviewQuestionId,
} from './intent-spec-review';
import {
    createOpenItem, editOpenItem, summarizeOpenItems, type OpenItemDraft,
} from './intent-spec-open-items';

const values = {
    appName: 'Weekly report', problem: 'Summarize a team report',
    targetUsers: 'Team leads', coreFeatures: 'Collect and review weekly summaries',
    dataNeeds: 'Synthetic reports only', successCriteria: 'Every submitted item is included once',
    constraints: 'No employee scoring', mustPreserve: 'Report column names', outOfScope: 'Sending email',
};
const create = () => createIntentSpecReview(values, 'SOURCE PACKET\nNo email sending.');
const complete = (state: IntentSpecReviewState) => state.decisions.reduce((current, decision) =>
    updateReviewDecision(current, decision.id, { answer: `Explicit decision for ${decision.id}` }), state);

describe('local intent draft review (no AI or execution proof)', () => {
    it('keeps six unresolved business prompts even when all template fields contain text', () => {
        const state = create();
        expect(getPendingReviewDecisions(state).map(item => item.id)).toEqual([
            'workflow', 'access', 'data', 'exceptions', 'acceptance', 'boundaries',
        ]);
        expect(buildReviewedDraftPacket(state, 'en')).toContain('Items still needing a decision: 6');
        expect(buildReviewedDraftPacket(state, 'en')).toContain('No answer yet.');
    });

    it('binds acknowledgement to current content and invalidates it after a user correction', () => {
        const reviewed = acknowledgeIntentSpecReview(complete(create()));
        expect(isCurrentReviewAcknowledged(reviewed)).toBe(true);
        const changed = updateReviewDecision(reviewed, 'access', { answer: 'Only leads may export; contributors may edit their own entries.' });
        expect(isCurrentReviewAcknowledged(changed)).toBe(false);
        const packet = buildReviewedDraftPacket(changed, 'en');
        expect(packet).toContain('Only leads may export');
        expect(packet).not.toContain('Explicit decision for access');
        expect(packet).toContain('Viewed this revision: No');
    });

    it('preserves conflicting text and excludes it from resolved coverage', () => {
        const state = updateReviewDecision(create(), 'data', {
            answer: 'Manager asks for indefinite retention, policy says 30 days.', disposition: 'CONFLICT',
        });
        const viewed = acknowledgeIntentSpecReview(state);
        expect(getPendingReviewDecisions(viewed).some(item => item.id === 'data')).toBe(true);
        expect(buildReviewedDraftPacket(viewed, 'en')).toContain('Status: Conflicting');
        expect(buildReviewedDraftPacket(viewed, 'en')).toContain('policy says 30 days');
    });

    it('requires an explanation for not-applicable and keeps blank answered decisions open', () => {
        const blank = updateReviewDecision(create(), 'exceptions', { disposition: 'NOT_APPLICABLE' });
        expect(getPendingReviewDecisions(blank).some(item => item.id === 'exceptions')).toBe(true);
        const explained = updateReviewDecision(blank, 'exceptions', { answer: 'A manual review is the only operation in this fixture.' });
        expect(getPendingReviewDecisions(explained).some(item => item.id === 'exceptions')).toBe(false);
        const erased = updateReviewDecision(explained, 'exceptions', { answer: '   ', disposition: 'ANSWERED' });
        expect(getPendingReviewDecisions(erased).some(item => item.id === 'exceptions')).toBe(true);
    });

    it('does not resolve a decision with an unresolved placeholder or a bare not-applicable label', () => {
        for (const answer of ['n/a', 'UNKNOWN', 'chưa biết', 'Không áp dụng']) {
            const state = updateReviewDecision(create(), 'data', { answer, disposition: 'NOT_APPLICABLE' });
            expect(getPendingReviewDecisions(state).some(item => item.id === 'data')).toBe(true);
        }
    });

    it('keeps old answers and their original source until affected decisions are reconfirmed', () => {
        const old = acknowledgeIntentSpecReview(complete(create()));
        const changedValues = { ...values, targetUsers: 'All employees' };
        const changed = synchronizeIntentSpecReview(old, changedValues, 'New source packet');
        expect(isCurrentReviewAcknowledged(changed)).toBe(false);
        const access = changed.decisions.find(item => item.id === 'access')!;
        expect(access.answer).toBe('Explicit decision for access');
        expect(access.needsReconfirmation).toBe(true);
        expect(access.sourceValues.targetUsers).toBe('Team leads');
        expect(changed.decisions.find(item => item.id === 'workflow')!.needsReconfirmation).toBe(false);
        const accepted = updateReviewDecision(changed, 'access', { reconfirm: true });
        expect(accepted.decisions.find(item => item.id === 'access')!.sourceValues.targetUsers).toBe('All employees');
        expect(accepted.decisions.find(item => item.id === 'access')!.needsReconfirmation).toBe(false);
        expect(isCurrentReviewAcknowledged(accepted)).toBe(false);
    });

    it('invalidates all answered decisions for an unmapped product identity change', () => {
        const changed = synchronizeIntentSpecReview(complete(create()), { ...values, appName: 'Payroll tool' }, 'New product');
        expect(changed.decisions.every(item => item.needsReconfirmation)).toBe(true);
    });

    it('rebinds review when packet mode, language or context changes without losing business answers', () => {
        const old = acknowledgeIntentSpecReview(complete(create()));
        const changed = synchronizeIntentSpecReview(old, values, 'English full packet with changed context');
        expect(isCurrentReviewAcknowledged(changed)).toBe(false);
        expect(getPendingReviewDecisions(changed)).toHaveLength(0);
        expect(buildReviewedDraftPacket(changed, 'en')).toContain('English full packet with changed context');
    });

    it('does not invalidate on key ordering or no-op changes', () => {
        const state = acknowledgeIntentSpecReview(complete(create()));
        const reordered = Object.fromEntries(Object.entries(values).reverse());
        expect(synchronizeIntentSpecReview(state, reordered, state.packetSource)).toBe(state);
        expect(updateReviewDecision(state, 'access', { answer: 'Explicit decision for access' })).toBe(state);
    });

    it('exports original text, answers, provenance and boundaries as a current draft', () => {
        const state = updateReviewDecision(create(), 'boundaries', { answer: 'Giữ tên cột.\nKhông gửi email.' });
        const packet = buildReviewedDraftPacket(state, 'vi');
        expect(packet).toContain('SOURCE PACKET\nNo email sending.');
        expect(packet).toContain('> Giữ tên cột.\n> Không gửi email.');
        expect(packet).toContain('mustPreserve: Report column names');
        expect(packet).toContain('chưa có actor binding');
        expect(packet).toContain('Các hướng dẫn design/build phía dưới là bước tương lai');
        expect(packet).toContain('Mục còn cần quyết định: 5');
    });
});

// ---------------------------------------------------------------------------------------------
// NIS T1E: explicit user-declared open items. Synthetic fixtures only; no AI, store or provider.
// Inputs are listed before expectations, and an unknown the user has not yet supplied is never demanded.
// ---------------------------------------------------------------------------------------------
const FXA = {
    appName: 'Weekly Equipment Report Compiler', appType: 'Web App',
    problem: 'Every Friday a department head needs one weekly maintenance report compiled from entries submitted by team leads. Compiling by hand takes half a day and entries get lost.',
    targetUsers: 'Team leads (view and edit own entries only); department head (view all, sole exporter)',
    coreFeatures: '1. Team leads submit a weekly entry per equipment line\n2. System compiles all entries into one weekly report\n3. Department head exports the compiled report\n4. Late, missing and duplicate entries are marked in the report',
    successCriteria: 'Department head receives one compiled report by Monday 09:00 containing every submitted entry, with missing, late and duplicate entries visibly marked.',
    mustPreserve: 'Submitted entries are immutable once submitted; the existing equipment line codes stay unchanged.',
    platforms: 'Web browser on office Windows PCs',
    dataNeeds: 'Synthetic equipment line code, weekly status text, submitting team lead name, submission time. Source: weekly CSV drop only. No personal evaluation data.',
    lookAndFeel: 'Plain table, high contrast', outOfScope: 'No automatic scoring or ranking of team leads or people. No email sending in this version.',
    constraints: 'Team leads may correct their entry until the Friday 17:00 deadline. Deadline timezone not decided.',
};
const FXB = {
    appName: 'Tool Lending Log', appType: 'Web App',
    problem: 'Volunteers lend shared workshop tools and later forget who has which tool.',
    targetUsers: 'Volunteers (record loans and returns); workshop lead (view all loans)',
    coreFeatures: '1. Record a loan\n2. Record a return\n3. List overdue loans',
    successCriteria: 'The workshop lead can list every unreturned tool at any time.',
    mustPreserve: 'Existing tool tag codes stay unchanged.', platforms: 'Phone browser',
    dataNeeds: 'Tool tag, borrower first name, date lent.', lookAndFeel: 'Large buttons',
    outOfScope: 'No user accounts or logins. No fines or payments.', constraints: 'A loan lasts at most 14 days.',
};
const packetOf = (input: Record<string, string>) => Object.entries(input).map(([key, value]) => `${key}: ${value}`).join('\n');
const answered = (input: Record<string, string>, ids: readonly ReviewQuestionId[]) => ids.reduce(
    (current, id) => updateReviewDecision(current, id, { answer: `Decision text for ${id}.` }),
    createIntentSpecReview(input, packetOf(input)));
function withItem(state: IntentSpecReviewState, decisionId: ReviewQuestionId, draft: OpenItemDraft): IntentSpecReviewState {
    const created = createOpenItem(draft, getReviewOpenItems(state), state.values);
    if (!created.ok) throw new Error(`fixture draft refused: ${created.error}`);
    const existing = state.decisions.find(decision => decision.id === decisionId)!.openItems ?? [];
    const next = updateReviewDecision(state, decisionId, { openItems: [...existing, created.value] });
    if (next === state) throw new Error('fixture item was not stored');
    return next;
}
function resolved(state: IntentSpecReviewState, id: string, resolution: string): IntentSpecReviewState {
    const owner = state.decisions.find(decision => decision.openItems?.some(item => item.id === id))!;
    const previous = owner.openItems!.find(item => item.id === id)!;
    const edited = editOpenItem(previous, { kind: previous.kind, text: previous.text, sourceFields: previous.sourceFields, status: 'RESOLVED', resolution }, state.values);
    if (!edited.ok) throw new Error(edited.error);
    return updateReviewDecision(state, owner.id, { openItems: owner.openItems!.map(item => (item.id === id ? edited.value : item)) });
}
const FXA_RESOLUTION = 'Corrections before Friday 17:00 create a new entry version; after the deadline entries are immutable.';
const C1: OpenItemDraft = { kind: 'CONFLICT', status: 'OPEN', sourceFields: ['constraints', 'mustPreserve'], text: 'mustPreserve says submitted entries are immutable once submitted, but constraints says team leads may correct an entry until Friday 17:00.' };
function fxA(stage: 'S0' | 'S1' | 'S2'): IntentSpecReviewState {
    let state = answered(FXA, ['workflow', 'access']);
    state = updateReviewDecision(state, 'boundaries', { answer: 'CONFLICT C1: immutability against correction until Friday 17:00.', disposition: 'CONFLICT' });
    state = withItem(state, 'boundaries', C1);
    if (stage === 'S0') return state;
    state = updateReviewDecision(state, 'data', { answer: 'Source: weekly CSV drop only. Compiled reports are kept 12 months. UNKNOWN U1: raw entry retention is not decided.' });
    state = updateReviewDecision(state, 'exceptions', { answer: 'Missing entry: show a NO ENTRY row. UNKNOWN U2: timezone. UNKNOWN U3: public holiday.' });
    state = updateReviewDecision(state, 'acceptance', { answer: 'One compiled report by Monday 09:00. UNKNOWN U4: export file format is not decided.' });
    state = updateReviewDecision(state, 'boundaries', { answer: FXA_RESOLUTION, disposition: 'ANSWERED' });
    state = withItem(state, 'data', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: ['dataNeeds'], text: 'How long raw entries are kept is not decided.' });
    state = withItem(state, 'exceptions', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: ['constraints'], text: 'The deadline timezone is not decided.' });
    state = withItem(state, 'exceptions', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'Behavior when the deadline falls on a public holiday is not decided.' });
    state = withItem(state, 'acceptance', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'The export file format is not decided.' });
    state = resolved(state, 'C1', FXA_RESOLUTION);
    return stage === 'S1' ? state : acknowledgeIntentSpecReview(state);
}
const ids = (state: IntentSpecReviewState) => getReviewOpenItems(state).map(item => item.id);
const itemOf = (state: IntentSpecReviewState, id: string) => getReviewOpenItems(state).find(item => item.id === id)!;

describe('NIS T1E explicit open items in the review lifecycle', () => {
    it('AC-B2: a stage with only the conflict does not demand an unknown the user has not supplied', () => {
        const state = fxA('S0');
        expect(ids(state)).toEqual(['C1']);
        expect(summarizeOpenItems(getReviewOpenItems(state))).toMatchObject({ open: ['C1'], delegated: [], resolved: [], stale: [] });
        // The four undecided decisions are pending; the open item neither adds nor removes one.
        expect(getPendingReviewDecisions(state).map(decision => decision.id)).toEqual(['data', 'exceptions', 'acceptance', 'boundaries']);
        expect(buildReviewedDraftPacket(state, 'en')).not.toContain('U1');
    });

    it('AC-B1: the fourth unknown is kept with the first three, in creation order, without truncation or completeness claim', () => {
        const state = fxA('S1');
        expect(ids(state)).toEqual(['U1', 'U2', 'U3', 'U4', 'C1']);
        const summary = summarizeOpenItems(getReviewOpenItems(state));
        expect(summary).toMatchObject({ open: ['U1', 'U2', 'U3', 'U4'], resolved: ['C1'], delegated: [], stale: [] });
        expect(getPendingReviewDecisions(state)).toEqual([]);
        const draft = buildReviewedDraftPacket(state, 'en');
        const order = ['U1', 'U2', 'U3', 'U4'].map(id => draft.indexOf(`### ${id} [Unknown] Open`));
        expect(order.every(position => position > 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(draft).toContain('> The export file format is not decided.');
        expect(draft).toContain('Open: 4 (U1, U2, U3, U4); Delegated: 0; Resolved: 1 (C1)');
        expect(draft).toContain('do not prove the list is complete');
        expect(draft).not.toMatch(/all (unknowns|items) (are )?captured|nothing else is missing|no other unknowns/i);
    });

    it('AC-B4: a resolved conflict shows the user decision and both original cited snapshots; the source packet is untouched', () => {
        const state = fxA('S1');
        const draft = buildReviewedDraftPacket(state, 'en');
        expect(draft).toContain('Effective decision (user-entered):');
        expect(draft).toContain(`> ${FXA_RESOLUTION}`);
        expect(draft).toContain(`> constraints: ${FXA.constraints}`);
        expect(draft).toContain(`> mustPreserve: ${FXA.mustPreserve}`);
        expect(draft).toContain(state.packetSource);
        expect(state.packetSource).toBe(packetOf(FXA));
        expect(draft).toContain('no winner is chosen and no consistency is claimed');
        expect(draft).toContain('applies only to the brief fields it lists');
        expect(draft.trimEnd().endsWith('Build readiness: NOT_ASSESSED')).toBe(true);
        expect(draft).toContain('route to review only');
        expect(draft.indexOf('User-declared open items:')).toBeLessThan(draft.indexOf(state.packetSource));
    });

    it('AC-B5: a cited-source change marks only the affected items stale and blocks until each is explicitly reconfirmed', () => {
        const base = fxA('S2');
        expect(isCurrentReviewAcknowledged(base)).toBe(true);
        const changed = { ...FXA, constraints: 'Team leads may correct their entry until the Friday 16:00 deadline. Deadline timezone not decided.' };
        let state = synchronizeIntentSpecReview(base, changed, packetOf(changed));
        expect(state.acknowledgedRevision).toBeNull();
        expect(getReviewOpenItems(state).filter(item => item.needsReconfirmation).map(item => item.id)).toEqual(['U2', 'C1']);
        expect(['U1', 'U3', 'U4'].every(id => !itemOf(state, id).needsReconfirmation)).toBe(true);
        // The mapped decisions are flagged by the existing rule; the stale items keep their decision pending too.
        expect(getPendingReviewDecisions(state).map(decision => decision.id)).toEqual(['data', 'exceptions', 'boundaries']);
        // An item stays stale until the explicit reconfirm; the old snapshot is kept for the user to review.
        expect(itemOf(state, 'C1').sourceValues.constraints).toBe(FXA.constraints);
        for (const id of ['data', 'exceptions', 'boundaries'] as const) state = updateReviewDecision(state, id, { reconfirm: true });
        expect(getReviewOpenItems(state).filter(item => item.needsReconfirmation).map(item => item.id)).toEqual(['U2', 'C1']);
        expect(getPendingReviewDecisions(state).map(decision => decision.id)).toEqual(['exceptions', 'boundaries']);
        state = updateReviewDecision(state, 'boundaries', { reconfirmItem: 'C1' });
        state = updateReviewDecision(state, 'exceptions', { reconfirmItem: 'U2' });
        expect(itemOf(state, 'C1')).toMatchObject({ needsReconfirmation: false, sourceValues: { constraints: changed.constraints, mustPreserve: FXA.mustPreserve } });
        expect(getPendingReviewDecisions(state)).toEqual([]);
        expect(isCurrentReviewAcknowledged(state)).toBe(false);
        expect(isCurrentReviewAcknowledged(acknowledgeIntentSpecReview(state))).toBe(true);
    });

    it('AC-B5: a reconfirm of one item leaves every other stale item stale', () => {
        const changed = { ...FXA, constraints: 'Changed deadline wording.', dataNeeds: 'Changed data wording.' };
        const stale = synchronizeIntentSpecReview(fxA('S2'), changed, packetOf(changed));
        expect(getReviewOpenItems(stale).filter(item => item.needsReconfirmation).map(item => item.id)).toEqual(['U1', 'U2', 'C1']);
        const after = updateReviewDecision(stale, 'data', { reconfirmItem: 'U1' });
        expect(getReviewOpenItems(after).filter(item => item.needsReconfirmation).map(item => item.id)).toEqual(['U2', 'C1']);
        expect(after.revision).toBe(stale.revision + 1);
        expect(after.acknowledgedRevision).toBeNull();
    });

    it('AC-B6: an unrelated brief change keeps the designed all-decisions rule but flags no item that does not cite it', () => {
        const changed = { ...FXA, lookAndFeel: 'Dark theme' };
        const state = synchronizeIntentSpecReview(fxA('S2'), changed, packetOf(changed));
        expect(getPendingReviewDecisions(state)).toHaveLength(6);
        expect(getReviewOpenItems(state).some(item => item.needsReconfirmation)).toBe(false);
        expect(state.acknowledgedRevision).toBeNull();
    });

    it('a changed or removed cited field is stale and must be repaired or removed before reconfirm; edits never clear the flag', () => {
        const base = fxA('S1');
        const { constraints, ...rest } = FXA;
        void constraints;
        let state = synchronizeIntentSpecReview(base, rest, packetOf(rest));
        expect(itemOf(state, 'U2').needsReconfirmation).toBe(true);
        // Reconfirm is refused while the cited field is missing; nothing changes.
        expect(updateReviewDecision(state, 'exceptions', { reconfirmItem: 'U2' })).toBe(state);
        // A replacement list that clears the flag is refused (state unchanged by reference).
        const owner = state.decisions.find(decision => decision.id === 'exceptions')!;
        const forged = owner.openItems!.map(item => (item.id === 'U2' ? { ...item, needsReconfirmation: false } : item));
        expect(updateReviewDecision(state, 'exceptions', { openItems: forged })).toBe(state);
        // A combined decision and item edit also cannot clear the stale item.
        const combined = updateReviewDecision(state, 'exceptions', { answer: 'Missing entry: NO ENTRY row; late: flag LATE.', openItems: forged });
        expect(combined).toBe(state);
        const edited = editOpenItem(itemOf(state, 'U2'), { kind: 'UNKNOWN', text: 'The deadline timezone is not decided.', sourceFields: ['problem'], status: 'OPEN' }, state.values);
        expect(edited.ok).toBe(true);
        if (!edited.ok) throw new Error('unreachable');
        state = updateReviewDecision(state, 'exceptions', { openItems: owner.openItems!.map(item => (item.id === 'U2' ? edited.value : item)) });
        expect(itemOf(state, 'U2')).toMatchObject({ needsReconfirmation: true, sourceFields: ['problem'] });
        state = updateReviewDecision(state, 'exceptions', { reconfirmItem: 'U2' });
        expect(itemOf(state, 'U2').needsReconfirmation).toBe(false);
    });

    it('AC-B7: an items-only change preserves the decision answer, disposition, stale flag and source snapshot', () => {
        const changed = { ...FXA, constraints: 'Changed deadline wording.' };
        const stale = synchronizeIntentSpecReview(fxA('S2'), changed, packetOf(changed));
        const before = stale.decisions.find(decision => decision.id === 'data')!;
        expect(before.needsReconfirmation).toBe(true);
        const edited = editOpenItem(itemOf(stale, 'U1'), { kind: 'UNKNOWN', text: 'Raw entry retention is not decided.', sourceFields: ['dataNeeds'], status: 'OPEN' }, stale.values);
        if (!edited.ok) throw new Error(edited.error);
        const after = updateReviewDecision(stale, 'data', { openItems: [edited.value] });
        const kept = after.decisions.find(decision => decision.id === 'data')!;
        expect({ answer: kept.answer, disposition: kept.disposition, needsReconfirmation: kept.needsReconfirmation, sourceValues: kept.sourceValues })
            .toEqual({ answer: before.answer, disposition: before.disposition, needsReconfirmation: true, sourceValues: before.sourceValues });
        expect(itemOf(after, 'U1').text).toBe('Raw entry retention is not decided.');
        expect(after.revision).toBe(stale.revision + 1);
        expect(after.acknowledgedRevision).toBeNull();
    });

    it('AC-B8: every real item change bumps the revision and clears acknowledgement; a no-op returns the same state', () => {
        let state = fxA('S2');
        const step = (next: IntentSpecReviewState) => {
            expect(next.revision).toBe(state.revision + 1);
            expect(next.acknowledgedRevision).toBeNull();
            state = acknowledgeIntentSpecReview(next);
        };
        const owner = (id: ReviewQuestionId) => state.decisions.find(decision => decision.id === id)!;
        const added = createOpenItem({ kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'A new unknown.' }, getReviewOpenItems(state), state.values);
        if (!added.ok) throw new Error(added.error);
        step(updateReviewDecision(state, 'data', { openItems: [...owner('data').openItems!, added.value] }));
        const edited = editOpenItem(itemOf(state, 'U5'), { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'A reworded unknown.' }, state.values);
        if (!edited.ok) throw new Error(edited.error);
        step(updateReviewDecision(state, 'data', { openItems: owner('data').openItems!.map(item => (item.id === 'U5' ? edited.value : item)) }));
        const delegated = editOpenItem(itemOf(state, 'U5'), { kind: 'UNKNOWN', status: 'DELEGATED', delegation: 'Any common label.', sourceFields: [], text: 'A reworded unknown.' }, state.values);
        if (!delegated.ok) throw new Error(delegated.error);
        step(updateReviewDecision(state, 'data', { openItems: owner('data').openItems!.map(item => (item.id === 'U5' ? delegated.value : item)) }));
        step(updateReviewDecision(state, 'data', { openItems: owner('data').openItems!.filter(item => item.id !== 'U5') }));
        const same = updateReviewDecision(state, 'data', { openItems: [...owner('data').openItems!] });
        expect(same).toBe(state);
        expect(isCurrentReviewAcknowledged(state)).toBe(true);
        // A fresh item cannot be explicitly reconfirmed, and an unknown decision or item id changes nothing.
        expect(updateReviewDecision(state, 'data', { reconfirmItem: 'U1' })).toBe(state);
        expect(updateReviewDecision(state, 'data', { reconfirmItem: 'U99' })).toBe(state);
        expect(updateReviewDecision(state, 'data', { openItems: [], reconfirmItem: 'U1' })).toBe(state);
    });

    it('refuses invalid replacement lists without changing, truncating or resetting anything', () => {
        const state = fxA('S2');
        const data = state.decisions.find(decision => decision.id === 'data')!;
        const good = data.openItems![0];
        const bad: unknown[] = [
            [{ ...good, extra: 1 }], [{ ...good, id: 'U2' }], [{ ...good, text: 'tbd' }], [{ ...good, status: 'RESOLVED' }],
            [{ ...good, sourceValues: { dataNeeds: 'Forged snapshot.' } }], [good, good], 'not an array', null,
        ];
        for (const items of bad) expect(updateReviewDecision(state, 'data', { openItems: items as never })).toBe(state);
        const crowded = Array.from({ length: 48 }, (_, n) => ({ ...good, id: `U${n + 10}` }));
        expect(updateReviewDecision(state, 'data', { openItems: crowded })).toBe(state);
        expect(previewOpenItems(state, 'data', [{ ...good, text: '' }])).toBe('ITEM_TEXT');
        expect(previewOpenItems(state, 'workflow', [good])).toBe('ITEM_DUPLICATE_ID');
        expect(ids(state)).toEqual(['U1', 'U2', 'U3', 'U4', 'C1']);
    });

    it('AC-B3 (state level): open items never block, but a stale item or a decision-level conflict still does', () => {
        const state = fxA('S2');
        expect(getPendingReviewDecisions(state)).toEqual([]);
        expect(isCurrentReviewAcknowledged(state)).toBe(true);
        const conflicted = updateReviewDecision(state, 'access', { disposition: 'CONFLICT' });
        expect(getPendingReviewDecisions(conflicted).map(decision => decision.id)).toEqual(['access']);
        expect(decisionNeedsReview({ ...state.decisions[0], openItems: [{ ...itemOf(state, 'U1'), needsReconfirmation: true }] })).toBe(true);
        expect(decisionNeedsReview(state.decisions.find(decision => decision.id === 'data')!)).toBe(false);
    });

    it('AC-B9: delegation records the user boundary, counts apart from resolved, and chooses no default', () => {
        let state = answered(FXB, ['workflow', 'access', 'data', 'exceptions', 'acceptance', 'boundaries']);
        const refused = createOpenItem({ kind: 'UNKNOWN', status: 'DELEGATED', sourceFields: ['dataNeeds'], text: 'How dates are displayed is not decided.', delegation: '' }, [], state.values);
        expect(refused).toEqual({ ok: false, error: 'ITEM_DELEGATION_REQUIRED' });
        state = withItem(state, 'data', { kind: 'UNKNOWN', status: 'DELEGATED', sourceFields: ['dataNeeds'], text: 'How dates are displayed is not decided.', delegation: 'Any common date format is acceptable; do not convert time zones.' });
        expect(summarizeOpenItems(getReviewOpenItems(state))).toMatchObject({ open: [], delegated: ['U1'], resolved: [] });
        expect(getPendingReviewDecisions(state)).toEqual([]);
        const draft = buildReviewedDraftPacket(state, 'en');
        expect(draft).toContain('Delegated within this user-stated boundary (user-entered):');
        expect(draft).toContain('> Any common date format is acceptable; do not convert time zones.');
        expect(draft).toContain('it chooses no business value');
        expect(draft).toContain('privacy, retention, payment, authentication, deployment or scope changes');
    });

    it('AC-B12/B13/B14: a different job with a cross-question conflict, a free unknown and fewer than four unknowns', () => {
        let state = answered(FXB, ['workflow', 'access', 'data', 'exceptions', 'acceptance', 'boundaries']);
        state = withItem(state, 'data', { kind: 'UNKNOWN', status: 'DELEGATED', sourceFields: ['dataNeeds'], text: 'How dates are displayed is not decided.', delegation: 'Any common date format.' });
        state = withItem(state, 'exceptions', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'What happens when a tool is lent to someone who is not a volunteer is not decided.' });
        state = withItem(state, 'access', { kind: 'CONFLICT', status: 'OPEN', sourceFields: ['outOfScope', 'targetUsers'], text: 'The lead must view all loans, which implies identifying people, but outOfScope forbids user accounts and logins.' });
        expect(summarizeOpenItems(getReviewOpenItems(state))).toMatchObject({ open: ['C1', 'U2'], delegated: ['U1'], resolved: [], stale: [] });
        state = acknowledgeIntentSpecReview(state);
        // The conflict sits under access but cites outOfScope, which belongs to the boundaries mapping.
        const changedScope = { ...FXB, outOfScope: 'No fines or payments.' };
        const afterScope = synchronizeIntentSpecReview(state, changedScope, packetOf(changedScope));
        expect(getReviewOpenItems(afterScope).filter(item => item.needsReconfirmation).map(item => item.id)).toEqual(['C1']);
        const accessDecision = afterScope.decisions.find(decision => decision.id === 'access')!;
        expect(accessDecision.sourceValues).toEqual(state.decisions.find(decision => decision.id === 'access')!.sourceValues);
        // An unmapped change flags every answered decision but no item, and the free unknown never goes stale.
        const changedLook = { ...FXB, lookAndFeel: 'Small buttons', platforms: 'Desktop' };
        const afterLook = synchronizeIntentSpecReview(state, changedLook, packetOf(changedLook));
        expect(getPendingReviewDecisions(afterLook)).toHaveLength(6);
        expect(getReviewOpenItems(afterLook).some(item => item.needsReconfirmation)).toBe(false);
        expect(afterLook.acknowledgedRevision).toBeNull();
    });

    it('AC-B15: viewed confirmation, decisions still pending, unresolved items and readiness are separate facts', () => {
        const state = fxA('S2');
        const appendix = buildIntentReviewAppendix(state, 'en');
        expect(appendix).toContain('Viewed this revision: Yes, in the current session');
        expect(appendix).toContain('Items still needing a decision: 0');
        expect(appendix).toContain('Open: 4 (U1, U2, U3, U4)');
        expect(appendix).toContain('Build readiness: NOT_ASSESSED');
        const resolvedU1 = resolved(state, 'U1', 'Keep raw entries 6 months.');
        const appendix2 = buildIntentReviewAppendix(resolvedU1, 'en');
        expect(appendix2).toContain('Viewed this revision: No');
        expect(appendix2).toContain('Open: 3 (U2, U3, U4); Delegated: 0; Resolved: 2 (U1, C1)');
        // Acknowledging again changes the viewed line only, never the item counts.
        const reviewedAgain = buildIntentReviewAppendix(acknowledgeIntentSpecReview(resolvedU1), 'en');
        expect(reviewedAgain).toContain('Viewed this revision: Yes, in the current session');
        expect(reviewedAgain).toContain('Open: 3 (U2, U3, U4); Delegated: 0; Resolved: 2 (U1, C1)');
    });

    it('AC-B16: the Vietnamese projection carries the same structure behind the encoding exception header', () => {
        const draft = buildReviewedDraftPacket(fxA('S2'), 'vi');
        expect(draft).toContain('Mục mở do người dùng khai báo: 4 còn mở, 0 đã ủy quyền, 1 đã giải quyết.');
        expect(draft).toContain('## Mục chưa giải quyết và quyết định có hiệu lực');
        expect(draft).toContain('### U4 [Chưa biết] Còn mở - quyết định: acceptance');
        expect(draft).toContain('Quyết định có hiệu lực (người dùng nhập):');
        expect(draft.trimEnd().endsWith('Build readiness: NOT_ASSESSED')).toBe(true);
    });

    it('AC-B17: removing an unknown drops it from the draft, bumps the revision and clears acknowledgement', () => {
        const state = fxA('S2');
        const data = state.decisions.find(decision => decision.id === 'acceptance')!;
        const after = updateReviewDecision(state, 'acceptance', { openItems: data.openItems!.filter(item => item.id !== 'U4') });
        expect(ids(after)).toEqual(['U1', 'U2', 'U3', 'C1']);
        expect(buildReviewedDraftPacket(after, 'en')).not.toContain('The export file format is not decided.');
        expect(after.revision).toBe(state.revision + 1);
        expect(after.acknowledgedRevision).toBeNull();
        expect(after.decisions.find(decision => decision.id === 'acceptance')).not.toHaveProperty('openItems');
    });

    it('AC-B18: prose that says UNKNOWN creates no item and leaves the draft in its item-free shape', () => {
        let state = answered(FXA, ['workflow', 'access']);
        state = updateReviewDecision(state, 'data', { answer: 'Retention kept 12 months. UNKNOWN U1: raw entry retention is not decided.' });
        expect(getReviewOpenItems(state)).toEqual([]);
        const draft = buildReviewedDraftPacket(state, 'en');
        expect(draft).not.toContain('Unresolved items and effective decisions');
        expect(draft).not.toContain('User-declared open items');
        expect(draft).not.toContain('Build readiness: NOT_ASSESSED');
        expect(JSON.stringify(state)).not.toContain('openItems');
    });

    it('keeps item-free output unchanged and returns an item-free decision shape after the last item is removed', () => {
        const free = answered(FXA, ['workflow']);
        const withOne = withItem(free, 'workflow', { kind: 'UNKNOWN', status: 'OPEN', sourceFields: [], text: 'A point.' });
        const owner = withOne.decisions.find(decision => decision.id === 'workflow')!;
        const back = updateReviewDecision(withOne, 'workflow', { openItems: [] });
        expect(owner.openItems).toHaveLength(1);
        expect(JSON.stringify(back.decisions)).toBe(JSON.stringify(free.decisions));
        // Same revision and acknowledgement as the item-free control, so the only difference left would be the items.
        expect(buildReviewedDraftPacket(back, 'en')).toBe(buildReviewedDraftPacket({ ...free, revision: back.revision, acknowledgedRevision: back.acknowledgedRevision }, 'en'));
        expect(back.revision).toBe(withOne.revision + 1);
    });
});
