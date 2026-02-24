// lib/i18n/vi.ts
// Vietnamese translations for Non-Coder Safety Dashboard (v1.7.2)
// CVF Doctrine: Non-coders should see clear, friendly Vietnamese — never raw R0-R3.

export const vi = {
    dashboard: {
        title: 'Bảng điều khiển An toàn AI',
        subtitle: 'Giám sát hoạt động AI của bạn',
    },
    risk: {
        R0: { emoji: '🟢', label: 'An toàn', description: 'AI đang hoạt động bình thường, không cần can thiệp.' },
        R1: { emoji: '🟡', label: 'Cần chú ý', description: 'AI cần kiểm tra thêm, có thể cần hướng dẫn.' },
        R2: { emoji: '🟠', label: 'Cần duyệt', description: 'AI cần được phê duyệt trước khi tiếp tục.' },
        R3: { emoji: '🔴', label: 'Nguy hiểm', description: 'AI đã bị dừng. Cần người có thẩm quyền xem xét.' },
    },
    status: {
        active: 'Đang hoạt động',
        paused: 'Tạm dừng',
        blocked: 'Đã chặn',
        safe: 'An toàn',
    },
    actions: {
        approve: 'Phê duyệt',
        reject: 'Từ chối',
        review: 'Xem xét',
        viewDetails: 'Xem chi tiết',
        export: 'Xuất báo cáo',
    },
    onboarding: {
        welcome: 'Chào mừng đến CVF Safety Dashboard!',
        step1Title: 'AI của bạn được bảo vệ',
        step1Desc: 'CVF giám sát mọi hoạt động AI và cảnh báo khi có rủi ro.',
        step2Title: 'Hiểu mức độ rủi ro',
        step2Desc: '🟢 An toàn → 🟡 Chú ý → 🟠 Cần duyệt → 🔴 Nguy hiểm',
        step3Title: 'Bạn luôn có quyền kiểm soát',
        step3Desc: 'AI không bao giờ hành động mà không có sự đồng ý của bạn ở mức R2+.',
        getStarted: 'Bắt đầu',
        next: 'Tiếp theo',
        skip: 'Bỏ qua',
    },
    badge: {
        controlled: 'AI đang được kiểm soát',
        byFramework: 'bởi CVF — Controlled Vibe Framework',
        learnMore: 'Tìm hiểu thêm',
    },
    errors: {
        connectionLost: 'Mất kết nối. Đang thử lại...',
        unauthorized: 'Bạn không có quyền truy cập.',
        unknown: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    }
}

export type TranslationKey = typeof vi
