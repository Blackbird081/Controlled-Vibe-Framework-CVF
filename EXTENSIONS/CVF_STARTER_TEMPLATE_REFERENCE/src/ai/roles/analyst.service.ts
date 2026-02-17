// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/roles/analyst.service.ts

import { AIRole, AIRoleConfig } from "../ai.interface";

export class AnalystService implements AIRole {
  constructor(private readonly config: AIRoleConfig) {}

  async execute(prompt: string): Promise<unknown> {
    const result = await this.config.provider.execute(
      this.config.model,
      prompt,
      {
        temperature: this.config.temperature ?? 0.3,
        maxTokens: this.config.maxTokens ?? 2000,
        systemPrompt:
          this.config.systemPrompt ??
          "You are a precise analytical AI. Provide structured and logical analysis.",
      }
    );

    return result.output;
  }
}
