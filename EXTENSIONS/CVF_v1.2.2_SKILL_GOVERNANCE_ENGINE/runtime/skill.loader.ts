import {
  SkillRegistry,
  RegisteredSkill,
  SkillExecutionPhase,
} from "../internal_ledger/skill.registry";
import { RevocationRegistry } from "../internal_ledger/revocation.registry";

export interface SkillExecutionContext {
  current_phase?: SkillExecutionPhase;
}

export interface SkillMigrationResult {
  skill: RegisteredSkill;
  migrated_from?: string;
  migration_path?: string[];
}

export class SkillLoader {
  constructor(
    private registry: SkillRegistry,
    private revocationRegistry: RevocationRegistry
  ) {}

  load(skillId: string, context?: SkillExecutionContext): RegisteredSkill {
    const skill = this.registry.get(skillId);

    if (!skill) {
      throw new Error("Skill not found");
    }
    this.assertExecutable(skill, skillId, context);
    return skill;
  }

  loadWithMigration(
    skillId: string,
    context?: SkillExecutionContext
  ): SkillMigrationResult {
    const skill = this.registry.get(skillId);

    if (!skill) {
      throw new Error("Skill not found");
    }

    this.assertNotRevoked(skill, skillId);

    if (!skill.deprecated) {
      this.assertDependencyAndPhaseCompatibility(skill, context);
      return { skill };
    }

    const migration = this.resolveMigrationTarget(skillId, context);
    if (!migration) {
      throw new Error("Skill is deprecated");
    }

    return {
      skill: migration.skill,
      migrated_from: skillId,
      migration_path: migration.path,
    };
  }

  private resolveMigrationTarget(
    skillId: string,
    context?: SkillExecutionContext
  ): { skill: RegisteredSkill; path: string[] } | undefined {
    const visited = new Set<string>([skillId]);
    const path: string[] = [];
    let currentSkillId = skillId;

    while (true) {
      const successor = this.registry.getSuccessor(currentSkillId);
      if (!successor) {
        if (path.length === 0) {
          return undefined;
        }
        throw new Error("Successor skill is deprecated");
      }

      if (visited.has(successor.id)) {
        throw new Error("Skill successor migration cycle detected");
      }

      visited.add(successor.id);
      path.push(successor.id);

      if (successor.revoked || this.revocationRegistry.isRevoked(successor.id)) {
        throw new Error("Successor skill is revoked");
      }

      if (!successor.deprecated) {
        this.assertDependencyAndPhaseCompatibility(successor, context);
        return { skill: successor, path };
      }

      currentSkillId = successor.id;
    }
  }

  private assertExecutable(
    skill: RegisteredSkill,
    skillId: string,
    context?: SkillExecutionContext
  ) {
    this.assertNotRevoked(skill, skillId);

    if (skill.deprecated) {
      throw new Error("Skill is deprecated");
    }

    this.assertDependencyAndPhaseCompatibility(skill, context);
  }

  private assertNotRevoked(skill: RegisteredSkill, skillId: string) {
    if (skill.revoked || this.revocationRegistry.isRevoked(skillId)) {
      throw new Error("Skill is revoked");
    }
  }

  private assertDependencyAndPhaseCompatibility(
    skill: RegisteredSkill,
    context?: SkillExecutionContext
  ) {
    if (skill.dependency_status === "blocked") {
      throw new Error("Skill dependencies are blocked");
    }

    if (
      context?.current_phase &&
      skill.allowed_phases &&
      !skill.allowed_phases.includes(context.current_phase)
    ) {
      throw new Error(`Skill is not allowed in phase ${context.current_phase}`);
    }
  }
}
