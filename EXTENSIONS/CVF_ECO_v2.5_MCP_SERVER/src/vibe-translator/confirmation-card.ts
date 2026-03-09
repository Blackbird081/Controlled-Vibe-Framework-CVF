/**
 * Confirmation Card Generator — M4.3
 *
 * Generates structured confirmation cards from parsed vibes.
 * "Optimistic UI Feedback" from Non-coder.md: show the user what will happen
 * before it happens, in a clear, non-technical format.
 *
 * @module vibe-translator/confirmation-card
 */

import type { ParsedVibe } from './vibe-parser.js';
import type { ClarificationResult } from './clarification-engine.js';

export interface ConfirmationCard {
  /** Card title */
  title: string;
  titleVi: string;
  /** What the user wants (goal) */
  goal: string;
  /** Steps that will be taken */
  steps: ConfirmationStep[];
  /** Active constraints */
  constraints: string[];
  /** Risk level with human-readable label */
  riskLabel: string;
  /** Phase with human-readable label */
  phaseLabel: string;
  /** Whether the user needs to confirm */
  requiresConfirmation: boolean;
  /** Whether there are unanswered questions */
  hasPendingQuestions: boolean;
  /** Estimated complexity */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Status */
  status: 'ready' | 'needs_info' | 'blocked';
}

export interface ConfirmationStep {
  order: number;
  action: string;
  actionVi: string;
  risk: string;
  automated: boolean;
}

// ─── Risk Labels ──────────────────────────────────────────────────────

const RISK_LABELS: Record<string, string> = {
  R0: '✅ Safe — No risk',
  R1: '⚡ Low — Minimal attention needed',
  R2: '⚠️ Elevated — Requires your approval',
  R3: '🛑 Critical — Manual confirmation required',
};

const RISK_LABELS_VI: Record<string, string> = {
  R0: '✅ An toàn — Không có rủi ro',
  R1: '⚡ Thấp — Cần chú ý nhẹ',
  R2: '⚠️ Cao — Cần bạn phê duyệt',
  R3: '🛑 Nghiêm trọng — Cần xác nhận thủ công',
};

const PHASE_LABELS: Record<string, string> = {
  DISCOVERY: '🔍 Discovery — Understanding requirements',
  DESIGN: '📐 Design — Planning the solution',
  BUILD: '🔨 Build — Implementing the solution',
  REVIEW: '✅ Review — Validating the result',
};

// ─── Step Templates ───────────────────────────────────────────────────

const ACTION_STEPS: Record<string, ConfirmationStep[]> = {
  create: [
    { order: 1, action: 'Analyze requirements', actionVi: 'Phân tích yêu cầu', risk: 'R0', automated: true },
    { order: 2, action: 'Generate content/code', actionVi: 'Tạo nội dung/code', risk: 'R1', automated: true },
    { order: 3, action: 'Validate output quality', actionVi: 'Kiểm tra chất lượng', risk: 'R0', automated: true },
    { order: 4, action: 'Present result for review', actionVi: 'Trình bày kết quả để duyệt', risk: 'R0', automated: false },
  ],
  modify: [
    { order: 1, action: 'Identify target files/content', actionVi: 'Xác định file/nội dung cần sửa', risk: 'R0', automated: true },
    { order: 2, action: 'Plan changes', actionVi: 'Lên kế hoạch thay đổi', risk: 'R0', automated: true },
    { order: 3, action: 'Apply changes', actionVi: 'Áp dụng thay đổi', risk: 'R1', automated: true },
    { order: 4, action: 'Verify no regressions', actionVi: 'Kiểm tra không lỗi', risk: 'R0', automated: true },
  ],
  delete: [
    { order: 1, action: 'Identify items to delete', actionVi: 'Xác định mục cần xóa', risk: 'R0', automated: true },
    { order: 2, action: 'Check dependencies', actionVi: 'Kiểm tra phụ thuộc', risk: 'R1', automated: true },
    { order: 3, action: 'Request confirmation', actionVi: 'Yêu cầu xác nhận', risk: 'R2', automated: false },
    { order: 4, action: 'Execute deletion', actionVi: 'Thực hiện xóa', risk: 'R2', automated: false },
  ],
  send: [
    { order: 1, action: 'Prepare content', actionVi: 'Chuẩn bị nội dung', risk: 'R0', automated: true },
    { order: 2, action: 'Verify recipient', actionVi: 'Xác minh người nhận', risk: 'R1', automated: false },
    { order: 3, action: 'Preview before sending', actionVi: 'Xem trước khi gửi', risk: 'R0', automated: false },
    { order: 4, action: 'Send', actionVi: 'Gửi', risk: 'R1', automated: false },
  ],
  analyze: [
    { order: 1, action: 'Gather data', actionVi: 'Thu thập dữ liệu', risk: 'R0', automated: true },
    { order: 2, action: 'Run analysis', actionVi: 'Chạy phân tích', risk: 'R0', automated: true },
    { order: 3, action: 'Generate insights', actionVi: 'Tạo insights', risk: 'R0', automated: true },
    { order: 4, action: 'Present findings', actionVi: 'Trình bày kết quả', risk: 'R0', automated: true },
  ],
  review: [
    { order: 1, action: 'Load content for review', actionVi: 'Tải nội dung để duyệt', risk: 'R0', automated: true },
    { order: 2, action: 'Check against criteria', actionVi: 'Kiểm tra theo tiêu chí', risk: 'R0', automated: true },
    { order: 3, action: 'Provide feedback', actionVi: 'Đưa ra phản hồi', risk: 'R0', automated: true },
  ],
  deploy: [
    { order: 1, action: 'Run pre-deployment checks', actionVi: 'Chạy kiểm tra trước triển khai', risk: 'R1', automated: true },
    { order: 2, action: 'Build artifacts', actionVi: 'Build artifacts', risk: 'R1', automated: true },
    { order: 3, action: 'Request deployment approval', actionVi: 'Yêu cầu phê duyệt triển khai', risk: 'R3', automated: false },
    { order: 4, action: 'Deploy to target', actionVi: 'Triển khai', risk: 'R3', automated: false },
  ],
  search: [
    { order: 1, action: 'Define search criteria', actionVi: 'Xác định tiêu chí tìm kiếm', risk: 'R0', automated: true },
    { order: 2, action: 'Execute search', actionVi: 'Thực hiện tìm kiếm', risk: 'R0', automated: true },
    { order: 3, action: 'Present results', actionVi: 'Trình bày kết quả', risk: 'R0', automated: true },
  ],
  report: [
    { order: 1, action: 'Gather data', actionVi: 'Thu thập dữ liệu', risk: 'R0', automated: true },
    { order: 2, action: 'Generate report', actionVi: 'Tạo báo cáo', risk: 'R0', automated: true },
    { order: 3, action: 'Format and present', actionVi: 'Định dạng và trình bày', risk: 'R0', automated: true },
  ],
  unknown: [
    { order: 1, action: 'Clarify request', actionVi: 'Làm rõ yêu cầu', risk: 'R0', automated: false },
  ],
};

