import { BugType } from "./bug.classifier"

export interface AutonomyDecision {
  allowAutoFix: boolean
  requireEscalation: boolean
  reason?: string
}

export function evaluateAutonomy(
  bugType: BugType,
  riskLevel: string
): AutonomyDecision {

  if (riskLevel === "R3") {
    return {
      allowAutoFix: false,
      requireEscalation: true,
      reason: "High risk tier (R3) requires escalation."
    }
  }

  if (bugType === BugType.SECURITY || bugType === BugType.ARCHITECTURE) {
    return {
      allowAutoFix: false,
      requireEscalation: true,
      reason: "Security or architecture issues require approval."
    }
  }

  if (bugType === BugType.SYNTAX || bugType === BugType.FAILING_TEST) {
    return {
      allowAutoFix: true,
      requireEscalation: false
    }
  }

  if (bugType === BugType.RUNTIME_ERROR || bugType === BugType.LOGIC_FLAW) {
    if (riskLevel === "R0" || riskLevel === "R1") {
      return {
        allowAutoFix: true,
        requireEscalation: false
      }
    }

    return {
      allowAutoFix: false,
      requireEscalation: true,
      reason: "Moderate risk logic/runtime issue requires escalation."
    }
  }

  return {
    allowAutoFix: false,
    requireEscalation: true,
    reason: "Unknown bug type requires escalation."
  }
}