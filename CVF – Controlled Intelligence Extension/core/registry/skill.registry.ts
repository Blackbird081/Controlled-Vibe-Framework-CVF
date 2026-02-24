export interface SkillDefinition {
  name: string
  version: string
  description?: string
}

const skillRegistry: SkillDefinition[] = []

export function registerSkill(skill: SkillDefinition): void {
  skillRegistry.push(skill)
}

export function getRegisteredSkills(): SkillDefinition[] {
  return skillRegistry
}