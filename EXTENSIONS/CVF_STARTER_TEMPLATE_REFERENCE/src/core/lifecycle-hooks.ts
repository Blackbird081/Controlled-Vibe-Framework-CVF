// @reference-only — This module is not wired into the main execution pipeline.
// src/core/lifecycle-hooks.ts

import { ExecutionContext } from "./execution-context";

export interface CVFLifecycleHook {
  beforeExecution?(context: ExecutionContext): Promise<void> | void;
  afterExecution?(context: ExecutionContext): Promise<void> | void;
  onError?(context: ExecutionContext): Promise<void> | void;
}

export class LifecycleManager {
  private hooks: CVFLifecycleHook[] = [];

  register(hook: CVFLifecycleHook) {
    this.hooks.push(hook);
  }

  async runBefore(context: ExecutionContext) {
    for (const hook of this.hooks) {
      if (hook.beforeExecution) {
        await hook.beforeExecution(context);
      }
    }
  }

  async runAfter(context: ExecutionContext) {
    for (const hook of this.hooks) {
      if (hook.afterExecution) {
        await hook.afterExecution(context);
      }
    }
  }

  async runError(context: ExecutionContext) {
    for (const hook of this.hooks) {
      if (hook.onError) {
        await hook.onError(context);
      }
    }
  }
}
