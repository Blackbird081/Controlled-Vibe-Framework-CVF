import { RiskAssessment } from "./risk.types"
import { mapScoreToCategory } from "./severity.matrix"

export function calculateRisk(
  baseScore: number,
  complexityFactor: number = 1
): RiskAssessment {

  const score = Math.min(baseScore * complexityFactor, 1)

  return {
    score,
    category: mapScoreToCategory(score)
  }
}