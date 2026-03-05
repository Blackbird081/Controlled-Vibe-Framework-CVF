// ui/dashboards/cost.dashboard.tsx

import React from "react"
import { getAllMetrics } from "../../storage/metrics.store"

const TOKEN_PRICE = 0.000002 // example

export const CostDashboard = () => {
  const metrics = getAllMetrics()

  const totalTokens = metrics.reduce(
    (sum, m) => sum + m.tokensUsed,
    0
  )

  const estimatedCost = totalTokens * TOKEN_PRICE

  return (
    <div>
      <h2>Cost Overview</h2>
      <p>Total Tokens Used: {totalTokens}</p>
      <p>Estimated Cost: ${estimatedCost.toFixed(4)}</p>
    </div>
  )
}