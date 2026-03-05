// ui/dashboards/skill.analytics.dashboard.tsx

import React from "react"
import { getAllMetrics } from "../../storage/metrics.store"

export const SkillAnalyticsDashboard = () => {
  const metrics = getAllMetrics()

  const totalRuns = metrics.length

  const totalTokens = metrics.reduce(
    (sum, m) => sum + m.tokensUsed,
    0
  )

  const avgDuration =
    totalRuns === 0
      ? 0
      : metrics.reduce((s, m) => s + m.durationMs, 0) / totalRuns

  return (
    <div>
      <h2>Skill Analytics</h2>
      <p>Total Runs: {totalRuns}</p>
      <p>Total Tokens: {totalTokens}</p>
      <p>Average Duration (ms): {avgDuration.toFixed(2)}</p>
    </div>
  )
}