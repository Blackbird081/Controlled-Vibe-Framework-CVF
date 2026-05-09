/**
 * Clarification Engine — M4.2
 *
 * "Active Clarification" from Non-coder.md: Slot Filling when info is missing.
 * CVF acts as a "strict secretary" — asks before acting, never guesses.
 *
 * @module vibe-translator/clarification-engine
 */
import type { ParsedVibe, VibeActionType } from './vibe-parser.js';
export interface ClarificationQuestion {
    slot: string;
    question: string;
    questionVi: string;
    options?: string[];
    required: boolean;
    priority: number;
}
export interface ClarificationResult {
    needsClarification: boolean;
    questions: ClarificationQuestion[];
    confidence: number;
    summary: string;
    summaryVi: string;
}
declare const SLOT_QUESTIONS: Record<string, Omit<ClarificationQuestion, 'slot'>>;
declare const ADDITIONAL_SLOTS: Record<VibeActionType, string[]>;
export declare function generateClarifications(parsed: ParsedVibe): ClarificationResult;
export { SLOT_QUESTIONS, ADDITIONAL_SLOTS };
//# sourceMappingURL=clarification-engine.d.ts.map