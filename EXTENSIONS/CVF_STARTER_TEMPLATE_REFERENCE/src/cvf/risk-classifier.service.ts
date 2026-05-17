// src/cvf/risk-classifier.service.ts

import { ExecutionContext, RiskLevel } from "../core/execution-context";

export interface RiskClassificationInput {
  prompt: string;
  workflowName: string;
}

export class RiskClassifierService {
  classify(
    context: ExecutionContext,
    input: RiskClassificationInput
  ): RiskLevel {
    const { prompt } = input;

    // Rule 1: financial / pricing / decision keywords
    const highRiskKeywords = [
      "price",
      "valuation",
      "financial decision",
      "investment",
      "forecast",
      "approve",
      "compliance",
      "contract",
    ];

    const mediumRiskKeywords = [
      "analysis",
      "report",
      "summary",
      "recommendation",
    ];

    const normalizedPrompt = prompt.toLowerCase();

    if (
      highRiskKeywords.some((kw) => normalizedPrompt.includes(kw))
    ) {
      context.setRiskLevel("HIGH");
      return "HIGH";
    }

    if (
      mediumRiskKeywords.some((kw) => normalizedPrompt.includes(kw))
    ) {
      context.setRiskLevel("MEDIUM");
      return "MEDIUM";
    }

    context.setRiskLevel("LOW");
    return "LOW";
  }
}
