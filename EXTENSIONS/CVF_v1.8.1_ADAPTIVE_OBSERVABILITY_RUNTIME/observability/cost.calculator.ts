export interface ModelPricing {
  inputPer1K: number
  outputPer1K: number
}

const pricingTable: Record<string, ModelPricing> = {
  "claude-3.5": { inputPer1K: 0.003, outputPer1K: 0.015 }
}

export function calculateCost(model: string, tokens: number): number {
  const pricing = pricingTable[model]
  if (!pricing) return 0

  const costPerToken = pricing.inputPer1K / 1000
  return tokens * costPerToken
}