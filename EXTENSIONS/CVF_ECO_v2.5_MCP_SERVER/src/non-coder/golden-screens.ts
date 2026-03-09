/**
 * 5 Golden Screens — M7.3
 *
 * Data models and generators for the 5 core non-coder UI screens
 * from Non-coder.md. These are the backend contracts that any
 * frontend (web, mobile, CLI) can consume.
 *
 * 1. The Vibe Box — Single input + voice
 * 2. Intention Map — Mindmap confirmation + auto-guardrails
 * 3. Live Operation Dashboard — Progress + budget + pause
 * 4. Human-in-the-Loop — Push notifications for risk events
 * 5. Audit Ledger — Human-language daily summary
 *
 * @module non-coder/golden-screens
 */

import type { ParsedVibe } from '../vibe-translator/vibe-parser.js';
import type { ClarificationResult } from '../vibe-translator/clarification-engine.js';
import type { ConfirmationCard } from '../vibe-translator/confirmation-card.js';
import type { SessionSnapshot } from '../memory/session-memory.js';
import type { GuardPipelineResult, GuardAuditEntry } from '../guards/types.js';

// ─── Screen 1: The Vibe Box ──────────────────────────────────────────

export interface VibeBoxScreen {
  type: 'vibe_box';
  placeholder: string;
  placeholderVi: string;
  voiceEnabled: boolean;
  suggestedPrompts: string[];
  recentVibes: string[];
  currentPhaseHint: string;
}

export function generateVibeBoxScreen(
  recentVibes: string[] = [],
  currentPhase: string = 'DISCOVERY',
): VibeBoxScreen {
  const phasePrompts: Record<string, string[]> = {
    DISCOVERY: [
      'What problem are you trying to solve?',
      'Describe your app idea in one sentence',
      'Who will use this product?',
    ],
    DESIGN: [
      'What features should it have?',
      'How should the main screen look?',
      'What tech stack do you prefer?',
    ],
    BUILD: [
      'Create a login page',
      'Add user authentication',
      'Build the dashboard component',
    ],
    REVIEW: [
      'Review the code for security issues',
      'Check if all tests pass',
      'Prepare for deployment',
    ],
  };

  return {
    type: 'vibe_box',
    placeholder: 'Tell me what you want to build...',
    placeholderVi: 'Hãy cho tôi biết bạn muốn xây dựng gì...',
    voiceEnabled: true,
    suggestedPrompts: phasePrompts[currentPhase] || phasePrompts.DISCOVERY,
    recentVibes: recentVibes.slice(0, 5),
    currentPhaseHint: `You are in ${currentPhase} phase`,
  };
}

// ─── Screen 2: Intention Map ─────────────────────────────────────────

export interface IntentionMapNode {
  id: string;
  label: string;
  labelVi: string;
  type: 'goal' | 'constraint' | 'step' | 'guardrail' | 'risk';
  status: 'confirmed' | 'pending' | 'warning' | 'blocked';
  children: IntentionMapNode[];
}

export interface IntentionMapScreen {
  type: 'intention_map';
  rootGoal: string;
  nodes: IntentionMapNode[];
  autoGuardrails: string[];
  requiresConfirmation: boolean;
  confidence: number;
}

export function generateIntentionMapScreen(
  parsed: ParsedVibe,
  clarification: ClarificationResult,
  card: ConfirmationCard,
): IntentionMapScreen {
  const nodes: IntentionMapNode[] = [];

  // Goal node
  const goalNode: IntentionMapNode = {
    id: 'goal-root',
    label: parsed.goal,
    labelVi: parsed.goal,
    type: 'goal',
    status: clarification.needsClarification ? 'pending' : 'confirmed',
    children: [],
  };

  // Step nodes
  for (const step of card.steps) {
    goalNode.children.push({
      id: `step-${step.order}`,
      label: step.action,
      labelVi: step.actionVi,
      type: 'step',
      status: step.automated ? 'confirmed' : 'pending',
      children: [],
    });
  }
  nodes.push(goalNode);

  // Constraint nodes
  for (let i = 0; i < parsed.constraints.length; i++) {
    nodes.push({
      id: `constraint-${i}`,
      label: parsed.constraints[i].description,
      labelVi: parsed.constraints[i].description,
      type: 'constraint',
      status: parsed.constraints[i].severity === 'hard' ? 'warning' : 'confirmed',
      children: [],
    });
  }

  // Auto-guardrails
  const autoGuardrails: string[] = [];
  if (parsed.suggestedRisk === 'R2' || parsed.suggestedRisk === 'R3') {
    autoGuardrails.push('Risk escalation active — human approval required');
  }
  if (parsed.actionType === 'deploy') {
    autoGuardrails.push('Deployment guard — operator role required');
  }
  if (parsed.actionType === 'delete') {
    autoGuardrails.push('Deletion guard — confirmation required');
  }
  autoGuardrails.push('Audit trail — all actions logged');
  autoGuardrails.push(`Mutation budget — limits per ${parsed.suggestedRisk} risk level`);

  return {
    type: 'intention_map',
    rootGoal: parsed.goal,
    nodes,
    autoGuardrails,
    requiresConfirmation: card.requiresConfirmation,
    confidence: parsed.confidence,
  };
}

