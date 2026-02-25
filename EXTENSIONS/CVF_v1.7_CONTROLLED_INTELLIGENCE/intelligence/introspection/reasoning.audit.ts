// reasoning.audit.ts
// Audit từng reasoning step: gọi policy engine trực tiếp, dùng governance constants.

import { bindPolicy } from "../../core/governance/policy.binding"
import {
  GOVERNANCE_HARD_RISK_THRESHOLD,
  GOVERNANCE_ESCALATION_THRESHOLD
} from "../../core/governance/governance.constants"
import { logGovernanceEvent } from "../../telemetry/governance_audit_log"

export interface ReasoningAuditResult {
  compliant: boolean
  violations?: string[]
}

/**
 * Audit a reasoning step by calling bindPolicy directly.
 * Không nhận policyCompliant từ ngoài — tự kiểm tra qua governance engine.
 */
export function auditReasoning(
  sessionId: string,
  role: string,
  riskScore: number
): ReasoningAuditResult {
  const violations: string[] = []

  const { allowed, escalate, result } = bindPolicy({ sessionId, role, riskScore })

  if (!allowed) {
    const msg = result.reason ?? "Policy denied"
    violations.push(msg)
    logGovernanceEvent(
      escalate ? "AUDIT_ESCALATED" : "AUDIT_BLOCKED",
      `[${sessionId}] ${msg}`
    )
  }

  if (riskScore >= GOVERNANCE_HARD_RISK_THRESHOLD) {
    violations.push(`Risk score ${riskScore} exceeds hard threshold ${GOVERNANCE_HARD_RISK_THRESHOLD}`)
  } else if (riskScore >= GOVERNANCE_ESCALATION_THRESHOLD) {
    violations.push(`Risk score ${riskScore} in escalation zone (>= ${GOVERNANCE_ESCALATION_THRESHOLD})`)
  }

  return {
    compliant: violations.length === 0,
    violations: violations.length > 0 ? violations : undefined
  }
}