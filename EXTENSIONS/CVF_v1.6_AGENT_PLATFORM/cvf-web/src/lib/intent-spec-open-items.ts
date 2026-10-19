// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
/** User-declared open items for the local spec review. Pure helpers: no I/O, no model inference, no
 * prose parsing. An item records what the user said is unknown, in conflict or delegated; it never
 * proves the list is complete and never grants build readiness or execution.
 */
export type OpenItemLanguage = 'vi' | 'en';
export type OpenItemKind = 'UNKNOWN' | 'CONFLICT';
export type OpenItemStatus = 'OPEN' | 'RESOLVED' | 'DELEGATED';

export const OPEN_ITEM_KEYS = [
    'id', 'kind', 'text', 'sourceFields', 'sourceValues', 'status', 'resolution', 'delegation', 'needsReconfirmation',
] as const;
export const OPEN_ITEM_KINDS: readonly OpenItemKind[] = ['UNKNOWN', 'CONFLICT'];
export const OPEN_ITEM_STATUSES: readonly OpenItemStatus[] = ['OPEN', 'RESOLVED', 'DELEGATED'];
/** Fail-closed safety bounds, never a completeness quota: an over-cap change is refused, not truncated. */
export const MAX_OPEN_ITEMS = 50;
export const MAX_OPEN_ITEM_TEXT = 2000;
export const MAX_SOURCE_FIELDS = 6;

export interface ReviewOpenItem {
    id: string;
    kind: OpenItemKind;
    text: string;
    sourceFields: string[];
    sourceValues: Record<string, string>;
    status: OpenItemStatus;
    resolution: string;
    delegation: string;
    needsReconfirmation: boolean;
}

/** What the user enters; the helper adds the id and the source snapshot. */
export interface OpenItemDraft {
    kind: OpenItemKind;
    text: string;
    sourceFields: string[];
    status: OpenItemStatus;
    resolution?: string;
    delegation?: string;
}

export type OpenItemError =
    | 'ITEM_SHAPE' | 'ITEM_ID' | 'ITEM_KIND' | 'ITEM_STATUS' | 'ITEM_TEXT' | 'ITEM_SOURCE_FIELDS'
    | 'ITEM_CONFLICT_NEEDS_TWO_FIELDS' | 'ITEM_SOURCE_MISSING' | 'ITEM_SNAPSHOT' | 'ITEM_RESOLUTION_REQUIRED'
    | 'ITEM_RESOLUTION_NOT_ALLOWED' | 'ITEM_DELEGATION_REQUIRED' | 'ITEM_DELEGATION_NOT_ALLOWED' | 'ITEM_STALE'
    | 'ITEM_STALE_CLEARED' | 'ITEM_DUPLICATE_ID' | 'ITEM_TOO_MANY' | 'ITEM_UNKNOWN_ITEM' | 'ITEM_NOT_NEW_FRESH';

export type OpenItemResult<T> = { ok: true; value: T } | { ok: false; error: OpenItemError };

const PLACEHOLDERS = ['', 'n/a', 'unknown', 'tbd', 'todo', '?', 'chưa biết', 'chưa quyết', 'không rõ', 'not applicable', 'không áp dụng'];
const FIELD_ID = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];
const ID = /^[UC](?:[1-9]|[1-9][0-9])$/;

/** Shared with the decision check so both treat the same bare labels as no answer. */
export function isPlaceholderText(text: string): boolean {
    return PLACEHOLDERS.includes(text.trim().toLowerCase());
}

