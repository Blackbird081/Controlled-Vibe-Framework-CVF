import { AgentRole } from "./role.types"

const allowedTransitions: Record<AgentRole, AgentRole[]> = {
  PLAN: ["RESEARCH", "DESIGN"],
  RESEARCH: ["PLAN", "DESIGN"],
  DESIGN: ["BUILD"],
  BUILD: ["TEST", "DEBUG"],
  TEST: ["REVIEW", "DEBUG"],
  DEBUG: ["BUILD", "TEST"],
  REVIEW: ["PLAN"],
  RISK: ["PLAN"]
} as any

export function validateTransition(
  from: AgentRole,
  to: AgentRole
): boolean {

  return allowedTransitions[from]?.includes(to) ?? false
}