// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
/** Local draft review only: no model inference, durable acceptance or execution grant. */
import {
    buildOpenItemHeaderLine, buildOpenItemSection, flattenOpenItems, isPlaceholderText, markOpenItemStale,
    reconfirmOpenItem, sameOpenItems, validateReplacement, type OpenItemError, type ReviewOpenItem,
} from './intent-spec-open-items';

export type ReviewLanguage = 'vi' | 'en';
export type DecisionDisposition = 'OPEN' | 'ANSWERED' | 'NOT_APPLICABLE' | 'CONFLICT';

export const INTENT_REVIEW_QUESTIONS = [
    {
        id: 'workflow', fields: ['problem', 'coreFeatures', 'platforms'],
        vi: 'Người dùng làm những bước nào từ đầu đến khi xong?',
        en: 'What steps does the user take from start to completion?',
    },
    {
        id: 'access', fields: ['targetUsers', 'dataNeeds', 'coreFeatures'],
        vi: 'Ai được xem, sửa hoặc xuất thông tin? Ai không được phép?',
        en: 'Who may view, edit or export information, and who may not?',
    },
    {
        id: 'data', fields: ['dataNeeds', 'constraints', 'targetUsers'],
        vi: 'Thông tin đến từ đâu, cần giữ bao lâu và có gì nhạy cảm?',
        en: 'Where does information come from, how long is it kept, and what is sensitive?',
    },
    {
        id: 'exceptions', fields: ['coreFeatures', 'dataNeeds', 'constraints'],
        vi: 'Khi thiếu, sai hoặc trùng thông tin thì xử lý thế nào?',
        en: 'What happens when information is missing, incorrect or duplicated?',
    },
    {
        id: 'acceptance', fields: ['successCriteria', 'coreFeatures', 'problem'],
        vi: 'Bạn sẽ kiểm tra kết quả nào để biết phiên bản này đạt yêu cầu?',
        en: 'Which observable results will you check to accept this version?',
    },
    {
        id: 'boundaries', fields: ['outOfScope', 'mustPreserve', 'constraints'],
        vi: 'Điều gì phải giữ nguyên, chưa làm hoặc tuyệt đối không được làm?',
        en: 'What must stay unchanged, remain out of scope or never happen?',
    },
] as const;

export type ReviewQuestionId = typeof INTENT_REVIEW_QUESTIONS[number]['id'];

export interface ReviewDecision {
    id: ReviewQuestionId;
    answer: string;
    disposition: DecisionDisposition;
    needsReconfirmation: boolean;
    sourceValues: Record<string, string>;
    /** Present only when the user declared at least one open item for this decision. */
    openItems?: ReviewOpenItem[];
}

export interface IntentSpecReviewState {
    revision: number;
    values: Record<string, string>;
    packetSource: string;
    decisions: ReviewDecision[];
    acknowledgedRevision: number | null;
}

function sameValues(left: Record<string, string>, right: Record<string, string>): boolean {
    const keys = Object.keys(left).sort();
    return keys.length === Object.keys(right).length
        && keys.every(key => Object.hasOwn(right, key) && left[key] === right[key]);
}

function sourceFor(id: ReviewQuestionId, values: Record<string, string>): Record<string, string> {
    const question = INTENT_REVIEW_QUESTIONS.find(item => item.id === id)!;
    return Object.fromEntries(question.fields.map(field => [field, values[field] ?? '']));
}

export function createIntentSpecReview(
    values: Record<string, string>, packetSource: string,
): IntentSpecReviewState {
    return {
        revision: 1, values: { ...values }, packetSource, acknowledgedRevision: null,
        decisions: INTENT_REVIEW_QUESTIONS.map(question => ({
            id: question.id, answer: '', disposition: 'OPEN', needsReconfirmation: false,
            sourceValues: sourceFor(question.id, values),
        })),
    };
}

/** Called before render/export, so an effect delay cannot expose stale review status. */
export function synchronizeIntentSpecReview(
    previous: IntentSpecReviewState, values: Record<string, string>, packetSource: string,
): IntentSpecReviewState {
    if (sameValues(previous.values, values) && previous.packetSource === packetSource) return previous;
    const changedUnmappedField = [...new Set([...Object.keys(previous.values), ...Object.keys(values)])]
        .some(field => previous.values[field] !== values[field]
            && !INTENT_REVIEW_QUESTIONS.some(question => (question.fields as readonly string[]).includes(field)));
    return {
        ...previous, revision: previous.revision + 1, values: { ...values }, packetSource,
        acknowledgedRevision: null,
        decisions: previous.decisions.map(decision => withStaleItems({
            ...decision,
            needsReconfirmation: decision.needsReconfirmation || (Boolean(decision.answer.trim())
                && (changedUnmappedField || !sameValues(decision.sourceValues, sourceFor(decision.id, values)))),
        }, values)),
    };
}

