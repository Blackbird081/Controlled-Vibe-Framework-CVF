/**
 * CVF Friendly Labels
 * =====================
 * Maps CVF internal concepts to user-friendly language.
 * Non-coders see "Kiểm tra an toàn ✅" instead of "Guard: PhaseGateGuard ALLOW".
 *
 * Sprint 7 — Task 7.6
 *
 * @module lib/friendly-labels
 */

import { getRiskOption, normalizeWebPhaseInput, type CVFPhaseToolkit } from './governance-model';

// ─── Phase Labels ────────────────────────────────────────────────────

export const PHASE_FRIENDLY: Record<CVFPhaseToolkit, { vi: string; en: string; icon: string }> = {
  'INTAKE': { vi: 'Tiếp nhận & Làm rõ', en: 'Intake & Clarify', icon: '🧭' },
  'DESIGN': { vi: 'Thiết kế & Lên kế hoạch', en: 'Design & Plan', icon: '📐' },
  'BUILD': { vi: 'Xây dựng & Thực thi', en: 'Build & Execute', icon: '🔨' },
  'REVIEW': { vi: 'Kiểm tra & Đánh giá', en: 'Review & Verify', icon: '✅' },
  'FREEZE': { vi: 'Chốt kết quả & Khóa phạm vi', en: 'Freeze & Close Out', icon: '🔒' },
};

// ─── Guard Decision Labels ───────────────────────────────────────────

export const DECISION_FRIENDLY: Record<string, { vi: string; en: string; icon: string; color: string }> = {
  'ALLOW': { vi: 'Được phép ✅', en: 'Allowed ✅', icon: '✅', color: 'text-green-600' },
  'BLOCK': { vi: 'Không được phép ❌', en: 'Not Allowed ❌', icon: '❌', color: 'text-red-600' },
  'ESCALATE': { vi: 'Cần người duyệt 👤', en: 'Needs Approval 👤', icon: '👤', color: 'text-amber-600' },
};

// ─── Guard Names ─────────────────────────────────────────────────────

export const GUARD_FRIENDLY: Record<string, { vi: string; en: string }> = {
  'ai_commit': { vi: 'Cam kết AI trước khi sửa', en: 'AI Commit Check' },
  'file_scope': { vi: 'Kiểm tra phạm vi file', en: 'File Scope Check' },
  'phase_gate': { vi: 'Kiểm tra giai đoạn', en: 'Phase Check' },
  'risk_gate': { vi: 'Kiểm tra rủi ro', en: 'Risk Check' },
  'authority_gate': { vi: 'Kiểm tra quyền hạn', en: 'Permission Check' },
  'mutation_budget': { vi: 'Giới hạn thay đổi', en: 'Change Limit' },
  'scope_guard': { vi: 'Kiểm tra phạm vi', en: 'Scope Check' },
  'audit_trail': { vi: 'Ghi nhật ký', en: 'Audit Log' },
  'AiCommitGuard': { vi: 'Cam kết AI trước khi sửa', en: 'AI Commit Check' },
  'FileScopeGuard': { vi: 'Kiểm tra phạm vi file', en: 'File Scope Check' },
  'PhaseGateGuard': { vi: 'Kiểm tra giai đoạn', en: 'Phase Check' },
  'RiskGateGuard': { vi: 'Kiểm tra rủi ro', en: 'Risk Check' },
  'AuthorityGateGuard': { vi: 'Kiểm tra quyền hạn', en: 'Permission Check' },
  'MutationBudgetGuard': { vi: 'Giới hạn thay đổi', en: 'Change Limit' },
  'ScopeGuard': { vi: 'Kiểm tra phạm vi', en: 'Scope Check' },
  'AuditTrailGuard': { vi: 'Ghi nhật ký', en: 'Audit Log' },
};

// ─── Status Messages ─────────────────────────────────────────────────

export const STATUS_FRIENDLY: Record<string, { vi: string; en: string }> = {
  'evaluating': { vi: 'Đang kiểm tra an toàn...', en: 'Running safety checks...' },
  'executing': { vi: 'Đang thực hiện yêu cầu...', en: 'Processing your request...' },
  'completed': { vi: 'Hoàn thành!', en: 'Done!' },
  'blocked': { vi: 'Yêu cầu không được phép. Xem lý do bên dưới.', en: 'Request not allowed. See reason below.' },
  'escalated': { vi: 'Cần người có thẩm quyền duyệt.', en: 'Needs authorized approval.' },
};

// ─── Helper Functions ────────────────────────────────────────────────

type Lang = 'vi' | 'en';

export function friendlyPhase(phase: string, lang: Lang = 'vi'): string {
  const key = normalizeWebPhaseInput(phase);
  const entry = key ? PHASE_FRIENDLY[key] : undefined;
  return entry ? `${entry.icon} ${entry[lang]}` : phase;
}

export function friendlyRisk(risk: string, lang: Lang = 'vi'): string {
  const entry = getRiskOption(risk);
  return entry ? `${entry.icon} ${lang === 'vi' ? entry.label : entry.labelEn}` : risk;
}

export function friendlyDecision(decision: string, lang: Lang = 'vi'): string {
  const entry = DECISION_FRIENDLY[decision];
  return entry ? entry[lang] : decision;
}

export function friendlyGuard(guardId: string, lang: Lang = 'vi'): string {
  const entry = GUARD_FRIENDLY[guardId];
  return entry ? entry[lang] : guardId;
}

export function friendlyStatus(status: string, lang: Lang = 'vi'): string {
  const entry = STATUS_FRIENDLY[status];
  return entry ? entry[lang] : status;
}

/**
 * Transform a guard pipeline result into user-friendly summary.
 */
export function friendlySummary(
  result: { finalDecision: string; guardsEvaluated?: number; durationMs?: number },
  lang: Lang = 'vi',
): string {
  const decision = friendlyDecision(result.finalDecision, lang);
  const guards = result.guardsEvaluated ?? 0;
  const ms = result.durationMs ?? 0;

  if (lang === 'vi') {
    return `${decision} — Đã kiểm tra ${guards} quy tắc (${ms}ms)`;
  }
  return `${decision} — Checked ${guards} rules (${ms}ms)`;
}
