// governance/skill.risk.score.ts

import { getMetricsBySkill } from "../storage/metrics.store"
import { getAuditLogs } from "../storage/audit.store"
import { detectRegression } from "../observability/regression.detector"

export interface SkillRiskResult {
  skillId: string
  score: number
  breakdown: {
    correctionRate: number
    regression: boolean
    securityIncidents: number
    tokenSpike: boolean
  }
}

export function calculateSkillRisk(skillId: string): SkillRiskResult {
  const metrics = getMetricsBySkill(skillId)

  if (metrics.length === 0) {
    return {
      skillId,
      score: 0,
      breakdown: {
        correctionRate: 0,
        regression: false,
        securityIncidents: 0,
        tokenSpike: false,
      },
    }
  }

  // ---------- Correction Rate ----------
  const correctionCount = metrics.filter(
    m => m.satisfaction === "correction"
  ).length

  const correctionRate = correctionCount / metrics.length

  // ---------- Regression ----------
  const regression = detectRegression(skillId)

  // ---------- Security Incidents ----------
  const auditLogs = getAuditLogs()
  const securityIncidents = auditLogs.length

  // ---------- Token Spike ----------
  const avgTokens =
    metrics.reduce((sum, m) => sum + m.tokensUsed, 0) / metrics.length

  const recent = metrics.slice(-5)
  const recentAvg =
    recent.reduce((sum, m) => sum + m.tokensUsed, 0) /
    (recent.length || 1)

  const tokenSpike = recentAvg > avgTokens * 1.3

  // ---------- Risk Scoring Logic ----------
  let score = 0

  score += correctionRate * 40        // max 40
  if (regression) score += 25         // +25
  score += Math.min(securityIncidents * 5, 20) // max 20
  if (tokenSpike) score += 15         // +15

  score = Math.min(Math.round(score), 100)

  return {
    skillId,
    score,
    breakdown: {
      correctionRate,
      regression,
      securityIncidents,
      tokenSpike,
    },
  }
}