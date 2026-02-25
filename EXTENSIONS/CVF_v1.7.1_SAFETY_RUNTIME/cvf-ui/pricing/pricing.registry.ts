export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
}

const pricingTable: Record<string, ModelPricing> = {
  "gpt-4o": { inputPer1k: 0.005, outputPer1k: 0.015 },
  "gpt-4-turbo": { inputPer1k: 0.01, outputPer1k: 0.03 },
  "claude-3-opus": { inputPer1k: 0.015, outputPer1k: 0.075 },
};

export function calculateUsdCost(
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  const pricing = pricingTable[model];

  if (!pricing) {
    throw new Error(`Unknown model pricing: ${model}`);
  }

  const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputPer1k;

  return inputCost + outputCost;
}