// explainability/explainability.layer.ts
// CVF v1.7.3 — Explainability Layer
// Human-readable explanations for non-coders (Vietnamese + English)

export type ExplainLocale = 'vi' | 'en'

export type IntentType =
    | 'FILE_READ'
    | 'FILE_WRITE'
    | 'FILE_DELETE'
    | 'EMAIL_SEND'
    | 'API_CALL'
    | 'CODE_EXECUTION'
    | 'DATA_EXPORT'
    | 'UNKNOWN'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ExecutionAction = 'EXECUTE' | 'BLOCK' | 'ESCALATE'

export interface ExplainInput {
    intentType: IntentType
    riskLevel: RiskLevel
    riskScore: number
    action: ExecutionAction
}

export interface HumanReadableExplanation {
    summary: string
    details: string
    riskMessage: string
    recommendation?: string
}

// ─── Translation Tables ───

const INTENT_LABELS: Record<ExplainLocale, Record<IntentType, string>> = {
    vi: {
        FILE_READ: 'đọc dữ liệu từ tệp',
        FILE_WRITE: 'ghi hoặc chỉnh sửa tệp',
        FILE_DELETE: 'xóa tệp',
        EMAIL_SEND: 'gửi email',
        API_CALL: 'gọi dịch vụ bên ngoài',
        CODE_EXECUTION: 'thực thi mã',
        DATA_EXPORT: 'xuất dữ liệu',
        UNKNOWN: 'thực hiện hành động không xác định',
    },
    en: {
        FILE_READ: 'read data from file',
        FILE_WRITE: 'write or modify file',
        FILE_DELETE: 'delete file',
        EMAIL_SEND: 'send email',
        API_CALL: 'call external service',
        CODE_EXECUTION: 'execute code',
        DATA_EXPORT: 'export data',
        UNKNOWN: 'perform unknown action',
    },
}

const RISK_LABELS: Record<ExplainLocale, Record<RiskLevel, (score: number) => string>> = {
    vi: {
        LOW: (s) => `Mức rủi ro thấp (${s}/100).`,
        MEDIUM: (s) => `Mức rủi ro trung bình (${s}/100).`,
        HIGH: (s) => `Mức rủi ro cao (${s}/100). Cần cân nhắc trước khi thực hiện.`,
        CRITICAL: (s) => `Mức rủi ro rất cao (${s}/100). Hành động có thể gây hậu quả nghiêm trọng.`,
    },
    en: {
        LOW: (s) => `Low risk (${s}/100).`,
        MEDIUM: (s) => `Medium risk (${s}/100).`,
        HIGH: (s) => `High risk (${s}/100). Review before proceeding.`,
        CRITICAL: (s) => `Critical risk (${s}/100). Action may cause severe consequences.`,
    },
}

const MESSAGES: Record<ExplainLocale, {
    blocked: { summary: string; details: (action: string) => string; recommendation: string }
    escalated: { summary: string; details: (action: string) => string; recommendation: string }
    approved: { summary: string; details: (action: string) => string }
}> = {
    vi: {
        blocked: {
            summary: 'Hành động đã bị chặn.',
            details: (a) => `Yêu cầu "${a}" không được phép theo chính sách hệ thống.`,
            recommendation: 'Kiểm tra lại yêu cầu hoặc liên hệ quản trị viên nếu cần thiết.',
        },
        escalated: {
            summary: 'Hành động cần phê duyệt.',
            details: (a) => `Yêu cầu "${a}" có mức rủi ro cao và cần được xác nhận trước khi thực hiện.`,
            recommendation: 'Xem lại nội dung và xác nhận nếu bạn chắc chắn muốn tiếp tục.',
        },
        approved: {
            summary: 'Hành động được chấp thuận.',
            details: (a) => `Yêu cầu "${a}" đáp ứng chính sách hiện tại và sẽ được thực hiện.`,
        },
    },
    en: {
        blocked: {
            summary: 'Action blocked.',
            details: (a) => `Request to "${a}" is not allowed by system policy.`,
            recommendation: 'Review the request or contact your administrator.',
        },
        escalated: {
            summary: 'Action requires approval.',
            details: (a) => `Request to "${a}" has high risk and requires confirmation before execution.`,
            recommendation: 'Review the details and confirm if you wish to proceed.',
        },
        approved: {
            summary: 'Action approved.',
            details: (a) => `Request to "${a}" meets current policy and will be executed.`,
        },
    },
}

// ─── ExplainabilityLayer Class ───

export class ExplainabilityLayer {

    constructor(private locale: ExplainLocale = 'en') { }

    setLocale(locale: ExplainLocale): void {
        this.locale = locale
    }

    explain(input: ExplainInput): HumanReadableExplanation {
        const actionLabel = INTENT_LABELS[this.locale][input.intentType]
        const riskMessage = RISK_LABELS[this.locale][input.riskLevel](input.riskScore)
        const msgs = MESSAGES[this.locale]

        switch (input.action) {
            case 'BLOCK':
                return {
                    summary: msgs.blocked.summary,
                    details: msgs.blocked.details(actionLabel),
                    riskMessage,
                    recommendation: msgs.blocked.recommendation,
                }

            case 'ESCALATE':
                return {
                    summary: msgs.escalated.summary,
                    details: msgs.escalated.details(actionLabel),
                    riskMessage,
                    recommendation: msgs.escalated.recommendation,
                }

            case 'EXECUTE':
            default:
                return {
                    summary: msgs.approved.summary,
                    details: msgs.approved.details(actionLabel),
                    riskMessage,
                }
        }
    }
}
