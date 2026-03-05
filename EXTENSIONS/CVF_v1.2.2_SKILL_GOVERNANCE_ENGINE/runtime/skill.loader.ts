import { SkillRegistry, RegisteredSkill } from "../internal_ledger/skill.registry";
import { RevocationRegistry } from "../internal_ledger/revocation.registry";

export class SkillLoader {
  constructor(
    private registry: SkillRegistry,
    private revocationRegistry: RevocationRegistry
  ) {}

  load(skillId: string): RegisteredSkill {
    const skill = this.registry.get(skillId);

    if (!skill) {
      throw new Error("Skill not found");
    }

    if (skill.revoked || this.revocationRegistry.isRevoked(skillId)) {
      throw new Error("Skill is revoked");
    }

    return skill;
  }
}