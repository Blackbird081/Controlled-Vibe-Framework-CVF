import { AgentRole, AllowedTransitions } from "./role.graph"

export interface TransitionDecision {
  allowed: boolean
  reason?: string
}

export function evaluateTransition(
  currentRole: AgentRole,
  nextRole: AgentRole
): TransitionDecision {

  const allowed = AllowedTransitions[currentRole] || []

  if (!allowed.includes(nextRole)) {
    return {
      allowed: false,
      reason: `Transition from ${currentRole} to ${nextRole} is not allowed.`
    }
  }

  return { allowed: true }
}