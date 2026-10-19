// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
'use client';

import { useState } from 'react';
import { IntentSpecConfirmation } from './IntentSpecConfirmation';
import { getTemplateById } from '@/lib/templates';
import { getTemplateFieldLabel } from '@/lib/template-i18n';
import {
    acknowledgeIntentSpecReview, buildReviewedDraftPacket, createIntentSpecReview,
    decisionNeedsReview, getDecisionLabel, getPendingReviewDecisions, INTENT_REVIEW_QUESTIONS,
    getReviewOpenItems, isCurrentReviewAcknowledged, previewOpenItems, synchronizeIntentSpecReview, updateReviewDecision,
    type DecisionDisposition, type IntentSpecReviewState, type ReviewDecision, type ReviewLanguage, type ReviewQuestionId,
} from '@/lib/intent-spec-review';
import {
    createOpenItem, describeOpenItemError, editOpenItem, getOpenItemKindLabel, getOpenItemStatusLabel,
    OPEN_ITEM_KINDS, OPEN_ITEM_STATUSES, summarizeOpenItems,
    type OpenItemError, type OpenItemKind, type OpenItemStatus, type ReviewOpenItem,
} from '@/lib/intent-spec-open-items';

export function useIntentSpecReview(
    templateId: string, values: Record<string, string>, packetSource: string, language: ReviewLanguage,
) {
    const [stored, setStored] = useState(() => createIntentSpecReview(values, packetSource));
    const review = synchronizeIntentSpecReview(stored, values, packetSource);
    // Render-time reconciliation prevents exporting a stale revision before an effect runs.
    if (review !== stored) setStored(review);
    const enabled = templateId === 'app_builder_complete';
    const update = (id: ReviewQuestionId, change: Parameters<typeof updateReviewDecision>[2]) => {
        setStored(previous => updateReviewDecision(
            synchronizeIntentSpecReview(previous, values, packetSource), id, change,
        ));
    };
    const acknowledge = () => setStored(previous => acknowledgeIntentSpecReview(
        synchronizeIntentSpecReview(previous, values, packetSource),
    ));
    return {
        review: enabled ? review : null, update, acknowledge,
        spec: enabled ? buildReviewedDraftPacket(review, language) : packetSource,
        canContinue: !enabled || (isCurrentReviewAcknowledged(review) && getPendingReviewDecisions(review).length === 0),
    };
}

interface Props {
    review: IntentSpecReviewState;
    language: ReviewLanguage;
    onUpdate: (id: ReviewQuestionId, change: Parameters<typeof updateReviewDecision>[2]) => void;
    onAcknowledge: () => void;
}

