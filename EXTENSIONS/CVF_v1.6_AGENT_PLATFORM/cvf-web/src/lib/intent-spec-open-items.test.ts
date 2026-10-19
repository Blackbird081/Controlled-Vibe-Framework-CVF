// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
import { describe, expect, it } from 'vitest';
import {
    buildOpenItemHeaderLine, buildOpenItemSection, createOpenItem, describeOpenItemError, editOpenItem,
    flattenOpenItems, getOpenItemKindLabel, getOpenItemStatusLabel, isPlaceholderText, itemSourceChanged, markOpenItemStale,
    MAX_OPEN_ITEMS, MAX_OPEN_ITEM_TEXT, nextOpenItemId, OPEN_ITEM_KEYS, reconfirmOpenItem, sameOpenItems, summarizeOpenItems,
    validateOpenItemSet, validateOpenItemShape, validateReplacement, validateStoredOpenItem,
    type OpenItemDraft, type OpenItemError, type ReviewOpenItem,
} from './intent-spec-open-items';

const values: Record<string, string> = {
    mustPreserve: 'Submitted entries are immutable once submitted.',
    constraints: 'Team leads may correct an entry until Friday 17:00.',
    dataNeeds: 'Equipment line code, weekly status text.',
};
const unknown = (patch: Partial<OpenItemDraft> = {}): OpenItemDraft => ({
    kind: 'UNKNOWN', text: 'How long raw entries are kept is not decided.', sourceFields: ['dataNeeds'], status: 'OPEN', ...patch,
});
const conflict = (patch: Partial<OpenItemDraft> = {}): OpenItemDraft => ({
    kind: 'CONFLICT', text: 'Immutable entries versus correction until Friday.', sourceFields: ['constraints', 'mustPreserve'], status: 'OPEN', ...patch,
});
function made(draft: OpenItemDraft, existing: ReviewOpenItem[] = [], from = values): ReviewOpenItem {
    const result = createOpenItem(draft, existing, from);
    if (!result.ok) throw new Error(`fixture draft refused: ${result.error}`);
    return result.value;
}
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe('open item creation and shape (explicit user declarations only)', () => {
    it('builds exactly nine keys in the contracted order with a fresh snapshot of its own cited fields', () => {
        const item = made(unknown());
        expect(Object.keys(item)).toEqual([...OPEN_ITEM_KEYS]);
        expect(OPEN_ITEM_KEYS).toEqual(['id', 'kind', 'text', 'sourceFields', 'sourceValues', 'status', 'resolution', 'delegation', 'needsReconfirmation']);
        expect(item).toEqual({
            id: 'U1', kind: 'UNKNOWN', text: 'How long raw entries are kept is not decided.', sourceFields: ['dataNeeds'],
            sourceValues: { dataNeeds: values.dataNeeds }, status: 'OPEN', resolution: '', delegation: '', needsReconfirmation: false,
        });
        expect(validateStoredOpenItem(item, values)).toBeNull();
    });

    it('assigns kind-matching ids that are unique and stable, with no minimum or maximum expected count', () => {
        const first = made(unknown());
        const second = made(unknown({ text: 'Timezone is not decided.' }), [first]);
        const conflictItem = made(conflict(), [first, second]);
        expect([first.id, second.id, conflictItem.id]).toEqual(['U1', 'U2', 'C1']);
        expect(nextOpenItemId([first, second], 'UNKNOWN')).toBe('U3');
        expect(nextOpenItemId([], 'CONFLICT')).toBe('C1');
        // A gap left by a removed item is not shifted onto the survivors.
        expect(made(unknown({ text: 'Another point.' }), [second]).id).toBe('U3');
        expect(validateOpenItemSet([first, second, conflictItem])).toBeNull();
        expect(validateOpenItemSet([first, { ...second, id: 'U1' }])).toBe('ITEM_DUPLICATE_ID');
    });

    it('keeps trimmed meaningful text and refuses placeholders, blanks and over-length text without changing anything', () => {
        for (const text of ['', '   ', 'tbd', 'unknown', '?', 'n/a', 'Chưa biết', 'KHÔNG RÕ', 'x'.repeat(MAX_OPEN_ITEM_TEXT + 1)]) {
            expect(createOpenItem(unknown({ text }), [], values)).toEqual({ ok: false, error: 'ITEM_TEXT' });
        }
        expect(made(unknown({ text: '  padded text  ' })).text).toBe('padded text');
        expect(made(unknown({ text: 'x'.repeat(MAX_OPEN_ITEM_TEXT) })).text).toHaveLength(MAX_OPEN_ITEM_TEXT);
        expect(isPlaceholderText(' TBD ')).toBe(true);
        expect(isPlaceholderText('Real answer')).toBe(false);
    });

    it('requires own, distinct, safe cited fields from the current brief and two for a conflict', () => {
        const cases: [Partial<OpenItemDraft>, OpenItemError][] = [
            [{ sourceFields: ['missingField'] }, 'ITEM_SOURCE_MISSING'],
            [{ sourceFields: ['dataNeeds', 'dataNeeds'] }, 'ITEM_SOURCE_FIELDS'],
            [{ sourceFields: ['__proto__'] }, 'ITEM_SOURCE_FIELDS'],
            [{ sourceFields: ['constructor'] }, 'ITEM_SOURCE_FIELDS'],
            [{ sourceFields: ['has space'] }, 'ITEM_SOURCE_FIELDS'],
            [{ sourceFields: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'] }, 'ITEM_SOURCE_FIELDS'],
        ];
        for (const [patch, error] of cases) expect(createOpenItem(unknown(patch), [], values)).toEqual({ ok: false, error });
        expect(createOpenItem(conflict({ sourceFields: ['constraints'] }), [], values)).toEqual({ ok: false, error: 'ITEM_CONFLICT_NEEDS_TWO_FIELDS' });
        expect(made(unknown({ sourceFields: [] })).sourceValues).toEqual({});
        const six = { a1: '1', a2: '2', a3: '3', a4: '4', a5: '5', a6: '6' };
        expect(made(unknown({ sourceFields: Object.keys(six) }), [], six).sourceFields).toHaveLength(6);
    });

    it('requires a resolution only when resolved and a boundary only when delegated', () => {
        expect(createOpenItem(unknown({ status: 'RESOLVED' }), [], values)).toEqual({ ok: false, error: 'ITEM_RESOLUTION_REQUIRED' });
        expect(createOpenItem(unknown({ status: 'RESOLVED', resolution: 'tbd' }), [], values)).toEqual({ ok: false, error: 'ITEM_RESOLUTION_REQUIRED' });
        expect(createOpenItem(unknown({ status: 'DELEGATED' }), [], values)).toEqual({ ok: false, error: 'ITEM_DELEGATION_REQUIRED' });
        expect(made(unknown({ status: 'RESOLVED', resolution: 'Keep 12 months.' })).resolution).toBe('Keep 12 months.');
        expect(made(unknown({ status: 'DELEGATED', delegation: 'Any common date format.' })).delegation).toBe('Any common date format.');
        // Unused text fields are cleared, never carried silently.
        expect(made(unknown({ status: 'OPEN', resolution: 'ignored', delegation: 'ignored' }))).toMatchObject({ resolution: '', delegation: '' });
        expect(made(unknown({ status: 'RESOLVED', resolution: 'Keep 12 months.', delegation: 'ignored' })).delegation).toBe('');
    });

    it('validates shape strictly: key set and order, id and kind agreement, types and enums', () => {
        const item = made(unknown());
        const reordered = Object.fromEntries(Object.entries(item).reverse());
        const bad: [unknown, OpenItemError][] = [
            [{ ...item, extra: 1 }, 'ITEM_SHAPE'], [(({ delegation, ...rest }) => (void delegation, rest))(item), 'ITEM_SHAPE'],
            [reordered, 'ITEM_SHAPE'], [null, 'ITEM_SHAPE'], [[], 'ITEM_SHAPE'],
            [{ ...item, id: 'X1' }, 'ITEM_ID'], [{ ...item, id: 'U0' }, 'ITEM_ID'], [{ ...item, id: 'U100' }, 'ITEM_ID'],
            [{ ...item, id: 'C1' }, 'ITEM_ID'], [{ ...item, kind: 'OTHER' }, 'ITEM_KIND'], [{ ...item, status: 'DONE' }, 'ITEM_STATUS'],
            [{ ...item, sourceValues: { other: 'x' } }, 'ITEM_SNAPSHOT'], [{ ...item, sourceValues: { dataNeeds: 5 } }, 'ITEM_SNAPSHOT'],
            [{ ...item, resolution: 'x' }, 'ITEM_RESOLUTION_NOT_ALLOWED'], [{ ...item, delegation: 'x' }, 'ITEM_DELEGATION_NOT_ALLOWED'],
            [{ ...item, needsReconfirmation: 'no' }, 'ITEM_SHAPE'], [{ ...item, text: ' padded ' }, 'ITEM_TEXT'],
        ];
        for (const [value, error] of bad) expect(validateOpenItemShape(value)).toBe(error);
        expect(validateOpenItemShape(item)).toBeNull();
    });

    it('refuses the 51st item without truncating or resetting earlier items', () => {
        const items: ReviewOpenItem[] = [];
        for (let n = 0; n < MAX_OPEN_ITEMS; n += 1) items.push(made(unknown({ text: `Point ${n} is not decided.` }), items));
        expect(items).toHaveLength(MAX_OPEN_ITEMS);
        expect(createOpenItem(unknown({ text: 'One more point.' }), items, values)).toEqual({ ok: false, error: 'ITEM_TOO_MANY' });
        expect(validateOpenItemSet([...items, made(conflict(), items.slice(0, 49))])).toBe('ITEM_TOO_MANY');
        expect(items[0].text).toBe('Point 0 is not decided.');
        expect(new Set(items.map(item => item.id)).size).toBe(MAX_OPEN_ITEMS);
    });
});

describe('open item lifecycle: edit, stale, reconfirm', () => {
    it('edits text, status and fields but never changes id or kind, and an edit cannot clear a stale flag', () => {
        const item = made(unknown());
        const resolved = editOpenItem(item, unknown({ status: 'RESOLVED', resolution: 'Keep raw entries 6 months.' }), values);
        expect(resolved.ok && resolved.value).toMatchObject({ id: 'U1', status: 'RESOLVED', resolution: 'Keep raw entries 6 months.', needsReconfirmation: false });
        expect(editOpenItem(item, conflict(), values)).toEqual({ ok: false, error: 'ITEM_KIND' });
        const stale = markOpenItemStale(item, { ...values, dataNeeds: 'Changed brief text.' });
        expect(stale.needsReconfirmation).toBe(true);
        const editedStale = editOpenItem(stale, unknown({ text: 'Reworded unknown.' }), { ...values, dataNeeds: 'Changed brief text.' });
        expect(editedStale.ok && editedStale.value).toMatchObject({ needsReconfirmation: true, sourceValues: { dataNeeds: values.dataNeeds } });
    });

    it('marks an item stale only for its own cited fields, stickily, and treats a missing field as changed', () => {
        const cited = made(unknown());
        const free = made(unknown({ text: 'Free point.', sourceFields: [] }), [cited]);
        const changed = { ...values, dataNeeds: 'New wording.' };
        expect(itemSourceChanged(cited, values)).toBe(false);
        expect(itemSourceChanged(cited, changed)).toBe(true);
        expect(itemSourceChanged(free, changed)).toBe(false);
        expect(markOpenItemStale(free, changed)).toBe(free);
        expect(markOpenItemStale(cited, { ...values, constraints: 'Other.' })).toBe(cited);
        const stale = markOpenItemStale(cited, changed);
        expect(markOpenItemStale(stale, values).needsReconfirmation).toBe(true);
        const { dataNeeds, ...withoutField } = values;
        void dataNeeds;
        expect(itemSourceChanged(cited, withoutField)).toBe(true);
        expect(markOpenItemStale(cited, withoutField).needsReconfirmation).toBe(true);
    });

    it('reconfirm refreshes only that item and refuses a missing cited field until it is repaired', () => {
        const cited = made(unknown());
        const changed = { ...values, dataNeeds: 'New wording.' };
        const stale = markOpenItemStale(cited, changed);
        const fresh = reconfirmOpenItem(stale, changed);
        expect(fresh.ok && fresh.value).toMatchObject({ needsReconfirmation: false, sourceValues: { dataNeeds: 'New wording.' } });
        const { dataNeeds, ...withoutField } = values;
        void dataNeeds;
        expect(reconfirmOpenItem(markOpenItemStale(cited, withoutField), withoutField)).toEqual({ ok: false, error: 'ITEM_SOURCE_MISSING' });
        const repaired = editOpenItem(markOpenItemStale(cited, withoutField), unknown({ sourceFields: ['constraints'] }), withoutField);
        expect(repaired.ok && repaired.value).toMatchObject({ needsReconfirmation: true, sourceValues: { constraints: values.constraints } });
        if (repaired.ok) expect(reconfirmOpenItem(repaired.value, withoutField).ok).toBe(true);
    });

    it('validates a replacement list: new items fresh, existing flags and snapshots kept, ids unique', () => {
        const a = made(unknown());
        const b = made(conflict(), [a]);
        expect(validateReplacement([a, b], [a], [], values)).toBeNull();
        expect(validateReplacement([a], [a, b], [], values)).toBeNull(); // removal
        const staleA = markOpenItemStale(a, { ...values, dataNeeds: 'Changed.' });
        expect(validateReplacement([{ ...staleA, needsReconfirmation: false }], [staleA], [], { ...values, dataNeeds: 'Changed.' })).toBe('ITEM_STALE_CLEARED');
        expect(validateReplacement([{ ...a, needsReconfirmation: true }], [a], [], values)).toBe('ITEM_STALE_CLEARED');
        expect(validateReplacement([{ ...a, sourceValues: { dataNeeds: 'Forged.' } }], [a], [], values)).toBe('ITEM_SNAPSHOT');
        expect(validateReplacement([{ ...b, needsReconfirmation: true }], [], [], values)).toBe('ITEM_NOT_NEW_FRESH');
        expect(validateReplacement([{ ...b, sourceValues: { constraints: 'x', mustPreserve: 'y' } }], [], [], values)).toBe('ITEM_NOT_NEW_FRESH');
        expect(validateReplacement([b], [], [{ ...a, id: 'C1' }], values)).toBe('ITEM_DUPLICATE_ID');
        expect(validateReplacement([{ ...a, kind: 'CONFLICT' as const }], [a], [], values)).toBe('ITEM_ID');
        expect(validateReplacement([{ ...a, extra: true } as unknown as ReviewOpenItem], [a], [], values)).toBe('ITEM_SHAPE');
    });

    it('a stored candidate must hold fresh items with current own keys and matching snapshots', () => {
        const item = made(unknown());
        expect(validateStoredOpenItem({ ...item, needsReconfirmation: true }, values)).toBe('ITEM_STALE');
        expect(validateStoredOpenItem(item, { ...values, dataNeeds: 'Different.' })).toBe('ITEM_STALE');
        const { dataNeeds, ...withoutField } = values;
        void dataNeeds;
        expect(validateStoredOpenItem(item, withoutField)).toBe('ITEM_SOURCE_MISSING');
        expect(validateStoredOpenItem({ ...item, id: 'U1', kind: 'CONFLICT' }, values)).toBe('ITEM_ID');
    });

    it('compares item lists by content and flattens decision groups in order', () => {
        const a = made(unknown());
        const b = made(conflict(), [a]);
        expect(sameOpenItems([a, b], clone([a, b]))).toBe(true);
        expect(sameOpenItems([a], [b])).toBe(false);
        expect(flattenOpenItems([[a], undefined, [b]]).map(item => item.id)).toEqual(['U1', 'C1']);
    });
});

describe('summary, localization and projection text', () => {
    const open = made(unknown());
    const delegated = made(unknown({ text: 'Date format.', status: 'DELEGATED', delegation: 'Any common date format.', sourceFields: [] }), [open]);
    const resolved = made(conflict({ status: 'RESOLVED', resolution: 'New version before Friday 17:00; immutable after.' }), [open, delegated]);
    const all = [open, delegated, resolved];

    it('counts by status separately and lists stale ids without treating open as complete', () => {
        const summary = summarizeOpenItems([...all.slice(0, 2), { ...resolved, needsReconfirmation: true }]);
        expect(summary).toEqual({ open: ['U1'], delegated: ['U2'], resolved: ['C1'], stale: ['C1'], total: 3 });
        expect(summarizeOpenItems([])).toEqual({ open: [], delegated: [], resolved: [], stale: [], total: 0 });
    });

    it('renders an en projection with user-entered quotes, cited snapshots, boundaries and no readiness claim', () => {
        const rows = [{ decisionId: 'data', item: open }, { decisionId: 'exceptions', item: delegated }, { decisionId: 'boundaries', item: resolved }];
        const section = buildOpenItemSection(rows, 'en');
        expect(section).toContain('## Unresolved items and effective decisions');
        expect(section).toContain('Open: 1 (U1); Delegated: 1 (U2); Resolved: 1 (C1)');
        expect(section).toContain('### U1 [Unknown] Open - decision: data');
        expect(section).toContain('> How long raw entries are kept is not decided.');
        expect(section).toContain('> dataNeeds: Equipment line code, weekly status text.');
        expect(section).toContain('(no brief field cited)');
        expect(section).toContain('Effective decision (user-entered):');
        expect(section).toContain('> New version before Friday 17:00; immutable after.');
        expect(section).toContain('> constraints: Team leads may correct an entry until Friday 17:00.');
        expect(section).toContain('Delegated within this user-stated boundary (user-entered):');
        expect(section).toContain('> Any common date format.');
        expect(section).toContain('it chooses no business value');
        expect(section).toContain('no winner is chosen and no consistency is claimed');
        expect(section).toContain('do not prove the list is complete');
        expect(section.trimEnd().endsWith('Build readiness: NOT_ASSESSED')).toBe(true);
        expect(section).not.toMatch(/build[- ]ready\b|approved for build|execution granted/i);
    });

    it('renders the same structure in vi and a header line in both languages', () => {
        const rows = [{ decisionId: 'data', item: open }, { decisionId: 'boundaries', item: resolved }];
        const section = buildOpenItemSection(rows, 'vi');
        expect(section).toContain('## Mục chưa giải quyết và quyết định có hiệu lực');
        expect(section).toContain('Quyết định có hiệu lực (người dùng nhập):');
        expect(section).toContain('### C1 [Mâu thuẫn] Đã giải quyết - quyết định: boundaries');
        expect(section.trimEnd().endsWith('Build readiness: NOT_ASSESSED')).toBe(true);
        expect(buildOpenItemHeaderLine(all, 'en')).toContain('1 open, 1 delegated, 1 resolved');
        expect(buildOpenItemHeaderLine(all, 'vi')).toContain('1 còn mở, 1 đã ủy quyền, 1 đã giải quyết');
        expect(buildOpenItemHeaderLine(all, 'en')).toContain('route to review only');
    });

    it('flags a stale item and quotes multi-line text as data', () => {
        const multi = made(unknown({ text: 'Line one\nLine two', sourceFields: [] }));
        const section = buildOpenItemSection([{ decisionId: 'data', item: { ...multi, needsReconfirmation: true } }], 'en');
        expect(section).toContain('> Line one\n> Line two');
        expect(section).toContain('Reconfirm after the source brief changed.');
    });

    it('has a label and a message for every kind, status and error in both languages', () => {
        for (const language of ['en', 'vi'] as const) {
            expect(getOpenItemKindLabel('UNKNOWN', language)).toBeTruthy();
            expect(getOpenItemKindLabel('CONFLICT', language)).toBeTruthy();
            for (const status of ['OPEN', 'RESOLVED', 'DELEGATED'] as const) expect(getOpenItemStatusLabel(status, language)).toBeTruthy();
            const errors: OpenItemError[] = ['ITEM_SHAPE', 'ITEM_ID', 'ITEM_KIND', 'ITEM_STATUS', 'ITEM_TEXT', 'ITEM_SOURCE_FIELDS',
                'ITEM_CONFLICT_NEEDS_TWO_FIELDS', 'ITEM_SOURCE_MISSING', 'ITEM_SNAPSHOT', 'ITEM_RESOLUTION_REQUIRED',
                'ITEM_RESOLUTION_NOT_ALLOWED', 'ITEM_DELEGATION_REQUIRED', 'ITEM_DELEGATION_NOT_ALLOWED', 'ITEM_STALE',
                'ITEM_STALE_CLEARED', 'ITEM_DUPLICATE_ID', 'ITEM_TOO_MANY', 'ITEM_UNKNOWN_ITEM', 'ITEM_NOT_NEW_FRESH'];
            for (const error of errors) expect(describeOpenItemError(error, language).length).toBeGreaterThan(5);
        }
        expect(getOpenItemStatusLabel('DELEGATED', 'vi')).not.toBe(getOpenItemStatusLabel('DELEGATED', 'en'));
    });
});

// Local reviewer regression: malformed field-list input must not become an unbound item.
it('Local rejects malformed cited-field lists on create and edit without erasing provenance', () => {
    const values = { coreFeatures: 'Synthetic reporting' };
    const draft = { kind: 'UNKNOWN', status: 'OPEN', text: 'Local cited requirement', sourceFields: ['coreFeatures'] } as const;
    const valid = createOpenItem({ ...draft, sourceFields: [...draft.sourceFields] }, [], values);
    if (!valid.ok) throw new Error(valid.error);
    for (const bad of [null, undefined, 'coreFeatures', {}]) {
        const malformed = { ...draft, sourceFields: bad } as unknown as Parameters<typeof createOpenItem>[0];
        expect(createOpenItem(malformed, [], values)).toEqual({ ok: false, error: 'ITEM_SOURCE_FIELDS' });
        expect(editOpenItem(valid.value, malformed, values)).toEqual({ ok: false, error: 'ITEM_SOURCE_FIELDS' });
        expect(valid.value.sourceFields).toEqual(['coreFeatures']);
    }
});
