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

const RISK_NUM: Record<CVFRiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };

export class SkillGuardWire {
  private mappings: Map<string, SkillGuardMapping> = new Map();

  registerSkill(mapping: SkillGuardMapping): void {
    if (this.mappings.has(mapping.skillId)) {
      throw new Error(`Skill "${mapping.skillId}" is already registered.`);
    }
    this.mappings.set(mapping.skillId, mapping);
  }

  unregisterSkill(skillId: string): boolean {
    return this.mappings.delete(skillId);
  }

  getSkill(skillId: string): SkillGuardMapping | undefined {
    return this.mappings.get(skillId);
  }

  getAllSkills(): SkillGuardMapping[] {
    return Array.from(this.mappings.values());
  }

  getSkillsByDomain(domain: string): SkillGuardMapping[] {
    const lower = domain.toLowerCase();
    return this.getAllSkills().filter((s) => s.domain.toLowerCase() === lower);
  }

  getSkillsByPhase(phase: CVFPhase): SkillGuardMapping[] {
    return this.getAllSkills().filter((s) => s.requiredPhase === phase);
  }

  getSkillsByTag(tag: string): SkillGuardMapping[] {
    return this.getAllSkills().filter((s) => s.tags.includes(tag));
  }

  checkSkill(
    skillId: string,
    currentPhase: CVFPhase,
    currentRisk: CVFRiskLevel,
    currentRole: CVFRole,
    activeGuardIds: string[],
  ): SkillGuardCheckResult {
    const mapping = this.mappings.get(skillId);

    if (!mapping) {
      return {
        skillId,
        allowed: false,
        missingGuards: [],
        phaseMatch: false,
        riskLevelSafe: false,
        roleAuthorized: false,
        reasons: [`Skill "${skillId}" not found in registry.`],
        guidance: `The skill "${skillId}" is not registered. Check skill ID or register it first.`,
      };
    }

    const reasons: string[] = [];
    const missingGuards = mapping.requiredGuards.filter((g) => !activeGuardIds.includes(g));
    const phaseMatch = currentPhase === mapping.requiredPhase;
    const riskLevelSafe = RISK_NUM[currentRisk] <= RISK_NUM[mapping.minimumRiskLevel];
    const roleAuthorized = currentRole === mapping.recommendedRole || currentRole === 'HUMAN' || currentRole === 'OPERATOR';

    if (!phaseMatch) {
      reasons.push(`Skill requires phase ${mapping.requiredPhase}, current phase is ${currentPhase}.`);
    }
    if (!riskLevelSafe) {
      reasons.push(`Current risk ${currentRisk} exceeds skill maximum ${mapping.minimumRiskLevel}.`);
    }
    if (!roleAuthorized) {
      reasons.push(`Role ${currentRole} is not recommended for this skill (expected ${mapping.recommendedRole}).`);
    }
    if (missingGuards.length > 0) {
      reasons.push(`Missing required guards: ${missingGuards.join(', ')}.`);
    }

    const allowed = phaseMatch && riskLevelSafe && roleAuthorized && missingGuards.length === 0;

    let guidance: string;
    if (allowed) {
      guidance = `Skill "${mapping.skillName}" is ready to use. All guards are active and context matches.`;
    } else {
      const fixes: string[] = [];
      if (!phaseMatch) fixes.push(`advance to ${mapping.requiredPhase} phase`);
      if (!riskLevelSafe) fixes.push(`reduce risk level to ${mapping.minimumRiskLevel} or below`);
      if (!roleAuthorized) fixes.push(`switch to ${mapping.recommendedRole} role`);
      if (missingGuards.length > 0) fixes.push(`enable guards: ${missingGuards.join(', ')}`);
      guidance = `Cannot use "${mapping.skillName}". To fix: ${fixes.join('; ')}.`;
    }

    return { skillId, allowed, missingGuards, phaseMatch, riskLevelSafe, roleAuthorized, reasons, guidance };
  }

