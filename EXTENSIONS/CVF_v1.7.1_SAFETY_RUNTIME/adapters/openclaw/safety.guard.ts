import { CVFProposalEnvelope } from "./types/contract.types"
import { defaultOpenClawConfig } from "./openclaw.config"

interface GuardResult {
  allowed: boolean
  escalatedRisk?: "medium" | "high"
  reason?: string
}

interface ProviderBudget {
  tokensUsed: number
  dailyLimit: number
}

let tokenUsage = 0
const providerBudgets: Record<string, ProviderBudget> = {}

export function registerProviderBudget(
  providerName: string,
  dailyLimit: number
) {
  providerBudgets[providerName] = {
    tokensUsed: 0,
    dailyLimit
  }
}

export function registerTokenUsage(
  providerName: string,
  tokens: number
) {
  // Update global token usage
  tokenUsage += tokens

  // Update per-provider budget if registered
  if (providerBudgets[providerName]) {
    providerBudgets[providerName].tokensUsed += tokens
  }
}

export function resetTokenUsage() {
  tokenUsage = 0
  for (const budget of Object.values(providerBudgets)) {
    budget.tokensUsed = 0
  }
}

export function guardBudget(providerName: string): boolean {
  const budget = providerBudgets[providerName]
  if (!budget) return true
  return budget.tokensUsed < budget.dailyLimit
}

export function guardProposal(
  proposal: CVFProposalEnvelope
): GuardResult {

  // 1️⃣ Budget control
  if (tokenUsage > defaultOpenClawConfig.maxTokensPerDay) {
    return {
      allowed: false,
      reason: "Daily AI token budget exceeded"
    }
  }

  // 2️⃣ Confidence too low → escalate risk
  if (proposal.confidence < 0.4) {
    return {
      allowed: true,
      escalatedRisk: "high",
      reason: "Low AI confidence"
    }
  }

  // 3️⃣ Dangerous actions blacklist
  const blockedActions = [
    "delete_database",
    "shutdown_system",
    "transfer_funds"
  ]

  if (blockedActions.includes(proposal.action)) {
    return {
      allowed: false,
      reason: "Blocked high-risk action"
    }
  }

  return { allowed: true }
}
