// skill.registry.ts
// CVF Skill Registry — links to the 124 skills in base CVF skill library.
// Maps skills by name for lookup, following CVF skill system conventions.

export interface SkillDefinition {
  name: string          // unique identifier matching CVF skill library names
  version: string
  category: string      // maps to CVF skill domains
  description?: string
  cvfPhase?: "A" | "B" | "C" | "D"  // which CVF phase this skill applies to
}

const skillRegistry: Map<string, SkillDefinition> = new Map()

export function registerSkill(skill: SkillDefinition): void {
  skillRegistry.set(skill.name, skill)
}

export function getSkillByName(name: string): SkillDefinition | undefined {
  return skillRegistry.get(name)
}

export function getRegisteredSkills(): SkillDefinition[] {
  return Array.from(skillRegistry.values())
}

export function getSkillsByPhase(phase: "A" | "B" | "C" | "D"): SkillDefinition[] {
  return getRegisteredSkills().filter(s => s.cvfPhase === phase)
}

export function getSkillsByCategory(category: string): SkillDefinition[] {
  return getRegisteredSkills().filter(s => s.category === category)
}