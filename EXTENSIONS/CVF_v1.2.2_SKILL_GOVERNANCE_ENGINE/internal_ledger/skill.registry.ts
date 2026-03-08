export type SkillExecutionPhase =
  | "INTENT_ANALYSIS"
  | "SKILL_DISCOVERY"
  | "RISK_EVALUATION"
  | "GOVERNANCE_DECISION"
  | "EXECUTION"
  | "LEDGER_RECORD";

export type SkillDependencyStatus = "ready" | "degraded" | "blocked";

export type SkillSource =
  | "ai_research_skills"
  | "awesome_claude_skills"
  | "skills_sh"
  | "acontext_dynamic";

export type SkillDomain = "ai_research" | "application";

export interface RegisteredSkill {
  id: string;
  name: string;
  domain: SkillDomain;
  source: SkillSource;
  maturity: "experimental" | "validated" | "production";
  integrity_hash: string;
  created_at: number;
  last_used_at?: number;
  usage_count: number;
  revoked: boolean;
  deprecated?: boolean;
  successor_skill_id?: string;
  dependency_status?: SkillDependencyStatus;
  allowed_phases?: SkillExecutionPhase[];
}

export class SkillRegistry {
  private skills: Map<string, RegisteredSkill> = new Map();

  register(skill: RegisteredSkill) {
    if (this.skills.has(skill.id)) {
      throw new Error("Skill already registered");
    }
    this.skills.set(skill.id, skill);
  }

  get(skillId: string): RegisteredSkill | undefined {
    return this.skills.get(skillId);
  }

  list(): RegisteredSkill[] {
    return Array.from(this.skills.values());
  }

  markUsed(skillId: string) {
    const skill = this.skills.get(skillId);
    if (!skill) return;
    skill.usage_count += 1;
    skill.last_used_at = Date.now();
  }

  revoke(skillId: string) {
    const skill = this.skills.get(skillId);
    if (!skill) return;
    skill.revoked = true;
  }

  markDeprecated(skillId: string, successorSkillId?: string) {
    const skill = this.skills.get(skillId);
    if (!skill) return;
    skill.deprecated = true;
    if (successorSkillId) {
      skill.successor_skill_id = successorSkillId;
    }
  }

  getSuccessor(skillId: string): RegisteredSkill | undefined {
    const skill = this.skills.get(skillId);
    if (!skill?.successor_skill_id) return undefined;
    return this.skills.get(skill.successor_skill_id);
  }
}