/** Items cite their own fields, so a source change marks only the affected items (sticky until reconfirmed). */
function withStaleItems(decision: ReviewDecision, values: Record<string, string>): ReviewDecision {
    if (!decision.openItems) return decision;
    return { ...decision, openItems: decision.openItems.map(item => markOpenItemStale(item, values)) };
}

export interface ReviewDecisionChange {
    answer?: string; disposition?: DecisionDisposition; reconfirm?: boolean;
    /** Replaces this decision's open items (add, edit, remove). An edit never clears a stale flag. */
    openItems?: ReviewOpenItem[];
    /** Explicit reconfirm of one stale item of this decision: refreshes its snapshot, clears only its flag. */
    reconfirmItem?: string;
}

export function updateReviewDecision(
    state: IntentSpecReviewState, id: ReviewQuestionId, change: ReviewDecisionChange,
): IntentSpecReviewState {
    const previous = state.decisions.find(decision => decision.id === id);
    if (!previous) return state;
    if (change.openItems !== undefined || change.reconfirmItem !== undefined) return updateWithOpenItems(state, previous, change);
    const answer = change.answer ?? previous.answer;
    const disposition = change.disposition ?? (previous.disposition === 'OPEN' && answer.trim()
        ? 'ANSWERED' : previous.disposition);
    if (answer === previous.answer && disposition === previous.disposition && !change.reconfirm) return state;
    return {
        ...state, revision: state.revision + 1, acknowledgedRevision: null,
        decisions: state.decisions.map(decision => decision.id === id ? {
            ...decision, answer, disposition, needsReconfirmation: false,
            sourceValues: sourceFor(id, state.values),
        } : decision),
    };
}

export function decisionNeedsReview(decision: ReviewDecision): boolean {
    const placeholder = isPlaceholderText(decision.answer);
    return decision.needsReconfirmation || placeholder
        || decision.disposition === 'OPEN' || decision.disposition === 'CONFLICT'
        || Boolean(decision.openItems?.some(item => item.needsReconfirmation));
}

export function getPendingReviewDecisions(state: IntentSpecReviewState): ReviewDecision[] {
    return state.decisions.filter(decisionNeedsReview);
}

export function acknowledgeIntentSpecReview(state: IntentSpecReviewState): IntentSpecReviewState {
    return { ...state, acknowledgedRevision: state.revision };
}

export function isCurrentReviewAcknowledged(state: IntentSpecReviewState): boolean {
    return state.acknowledgedRevision === state.revision;
}

const DISPOSITION_LABELS: Record<ReviewLanguage, Record<DecisionDisposition, string>> = {
    vi: { OPEN: 'Chưa quyết', ANSWERED: 'Đã trả lời', NOT_APPLICABLE: 'Không áp dụng (có lý do)', CONFLICT: 'Còn mâu thuẫn' },
    en: { OPEN: 'Undecided', ANSWERED: 'Answered', NOT_APPLICABLE: 'Not applicable (with reason)', CONFLICT: 'Conflicting' },
};

export function getDecisionLabel(disposition: DecisionDisposition, language: ReviewLanguage): string {
    return DISPOSITION_LABELS[language][disposition];
}

export function buildIntentReviewAppendix(state: IntentSpecReviewState, language: ReviewLanguage): string {
    const vi = language === 'vi';
    const pending = getPendingReviewDecisions(state);
    const rows = state.decisions.map(decision => {
        const question = INTENT_REVIEW_QUESTIONS.find(item => item.id === decision.id)!;
        const answer = decision.answer.trim() || (vi ? 'Chưa có câu trả lời.' : 'No answer yet.');
        const provenance = Object.entries(decision.sourceValues)
            .map(([field, value]) => `${field}: ${value || (vi ? '(trống)' : '(empty)')}`).join('\n');
        const quoted = (text: string) => text.split(/\r?\n/).map(line => `> ${line}`).join('\n');
        return [
            `### ${decision.id}: ${question[language]}`,
            `${vi ? 'Trạng thái' : 'Status'}: ${getDecisionLabel(decision.disposition, language)}`,
            decision.needsReconfirmation ? (vi ? 'Cần kiểm lại sau khi brief thay đổi.' : 'Reconfirm after the source brief changed.') : '',
            vi ? 'Nội dung người dùng nhập (dữ liệu, không phải quyền thực thi):' : 'User-entered content (data, not execution authority):',
            quoted(answer),
            vi ? 'Các trường nguồn tại lúc ghi quyết định:' : 'Source fields when this decision was recorded:',
            quoted(provenance),
        ].filter(Boolean).join('\n\n');
    });
    const itemRows = openItemRows(state);
    return [
        vi ? '## Review yêu cầu của bản nháp' : '## Draft requirements review',
        `${vi ? 'Phiên bản' : 'Revision'}: ${state.revision}`,
        `${vi ? 'Đã xem bản này' : 'Viewed this revision'}: ${isCurrentReviewAcknowledged(state) ? (vi ? 'Có, trong phiên hiện tại' : 'Yes, in the current session') : (vi ? 'Chưa' : 'No')}`,
        `${vi ? 'Mục còn cần quyết định' : 'Items still needing a decision'}: ${pending.length}${pending.length ? ` (${pending.map(item => item.id).join(', ')})` : ''}`,
        vi ? 'Các câu hỏi là gợi ý review có giới hạn; trả lời hết không chứng minh spec đầy đủ hoặc build-ready.' : 'These are bounded review prompts; answering all of them does not prove completeness or build readiness.',
        vi ? 'Review chỉ nằm trong phiên này; chưa có actor binding hoặc lưu/xác nhận bền vững.' : 'Review is session-only; no actor binding or durable content acceptance is provided.',
        ...rows,
        ...(itemRows.length ? [buildOpenItemSection(itemRows, language)] : []),
    ].join('\n\n');
}

