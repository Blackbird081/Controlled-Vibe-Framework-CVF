export interface CVFExecutionResult {
  status: "approved" | "rejected" | "pending"
  reason?: string
  executionId?: string
  data?: any
}

export interface CVFProposalEnvelope {
  id: string
  source: "openclaw"
  action: string
  payload: Record<string, any>
  createdAt: number
  confidence: number
  riskLevel: "low" | "medium" | "high"
}