  getRequiredGuardsForSkill(skillId: string): string[] {
    const mapping = this.mappings.get(skillId);
    return mapping ? [...mapping.requiredGuards] : [];
  }

  count(): number {
    return this.mappings.size;
  }
}

// ─── Factory: Create wire with standard skill mappings ────────────────

export function createDefaultSkillGuardWire(): SkillGuardWire {
  const wire = new SkillGuardWire();

  // App Development skills
  wire.registerSkill({
    skillId: 'app_requirements_spec',
    skillName: 'App Requirements Spec',
    domain: 'app_development',
    requiredPhase: 'DISCOVERY',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'audit_trail'],
    recommendedRole: 'HUMAN',
    tags: ['requirements', 'discovery', 'beginner'],
  });

  wire.registerSkill({
    skillId: 'tech_stack_selection',
    skillName: 'Tech Stack Selection',
    domain: 'app_development',
    requiredPhase: 'DESIGN',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'risk_gate', 'audit_trail'],
    recommendedRole: 'HUMAN',
    tags: ['architecture', 'design', 'beginner'],
  });

  wire.registerSkill({
    skillId: 'architecture_design',
    skillName: 'Architecture Design',
    domain: 'app_development',
    requiredPhase: 'DESIGN',
    minimumRiskLevel: 'R2',
    requiredGuards: ['phase_gate', 'risk_gate', 'authority_gate', 'audit_trail'],
    recommendedRole: 'HUMAN',
    tags: ['architecture', 'design', 'advanced'],
  });

  wire.registerSkill({
    skillId: 'code_implementation',
    skillName: 'Code Implementation',
    domain: 'app_development',
    requiredPhase: 'BUILD',
    minimumRiskLevel: 'R2',
    requiredGuards: ['phase_gate', 'risk_gate', 'authority_gate', 'mutation_budget', 'scope_guard', 'audit_trail'],
    recommendedRole: 'AI_AGENT',
    maxMutations: 20,
    tags: ['build', 'coding', 'intermediate'],
  });

  wire.registerSkill({
    skillId: 'code_review',
    skillName: 'Code Review',
    domain: 'app_development',
    requiredPhase: 'REVIEW',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'authority_gate', 'audit_trail'],
    recommendedRole: 'REVIEWER',
    tags: ['review', 'quality', 'intermediate'],
  });

  // AI/ML skills
  wire.registerSkill({
    skillId: 'model_selection',
    skillName: 'AI Model Selection',
    domain: 'ai_ml_evaluation',
    requiredPhase: 'DESIGN',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'risk_gate', 'audit_trail'],
    recommendedRole: 'HUMAN',
    tags: ['ai', 'design', 'intermediate'],
  });

  wire.registerSkill({
    skillId: 'prompt_evaluation',
    skillName: 'Prompt Evaluation',
    domain: 'ai_ml_evaluation',
    requiredPhase: 'BUILD',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'risk_gate', 'audit_trail'],
    recommendedRole: 'AI_AGENT',
    tags: ['ai', 'prompt', 'intermediate'],
  });

  wire.registerSkill({
    skillId: 'output_quality_check',
    skillName: 'Output Quality Check',
    domain: 'ai_ml_evaluation',
    requiredPhase: 'REVIEW',
    minimumRiskLevel: 'R1',
    requiredGuards: ['phase_gate', 'audit_trail'],
    recommendedRole: 'REVIEWER',
    tags: ['ai', 'quality', 'beginner'],
  });

  // Deployment skill (high risk)
  wire.registerSkill({
    skillId: 'deployment',
    skillName: 'Production Deployment',
    domain: 'devops',
    requiredPhase: 'REVIEW',
    minimumRiskLevel: 'R3',
    requiredGuards: ['phase_gate', 'risk_gate', 'authority_gate', 'scope_guard', 'audit_trail'],
    recommendedRole: 'OPERATOR',
    protectedPaths: ['production/', 'deploy/'],
    tags: ['deploy', 'devops', 'critical'],
  });

  return wire;
}
