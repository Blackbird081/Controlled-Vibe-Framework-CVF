"use client"

interface Props {
  estimatedCost?: number
}

export default function CostEstimator({ estimatedCost }: Props) {
  if (!estimatedCost) return null

  return (
    <div>
      <strong>Estimated Cost:</strong> ${estimatedCost.toFixed(4)}
    </div>
  )
}
