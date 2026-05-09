import { CVFRiskLevel, RiskAssessment, RiskLevel } from "./risk.types"
import { DefaultRiskMatrix } from "./risk.matrix"

export class RiskScorer {
  private matrix = DefaultRiskMatrix

  scoreText(text: string): RiskAssessment {
    const lower = text.toLowerCase()
    const flags: string[] = []

    if (lower.includes("suicide") || lower.includes("kill myself"))
      flags.push("self_harm")
    if (lower.includes("lawsuit") || lower.includes("legal advice")) flags.push("legal")
    if (lower.includes("invest") || lower.includes("trading strategy"))
      flags.push("financial")
    if (lower.includes("medicine") || lower.includes("treatment")) flags.push("medical")

    return this.score(flags)
  }

  score(flags: string[]): RiskAssessment {
    if (flags.length === 0)
      return {
        level: "low",
        cvfRiskLevel: "R0",
        score: 0,
        reasons: [],
      }

    const total = flags.reduce(
      (sum, f) => sum + (this.matrix[f as keyof typeof this.matrix] || 0),
      0
    )

    const avg = total / flags.length

    const level = this.mapRiskLevel(avg)
    const cvfRiskLevel = this.mapCVFRiskLevel(avg)

    return { level, cvfRiskLevel, score: avg, reasons: flags }
  }

  private mapRiskLevel(score: number): RiskLevel {
    if (score >= 90) return "critical"
    if (score >= 75) return "high"
    if (score >= 50) return "medium"
    return "low"
  }

  private mapCVFRiskLevel(score: number): CVFRiskLevel {
    if (score >= 95) return "R4"
    if (score >= 90) return "R3"
    if (score >= 75) return "R3"
    if (score >= 50) return "R2"
    if (score > 0) return "R1"
    return "R0"
  }
}
