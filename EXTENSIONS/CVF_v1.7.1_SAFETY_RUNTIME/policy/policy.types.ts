export type PolicyDecision =
  | "approved"
  | "rejected"
  | "pending"

export interface PolicyRule {
  id: string
  description: string
  evaluate(proposal: any): PolicyDecision | null
}

export interface PolicyDefinition {
  version: string
  createdAt: number
  rules: PolicyRule[]
  hash: string
}