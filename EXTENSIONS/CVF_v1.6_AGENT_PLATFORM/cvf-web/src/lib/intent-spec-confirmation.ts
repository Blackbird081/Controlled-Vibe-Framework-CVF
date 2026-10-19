// Text Encoding Exception: Vietnamese worksheet copy.
/** Portable review candidate only; no authenticated acceptance or storage guarantee. */
import {
    buildReviewedDraftPacket, getPendingReviewDecisions, getReviewOpenItems, isCurrentReviewAcknowledged,
    type IntentSpecReviewState, type ReviewLanguage,
} from './intent-spec-review';
import { validateOpenItemSet, validateStoredOpenItem } from './intent-spec-open-items';

export const CANDIDATE_SCHEMA_V1 = 'cvf.intentSpecReviewCandidate.v1';
/** Used only when the user declared at least one open item; a state with none keeps the v1 bytes. */
export const CANDIDATE_SCHEMA_V2 = 'cvf.intentSpecReviewCandidate.v2';

export const MAX_CONFIRMATION_BYTES = 2 * 1024 * 1024;

export interface SpecConfirmationCandidate {
    readonly bindingKey: string;
    readonly fileContent: string;
    readonly fileSha256: string;
    readonly revision: number;
}

/** Exact current state, including acknowledgement, is bound rather than revision alone. */
export function reviewBindingKey(state: IntentSpecReviewState, language: ReviewLanguage, reviewer: string): string {
    return JSON.stringify({ state, language, reviewer: reviewer.trim() });
}

async function sha256(bytes: Uint8Array): Promise<string> {
    const owned = new Uint8Array(bytes);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', owned.buffer);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSpecConfirmationCandidate(
    state: IntentSpecReviewState, language: ReviewLanguage, reviewer: string,
    createdAt = new Date().toISOString(),
): Promise<SpecConfirmationCandidate> {
    if (!reviewer.trim() || reviewer.trim().length > 120) throw new Error('REVIEWER_REQUIRED');
    if (!isCurrentReviewAcknowledged(state) || getPendingReviewDecisions(state).length) {
        throw new Error('CURRENT_REVIEW_REQUIRED');
    }
    const items = getReviewOpenItems(state);
    // Items must be fresh and valid; the acceptance verifier applies the same rules to the saved bytes.
    if (items.length && (validateOpenItemSet(items)
        || items.some(item => validateStoredOpenItem(item, state.values)))) throw new Error('CURRENT_REVIEW_REQUIRED');
    // Copy to immutable strings before the first await; caller edits cannot affect the snapshot.
    const bindingKey = reviewBindingKey(state, language, reviewer);
    const payload = JSON.stringify({
        schema: items.length ? CANDIDATE_SCHEMA_V2 : CANDIDATE_SCHEMA_V1,
        scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY',
        reviewer: { name: reviewer.trim(), verification: 'SELF_DECLARED' },
        createdAt, language, review: JSON.parse(JSON.stringify(state)),
        draft: buildReviewedDraftPacket(state, language),
    });
    const payloadBytes = new TextEncoder().encode(payload);
    if (payloadBytes.length > MAX_CONFIRMATION_BYTES - 1024) throw new Error('FILE_TOO_LARGE');
    const revision = state.revision;
    const payloadSha256 = await sha256(payloadBytes);
    const fileContent = JSON.stringify({ payload: JSON.parse(payload), payloadSha256 }) + '\n';
    const fileSha256 = await sha256(new TextEncoder().encode(fileContent));
    return Object.freeze({ bindingKey, fileContent, fileSha256, revision });
}

export const worksheetFileName = (revision: number) => `cvf-spec-review-r${revision}-worksheet.md`;
export const reviewFileName = (revision: number) => `cvf-spec-review-r${revision}.json`;

/**
 * Render-only: an unfinished manual technical-review worksheet bound to this session's owned candidate.
 * It extracts nothing from the draft, scores nothing and seeds no requirement; every review section stays UNFILLED.
 * Worksheet text is UTF-8 with LF; the source snapshot is the candidate's draft verbatim (its own line endings kept).
 */
