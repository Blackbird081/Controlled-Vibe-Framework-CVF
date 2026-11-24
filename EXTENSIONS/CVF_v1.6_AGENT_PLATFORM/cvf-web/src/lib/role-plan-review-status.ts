// Text Encoding Exception: localized Vietnamese review status for the result and export.
import type { GovernanceRolePlanSummary } from './ai/types';

/** Closed, content-free diagnostics. Never store provider text or exception messages here. */
export const REVIEW_DIAGNOSTICS = [
    'NON_TEXT', 'EMPTY_OUTPUT', 'OUTPUT_TOO_LONG', 'NO_JSON_OBJECT', 'MULTIPLE_JSON_OBJECTS',
    'INVALID_JSON', 'INVALID_REVIEW_SHAPE', 'INVALID_VERDICT', 'INVALID_FINDINGS',
    'TOO_MANY_FINDINGS', 'INVALID_FINDING', 'REVISE_WITHOUT_FINDINGS', 'FINDINGS_FILTERED',
] as const;
export type ReviewDiagnostic = typeof REVIEW_DIAGNOSTICS[number];
export const isReviewDiagnostic = (value: unknown): value is ReviewDiagnostic =>
    typeof value === 'string' && (REVIEW_DIAGNOSTICS as readonly string[]).includes(value);

const REASONS: Record<ReviewDiagnostic, readonly [string, string]> = {
    NON_TEXT: ['Phản hồi duyệt không phải văn bản.', 'The review response was not text.'],
    EMPTY_OUTPUT: ['Phản hồi duyệt trống.', 'The review response was empty.'],
    OUTPUT_TOO_LONG: ['Phản hồi duyệt vượt giới hạn độ dài.', 'The review response exceeded the length limit.'],
    NO_JSON_OBJECT: ['Không tìm thấy đối tượng JSON hoàn chỉnh trong phản hồi duyệt.', 'No complete JSON object was found in the review response.'],
    MULTIPLE_JSON_OBJECTS: ['Phản hồi duyệt chứa nhiều đối tượng JSON nên không xác định được kết luận.', 'Multiple JSON objects made the review ambiguous.'],
    INVALID_JSON: ['Đối tượng JSON trong phản hồi duyệt sai cú pháp.', 'The review JSON object had invalid syntax.'],
    INVALID_REVIEW_SHAPE: ['Phản hồi duyệt không đúng cấu trúc yêu cầu.', 'The review response did not match the required structure.'],
    INVALID_VERDICT: ['Kết luận duyệt không hợp lệ.', 'The review verdict was invalid.'],
    INVALID_FINDINGS: ['Danh sách nhận xét không hợp lệ.', 'The findings list was invalid.'],
    TOO_MANY_FINDINGS: ['Số nhận xét vượt giới hạn cho phép.', 'The review contained too many findings.'],
    INVALID_FINDING: ['Một nhận xét thiếu trường hợp lệ hoặc có nội dung trống.', 'A finding had missing, invalid or empty fields.'],
    REVISE_WITHOUT_FINDINGS: ['Reviewer yêu cầu sửa nhưng không đưa ra nhận xét.', 'The reviewer requested revision without findings.'],
    FINDINGS_FILTERED: ['Các nhận xét yêu cầu sửa đều không qua bước lọc nội dung.', 'All revision findings were removed by content screening.'],
};

export function reviewDiagnosticText(code: unknown, isVi: boolean): string {
    return isReviewDiagnostic(code) ? REASONS[code][isVi ? 0 : 1]
        : isVi ? 'Không có chẩn đoán chi tiết cho lần duyệt này.' : 'No detailed diagnostic was recorded for this review.';
}

/** A settled recheck is required after revision; a successful call alone is not approval. */
export function finalRolePlanReview(plan: GovernanceRolePlanSummary) {
    const verdict = plan.revisionApplied ? plan.recheckVerdict ?? 'NOT_RUN' : plan.reviewerVerdict;
    const diagnostic = plan.revisionApplied ? plan.recheckDiagnostic : plan.reviewerDiagnostic;
    const confirmed = verdict === 'PASS' && (!plan.revisionApplied || plan.revisionReviewed === true) && plan.stoppedEarly === null;
    return { verdict, diagnostic, confirmed };
}

export function finalReviewDetail(plan: GovernanceRolePlanSummary, isVi: boolean): string {
    const final = finalRolePlanReview(plan);
    if (final.verdict === 'UNPARSEABLE') return reviewDiagnosticText(final.diagnostic, isVi);
    if (final.verdict === 'REVISE') return isVi ? 'Reviewer vẫn yêu cầu chỉnh sửa.' : 'The reviewer still requests changes.';
    return isVi ? 'Chưa có kết luận duyệt cuối hợp lệ cho bản đang hiển thị.' : 'No settled final review is confirmed for the displayed draft.';
}
