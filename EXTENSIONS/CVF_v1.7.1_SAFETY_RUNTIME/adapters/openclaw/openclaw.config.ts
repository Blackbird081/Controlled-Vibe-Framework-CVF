export interface OpenClawConfig {
  enabled: boolean
  provider: string
  maxTokensPerRequest: number
  maxTokensPerDay: number
  monthlyBudgetLimit: number
  allowToolExecution: boolean
  requireHumanApproval: boolean
}

export const defaultOpenClawConfig: OpenClawConfig = {
  enabled: false,
  provider: "openai",
  maxTokensPerRequest: 4000,
  maxTokensPerDay: 100000,
  monthlyBudgetLimit: 0,
  allowToolExecution: false,
  requireHumanApproval: true,
}
