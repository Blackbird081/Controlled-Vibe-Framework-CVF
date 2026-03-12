/**
 * CVF Skill Registry
 * ===================
 * Defines skill metadata with phase/risk requirements.
 * Guards use this to block skills that violate current session constraints.
 *
 * @module cvf-guard-contract/runtime/skill-registry
 */

import type { CVFPhase, CVFRiskLevel } from '../types';

// ─── Skill Definition ─────────────────────────────────────────────────

export interface SkillDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  /** Phase where this skill is allowed to run. If undefined, allowed in any phase. */
  requiredPhase?: CVFPhase;
  /** Minimum risk level this skill introduces. Guards escalate/block if session risk is lower. */
  riskLevel: CVFRiskLevel;
  /** Tags for categorization */
  tags?: string[];
}

// ─── Skill Registry ───────────────────────────────────────────────────

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.id)) {
      throw new Error(`Skill "${skill.id}" is already registered.`);
    }
    this.skills.set(skill.id, skill);
  }

  get(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getByDomain(domain: string): SkillDefinition[] {
    return this.getAll().filter((s) => s.domain === domain);
  }

  getByPhase(phase: CVFPhase): SkillDefinition[] {
    return this.getAll().filter((s) => !s.requiredPhase || s.requiredPhase === phase);
  }

  getCount(): number {
    return this.skills.size;
  }

  /**
   * Validate that a skill can run in the current session context.
   * Returns { allowed, reason } indicating whether the skill is compatible.
   */
  validateSkillForContext(
    skillId: string,
    currentPhase: CVFPhase,
    currentRisk: CVFRiskLevel,
  ): { allowed: boolean; reason: string } {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { allowed: false, reason: `Skill "${skillId}" not found in registry.` };
    }

    if (skill.requiredPhase && skill.requiredPhase !== currentPhase) {
      return {
        allowed: false,
        reason: `Skill "${skill.name}" requires phase ${skill.requiredPhase} but current phase is ${currentPhase}.`,
      };
    }

    const riskOrder = ['R0', 'R1', 'R2', 'R3'] as const;
    const skillRiskIdx = riskOrder.indexOf(skill.riskLevel);
    const sessionRiskIdx = riskOrder.indexOf(currentRisk);

    if (skillRiskIdx > sessionRiskIdx) {
      return {
        allowed: false,
        reason: `Skill "${skill.name}" has risk ${skill.riskLevel} but session risk is ${currentRisk}. Escalation required.`,
      };
    }

    return { allowed: true, reason: 'Skill is compatible with current context.' };
  }
}

// ─── Sample Skills (CVF Core) ─────────────────────────────────────────

/**
 * Creates a SkillRegistry pre-loaded with representative CVF skills.
 * These map to the 12 domains mentioned in the assessment.
 */
export function createDefaultSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry();

  // Domain: Code Generation (BUILD only)
  registry.register({
    id: 'code_gen_component',
    name: 'Generate Component',
    domain: 'code_generation',
    description: 'Generate a new code component from spec',
    requiredPhase: 'BUILD',
    riskLevel: 'R1',
  });

  registry.register({
    id: 'code_gen_test',
    name: 'Generate Tests',
    domain: 'code_generation',
    description: 'Generate test cases for a module',
    requiredPhase: 'BUILD',
    riskLevel: 'R0',
  });

  // Domain: Analysis (any phase)
  registry.register({
    id: 'analysis_code_review',
    name: 'Code Review Analysis',
    domain: 'analysis',
    description: 'Analyze code for quality, security, and patterns',
    riskLevel: 'R0',
  });

  registry.register({
    id: 'analysis_architecture',
    name: 'Architecture Analysis',
    domain: 'analysis',
    description: 'Analyze system architecture and dependencies',
    requiredPhase: 'DESIGN',
    riskLevel: 'R0',
  });

  // Domain: Deployment (R2+, BUILD/REVIEW only)
  registry.register({
    id: 'deploy_staging',
    name: 'Deploy to Staging',
    domain: 'deployment',
    description: 'Deploy application to staging environment',
    requiredPhase: 'REVIEW',
    riskLevel: 'R2',
  });

  registry.register({
    id: 'deploy_production',
    name: 'Deploy to Production',
    domain: 'deployment',
    description: 'Deploy application to production environment',
    requiredPhase: 'REVIEW',
    riskLevel: 'R3',
  });

  // Domain: Documentation (any phase, low risk)
  registry.register({
    id: 'docs_generate',
    name: 'Generate Documentation',
    domain: 'documentation',
    description: 'Auto-generate documentation from code',
    riskLevel: 'R0',
  });

  // Domain: Refactoring (BUILD, medium risk)
  registry.register({
    id: 'refactor_extract',
    name: 'Extract Function/Module',
    domain: 'refactoring',
    description: 'Extract code into separate function or module',
    requiredPhase: 'BUILD',
    riskLevel: 'R1',
  });

  // Domain: Data Operations (varies)
  registry.register({
    id: 'data_migration',
    name: 'Database Migration',
    domain: 'data',
    description: 'Run database migration scripts',
    requiredPhase: 'BUILD',
    riskLevel: 'R3',
  });

  registry.register({
    id: 'data_seed',
    name: 'Seed Test Data',
    domain: 'data',
    description: 'Populate database with test data',
    requiredPhase: 'BUILD',
    riskLevel: 'R1',
  });

  return registry;
}
