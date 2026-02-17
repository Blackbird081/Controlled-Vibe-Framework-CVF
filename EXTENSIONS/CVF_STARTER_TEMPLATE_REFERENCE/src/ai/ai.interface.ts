// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/ai.interface.ts

import { AIProvider } from "./providers/provider.interface";

export interface AIRoleConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIRole {
  execute(prompt: string): Promise<unknown>;
}