function meaningful(value: unknown): value is string {
    return typeof value === 'string' && value.trim() === value && value.length >= 1
        && value.length <= MAX_OPEN_ITEM_TEXT && !isPlaceholderText(value);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

function sameStrings(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((item, index) => item === b[index]);
}

function currentFor(fields: readonly string[], values: Record<string, string>): Record<string, string> {
    return Object.fromEntries(fields.map(field => [field, Object.hasOwn(values, field) ? values[field] : '']));
}

/** Exact shape and rules that do not depend on the current brief (a stored candidate runs this first). */
export function validateOpenItemShape(item: unknown): OpenItemError | null {
    if (!isRecord(item) || !sameStrings(Object.keys(item), OPEN_ITEM_KEYS)) return 'ITEM_SHAPE';
    if (typeof item.id !== 'string' || !ID.test(item.id)) return 'ITEM_ID';
    if (!OPEN_ITEM_KINDS.includes(item.kind as OpenItemKind)) return 'ITEM_KIND';
    if (item.id[0] !== (item.kind === 'UNKNOWN' ? 'U' : 'C')) return 'ITEM_ID';
    if (!OPEN_ITEM_STATUSES.includes(item.status as OpenItemStatus)) return 'ITEM_STATUS';
    if (!meaningful(item.text)) return 'ITEM_TEXT';
    const fields = item.sourceFields;
    if (!Array.isArray(fields) || fields.length > MAX_SOURCE_FIELDS
        || fields.some(field => typeof field !== 'string' || !FIELD_ID.test(field) || UNSAFE_KEYS.includes(field))
        || new Set(fields).size !== fields.length) return 'ITEM_SOURCE_FIELDS';
    if (item.kind === 'CONFLICT' && fields.length < 2) return 'ITEM_CONFLICT_NEEDS_TWO_FIELDS';
    const snapshot = item.sourceValues;
    if (!isRecord(snapshot) || !sameStrings(Object.keys(snapshot), fields as string[])
        || Object.values(snapshot).some(value => typeof value !== 'string')) return 'ITEM_SNAPSHOT';
    if (item.status === 'RESOLVED') {
        if (!meaningful(item.resolution)) return 'ITEM_RESOLUTION_REQUIRED';
    } else if (item.resolution !== '') return 'ITEM_RESOLUTION_NOT_ALLOWED';
    if (item.status === 'DELEGATED') {
        if (!meaningful(item.delegation)) return 'ITEM_DELEGATION_REQUIRED';
    } else if (item.delegation !== '') return 'ITEM_DELEGATION_NOT_ALLOWED';
    if (typeof item.needsReconfirmation !== 'boolean') return 'ITEM_SHAPE';
    return null;
}

/** True when a cited field no longer exists or its text differs from the item's snapshot. */
export function itemSourceChanged(item: ReviewOpenItem, values: Record<string, string>): boolean {
    return item.sourceFields.some(field => !Object.hasOwn(values, field) || values[field] !== item.sourceValues[field]);
}

/** A stored candidate must hold fresh items: own cited keys, snapshots equal to the stored brief, no stale flag. */
export function validateStoredOpenItem(item: unknown, values: Record<string, string>): OpenItemError | null {
    const shape = validateOpenItemShape(item);
    if (shape) return shape;
    const typed = item as ReviewOpenItem;
    if (typed.needsReconfirmation) return 'ITEM_STALE';
    if (typed.sourceFields.some(field => !Object.hasOwn(values, field))) return 'ITEM_SOURCE_MISSING';
    if (itemSourceChanged(typed, values)) return 'ITEM_STALE';
    return null;
}

export function flattenOpenItems(groups: readonly (readonly ReviewOpenItem[] | undefined)[]): ReviewOpenItem[] {
    return groups.flatMap(group => group ?? []);
}

/** Review-wide rules: unique ids and the safety cap. Per-item rules are checked separately. */
export function validateOpenItemSet(items: readonly ReviewOpenItem[]): OpenItemError | null {
    if (items.length > MAX_OPEN_ITEMS) return 'ITEM_TOO_MANY';
    return new Set(items.map(item => item.id)).size === items.length ? null : 'ITEM_DUPLICATE_ID';
}

export function nextOpenItemId(existing: readonly ReviewOpenItem[], kind: OpenItemKind): string | null {
    const prefix = kind === 'UNKNOWN' ? 'U' : 'C';
    const used = new Set(existing.map(item => item.id));
    let max = 0;
    for (const item of existing) if (item.id[0] === prefix) max = Math.max(max, Number(item.id.slice(1)));
    for (let n = max + 1; n <= 99; n += 1) if (!used.has(`${prefix}${n}`)) return `${prefix}${n}`;
    for (let n = 1; n <= 99; n += 1) if (!used.has(`${prefix}${n}`)) return `${prefix}${n}`;
    return null;
}

function canonical(item: {
    id: string; kind: OpenItemKind; text: string; sourceFields: string[]; sourceValues: Record<string, string>;
    status: OpenItemStatus; resolution: string; delegation: string; needsReconfirmation: boolean;
}): ReviewOpenItem {
    return {
        id: item.id, kind: item.kind, text: item.text, sourceFields: [...item.sourceFields],
        sourceValues: Object.fromEntries(item.sourceFields.map(field => [field, item.sourceValues[field]])),
        status: item.status, resolution: item.resolution, delegation: item.delegation,
        needsReconfirmation: item.needsReconfirmation,
    };
}

function draftFields(draft: OpenItemDraft) {
    return {
        text: typeof draft.text === 'string' ? draft.text.trim() : draft.text,
        resolution: draft.status === 'RESOLVED' ? (draft.resolution ?? '').trim() : '',
        delegation: draft.status === 'DELEGATED' ? (draft.delegation ?? '').trim() : '',
    };
}

function freshSnapshotError(item: ReviewOpenItem, values: Record<string, string>): OpenItemError | null {
    if (item.sourceFields.some(field => !Object.hasOwn(values, field))) return 'ITEM_SOURCE_MISSING';
    return null;
}

/** Builds a new item with a fresh snapshot of its own cited fields. Does not touch any existing item. */
export function createOpenItem(
    draft: OpenItemDraft, existing: readonly ReviewOpenItem[], values: Record<string, string>,
): OpenItemResult<ReviewOpenItem> {
    if (!Array.isArray(draft.sourceFields)) return { ok: false, error: 'ITEM_SOURCE_FIELDS' };
    if (existing.length >= MAX_OPEN_ITEMS) return { ok: false, error: 'ITEM_TOO_MANY' };
    if (!OPEN_ITEM_KINDS.includes(draft.kind)) return { ok: false, error: 'ITEM_KIND' };
    const id = nextOpenItemId(existing, draft.kind);
    if (!id) return { ok: false, error: 'ITEM_TOO_MANY' };
    const fields = Array.isArray(draft.sourceFields) ? [...draft.sourceFields] : [];
    const item = canonical({
        id, kind: draft.kind, sourceFields: fields, status: draft.status, ...draftFields(draft),
        sourceValues: currentFor(fields, values), needsReconfirmation: false,
    });
    const shape = validateOpenItemShape(item) ?? freshSnapshotError(item, values);
    return shape ? { ok: false, error: shape } : { ok: true, value: item };
}

/** Edits an existing item. Kind and id are fixed; an edit never clears a stale flag (only reconfirm does). */
export function editOpenItem(
    previous: ReviewOpenItem, draft: OpenItemDraft, values: Record<string, string>,
): OpenItemResult<ReviewOpenItem> {
    if (!Array.isArray(draft.sourceFields)) return { ok: false, error: 'ITEM_SOURCE_FIELDS' };
    if (draft.kind !== previous.kind) return { ok: false, error: 'ITEM_KIND' };
    const fields = Array.isArray(draft.sourceFields) ? [...draft.sourceFields] : [];
    const sameFields = sameStrings(fields, previous.sourceFields);
    const item = canonical({
        id: previous.id, kind: previous.kind, sourceFields: fields, status: draft.status, ...draftFields(draft),
        sourceValues: sameFields ? previous.sourceValues : currentFor(fields, values),
        needsReconfirmation: previous.needsReconfirmation,
    });
    const shape = validateOpenItemShape(item) ?? (sameFields ? null : freshSnapshotError(item, values));
    return shape ? { ok: false, error: shape } : { ok: true, value: item };
}

/** Explicit reconfirm: refresh this item's snapshot and clear only its own stale flag. */
export function reconfirmOpenItem(item: ReviewOpenItem, values: Record<string, string>): OpenItemResult<ReviewOpenItem> {
    const missing = freshSnapshotError(item, values);
    if (missing) return { ok: false, error: missing };
    return { ok: true, value: canonical({ ...item, sourceValues: currentFor(item.sourceFields, values), needsReconfirmation: false }) };
}

/** Sticky stale flag after a source change; items without cited fields are never stale from source text. */
export function markOpenItemStale(item: ReviewOpenItem, values: Record<string, string>): ReviewOpenItem {
    if (item.needsReconfirmation || !itemSourceChanged(item, values)) return item;
    return { ...item, needsReconfirmation: true };
}

/**
 * Safety net for a replacement list: every item valid, new items fresh, an existing item's stale flag and
 * unchanged snapshot kept, ids unique and within the cap. The caller treats any error as "store nothing".
 */
export function validateReplacement(
    next: readonly ReviewOpenItem[], previousAll: readonly ReviewOpenItem[], otherItems: readonly ReviewOpenItem[],
    values: Record<string, string>,
): OpenItemError | null {
    const setError = validateOpenItemSet([...otherItems, ...next]);
    if (setError) return setError;
    const before = new Map(previousAll.map(item => [item.id, item]));
    for (const item of next) {
        const shape = validateOpenItemShape(item);
        if (shape) return shape;
        const old = before.get(item.id);
        if (!old) {
            if (item.needsReconfirmation || item.sourceFields.some(field => !Object.hasOwn(values, field))) return 'ITEM_NOT_NEW_FRESH';
            if (itemSourceChanged(item, values)) return 'ITEM_NOT_NEW_FRESH';
            continue;
        }
        if (old.kind !== item.kind) return 'ITEM_KIND';
        if (old.needsReconfirmation !== item.needsReconfirmation) return 'ITEM_STALE_CLEARED';
        if (sameStrings(old.sourceFields, item.sourceFields)) {
            if (!sameStrings(Object.values(old.sourceValues), Object.values(item.sourceValues))) return 'ITEM_SNAPSHOT';
        } else if (item.sourceFields.some(field => !Object.hasOwn(values, field))
            || itemSourceChanged(item, values)) return 'ITEM_SNAPSHOT';
    }
    return null;
}

export function sameOpenItems(a: readonly ReviewOpenItem[], b: readonly ReviewOpenItem[]): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export interface OpenItemSummary {
    open: string[]; delegated: string[]; resolved: string[]; stale: string[]; total: number;
}

export function summarizeOpenItems(items: readonly ReviewOpenItem[]): OpenItemSummary {
    const ids = (status: OpenItemStatus) => items.filter(item => item.status === status).map(item => item.id);
    return {
        open: ids('OPEN'), delegated: ids('DELEGATED'), resolved: ids('RESOLVED'),
        stale: items.filter(item => item.needsReconfirmation).map(item => item.id), total: items.length,
    };
}

const KIND_LABELS: Record<OpenItemLanguage, Record<OpenItemKind, string>> = {
    vi: { UNKNOWN: 'Chưa biết', CONFLICT: 'Mâu thuẫn' },
    en: { UNKNOWN: 'Unknown', CONFLICT: 'Conflict' },
};
const STATUS_LABELS: Record<OpenItemLanguage, Record<OpenItemStatus, string>> = {
    vi: { OPEN: 'Còn mở', RESOLVED: 'Đã giải quyết', DELEGATED: 'Đã ủy quyền' },
    en: { OPEN: 'Open', RESOLVED: 'Resolved', DELEGATED: 'Delegated' },
};
export const getOpenItemKindLabel = (kind: OpenItemKind, language: OpenItemLanguage) => KIND_LABELS[language][kind];
export const getOpenItemStatusLabel = (status: OpenItemStatus, language: OpenItemLanguage) => STATUS_LABELS[language][status];

const ERROR_LABELS: Record<OpenItemLanguage, Record<OpenItemError, string>> = {
    vi: {
        ITEM_SHAPE: 'Mục này không hợp lệ.', ITEM_ID: 'Mã mục không hợp lệ.', ITEM_KIND: 'Loại mục không hợp lệ.',
        ITEM_STATUS: 'Trạng thái không hợp lệ.', ITEM_TEXT: 'Hãy mô tả cụ thể điều chưa biết hoặc mâu thuẫn (tối đa 2000 ký tự).',
        ITEM_SOURCE_FIELDS: 'Chọn tối đa 6 trường khác nhau của brief.', ITEM_CONFLICT_NEEDS_TWO_FIELDS: 'Mâu thuẫn cần ít nhất hai trường brief.',
        ITEM_SOURCE_MISSING: 'Một trường brief được trích dẫn không còn. Hãy sửa trường trích dẫn hoặc xóa mục này.',
        ITEM_SNAPSHOT: 'Nội dung brief được trích dẫn không khớp.', ITEM_RESOLUTION_REQUIRED: 'Hãy ghi quyết định có hiệu lực.',
        ITEM_RESOLUTION_NOT_ALLOWED: 'Chỉ mục đã giải quyết mới có quyết định.', ITEM_DELEGATION_REQUIRED: 'Hãy ghi phạm vi mà builder được tự quyết.',
        ITEM_DELEGATION_NOT_ALLOWED: 'Chỉ mục đã ủy quyền mới có phạm vi ủy quyền.', ITEM_STALE: 'Brief đã thay đổi; hãy kiểm lại mục này.',
        ITEM_STALE_CLEARED: 'Chỉ nút kiểm lại mới xóa cảnh báo thay đổi.', ITEM_DUPLICATE_ID: 'Mã mục bị trùng.',
        ITEM_TOO_MANY: 'Đã đạt giới hạn 50 mục; chưa có mục nào bị bỏ.', ITEM_UNKNOWN_ITEM: 'Không tìm thấy mục.',
        ITEM_NOT_NEW_FRESH: 'Mục mới phải khớp brief hiện tại.',
    },
    en: {
        ITEM_SHAPE: 'This item is not valid.', ITEM_ID: 'The item id is not valid.', ITEM_KIND: 'The item kind is not valid.',
        ITEM_STATUS: 'The status is not valid.', ITEM_TEXT: 'Describe what is unknown or in conflict (up to 2000 characters).',
        ITEM_SOURCE_FIELDS: 'Pick up to 6 different brief fields.', ITEM_CONFLICT_NEEDS_TWO_FIELDS: 'A conflict needs at least two brief fields.',
        ITEM_SOURCE_MISSING: 'A cited brief field no longer exists. Edit the cited fields or remove this item.',
        ITEM_SNAPSHOT: 'The cited brief text does not match.', ITEM_RESOLUTION_REQUIRED: 'Write the decision that applies.',
        ITEM_RESOLUTION_NOT_ALLOWED: 'Only a resolved item has a decision.', ITEM_DELEGATION_REQUIRED: 'Write the boundary the builder may decide within.',
        ITEM_DELEGATION_NOT_ALLOWED: 'Only a delegated item has a boundary.', ITEM_STALE: 'The brief changed; check this item again.',
        ITEM_STALE_CLEARED: 'Only the check-again button clears the changed warning.', ITEM_DUPLICATE_ID: 'The item id is duplicated.',
        ITEM_TOO_MANY: 'The 50-item limit is reached; nothing was dropped.', ITEM_UNKNOWN_ITEM: 'The item was not found.',
        ITEM_NOT_NEW_FRESH: 'A new item must match the current brief.',
    },
};
export const describeOpenItemError = (error: OpenItemError, language: OpenItemLanguage) => ERROR_LABELS[language][error];

const quoted = (text: string) => text.split(/\r?\n/).map(line => `> ${line}`).join('\n');
const idList = (ids: readonly string[]) => (ids.length ? ` (${ids.join(', ')})` : '');

export function buildOpenItemHeaderLine(items: readonly ReviewOpenItem[], language: OpenItemLanguage): string {
    const s = summarizeOpenItems(items);
    return language === 'vi'
        ? `Mục mở do người dùng khai báo: ${s.open.length} còn mở, ${s.delegated.length} đã ủy quyền, ${s.resolved.length} đã giải quyết. Xem phần "Mục chưa giải quyết và quyết định có hiệu lực" ở cuối. Danh sách chỉ gồm các mục người dùng tự khai báo. Các dòng sẵn sàng trong gói nguồn bên dưới chỉ chuyển sang bước review, không có nghĩa các mục đã được chốt.`
        : `User-declared open items: ${s.open.length} open, ${s.delegated.length} delegated, ${s.resolved.length} resolved. See "Unresolved items and effective decisions" at the end. The list holds only items the user declared. Readiness lines in the source packet below route to review only; they do not mean these items are settled.`;
}

/** The trailing appendix section. `rows` are in decision order, then array order. */
export function buildOpenItemSection(
    rows: readonly { decisionId: string; item: ReviewOpenItem }[], language: OpenItemLanguage,
): string {
    const vi = language === 'vi';
    const s = summarizeOpenItems(rows.map(row => row.item));
    const blocks = rows.map(({ decisionId, item }) => {
        const cited = item.sourceFields.length
            ? item.sourceFields.map(field => `${field}: ${item.sourceValues[field] || (vi ? '(trống)' : '(empty)')}`).join('\n')
            : (vi ? '(không trích dẫn trường nào)' : '(no brief field cited)');
        return [
            `### ${item.id} [${getOpenItemKindLabel(item.kind, language)}] ${getOpenItemStatusLabel(item.status, language)} - ${vi ? 'quyết định' : 'decision'}: ${decisionId}`,
            vi ? 'Nội dung người dùng nhập (dữ liệu, không phải quyền thực thi):' : 'User-entered content (data, not execution authority):',
            quoted(item.text),
            vi ? 'Các trường brief được trích dẫn lúc ghi:' : 'Cited brief fields when recorded:',
            quoted(cited),
            item.status === 'RESOLVED'
                ? [vi ? 'Quyết định có hiệu lực (người dùng nhập):' : 'Effective decision (user-entered):', quoted(item.resolution)].join('\n\n') : '',
            item.status === 'DELEGATED'
                ? [vi ? 'Ủy quyền trong phạm vi người dùng nêu (người dùng nhập):' : 'Delegated within this user-stated boundary (user-entered):', quoted(item.delegation),
                    vi ? 'Ủy quyền chỉ ghi phạm vi của người dùng. Không bao gồm quyền riêng tư, thời gian lưu giữ, thanh toán, xác thực, triển khai hoặc đổi phạm vi, và không chọn giá trị nghiệp vụ nào.'
                        : "Delegation records the user's boundary only. It does not cover privacy, retention, payment, authentication, deployment or scope changes, and it chooses no business value."].join('\n\n') : '',
            item.needsReconfirmation ? (vi ? 'Cần kiểm lại sau khi brief thay đổi.' : 'Reconfirm after the source brief changed.') : '',
        ].filter(Boolean).join('\n\n');
    });
    return [
        vi ? '## Mục chưa giải quyết và quyết định có hiệu lực' : '## Unresolved items and effective decisions',
        `${vi ? 'Còn mở' : 'Open'}: ${s.open.length}${idList(s.open)}; ${vi ? 'Đã ủy quyền' : 'Delegated'}: ${s.delegated.length}${idList(s.delegated)}; ${vi ? 'Đã giải quyết' : 'Resolved'}: ${s.resolved.length}${idList(s.resolved)}`,
        vi ? 'Các mục này do người dùng khai báo. Chúng không chứng minh danh sách đầy đủ, và một mục đã giải quyết không phải là phê duyệt build.'
            : 'These items are user-declared. They do not prove the list is complete, and a resolved item is not a build approval.',
        vi ? 'Khi các quy tắc của người dùng chồng lấn nhau, cả hai được hiển thị đúng như người dùng nhập; không chọn bên thắng và không khẳng định nhất quán.'
            : 'Where user rules overlap, each is shown as the user entered it; no winner is chosen and no consistency is claimed.',
        vi ? 'Một quyết định có hiệu lực chỉ áp dụng cho các trường brief được liệt kê; văn bản nguồn ở trên được giữ nguyên.'
            : 'An effective decision applies only to the brief fields it lists; the source text above is retained unchanged.',
        ...blocks,
        vi ? 'Xem hoặc lưu review này không giải quyết mục nào, và không phải là sẵn sàng build hay quyền thực thi.'
            : 'Viewing or saving this review does not resolve any item and is not build readiness or an execution grant.',
        'Build readiness: NOT_ASSESSED',
    ].join('\n\n');
}