export function IntentSpecReview({ review, language, onUpdate, onAcknowledge }: Props) {
    const [showAll, setShowAll] = useState(false);
    const vi = language === 'vi';
    const pending = getPendingReviewDecisions(review);
    const acknowledged = isCurrentReviewAcknowledged(review);
    const shown = showAll ? review.decisions : review.decisions.slice(0, 3);
    const itemSummary = summarizeOpenItems(getReviewOpenItems(review));
    const control = 'min-h-11 rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';
    return (
        <section aria-label={vi ? 'Review yêu cầu' : 'Requirements review'}
            className="mb-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {vi ? 'Làm rõ trước khi bàn giao' : 'Clarify before handoff'}
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {vi ? 'Bạn quyết định các quy tắc nghiệp vụ. Builder sẽ chọn cách triển khai trong phạm vi đó.' : 'You decide the business rules. The builder chooses how to implement within those boundaries.'}
            </p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {vi ? 'Các câu hỏi là gợi ý, không tự phát hiện mọi thiếu sót. Bản review chỉ nằm trong phiên này; tải bản nháp để giữ nội dung.' : 'These prompts do not detect every gap. Review stays in this session only; download the draft to keep its content.'}
            </p>
            <div role="status" className="my-3 text-sm text-gray-800 dark:text-gray-200">
                {vi ? 'Phiên bản' : 'Revision'} {review.revision} · {pending.length} {vi ? 'mục còn cần quyết định' : 'items need a decision'}
                {' · '}{acknowledged ? (vi ? 'Đã xem bản này' : 'Viewed this revision') : (vi ? 'Chưa xem bản này' : 'Not viewed yet')}
                {itemSummary.total > 0 && (vi
                    ? ` · Điểm mở bạn khai báo: ${itemSummary.open.length} còn mở, ${itemSummary.delegated.length} đã ủy quyền, ${itemSummary.resolved.length} đã giải quyết`
                    : ` · Open points you declared: ${itemSummary.open.length} open, ${itemSummary.delegated.length} delegated, ${itemSummary.resolved.length} resolved`)}
            </div>
            <div className="space-y-4">
                {shown.map(decision => {
                    const question = INTENT_REVIEW_QUESTIONS.find(item => item.id === decision.id)!;
                    const textId = `intent-review-${decision.id}`;
                    return (
                        <div key={decision.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <label htmlFor={textId} className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                {question[language]}
                            </label>
                            <details className="my-2 text-xs text-gray-600 dark:text-gray-400">
                                <summary className="cursor-pointer">{vi ? 'Thông tin đang có trong brief' : 'Current brief information'}</summary>
                                {question.fields.map(field => (
                                    <p key={field} className="mt-1 whitespace-pre-wrap">{review.values[field] || (vi ? 'Chưa có thông tin.' : 'No information yet.')}</p>
                                ))}
                            </details>
                            <textarea id={textId} rows={2} value={decision.answer}
                                className={`${control} w-full`}
                                placeholder={vi ? 'Trả lời, nêu mâu thuẫn hoặc lý do không áp dụng…' : 'Answer, describe a conflict or explain why it does not apply…'}
                                onChange={event => onUpdate(decision.id, { answer: event.target.value })} />
                            <label className="mt-2 flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                                {vi ? 'Trạng thái câu trả lời' : 'Answer status'}
                                <select value={decision.disposition} className={control}
                                    onChange={event => onUpdate(decision.id, { disposition: event.target.value as DecisionDisposition })}>
                                    {(['OPEN', 'ANSWERED', 'NOT_APPLICABLE', 'CONFLICT'] as const).map(value => (
                                        <option key={value} value={value}>{getDecisionLabel(value, language)}</option>
                                    ))}
                                </select>
                            </label>
                            {decision.disposition === 'NOT_APPLICABLE' && !decision.answer.trim() && (
                                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                    {vi ? 'Hãy ghi lý do không áp dụng.' : 'Please give a reason why this does not apply.'}
                                </p>
                            )}
                            {decision.needsReconfirmation && (
                                <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                    <p>{vi ? 'Brief liên quan đã thay đổi. Câu trả lời cũ được giữ để bạn kiểm lại.' : 'Related brief information changed. The old answer is kept for you to review.'}</p>
                                    <button type="button" className={`${control} mt-2`}
                                        onClick={() => onUpdate(decision.id, { reconfirm: true })}>
                                        {vi ? 'Giữ câu trả lời cho bản mới' : 'Keep answer for new revision'}
                                    </button>
                                </div>
                            )}
                            <OpenPoints decision={decision} review={review} language={language} control={control} onUpdate={onUpdate} />
                            {decisionNeedsReview(decision) && !decision.needsReconfirmation && (
                                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                    {vi ? 'Mục này vẫn còn mở trong bản nháp.' : 'This item remains open in the draft.'}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <button type="button" className={`${control} mt-3`} onClick={() => setShowAll(value => !value)}>
                {showAll ? (vi ? 'Thu gọn' : 'Show fewer') : (vi ? `Xem đủ ${review.decisions.length} câu hỏi` : `Show all ${review.decisions.length} questions`)}
            </button>
            <p className="my-3 text-xs text-gray-600 dark:text-gray-400">
                {vi ? 'Bạn vẫn có thể xuất bản nháp với các mục chưa quyết. Đã xem không đồng nghĩa duyệt build hoặc spec đã đầy đủ.' : 'You can export a draft with unresolved items. Viewing it does not approve a build or prove specification completeness.'}
            </p>
            <button type="button" disabled={acknowledged} onClick={onAcknowledge}
                className="min-h-11 rounded-lg bg-indigo-600 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-400 disabled:opacity-50">
                {vi ? 'Tôi đã xem bản nháp này' : 'I have viewed this draft'}
            </button>
            <IntentSpecConfirmation review={review} language={language} />
        </section>
    );
}

interface OpenPointsProps {
    decision: ReviewDecision;
    review: IntentSpecReviewState;
    language: ReviewLanguage;
    control: string;
    onUpdate: Props['onUpdate'];
}
interface PointForm {
    kind: OpenItemKind; text: string; fields: string[]; status: OpenItemStatus; resolution: string; delegation: string;
}
const EMPTY_FORM: PointForm = { kind: 'UNKNOWN', text: '', fields: [], status: 'OPEN', resolution: '', delegation: '' };

/** User-declared unknown, conflict and delegated points for one question. Nothing here is inferred from text. */
function OpenPoints({ decision, review, language, control, onUpdate }: OpenPointsProps) {
    const vi = language === 'vi';
    const items = decision.openItems ?? [];
    const [form, setForm] = useState<PointForm | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<OpenItemError | null>(null);
    const prefix = `intent-open-${decision.id}`;
    const fieldChoices = [...new Set([...Object.keys(review.values), ...(form?.fields ?? [])])].sort();
    const close = () => { setForm(null); setEditingId(null); setError(null); };
    const edit = (item: ReviewOpenItem) => {
        setEditingId(item.id); setError(null);
        setForm({ kind: item.kind, text: item.text, fields: [...item.sourceFields], status: item.status, resolution: item.resolution, delegation: item.delegation });
    };
    const save = () => {
        if (!form) return;
        const draft = { kind: form.kind, text: form.text, sourceFields: form.fields, status: form.status, resolution: form.resolution, delegation: form.delegation };
        const previous = editingId ? items.find(item => item.id === editingId) : undefined;
        const built = previous ? editOpenItem(previous, draft, review.values) : createOpenItem(draft, getReviewOpenItems(review), review.values);
        if (!built.ok) { setError(built.error); return; }
        const next = previous ? items.map(item => (item.id === previous.id ? built.value : item)) : [...items, built.value];
        const problem = previewOpenItems(review, decision.id, next);
        if (problem) { setError(problem); return; }
        onUpdate(decision.id, { openItems: next });
        close();
    };
    return (
        <div className="mt-2">
            {items.length > 0 && (
                <ul className="space-y-2" aria-label={vi ? 'Điểm mở của câu hỏi này' : 'Open points for this question'}>
                    {items.map(item => (
                        <li key={item.id} className="rounded-lg border border-gray-200 p-2 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300">
                            <p className="font-medium">{item.id} · {getOpenItemKindLabel(item.kind, language)} · {getOpenItemStatusLabel(item.status, language)}</p>
                            <p className="mt-1 whitespace-pre-wrap">{item.text}</p>
                            {item.status === 'RESOLVED' && <p className="mt-1 whitespace-pre-wrap">{vi ? 'Quyết định: ' : 'Decision: '}{item.resolution}</p>}
                            {item.status === 'DELEGATED' && <p className="mt-1 whitespace-pre-wrap">{vi ? 'Builder được quyết trong phạm vi: ' : 'Builder may decide within: '}{item.delegation}</p>}
                            {item.needsReconfirmation && (
                                <div className="mt-1 text-amber-700 dark:text-amber-300">
                                    <p>{vi ? 'Brief liên quan đã thay đổi. Hãy kiểm lại điểm này.' : 'Related brief information changed. Check this point again.'}</p>
                                    {item.sourceFields.some(field => !Object.hasOwn(review.values, field)) && (
                                        <p>{vi ? 'Một trường brief được trích dẫn không còn. Hãy sửa trường trích dẫn hoặc xóa điểm này.' : 'A cited brief field no longer exists. Edit the cited fields or remove this point.'}</p>
                                    )}
                                    <button type="button" className={`${control} mt-1`}
                                        onClick={() => onUpdate(decision.id, { reconfirmItem: item.id })}>
                                        {vi ? `Kiểm lại ${item.id}` : `Check ${item.id} again`}
                                    </button>
                                </div>
                            )}
                            <div className="mt-1 flex gap-2">
                                <button type="button" className={control} onClick={() => edit(item)}>{vi ? `Sửa ${item.id}` : `Edit ${item.id}`}</button>
                                <button type="button" className={control}
                                    onClick={() => onUpdate(decision.id, { openItems: items.filter(entry => entry.id !== item.id) })}>
                                    {vi ? `Xóa ${item.id}` : `Remove ${item.id}`}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {!form && (
                <button type="button" className={`${control} mt-2`} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(null); }}>
                    {vi ? 'Thêm điểm mở' : 'Add an open point'}
                </button>
            )}
            {form && (
                <div className="mt-2 space-y-2 rounded-lg border border-gray-300 p-3 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {vi ? 'Chỉ các điểm bạn khai báo mới được liệt kê. Danh sách không chứng minh rằng không còn gì thiếu.' : 'Only points you declare are listed. The list does not prove nothing else is missing.'}
                    </p>
                    {!editingId && (
                        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400" htmlFor={`${prefix}-kind`}>
                            {vi ? 'Loại' : 'Kind'}
                            <select id={`${prefix}-kind`} value={form.kind} className={control}
                                onChange={event => setForm({ ...form, kind: event.target.value as OpenItemKind })}>
                                {OPEN_ITEM_KINDS.map(kind => <option key={kind} value={kind}>{getOpenItemKindLabel(kind, language)}</option>)}
                            </select>
                        </label>
                    )}
                    <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400" htmlFor={`${prefix}-text`}>
                        {vi ? 'Điều chưa biết hoặc mâu thuẫn' : 'What is unknown or in conflict'}
                        <textarea id={`${prefix}-text`} rows={2} value={form.text} className={control}
                            onChange={event => setForm({ ...form, text: event.target.value })} />
                    </label>
                    <fieldset className="text-xs text-gray-600 dark:text-gray-400">
                        <legend>{vi ? 'Trường brief liên quan' : 'Related brief fields'}</legend>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {fieldChoices.map(field => (
                                <label key={field} className="flex min-h-11 items-center gap-1">
                                    <input type="checkbox" checked={form.fields.includes(field)}
                                        onChange={event => setForm({ ...form, fields: event.target.checked ? [...form.fields, field] : form.fields.filter(entry => entry !== field) })} />
                                    {getTemplateFieldLabel('app_builder_complete', field,
                                        getTemplateById('app_builder_complete')?.fields.find(entry => entry.id === field)?.label
                                            ?? (vi ? 'Thông tin khác trong brief' : 'Other brief information'), language)}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400" htmlFor={`${prefix}-status`}>
                        {vi ? 'Trạng thái điểm mở' : 'Open point status'}
                        <select id={`${prefix}-status`} value={form.status} className={control}
                            onChange={event => setForm({ ...form, status: event.target.value as OpenItemStatus })}>
                            {OPEN_ITEM_STATUSES.map(status => <option key={status} value={status}>{getOpenItemStatusLabel(status, language)}</option>)}
                        </select>
                    </label>
                    {form.status === 'RESOLVED' && (
                        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400" htmlFor={`${prefix}-resolution`}>
                            {vi ? 'Quyết định áp dụng' : 'Decision that applies'}
                            <textarea id={`${prefix}-resolution`} rows={2} value={form.resolution} className={control}
                                onChange={event => setForm({ ...form, resolution: event.target.value })} />
                        </label>
                    )}
                    {form.status === 'DELEGATED' && (
                        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400" htmlFor={`${prefix}-delegation`}>
                            {vi ? 'Builder được tự quyết trong phạm vi nào' : 'What the builder may decide'}
                            <textarea id={`${prefix}-delegation`} rows={2} value={form.delegation} className={control}
                                onChange={event => setForm({ ...form, delegation: event.target.value })} />
                        </label>
                    )}
                    {error && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{describeOpenItemError(error, language)}</p>}
                    <div className="flex gap-2">
                        <button type="button" className={control} onClick={save}>{vi ? 'Lưu điểm mở' : 'Save open point'}</button>
                        <button type="button" className={control} onClick={close}>{vi ? 'Hủy' : 'Cancel'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
