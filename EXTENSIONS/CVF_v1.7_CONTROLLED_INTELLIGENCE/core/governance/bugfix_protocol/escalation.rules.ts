import { AutonomyDecision } from "./autonomy.matrix"
import { FixScopeDecision } from "./fix.scope.guard"

export interface EscalationResult {
  escalate: boolean
  reasons?: string[]
}

export function evaluateEscalation(
  autonomy: AutonomyDecision,
  scope: FixScopeDecision
): EscalationResult {

  const reasons: string[] = []

  if (autonomy.requireEscalation) {
    reasons.push(autonomy.reason || "Autonomy rule requires escalation.")
  }

  if (!scope.allowed) {
    reasons.push(...(scope.reasons || []))
  }

  return {
    escalate: reasons.length > 0,
    reasons: reasons.length > 0 ? reasons : undefined
  }
}