/**
 * Skill-Guard Wire — M3.2
 *
 * Maps CVF Skills to required guards. When a user selects a skill,
 * the wire determines which guards must be active and at what settings.
 *
 * @module registry/skill-guard-wire
 */
import type { CVFPhase, CVFRiskLevel, CVFRole } from '../guards/types.js';
export interface SkillGuardMapping {
    skillId: string;
    skillName: string;
    domain: string;
    requiredPhase: CVFPhase;
    minimumRiskLevel: CVFRiskLevel;
    requiredGuards: string[];
    recommendedRole: CVFRole;
    maxMutations?: number;
    protectedPaths?: string[];
    tags: string[];
}
export interface SkillGuardCheckResult {
    skillId: string;
    allowed: boolean;
    missingGuards: string[];
    phaseMatch: boolean;
    riskLevelSafe: boolean;
    roleAuthorized: boolean;
    reasons: string[];
    guidance: string;
}
export declare class SkillGuardWire {
    private mappings;
    registerSkill(mapping: SkillGuardMapping): void;
    unregisterSkill(skillId: string): boolean;
    getSkill(skillId: string): SkillGuardMapping | undefined;
    getAllSkills(): SkillGuardMapping[];
    getSkillsByDomain(domain: string): SkillGuardMapping[];
    getSkillsByPhase(phase: CVFPhase): SkillGuardMapping[];
    getSkillsByTag(tag: string): SkillGuardMapping[];
    checkSkill(skillId: string, currentPhase: CVFPhase, currentRisk: CVFRiskLevel, currentRole: CVFRole, activeGuardIds: string[]): SkillGuardCheckResult;
    getRequiredGuardsForSkill(skillId: string): string[];
    count(): number;
}
export declare function createDefaultSkillGuardWire(): SkillGuardWire;
//# sourceMappingURL=skill-guard-wire.d.ts.map