// ─── Screen 3: Live Operation Dashboard ──────────────────────────────

export interface LiveDashboardScreen {
  type: 'live_dashboard';
  currentStep: number;
  totalSteps: number;
  progress: number;
  mutationBudget: { used: number; max: number; percentage: number };
  riskLevel: string;
  riskLabel: string;
  canPause: boolean;
  isPaused: boolean;
  elapsedMs: number;
  statusMessage: string;
  statusMessageVi: string;
}

export function generateLiveDashboardScreen(
  snapshot: SessionSnapshot,
  currentStep: number = 1,
  totalSteps: number = 4,
  isPaused: boolean = false,
): LiveDashboardScreen {
  const riskBudgets: Record<string, number> = { R0: 10, R1: 10, R2: 5, R3: 0 };
  const maxBudget = riskBudgets[snapshot.currentRisk] ?? 10;
  const budgetPercentage = maxBudget > 0 ? Math.round((snapshot.mutationCount / maxBudget) * 100) : 100;

  const riskLabels: Record<string, string> = {
    R0: '✅ Safe', R1: '⚡ Low', R2: '⚠️ Elevated', R3: '🛑 Critical',
  };

  const elapsed = new Date(snapshot.lastActivityAt).getTime() - new Date(snapshot.createdAt).getTime();
  const progress = Math.round((currentStep / totalSteps) * 100);

  let statusMessage: string;
  let statusMessageVi: string;
  if (isPaused) {
    statusMessage = 'Paused — waiting for your input';
    statusMessageVi = 'Tạm dừng — đang chờ phản hồi của bạn';
  } else if (budgetPercentage >= 100) {
    statusMessage = 'Budget exhausted — cannot proceed';
    statusMessageVi = 'Hết ngân sách — không thể tiếp tục';
  } else {
    statusMessage = `Step ${currentStep}/${totalSteps} in progress`;
    statusMessageVi = `Bước ${currentStep}/${totalSteps} đang thực hiện`;
  }

  return {
    type: 'live_dashboard',
    currentStep,
    totalSteps,
    progress,
    mutationBudget: { used: snapshot.mutationCount, max: maxBudget, percentage: Math.min(budgetPercentage, 100) },
    riskLevel: snapshot.currentRisk,
    riskLabel: riskLabels[snapshot.currentRisk] || '✅ Safe',
    canPause: !isPaused,
    isPaused,
    elapsedMs: Math.max(0, elapsed),
    statusMessage,
    statusMessageVi,
  };
}

// ─── Screen 4: Human-in-the-Loop ─────────────────────────────────────

export interface HITLNotification {
  id: string;
  type: 'risk_escalation' | 'budget_warning' | 'phase_gate' | 'authority_required' | 'scope_violation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  titleVi: string;
  message: string;
  messageVi: string;
  actions: { label: string; labelVi: string; action: string }[];
  timestamp: string;
}

export interface HITLScreen {
  type: 'hitl';
  notifications: HITLNotification[];
  pendingCount: number;
  criticalCount: number;
}