// ─── Generator ────────────────────────────────────────────────────────

export function generateConfirmationCard(
  parsed: ParsedVibe,
  clarification: ClarificationResult,
): ConfirmationCard {
  const steps = ACTION_STEPS[parsed.actionType] || ACTION_STEPS.unknown;
  const constraints = parsed.constraints.map((c) => c.description);

  const hasPendingQuestions = clarification.needsClarification;
  const requiresConfirmation =
    parsed.suggestedRisk === 'R2' ||
    parsed.suggestedRisk === 'R3' ||
    hasPendingQuestions;

  const complexity = determineComplexity(parsed, steps);

  let status: ConfirmationCard['status'];
  if (hasPendingQuestions) {
    status = 'needs_info';
  } else if (parsed.suggestedRisk === 'R3' && parsed.actionType === 'deploy') {
    status = 'blocked';
  } else {
    status = 'ready';
  }

  const actionLabel = parsed.actionType.charAt(0).toUpperCase() + parsed.actionType.slice(1);

  return {
    title: `${actionLabel}: ${parsed.goal.slice(0, 80)}`,
    titleVi: `${actionLabel}: ${parsed.goal.slice(0, 80)}`,
    goal: parsed.goal,
    steps,
    constraints,
    riskLabel: RISK_LABELS[parsed.suggestedRisk] || RISK_LABELS.R0,
    phaseLabel: PHASE_LABELS[parsed.suggestedPhase] || PHASE_LABELS.DISCOVERY,
    requiresConfirmation,
    hasPendingQuestions,
    complexity,
    status,
  };
}

function determineComplexity(
  parsed: ParsedVibe,
  steps: ConfirmationStep[],
): 'simple' | 'moderate' | 'complex' {
  let score = 0;

  score += steps.length;
  score += parsed.entities.length;
  score += parsed.constraints.length * 2;

  if (parsed.suggestedRisk === 'R2') score += 3;
  if (parsed.suggestedRisk === 'R3') score += 5;
  if (parsed.actionType === 'deploy') score += 3;
  if (parsed.actionType === 'delete') score += 2;

  if (score <= 5) return 'simple';
  if (score <= 10) return 'moderate';
  return 'complex';
}

export function formatCardAsText(card: ConfirmationCard, lang: 'en' | 'vi' = 'en'): string {
  const lines: string[] = [];

  lines.push(`═══════════════════════════════════════`);
  lines.push(lang === 'en' ? card.title : card.titleVi);
  lines.push(`═══════════════════════════════════════`);
  lines.push('');
  lines.push(`Goal: ${card.goal}`);
  lines.push(`Risk: ${card.riskLabel}`);
  lines.push(`Phase: ${card.phaseLabel}`);
  lines.push(`Complexity: ${card.complexity}`);
  lines.push(`Status: ${card.status}`);
  lines.push('');

  lines.push('Steps:');
  for (const step of card.steps) {
    const auto = step.automated ? '🤖' : '👤';
    const label = lang === 'en' ? step.action : step.actionVi;
    lines.push(`  ${step.order}. ${auto} ${label} [${step.risk}]`);
  }

  if (card.constraints.length > 0) {
    lines.push('');
    lines.push('Constraints:');
    for (const c of card.constraints) {
      lines.push(`  • ${c}`);
    }
  }

  if (card.requiresConfirmation) {
    lines.push('');
    lines.push(lang === 'en'
      ? '⚠️ Your confirmation is required before proceeding.'
      : '⚠️ Cần bạn xác nhận trước khi tiến hành.');
  }

  return lines.join('\n');
}

export { RISK_LABELS, RISK_LABELS_VI, PHASE_LABELS, ACTION_STEPS };
