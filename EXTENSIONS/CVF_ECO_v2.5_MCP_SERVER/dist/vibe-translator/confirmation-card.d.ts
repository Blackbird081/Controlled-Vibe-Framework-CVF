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
declare const RISK_LABELS: Record<string, string>;
declare const RISK_LABELS_VI: Record<string, string>;
declare const PHASE_LABELS: Record<string, string>;
declare const ACTION_STEPS: Record<string, ConfirmationStep[]>;
export declare function generateConfirmationCard(parsed: ParsedVibe, clarification: ClarificationResult): ConfirmationCard;
export declare function formatCardAsText(card: ConfirmationCard, lang?: 'en' | 'vi'): string;
export { RISK_LABELS, RISK_LABELS_VI, PHASE_LABELS, ACTION_STEPS };
//# sourceMappingURL=confirmation-card.d.ts.map