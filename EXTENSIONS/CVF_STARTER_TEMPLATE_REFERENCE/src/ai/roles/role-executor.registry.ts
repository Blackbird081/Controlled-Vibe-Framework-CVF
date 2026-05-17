// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/roles/role-executor.registry.ts

import { AIExecutionResult } from "../providers/provider.interface";

export interface AIExecutor {
  execute(prompt: string): Promise<AIExecutionResult>;
}

export type RoleType =
  | "ANALYST"
  | "TRADER"
  | "RESEARCHER"
  | "ADMIN";

export class RoleExecutorRegistry {
  private registry = new Map<RoleType, AIExecutor>();

  register(role: RoleType, executor: AIExecutor) {
    if (this.registry.has(role)) {
      throw new Error(`Executor already registered for role ${role}`);
    }
    this.registry.set(role, executor);
  }

  get(role: RoleType): AIExecutor {
    const executor = this.registry.get(role);

    if (!executor) {
      throw new Error(`No executor registered for role ${role}`);
    }

    return executor;
  }
}
