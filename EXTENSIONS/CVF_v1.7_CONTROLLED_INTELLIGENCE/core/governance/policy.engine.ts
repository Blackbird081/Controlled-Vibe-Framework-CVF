import {
  GovernanceContext,
  GovernanceResult
} from "./governance.types"

import {
  GOVERNANCE_HARD_RISK_THRESHOLD,
  GOVERNANCE_ESCALATION_THRESHOLD
} from "./governance.constants"

export function evaluatePolicy(
  context: GovernanceContext
): GovernanceResult {

  const { riskScore } = context

  if (riskScore >= GOVERNANCE_HARD_RISK_THRESHOLD) {
    return {
      decision: "BLOCK",
      reason: "Risk exceeds hard threshold",
      timestamp: Date.now()
    }
  }

  if (riskScore >= GOVERNANCE_ESCALATION_THRESHOLD) {
    return {
      decision: "ESCALATE",
      reason: "Risk requires escalation",
      timestamp: Date.now()
    }
  }

  return {
    decision: "ALLOW",
    timestamp: Date.now()
  }
}