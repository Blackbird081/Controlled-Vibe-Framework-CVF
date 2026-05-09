/**
 * Smart Onboarding — M7.4
 *
 * Psychographic profiling to personalize CVF for each user.
 * Replaces technical settings with human-friendly questions.
 *
 * From Non-coder.md:
 * - Persona Alignment (autonomy level)
 * - Red Lines (data access whitelist, HITL triggers)
 * - Personal Dictionary (context mapping)
 * - Identity Mapping (contact graph)
 * - Action Cards (gesture-based governance)
 *
 * @module non-coder/smart-onboarding
 */
import type { CVFRiskLevel } from '../guards/types.js';
export type AutonomyLevel = 'guardian' | 'balanced' | 'copilot' | 'autopilot';
export interface PersonaProfile {
    autonomyLevel: AutonomyLevel;
    riskTolerance: CVFRiskLevel;
    preferredLanguage: 'en' | 'vi';
    confirmBeforeAction: boolean;
    verboseExplanations: boolean;
    nickname?: string;
}
export interface PersonaQuestion {
    id: string;
    question: string;
    questionVi: string;
    options: {
        label: string;
        labelVi: string;
        value: string;
    }[];
}
declare const PERSONA_QUESTIONS: PersonaQuestion[];
export declare function getPersonaQuestions(): PersonaQuestion[];
export declare function buildPersonaProfile(answers: Record<string, string>): PersonaProfile;
export declare function getMaxRiskForAutonomy(autonomy: AutonomyLevel): CVFRiskLevel;
export interface RedLineConfig {
    dataAccessWhitelist: string[];
    hitlTriggers: string[];
    forbiddenActions: string[];
    requireApprovalFor: string[];
}
export declare function getDefaultRedLines(): RedLineConfig;
export declare function mergeRedLines(base: RedLineConfig, custom: Partial<RedLineConfig>): RedLineConfig;
export declare function checkRedLine(action: string, config: RedLineConfig): {
    allowed: boolean;
    requiresApproval: boolean;
    triggersHITL: boolean;
    reason?: string;
};
export interface DictionaryEntry {
    term: string;
    meaning: string;
    category: 'person' | 'action' | 'document' | 'service' | 'custom';
    aliases: string[];
}
export declare class PersonalDictionary {
    private entries;
    add(entry: DictionaryEntry): void;
    lookup(term: string): DictionaryEntry | undefined;
    resolve(text: string): string;
    getAll(): DictionaryEntry[];
    count(): number;
    remove(term: string): boolean;
}
export interface OnboardingResult {
    persona: PersonaProfile;
    redLines: RedLineConfig;
    dictionary: DictionaryEntry[];
    completedAt: string;
}
export declare function completeOnboarding(answers: Record<string, string>, customRedLines?: Partial<RedLineConfig>, dictionaryEntries?: DictionaryEntry[]): OnboardingResult;
export { PERSONA_QUESTIONS };
//# sourceMappingURL=smart-onboarding.d.ts.map