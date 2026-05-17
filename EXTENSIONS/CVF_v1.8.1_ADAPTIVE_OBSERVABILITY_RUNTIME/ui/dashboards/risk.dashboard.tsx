// ui/dashboards/risk.dashboard.tsx

import React from "react"
import { getAllMetrics } from "../../storage/metrics.store"
import { detectRegression } from "../../observability/regression.detector"

export function detectAnyRegressionForMetrics(
  metrics: Array<{ skillId: string }>
): boolean {
  const uniqueSkillIds = Array.from(new Set(metrics.map(m => m.skillId)))
  return uniqueSkillIds.some(skillId => detectRegression(skillId))
}

export const RiskDashboard = () => {
  const metrics = getAllMetrics()

  const totalRuns = metrics.length

  const satisfactionStats = metrics.reduce(
    (acc, m) => {
      if (m.satisfaction === "satisfied") acc.satisfied++
      if (m.satisfaction === "correction") acc.correction++
      if (m.satisfaction === "followup") acc.followup++
      return acc
    },
    { satisfied: 0, correction: 0, followup: 0 }
  )

  const correctionRate =
    totalRuns === 0
      ? 0
      : (satisfactionStats.correction / totalRuns) * 100

  const regressionDetected =
    totalRuns > 0
      ? detectAnyRegressionForMetrics(metrics)
      : false

  return (
    <div>
      <h2>Risk Monitor</h2>

      <p>Total Runs: {totalRuns}</p>

      <h3>Satisfaction</h3>
      <p>Satisfied: {satisfactionStats.satisfied}</p>
      <p>Corrections: {satisfactionStats.correction}</p>
      <p>Follow-ups: {satisfactionStats.followup}</p>
      <p>Correction Rate: {correctionRate.toFixed(2)}%</p>

      <h3>Regression</h3>
      <p>
        {regressionDetected
          ? "⚠️ Regression Detected"
          : "No Regression Detected"}
      </p>
    </div>
  )
}
