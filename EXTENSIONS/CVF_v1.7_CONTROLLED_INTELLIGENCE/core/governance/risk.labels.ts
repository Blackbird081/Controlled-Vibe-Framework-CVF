// risk.labels.ts
// Non-Coder friendly risk level labels.
// Maps internal R0-R3 to human-readable, non-technical labels.
// CVF Doctrine: Non-Coders should never see raw R0-R3.

import { type CVFRiskLevel } from './risk.mapping'

export type SupportedLocale = 'vi' | 'en'

export interface NonCoderRiskLabel {
    emoji: string
    label: string
    description: string
}

const RISK_LABELS: Record<SupportedLocale, Record<CVFRiskLevel, NonCoderRiskLabel>> = {
    vi: {
        R0: { emoji: '🟢', label: 'An toàn', description: 'AI đang hoạt động bình thường, không cần can thiệp.' },
        R1: { emoji: '🟡', label: 'Cần chú ý', description: 'AI cần kiểm tra thêm, có thể cần hướng dẫn.' },
        R2: { emoji: '🟠', label: 'Cần duyệt', description: 'AI cần được phê duyệt trước khi tiếp tục.' },
        R3: { emoji: '🔴', label: 'Nguy hiểm', description: 'AI đã bị dừng. Cần người có thẩm quyền xem xét.' }
    },
    en: {
        R0: { emoji: '🟢', label: 'Safe', description: 'AI is operating normally, no intervention needed.' },
        R1: { emoji: '🟡', label: 'Attention', description: 'AI needs additional review, may require guidance.' },
        R2: { emoji: '🟠', label: 'Review Required', description: 'AI needs approval before proceeding.' },
        R3: { emoji: '🔴', label: 'Dangerous', description: 'AI has been stopped. Authorized review required.' }
    }
}

/**
 * Get Non-Coder friendly label for a CVF risk level.
 * @param level - Internal CVF risk level (R0-R3)
 * @param locale - Language (default: 'vi')
 */
export function getRiskLabel(level: CVFRiskLevel, locale: SupportedLocale = 'vi'): NonCoderRiskLabel {
    return RISK_LABELS[locale][level]
}

/**
 * Format risk for display in dashboard.
 * Example: "🟢 An toàn" or "🔴 Nguy hiểm"
 */
export function formatRiskDisplay(level: CVFRiskLevel, locale: SupportedLocale = 'vi'): string {
    const label = getRiskLabel(level, locale)
    return `${label.emoji} ${label.label}`
}

/**
 * Get all risk labels for a locale (useful for legends/tooltips).
 */
export function getAllRiskLabels(locale: SupportedLocale = 'vi'): Record<CVFRiskLevel, NonCoderRiskLabel> {
    return RISK_LABELS[locale]
}
