// Text Encoding Exception: presentation labels are shared by the Vietnamese and English UI.
type Language = 'vi' | 'en';

export const NO_DATA_LABEL: Record<Language, string> = {
    vi: 'Chưa có dữ liệu',
    en: 'No data yet',
};

const STATUS_LABELS: Record<string, Record<Language, string>> = {
    STATUS_UNAVAILABLE: { vi: 'Chưa thể kiểm tra trạng thái', en: 'Status unavailable' },
    ALLOW: { vi: 'Được phép', en: 'Allowed' },
    ALLOWED: { vi: 'Được phép', en: 'Allowed' },
    DENY: { vi: 'Không được phép', en: 'Denied' },
    DENIED: { vi: 'Không được phép', en: 'Denied' },
    BLOCK: { vi: 'Bị chặn', en: 'Blocked' },
    BLOCKED: { vi: 'Bị chặn', en: 'Blocked' },
    WARN: { vi: 'Cần lưu ý', en: 'Warning' },
    ESCALATE: { vi: 'Cần người phụ trách xem xét', en: 'Needs review' },
    UNKNOWN: { vi: 'Chưa xác định', en: 'Unknown' },
};

export function statusLabel(value: string, language: Language): string {
    const key = value.toUpperCase();
    return Object.hasOwn(STATUS_LABELS, key) ? STATUS_LABELS[key][language] : value;
}

const CONTROL_FAILURE_LABELS: Record<string, Record<Language, string>> = {
    AWAITING_SERVER_OBSERVATION: { vi: 'Đang chờ máy chủ xác nhận thay đổi.', en: 'Waiting for the server to confirm the change.' },
    RELEASE_TOO_EARLY: { vi: 'Chưa đến lúc xác nhận. Hãy thử lại vào thời điểm hiển thị.', en: 'Wait until the time shown to confirm.' },
    RELEASE_NOT_APPLICABLE: { vi: 'Yêu cầu này không còn chờ xác nhận. Hãy làm mới trạng thái.', en: 'This request is no longer waiting for confirmation. Refresh its status.' },
    HELD_RELEASE_LIMIT: { vi: 'Đã đạt giới hạn xác nhận. Hãy liên hệ người quản trị.', en: 'The confirmation limit was reached. Contact your administrator.' },
    INVALID_OR_STALE_OBSERVATION: { vi: 'Chưa xác minh được phản hồi từ máy chủ. Hãy làm mới trạng thái.', en: 'The server response could not be verified. Refresh status to try again.' },
    JOURNAL_COMMIT_UNKNOWN: { vi: 'Máy chủ chưa xác nhận thay đổi đã được lưu hay chưa.', en: 'The server could not confirm whether the change was saved.' },
    JOURNAL_BUSY: { vi: 'Máy chủ đang bận. Hãy làm mới trạng thái sau.', en: 'The server is busy. Refresh status in a moment.' },
    JOURNAL_NOT_READY: { vi: 'Máy chủ chưa sẵn sàng xác nhận trạng thái.', en: 'The server is not ready to confirm the status.' },
    JOURNAL_UNAVAILABLE: { vi: 'Chưa thể đọc trạng thái từ máy chủ.', en: 'The server status could not be read.' },
    CONTROL_MIGRATION_REQUIRED: { vi: 'Cần người quản trị cập nhật hệ thống điều khiển.', en: 'An administrator needs to update the control system.' },
    ADMISSION_CAPACITY: { vi: 'Đã đạt giới hạn lượt chạy. Hãy kiểm tra trạng thái sau.', en: 'The run limit was reached. Check the status again later.' },
    ADMISSION_CONFLICT: { vi: 'Trạng thái đã thay đổi. Hãy làm mới trước khi thử lại.', en: 'The status changed. Refresh it before trying again.' },
    ADMISSION_STOPPED: { vi: 'Việc nhận lượt chạy mới đã dừng.', en: 'New admissions are stopped.' },
    BAD_PAYLOAD: { vi: 'Máy chủ không chấp nhận yêu cầu này.', en: 'The server rejected the request.' },
    FORBIDDEN_ORIGIN: { vi: 'Không thể thực hiện thao tác từ trang này.', en: 'This page cannot perform that action.' },
    UNAUTHORIZED: { vi: 'Hãy đăng nhập bằng tài khoản đã xác minh hoặc liên hệ người quản trị.', en: 'Sign in with a verified account or contact your administrator.' },
};

export function controlFailureLabel(code: string, language: Language): string {
    return Object.hasOwn(CONTROL_FAILURE_LABELS, code)
        ? CONTROL_FAILURE_LABELS[code][language]
        : STATUS_LABELS.STATUS_UNAVAILABLE[language];
}
