'use client';

/**
 * CVF v1.7.3 — Risk Models (ported for Web UI)
 * Data-driven risk matrix from JSON configs.
 *
 * ⚠️ SYNC WARNING: These values are manually ported from
 * EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/*.json
 * If the canonical JSON files change, update these constants accordingly.
 */

export interface RiskMatrixEntry {
    intent: string;
    label: { vi: string; en: string };
    baseScore: number;
    category: 'safe' | 'caution' | 'dangerous' | 'critical';
}

export interface DestructiveRule {
    pattern: string;
    label: { vi: string; en: string };
    riskBoost: number;
}

export interface EscalationThreshold {
    level: string;
    minScore: number;
    maxScore: number;
    action: string;
    color: string;
    label: { vi: string; en: string };
}

// ─── Risk Matrix (from risk.matrix.json) ───

export const RISK_MATRIX: RiskMatrixEntry[] = [
    { intent: 'FILE_READ', label: { vi: 'Đọc tệp', en: 'File Read' }, baseScore: 10, category: 'safe' },
    { intent: 'FILE_WRITE', label: { vi: 'Ghi tệp', en: 'File Write' }, baseScore: 40, category: 'caution' },
    { intent: 'FILE_DELETE', label: { vi: 'Xóa tệp', en: 'File Delete' }, baseScore: 75, category: 'dangerous' },
    { intent: 'EMAIL_SEND', label: { vi: 'Gửi email', en: 'Email Send' }, baseScore: 55, category: 'caution' },
    { intent: 'API_CALL', label: { vi: 'Gọi API', en: 'API Call' }, baseScore: 45, category: 'caution' },
    { intent: 'CODE_EXECUTION', label: { vi: 'Thực thi mã', en: 'Code Execution' }, baseScore: 80, category: 'dangerous' },
    { intent: 'DATA_EXPORT', label: { vi: 'Xuất dữ liệu', en: 'Data Export' }, baseScore: 60, category: 'caution' },
    { intent: 'SHELL_COMMAND', label: { vi: 'Lệnh shell', en: 'Shell Command' }, baseScore: 85, category: 'critical' },
    { intent: 'DB_WRITE', label: { vi: 'Ghi database', en: 'DB Write' }, baseScore: 65, category: 'dangerous' },
    { intent: 'DB_DELETE', label: { vi: 'Xóa database', en: 'DB Delete' }, baseScore: 90, category: 'critical' },
];

// ─── Destructive Patterns (from destructive.rules.json) ───

export const DESTRUCTIVE_RULES: DestructiveRule[] = [
    { pattern: 'rm -rf', label: { vi: 'Xóa đệ quy', en: 'Recursive delete' }, riskBoost: 30 },
    { pattern: 'DROP TABLE', label: { vi: 'Xóa bảng DB', en: 'Drop DB table' }, riskBoost: 40 },
    { pattern: 'FORMAT', label: { vi: 'Format ổ đĩa', en: 'Format drive' }, riskBoost: 50 },
    { pattern: 'DELETE FROM', label: { vi: 'Xóa dữ liệu', en: 'Delete data' }, riskBoost: 25 },
    { pattern: 'sudo', label: { vi: 'Quyền root', en: 'Root access' }, riskBoost: 20 },
    { pattern: 'chmod 777', label: { vi: 'Mở toàn quyền', en: 'Full permissions' }, riskBoost: 15 },
];

// ─── Escalation Thresholds (from escalation.thresholds.json) ───

export const ESCALATION_THRESHOLDS: EscalationThreshold[] = [
    { level: 'SAFE', minScore: 0, maxScore: 29, action: 'EXECUTE', color: 'bg-emerald-500', label: { vi: 'An toàn', en: 'Safe' } },
    { level: 'CAUTION', minScore: 30, maxScore: 59, action: 'EXECUTE', color: 'bg-amber-500', label: { vi: 'Cẩn thận', en: 'Caution' } },
    { level: 'REVIEW', minScore: 60, maxScore: 79, action: 'ESCALATE', color: 'bg-orange-500', label: { vi: 'Cần duyệt', en: 'Review' } },
    { level: 'CRITICAL', minScore: 80, maxScore: 100, action: 'BLOCK', color: 'bg-red-500', label: { vi: 'Nguy hiểm', en: 'Critical' } },
];

// ─── Helpers ───

export function getCategoryColor(category: string): string {
    switch (category) {
        case 'safe': return 'text-emerald-600 dark:text-emerald-400';
        case 'caution': return 'text-amber-600 dark:text-amber-400';
        case 'dangerous': return 'text-orange-600 dark:text-orange-400';
        case 'critical': return 'text-red-600 dark:text-red-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
}

export function getCategoryBg(category: string): string {
    switch (category) {
        case 'safe': return 'bg-emerald-100 dark:bg-emerald-900/30';
        case 'caution': return 'bg-amber-100 dark:bg-amber-900/30';
        case 'dangerous': return 'bg-orange-100 dark:bg-orange-900/30';
        case 'critical': return 'bg-red-100 dark:bg-red-900/30';
        default: return 'bg-gray-100 dark:bg-gray-800';
    }
}

export function getScoreBar(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
}
