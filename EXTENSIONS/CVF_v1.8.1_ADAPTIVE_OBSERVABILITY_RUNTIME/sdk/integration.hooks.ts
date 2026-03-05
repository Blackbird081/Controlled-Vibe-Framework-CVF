// sdk/integration.hooks.ts

import { runSkill } from "./cvf.client"

export function createClaudeHook(skillId: string, model: string) {
  return async function hook(
    input: string,
    execute: (input: string) => Promise<{
      output: string
      tokensUsed: number
      durationMs: number
    }>
  ) {
    return runSkill({
      skillId,
      input,
      model,
      execute,
    })
  }
}