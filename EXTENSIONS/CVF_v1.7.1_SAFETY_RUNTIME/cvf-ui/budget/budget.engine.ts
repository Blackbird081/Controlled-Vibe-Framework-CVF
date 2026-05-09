import { BudgetCheckInput, BudgetCheckResult } from "./budget.types"
import { defaultBudgetPolicies } from "./budget.policy"
import { getUserDailyUsage, getOrgMonthlyUsage } from "./quota.registry"

export class BudgetEngine {
  async evaluate(input: BudgetCheckInput): Promise<BudgetCheckResult> {
    const policies = defaultBudgetPolicies

    for (const policy of policies) {
      if (policy.scope === "EXECUTION") {
        if (input.estimatedCostUsd > policy.hardLimitUsd) {
          return {
            allowed: false,
            reason: "Execution cost exceeds hard limit",
          }
        }

        if (policy.maxTokens && input.estimatedTokens > policy.maxTokens) {
          return {
            allowed: false,
            reason: "Execution token limit exceeded",
          }
        }
      }

      if (policy.scope === "USER_DAILY") {
        const usage = await getUserDailyUsage(input.userId)
        if (usage + input.estimatedTokens > policy.hardLimitUsd * 100000) {
          return {
            allowed: false,
            reason: "User daily quota exceeded",
          }
        }
      }

      if (policy.scope === "ORG_MONTHLY") {
        const usage = await getOrgMonthlyUsage()
        if (usage + input.estimatedTokens > policy.hardLimitUsd * 100000) {
          return {
            allowed: false,
            reason: "Organization monthly budget exceeded",
          }
        }
      }
    }

    return { allowed: true }
  }
}