export function renderDocumentaryWorksheet(candidate: SpecConfirmationCandidate): string {
    let payload: { language?: unknown; createdAt?: unknown; reviewer?: { name?: unknown }; draft?: unknown };
    try { payload = JSON.parse(candidate.fileContent).payload; } catch { throw new Error('CANDIDATE_UNREADABLE'); }
    if (!payload || typeof payload.draft !== 'string' || typeof payload.createdAt !== 'string'
        || typeof payload.reviewer?.name !== 'string' || (payload.language !== 'vi' && payload.language !== 'en')) {
        throw new Error('CANDIDATE_UNREADABLE');
    }
    const vi = payload.language === 'vi';
    const t = (viText: string, enText: string) => (vi ? viText : enText);
    const byteCount = new TextEncoder().encode(candidate.fileContent).length;
    let longestRun = 0;
    for (const run of payload.draft.matchAll(/`+/g)) longestRun = Math.max(longestRun, run[0].length);
    const fence = '`'.repeat(Math.max(3, longestRun + 1));
    const unfilled = t('UNFILLED - điền thủ công', 'UNFILLED - manual entry');
    const section = (title: string, guide: string) => [`## ${title}`, '', guide, '', unfilled, ''];
    return [
        `# ${t('Phiếu review kỹ thuật (chưa hoàn thành)', 'Technical review worksheet (unfinished)')}`,
        '',
        t('Trạng thái: CHƯA HOÀN THÀNH. Review kỹ thuật CHƯA được thực hiện. Phiếu này không phải phê duyệt, không phải xác nhận sẵn sàng build, và không xác thực người review hay file nguồn.',
            'Status: UNFINISHED. Technical review has NOT been performed. This worksheet is not an approval, not build readiness, and does not authenticate the reviewer or the source file.'),
        '',
        `## ${t('1. Nguồn đã gắn', '1. Bound source')}`,
        '',
        `| ${t('Mục', 'Field')} | ${t('Giá trị', 'Value')} |`,
        '| --- | --- |',
        `| ${t('File review JSON nguồn', 'Source review JSON file')} | ${reviewFileName(candidate.revision)} |`,
        `| SHA-256 (${t('toàn bộ file JSON', 'whole JSON file')}) | ${candidate.fileSha256} |`,
        `| ${t('Số byte UTF-8 của file JSON', 'UTF-8 byte count of the JSON file')} | ${byteCount} |`,
        `| ${t('Phiên bản', 'Revision')} | ${candidate.revision} |`,
        `| ${t('Ngôn ngữ', 'Language')} | ${payload.language} |`,
        `| ${t('Người review (tự khai báo, chưa xác thực)', 'Reviewer (self-declared, unverified)')} | ${payload.reviewer.name.replace(/[\r\n|]/g, ' ')} |`,
        `| ${t('Thời điểm tạo gói', 'Candidate timestamp')} | ${payload.createdAt} |`,
        '',
        t('Hãy giữ cả phiếu này và file JSON nguồn. Trước khi review thủ công, kiểm tra SHA-256 của file JSON khớp giá trị trên và phiên bản đúng. Phiếu không chứng minh file đã được lưu.',
            'Keep both this worksheet and the source JSON file. Before the manual review, check that the JSON file SHA-256 matches the value above and that the revision is the expected one. This worksheet does not prove the file was saved.'),
        '',
        `## ${t('2. Bản nháp nguồn đã review (nguyên văn)', '2. Reviewed source draft (verbatim)')}`,
        '',
        t('Phần dưới là bản nháp đã review, giữ nguyên văn cùng các mục chưa giải quyết, xung đột và quyết định của người dùng. Đây là phát biểu nguồn, không phải đề xuất kỹ thuật.',
            'The block below is the reviewed draft verbatim, including the user\'s unresolved items, conflicts and decisions. These are source statements, not technical proposals.'),
        '',
        fence + 'text',
        payload.draft,
        fence,
        '',
        `## ${t('3. Hướng dẫn review thủ công', '3. Manual review instructions')}`,
        '',
        t('- Tách rõ phát biểu nguồn (trích dẫn từ mục 2) với đề xuất kỹ thuật (của người review).', '- Keep source statements (cited from section 2) separate from technical proposals (the reviewer\'s own).'),
        t('- Tách rõ dữ liệu đầu vào thô với phạm vi báo cáo khi hai thứ này khác nhau.', '- Keep raw entry separate from report scope where the two differ.'),
        t('- Nếu một khoảng thời gian cần lịch, mốc neo hoặc múi giờ mà nguồn không nêu, ghi là chưa giải quyết; không tự giả định.', '- If a period needs a calendar, anchor date or timezone the source does not state, record it as unresolved; do not assume one.'),
        t('- Không suy ra sẵn sàng hay "không còn điều chưa biết" từ phiếu này.', '- Do not infer readiness or "no unknowns" from this worksheet.'),
        '',
        ...section(t('4. Yêu cầu (kèm trích dẫn nguồn và quyết định áp dụng của người dùng)', '4. Requirements (with source citations and applicable user resolutions)'),
            t('Mỗi yêu cầu: trích dẫn mục 2 và quyết định của người dùng áp dụng.', 'Per requirement: the section 2 citation and the user resolution that applies.')),
        ...section(t('5. Thiết kế đề xuất', '5. Proposed design'), t('Đề xuất kỹ thuật của người review, ghi rõ là đề xuất.', 'The reviewer\'s technical proposal, labelled as a proposal.')),
        ...section(t('6. Công việc và phụ thuộc', '6. Tasks and dependencies'), t('Công việc, thứ tự và phụ thuộc do người review xác định.', 'Tasks, order and dependencies as determined by the reviewer.')),
        ...section(t('7. Kiểm chứng phân biệt được', '7. Discriminating validations'), t('Kiểm chứng có thể làm thất bại một thiết kế sai.', 'Validations that could fail a wrong design.')),
        ...section(t('8. Chính sách chưa giải quyết hoặc ủy quyền trong phạm vi bị ảnh hưởng', '8. Unresolved or delegated policies in the affected scope'),
            t('Liệt kê các mục chưa giải quyết/ủy quyền từ mục 2 mà thiết kế chạm tới.', 'List the unresolved or delegated items from section 2 that the design touches.')),
        ...section(t('9. Kết luận của người review có tên', '9. Named reviewer disposition'),
            t('Tên người review, ngày và kết luận. Chưa ai điền.', 'Reviewer name, date and disposition. Nobody has filled this in.')),
    ].join('\n');
}

/** Verify selected bytes against this session's owned expected candidate; never adopt imports. */
export async function verifySpecConfirmationReadback(
    candidate: SpecConfirmationCandidate, received: Uint8Array,
): Promise<boolean> {
    const owned = new Uint8Array(received);
    const expected = new TextEncoder().encode(candidate.fileContent);
    if (owned.length > MAX_CONFIRMATION_BYTES || owned.length !== expected.length) return false;
    if (!owned.every((byte, index) => byte === expected[index])) return false;
    return await sha256(owned) === candidate.fileSha256;
}
