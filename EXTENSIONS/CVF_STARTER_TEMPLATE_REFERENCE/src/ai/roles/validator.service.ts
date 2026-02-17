// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/roles/validator.service.ts

import { AIRole, AIRoleConfig } from "../ai.interface";

export class ValidatorService implements AIRole {
  constructor(private readonly config: AIRoleConfig) {}

  async execute(prompt: string): Promise<unknown> {
    const result = await this.config.provider.execute(
      this.config.model,
      prompt,
      {
        temperature: this.config.temperature ?? 0,
        maxTokens: this.config.maxTokens ?? 1000,
        systemPrompt:
          this.config.systemPrompt ??
          "You are a strict validation AI. Verify correctness, logical consistency, and risk.",
      }
    );

    return result.output;
  }
}
