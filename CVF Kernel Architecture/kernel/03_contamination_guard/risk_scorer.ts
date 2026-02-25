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

export class RiskScorer {

  private matrix = {
    medical: 80,
    legal: 75,
    financial: 70,
    self_harm: 95,
    weapons: 95
  }

  scoreText(text: string): RiskAssessment {

    const lower = text.toLowerCase()
    const flags: string[] = []

    if (lower.includes("suicide")) flags.push("self_harm")
    if (lower.includes("lawsuit")) flags.push("legal")
    if (lower.includes("invest")) flags.push("financial")
    if (lower.includes("medicine")) flags.push("medical")

    if (flags.length === 0)
      return { level: "low", score: 0, reasons: [] }

    const total = flags.reduce(
      (sum, f) => sum + (this.matrix[f as keyof typeof this.matrix] || 0),
      0
    )

    const avg = total / flags.length

    if (avg >= 90) return { level: "critical", score: avg, reasons: flags }
    if (avg >= 75) return { level: "high", score: avg, reasons: flags }
    if (avg >= 50) return { level: "medium", score: avg, reasons: flags }

    return { level: "low", score: avg, reasons: flags }
  }
}