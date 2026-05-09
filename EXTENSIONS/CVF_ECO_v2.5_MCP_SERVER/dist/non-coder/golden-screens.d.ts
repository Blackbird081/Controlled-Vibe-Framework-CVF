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
export interface VibeBoxScreen {
    type: 'vibe_box';
    placeholder: string;
    placeholderVi: string;
    voiceEnabled: boolean;
    suggestedPrompts: string[];
    recentVibes: string[];
    currentPhaseHint: string;
}
export declare function generateVibeBoxScreen(recentVibes?: string[], currentPhase?: string): VibeBoxScreen;
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
export declare function generateIntentionMapScreen(parsed: ParsedVibe, clarification: ClarificationResult, card: ConfirmationCard): IntentionMapScreen;
export interface LiveDashboardScreen {
    type: 'live_dashboard';
    currentStep: number;
    totalSteps: number;
    progress: number;
    mutationBudget: {
        used: number;
        max: number;
        percentage: number;
    };
    riskLevel: string;
    riskLabel: string;
    canPause: boolean;
    isPaused: boolean;
    elapsedMs: number;
    statusMessage: string;
    statusMessageVi: string;
}
export declare function generateLiveDashboardScreen(snapshot: SessionSnapshot, currentStep?: number, totalSteps?: number, isPaused?: boolean): LiveDashboardScreen;
export interface HITLNotification {
    id: string;
    type: 'risk_escalation' | 'budget_warning' | 'phase_gate' | 'authority_required' | 'scope_violation';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    titleVi: string;
    message: string;
    messageVi: string;
    actions: {
        label: string;
        labelVi: string;
        action: string;
    }[];
    timestamp: string;
}
export interface HITLScreen {
    type: 'hitl';
    notifications: HITLNotification[];
    pendingCount: number;
    criticalCount: number;
}
export declare function generateHITLScreen(pipelineResult: GuardPipelineResult): HITLScreen;
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
export declare function generateAuditLedgerScreen(auditLog: GuardAuditEntry[]): AuditLedgerScreen;
//# sourceMappingURL=golden-screens.d.ts.map