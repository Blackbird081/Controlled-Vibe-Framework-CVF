import { GovernanceContext } from "./governance.types"
import { evaluatePolicy } from "./policy.engine"

export function bindPolicy(context: GovernanceContext) {
  const result = evaluatePolicy(context)

  return {
    allowed: result.decision === "ALLOW",
    escalate: result.decision === "ESCALATE",
    result
  }
}