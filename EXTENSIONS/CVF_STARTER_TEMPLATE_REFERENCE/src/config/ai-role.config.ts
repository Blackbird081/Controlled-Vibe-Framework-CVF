// @reference-only — This module is not wired into the main execution pipeline.
// src/config/ai-role.config.ts

export interface AIRoleRuntimeConfig {
  temperature: number;
  maxTokens: number;
}

export const aiRoleConfig = {
  planner: {
    temperature: 0.2,
    maxTokens: 1000,
  } as AIRoleRuntimeConfig,

  analyst: {
    temperature: 0.3,
    maxTokens: 2000,
  } as AIRoleRuntimeConfig,

  validator: {
    temperature: 0,
    maxTokens: 1000,
  } as AIRoleRuntimeConfig,
};
