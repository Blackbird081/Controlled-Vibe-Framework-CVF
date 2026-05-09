export type BilingualText = { vi: string; en: string };
export type Lang = 'vi' | 'en';

export function t(text: BilingualText, lang: Lang): string {
    return text[lang];
}

// Common wizard UI strings shared across all wizard components
export const WIZARD_COMMON = {
    specGatePass: { vi: 'Spec Gate: PASS — Đủ input để xuất', en: 'Spec Gate: PASS — Enough input to export' },
    specGateClarify: { vi: 'Spec Gate: CLARIFY — Thiếu input bắt buộc', en: 'Spec Gate: CLARIFY — Missing required input' },
    specGateFail: { vi: 'Spec Gate: FAIL — Không đủ dữ liệu để tạo spec', en: 'Spec Gate: FAIL — Not enough data to generate spec' },
    missingRequired: { vi: 'Thiếu input bắt buộc', en: 'Missing required input' },
    copiedToClipboard: { vi: 'Đã copy vào clipboard!', en: 'Copied to clipboard!' },
    backToHome: { vi: 'Quay lại trang chủ', en: 'Back to home' },
    draftFound: { vi: 'Bạn có bản nháp chưa hoàn thành', en: 'You have an unfinished draft' },
    draftResume: { vi: 'Tiếp tục từ lần trước hoặc bắt đầu mới', en: 'Continue from last time or start new' },
    continue: { vi: 'Tiếp tục', en: 'Continue' },
    startNew: { vi: 'Bắt đầu mới', en: 'Start new' },
    previous: { vi: '← Trước', en: '← Previous' },
    next: { vi: 'Tiếp tục →', en: 'Next →' },
    skipContinue: { vi: 'Bỏ qua / Tiếp tục', en: 'Skip / Continue' },
    clickToGo: { vi: 'Nhấn để đến', en: 'Click to go to' },
    completePrevious: { vi: 'Hoàn thành các step trước để mở khóa', en: 'Complete previous steps to unlock' },
    select: { vi: '-- Chọn --', en: '-- Select --' },
    reviewReady: { vi: 'sẵn sàng!', en: 'is ready!' },
    reviewDesc: { vi: 'Review bên dưới và xuất khi sẵn sàng.', en: 'Review below and export when ready.' },
    required: { vi: 'Bắt buộc', en: 'Required' },
    optional: { vi: 'Tùy chọn', en: 'Optional' },
    example: { vi: 'VD', en: 'e.g.' },
    specReady: { vi: 'Spec đã sẵn sàng! Nhấn "Xuất Spec" để copy và paste vào AI Agent.', en: 'Spec is ready! Click "Export Spec" to copy and paste into AI Agent.' },
    exportSpec: { vi: 'Xuất Spec', en: 'Export Spec' },
    stepSkipped: { vi: 'Bước đã bỏ qua', en: 'Step skipped' },
    goTo: { vi: 'Đến', en: 'Go to' },
    optionalStep: { vi: 'Bước này không bắt buộc. Bạn có thể bỏ qua nếu không cần.', en: 'This step is optional. You can skip it if not needed.' },
    allStepsComplete: { vi: 'Đã hoàn thành tất cả steps!', en: 'All steps completed!' },
    copyToClipboard: { vi: 'Copy to Clipboard', en: 'Copy to Clipboard' },
    downloadMd: { vi: 'Download .md', en: 'Download .md' },
} as const;
