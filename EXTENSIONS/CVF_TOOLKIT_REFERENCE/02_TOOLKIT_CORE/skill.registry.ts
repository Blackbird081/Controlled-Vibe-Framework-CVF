// skill.registry.ts
// CVF Toolkit Core - Skill Registry
// Governs business-level capabilities independent from AI model providers.

import { RiskLevel, SkillDefinition } from "./interfaces"
import { SkillViolationError } from "./errors"

class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map()

  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.id)) {
      throw new SkillViolationError(`Skill already registered: ${skill.id}`)
    }

    this.skills.set(skill.id, skill)
  }

  update(skillId: string, update: Partial<SkillDefinition>): void {
    const existing = this.skills.get(skillId)
    if (!existing) {
      throw new SkillViolationError(`Skill not found: ${skillId}`)
    }

    const updated: SkillDefinition = {
      ...existing,
      ...update
    }

    this.skills.set(skillId, updated)
  }

  deactivate(skillId: string): void {
    const skill = this.get(skillId)
    skill.active = false
  }

  get(skillId: string): SkillDefinition {
    const skill = this.skills.get(skillId)
    if (!skill) {
      throw new SkillViolationError(`Skill not found: ${skillId}`)
    }

    if (skill.active === false) {
      throw new SkillViolationError(`Skill is deactivated: ${skillId}`)
    }

    return skill
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }

  exists(skillId: string): boolean {
    return this.skills.has(skillId)
  }
}

export const skillRegistry = new SkillRegistry()