export function generateHITLScreen(pipelineResult: GuardPipelineResult): HITLScreen {
  const notifications: HITLNotification[] = [];
  const now = new Date().toISOString();

  for (const result of pipelineResult.results) {
    if (result.decision === 'BLOCK' || result.decision === 'ESCALATE') {
      const type = mapGuardToNotificationType(result.guardId);
      const severity = result.decision === 'BLOCK' ? 'critical' : 'warning';

      notifications.push({
        id: `hitl-${result.guardId}-${Date.now()}`,
        type,
        severity: severity as 'warning' | 'critical',
        title: `${result.decision}: ${result.guardId.replace(/_/g, ' ')}`,
        titleVi: `${result.decision === 'BLOCK' ? 'Chặn' : 'Cần duyệt'}: ${result.guardId.replace(/_/g, ' ')}`,
        message: result.reason,
        messageVi: result.reason,
        actions: severity === 'critical'
          ? [
              { label: 'Override', labelVi: 'Ghi đè', action: 'override' },
              { label: 'Cancel', labelVi: 'Hủy', action: 'cancel' },
            ]
          : [
              { label: 'Approve', labelVi: 'Phê duyệt', action: 'approve' },
              { label: 'Modify', labelVi: 'Sửa đổi', action: 'modify' },
              { label: 'Reject', labelVi: 'Từ chối', action: 'reject' },
            ],
        timestamp: now,
      });
    }
  }

  return {
    type: 'hitl',
    notifications,
    pendingCount: notifications.length,
    criticalCount: notifications.filter((n) => n.severity === 'critical').length,
  };
}

function mapGuardToNotificationType(guardId: string): HITLNotification['type'] {
  switch (guardId) {
    case 'risk_gate': return 'risk_escalation';
    case 'mutation_budget': return 'budget_warning';
    case 'phase_gate': return 'phase_gate';
    case 'authority_gate': return 'authority_required';
    case 'scope_guard': return 'scope_violation';
    default: return 'risk_escalation';
  }
}

// ─── Screen 5: Audit Ledger ──────────────────────────────────────────

export interface AuditLedgerEntry {
  time: string;
  action: string;
  decision: string;
  decisionLabel: string;
  explanation: string;
  explanationVi: string;
}

export interface AuditLedgerScreen {
  type: 'audit_ledger';
  title: string;
  titleVi: string;
  entries: AuditLedgerEntry[];
  summary: string;
  summaryVi: string;
  totalActions: number;
  allowedCount: number;
  blockedCount: number;
}

export function generateAuditLedgerScreen(auditLog: GuardAuditEntry[]): AuditLedgerScreen {
  const entries: AuditLedgerEntry[] = auditLog.map((entry) => {
    const decision = entry.pipelineResult.finalDecision;
    const decisionLabels: Record<string, string> = {
      ALLOW: '✅ Allowed',
      BLOCK: '🛑 Blocked',
      ESCALATE: '⚠️ Escalated',
    };

    return {
      time: new Date(entry.timestamp).toLocaleTimeString(),
      action: entry.context.action || 'unknown action',
      decision,
      decisionLabel: decisionLabels[decision] || decision,
      explanation: `Action "${entry.context.action}" was ${decision === 'ALLOW' ? 'allowed' : decision === 'BLOCK' ? 'blocked' : 'escalated'} during ${entry.context.phase} phase at risk ${entry.context.riskLevel}.`,
      explanationVi: `Hành động "${entry.context.action}" đã bị ${decision === 'ALLOW' ? 'cho phép' : decision === 'BLOCK' ? 'chặn' : 'chuyển lên'} trong giai đoạn ${entry.context.phase} ở mức rủi ro ${entry.context.riskLevel}.`,
    };
  });

  const allowed = entries.filter((e) => e.decision === 'ALLOW').length;
  const blocked = entries.filter((e) => e.decision === 'BLOCK').length;

  const summary = entries.length === 0
    ? 'No actions recorded yet.'
    : `${entries.length} action(s) today: ${allowed} allowed, ${blocked} blocked.`;
  const summaryVi = entries.length === 0
    ? 'Chưa có hành động nào được ghi nhận.'
    : `${entries.length} hành động hôm nay: ${allowed} cho phép, ${blocked} chặn.`;

  return {
    type: 'audit_ledger',
    title: 'Daily Audit Ledger',
    titleVi: 'Nhật Ký Kiểm Toán Hàng Ngày',
    entries,
    summary,
    summaryVi,
    totalActions: entries.length,
    allowedCount: allowed,
    blockedCount: blocked,
  };
}
