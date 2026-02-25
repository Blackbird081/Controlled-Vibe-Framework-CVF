export type RiskCategory =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"

export interface RiskAssessment {
  score: number
  category: RiskCategory
}