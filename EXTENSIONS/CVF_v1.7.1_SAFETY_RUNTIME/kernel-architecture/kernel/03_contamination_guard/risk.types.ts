export type RiskLevel = "low" | "medium" | "high" | "critical"

export type CVFRiskLevel = "R0" | "R1" | "R2" | "R3" | "R4"

export interface RiskAssessment {
  level: RiskLevel
  cvfRiskLevel: CVFRiskLevel
  score: number
  reasons: string[]
  driftDetected?: boolean
  assumptions?: string[]
}

export interface DriftSignal {
  detected: boolean
  reasons: string[]
}
