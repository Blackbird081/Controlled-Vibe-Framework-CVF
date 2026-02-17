// src/config/model.config.ts

export interface ApprovedModelConfig {
  provider: string;
  model: string;
  maxRisk: "LOW" | "MEDIUM" | "HIGH";
}

export const approvedModels: ApprovedModelConfig[] = [
  {
    provider: "openai",
    model: "gpt-4o",
    maxRisk: "HIGH",
  },
  {
    provider: "openai",
    model: "gpt-4.1",
    maxRisk: "HIGH",
  },
  {
    provider: "claude",
    model: "claude-3-5-sonnet",
    maxRisk: "HIGH",
  },
  {
    provider: "claude",
    model: "claude-3-haiku",
    maxRisk: "MEDIUM",
  },
  {
    provider: "gemini",
    model: "gemini-1.5-pro",
    maxRisk: "HIGH",
  },
  {
    provider: "gemini",
    model: "gemini-1.5-flash",
    maxRisk: "MEDIUM",
  },
];
