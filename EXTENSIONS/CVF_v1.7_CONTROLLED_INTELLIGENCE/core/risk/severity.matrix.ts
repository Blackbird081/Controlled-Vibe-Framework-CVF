import { RiskCategory } from "./risk.types"

export function mapScoreToCategory(score: number): RiskCategory {
  if (score >= 0.85) return "CRITICAL"
  if (score >= 0.7) return "HIGH"
  if (score >= 0.4) return "MEDIUM"
  return "LOW"
}