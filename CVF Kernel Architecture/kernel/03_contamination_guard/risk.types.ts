export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"

export interface RiskAssessment {
  level: RiskLevel
  score: number
  reasons: string[]
}