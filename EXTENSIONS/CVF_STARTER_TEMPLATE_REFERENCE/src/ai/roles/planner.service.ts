// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/roles/planner.service.ts

import { AIRole, AIRoleConfig } from "../ai.interface";

export class PlannerService implements AIRole {
  constructor(private readonly config: AIRoleConfig) {}

  async execute(prompt: string): Promise<unknown> {
    const result = await this.config.provider.execute(
      this.config.model,
      prompt,
      {
        temperature: this.config.temperature ?? 0.2,
        maxTokens: this.config.maxTokens ?? 1000,
        systemPrompt:
          this.config.systemPrompt ??
          "You are a strategic planning AI. Break down the task into structured steps.",
      }
    );

    return result.output;
  }
}
