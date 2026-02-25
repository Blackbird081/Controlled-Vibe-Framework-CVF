// binding.registry.ts
// Connects CVF skills to AgentRoles via CVF phase mapping.
// Uses role.mapping.ts to determine which skills are available per role.

import { AgentRole } from "../../intelligence/role_transition_guard/role.types"
import { getPhaseForRole, CVFPhase } from "../governance/role.mapping"
import { getSkillsByPhase, SkillDefinition } from "./skill.registry"

export interface SkillBinding {
  skillName: string
  role: AgentRole
  phase: CVFPhase
}

/**
 * Get all skills bound to a given agent role,
 * based on which CVF phase the role maps to.
 */
export function getSkillsForRole(role: AgentRole): SkillDefinition[] {
  const phase = getPhaseForRole(role)
  if (!phase) return []
  return getSkillsByPhase(phase)
}

/**
 * Get all skill bindings for a given role — returns binding metadata.
 */
export function getBindingsForRole(role: AgentRole): SkillBinding[] {
  const phase = getPhaseForRole(role)
  if (!phase) return []

  return getSkillsByPhase(phase).map(skill => ({
    skillName: skill.name,
    role,
    phase
  }))
}

/**
 * Check if a specific skill is available for a given role.
 */
export function isSkillAvailableForRole(skillName: string, role: AgentRole): boolean {
  const skills = getSkillsForRole(role)
  return skills.some(s => s.name === skillName)
}