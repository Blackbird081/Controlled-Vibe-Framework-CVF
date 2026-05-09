/**
 * Vibe Parser — M4.1
 *
 * Extracts structured intent, entities, and constraints from natural language input.
 * This is the "Vibe-to-Action" translator core from Non-coder.md:
 * User says "Vibe" → CVF extracts Goal + Constraints → Guards enforce.
 *
 * @module vibe-translator/vibe-parser
 */
export interface ParsedVibe {
    /** The raw user input */
    rawInput: string;
    /** Extracted goal/intent */
    goal: string;
    /** Extracted action type */
    actionType: VibeActionType;
    /** Extracted entities (people, files, services) */
    entities: VibeEntity[];
    /** Extracted constraints (budget, time, scope) */
    constraints: VibeConstraint[];
    /** Confidence score 0-1 */
    confidence: number;
    /** Missing information that needs clarification */
    missingSlots: string[];
    /** Suggested CVF phase for this vibe */
    suggestedPhase: string;
    /** Suggested risk level */
    suggestedRisk: string;
}
export type VibeActionType = 'create' | 'modify' | 'delete' | 'send' | 'analyze' | 'review' | 'deploy' | 'search' | 'report' | 'unknown';
export interface VibeEntity {
    type: 'person' | 'file' | 'service' | 'data' | 'money' | 'time' | 'location';
    value: string;
    raw: string;
    confidence: number;
}
export interface VibeConstraint {
    type: 'budget' | 'time' | 'scope' | 'security' | 'quality' | 'permission';
    description: string;
    raw: string;
    severity: 'hard' | 'soft';
}
export declare function parseVibe(input: string): ParsedVibe;
//# sourceMappingURL=vibe-parser.d.ts.map