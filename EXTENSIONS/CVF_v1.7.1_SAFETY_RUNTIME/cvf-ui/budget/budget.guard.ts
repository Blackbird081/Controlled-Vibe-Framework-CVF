import { BudgetEngine } from "./budget.engine"
import { BudgetCheckInput } from "./budget.types"

const engine = new BudgetEngine()

export async function enforceBudget(input: BudgetCheckInput) {
  const result = await engine.evaluate(input)

  if (!result.allowed) {
    throw new Error(`Budget blocked: ${result.reason}`)
  }

  return true
}
