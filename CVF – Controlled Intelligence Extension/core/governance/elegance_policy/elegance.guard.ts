import { EleganceScoreResult } from "./elegance.scorer"
import { RefactorThresholds, DefaultRefactorThresholds } from "./refactor.thresholds"

export interface EleganceGuardDecision {
  requireRefactor: boolean
  blockedByRisk: boolean
  reasons?: string[]
}

export function evaluateEleganceGuard(
  scoreResult: EleganceScoreResult,
  currentRiskLevel: string,
  thresholds: RefactorThresholds = DefaultRefactorThresholds
): EleganceGuardDecision {

  const reasons: string[] = []

  if (!thresholds.riskLevelAllowed.includes(currentRiskLevel)) {
    return {
      requireRefactor: false,
      blockedByRisk: true,
      reasons: ["Risk level does not allow elegance refactor."]
    }
  }

  if (scoreResult.complexityGrowth > thresholds.maxComplexityGrowthPercent) {
    reasons.push("Complexity growth exceeds threshold.")
  }

  if (scoreResult.locGrowth > thresholds.maxLocGrowthPercent) {
    reasons.push("LOC growth exceeds threshold.")
  }

  if (scoreResult.dependencyIncrease > thresholds.maxDependencyIncrease) {
    reasons.push("Dependency increase exceeds threshold.")
  }

  return {
    requireRefactor: reasons.length > 0,
    blockedByRisk: false,
    reasons: reasons.length > 0 ? reasons : undefined
  }
}