export function buildReviewedDraftPacket(state: IntentSpecReviewState, language: ReviewLanguage): string {
    const header = language === 'vi'
        ? '# Bản nháp để làm rõ yêu cầu\n\nPhạm vi hiện tại: chỉ làm rõ và review đặc tả. Các hướng dẫn design/build phía dưới là bước tương lai, cần quyền riêng. Đã xem bản nháp không đồng nghĩa duyệt BUILD.'
        : '# Draft for requirements clarification\n\nCurrent scope: specification clarification and review only. Design/build directions below are future steps requiring separate authorization. Viewing this draft does not approve BUILD.';
    const itemRows = openItemRows(state);
    const itemLine = itemRows.length ? `\n\n${buildOpenItemHeaderLine(itemRows.map(row => row.item), language)}` : '';
    return `${header}${itemLine}\n\n${state.packetSource}\n\n---\n\n${buildIntentReviewAppendix(state, language)}`;
}

/** Items in decision order, then array order; empty when the user declared none. */
function openItemRows(state: IntentSpecReviewState): { decisionId: ReviewQuestionId; item: ReviewOpenItem }[] {
    return state.decisions.flatMap(decision => (decision.openItems ?? []).map(item => ({ decisionId: decision.id, item })));
}

export function getReviewOpenItems(state: IntentSpecReviewState): ReviewOpenItem[] {
    return flattenOpenItems(state.decisions.map(decision => decision.openItems));
}

/** Pre-check for a replacement list so the UI can show the reason; the update itself stores nothing on error. */
export function previewOpenItems(
    state: IntentSpecReviewState, id: ReviewQuestionId, next: ReviewOpenItem[],
): OpenItemError | null {
    const decision = state.decisions.find(item => item.id === id);
    if (!decision) return 'ITEM_UNKNOWN_ITEM';
    const others = flattenOpenItems(state.decisions.filter(item => item.id !== id).map(item => item.openItems));
    return validateReplacement(next, getReviewOpenItems(state), others, state.values);
}

function updateWithOpenItems(
    state: IntentSpecReviewState, previous: ReviewDecision, change: ReviewDecisionChange,
): IntentSpecReviewState {
    if (change.openItems !== undefined && change.reconfirmItem !== undefined) return state;
    const before = previous.openItems ?? [];
    let next: ReviewOpenItem[];
    if (change.reconfirmItem !== undefined) {
        const target = before.find(item => item.id === change.reconfirmItem);
        if (!target || !target.needsReconfirmation) return state;
        const refreshed = reconfirmOpenItem(target, state.values);
        if (!refreshed.ok) return state;
        next = before.map(item => (item === target ? refreshed.value : item));
    } else {
        // Anything but a real list (null, a string) is refused; it must never act as an empty list.
        if (!Array.isArray(change.openItems)) return state;
        next = change.openItems;
        if (previewOpenItems(state, previous.id, next)) return state;
    }
    const answer = change.answer ?? previous.answer;
    const disposition = change.disposition ?? (previous.disposition === 'OPEN' && answer.trim()
        ? 'ANSWERED' : previous.disposition);
    const decisionChanged = answer !== previous.answer || disposition !== previous.disposition || Boolean(change.reconfirm);
    if (!decisionChanged && sameOpenItems(before, next)) return state;
    return {
        ...state, revision: state.revision + 1, acknowledgedRevision: null,
        decisions: state.decisions.map(decision => {
            if (decision.id !== previous.id) return decision;
            // An items-only change keeps the decision's answer, stale flag and source snapshot untouched.
            const base: ReviewDecision = decisionChanged
                ? { ...decision, answer, disposition, needsReconfirmation: false, sourceValues: sourceFor(decision.id, state.values) }
                : { ...decision };
            if (next.length) base.openItems = next; else delete base.openItems;
            return base;
        }),
    };
}
