export type GovernanceDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"

export interface GovernanceContext {
  sessionId: string
  role: string
  riskScore: number
  metadata?: Record<string, unknown>
}

export interface GovernanceResult {
  decision: GovernanceDecision
  reason?: string
  timestamp: number
}