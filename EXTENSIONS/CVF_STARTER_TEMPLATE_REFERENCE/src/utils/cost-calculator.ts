// @reference-only — This module is not wired into the main execution pipeline.
// src/utils/cost-calculator.ts

export interface PricingConfig {
  inputPer1K: number;
  outputPer1K: number;
}

export class CostCalculator {
  static calculate(
    promptTokens: number,
    completionTokens: number,
    pricing: PricingConfig
  ): number {
    const inputCost = (promptTokens / 1000) * pricing.inputPer1K;
    const outputCost = (completionTokens / 1000) * pricing.outputPer1K;

    return Number((inputCost + outputCost).toFixed(6));
  }
}
