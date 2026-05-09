// self.check.ts
// Kiểm tra tính hợp lệ của session state + reasoning steps trước khi reasoning.

import { AgentRole } from "../role_transition_guard/role.graph"
import {
  GOVERNANCE_HARD_RISK_THRESHOLD,
  GOVERNANCE_ESCALATION_THRESHOLD
} from "../../core/governance/governance.constants"

export interface SelfCheckResult {
  valid: boolean
  warnings: string[]
  blockers: string[]
}

/**
 * Validate session state: sessionId, role, riskScore, entropyScore.
 * Phải pass trước khi reasoning được invoke.
 */
export function runSelfCheck(
  sessionId: string,
  role: AgentRole,
  riskScore: number,
  entropyScore: number
): SelfCheckResult {
  const warnings: string[] = []
  const blockers: string[] = []

  if (!sessionId || sessionId.trim() === "") {
    blockers.push("Session ID is empty")
  }

  if (!Object.values(AgentRole).includes(role)) {
    blockers.push(`Unknown role: ${role}`)
  }

  if (riskScore < 0 || riskScore > 1) {
    blockers.push(`riskScore out of range [0,1]: ${riskScore}`)
  } else if (riskScore >= GOVERNANCE_HARD_RISK_THRESHOLD) {
    blockers.push(`riskScore ${riskScore} exceeds hard threshold`)
  } else if (riskScore >= GOVERNANCE_ESCALATION_THRESHOLD) {
    warnings.push(`riskScore ${riskScore} in escalation zone`)
  }

  if (entropyScore < 0) {
    blockers.push(`entropyScore cannot be negative: ${entropyScore}`)
  } else if (entropyScore > 0.35) {
    warnings.push(`High entropy: ${entropyScore}`)
  }

  return {
    valid: blockers.length === 0,
    warnings,
    blockers
  }
}

/**
 * Check reasoning steps for duplicate/loop patterns (original logic preserved).
 */
export function checkReasoningConsistency(
  reasoningSteps: string[]
): { consistent: boolean; issues?: string[] } {
  const issues: string[] = []

  for (let i = 1; i < reasoningSteps.length; i++) {
    if (reasoningSteps[i] === reasoningSteps[i - 1]) {
      issues.push(`Duplicate reasoning step at index ${i}`)
    }
  }

  return {
    consistent: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined
  }
}