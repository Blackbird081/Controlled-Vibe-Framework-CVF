/**
 * cost.binding.ts
 *
 * Bridge layer giữa DevAutomation skill và
 * Governance Cost + Budget system.
 *
 * Không chứa business logic AI.
 * Không chứa execution logic.
 * Chỉ binding estimation + budget enforcement.
 */

import { calculateUsdCost } from "@/governance/pricing/pricing.registry";
import { enforceBudget } from "@/governance/budget";
import type { BudgetCheckInput } from "@/governance/budget";

/**
 * Token usage contract (provider-agnostic)
 */
export interface TokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Cost evaluation result
 */
export interface CostEvaluationResult {
  estimatedUsd: number;
  totalTokens: number;
}

/**
 * 1️⃣ Estimate USD cost using provider-aware pricing registry
 */
export function estimateDevAutomationCost(
  usage: TokenUsage
): CostEvaluationResult {
  const { model, inputTokens, outputTokens } = usage;

  const estimatedUsd = calculateUsdCost(
    model,
    inputTokens,
    outputTokens
  );

  return {
    estimatedUsd,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * 2️⃣ Enforce budget before execution
 *
 * Must be called AFTER:
 * - Risk evaluation
 * - Cost estimation
 *
 * Must be called BEFORE:
 * - Approval
 * - Execution boundary
 */
export async function enforceDevAutomationBudget(params: {
  userId: string;
  role: string;
  usage: TokenUsage;
  sessionId?: string;
}) {
  const { userId, role, usage, sessionId } = params;

  const { estimatedUsd, totalTokens } =
    estimateDevAutomationCost(usage);

  const budgetInput: BudgetCheckInput = {
    userId,
    role,
    estimatedCostUsd: estimatedUsd,
    estimatedTokens: totalTokens,
    sessionId,
  };

  await enforceBudget(budgetInput);

  return {
    allowed: true,
    estimatedUsd,
    totalTokens,
  };
}