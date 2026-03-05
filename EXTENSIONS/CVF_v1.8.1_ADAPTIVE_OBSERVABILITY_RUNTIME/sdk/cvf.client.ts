// sdk/cvf.client.ts

import { scanPII } from "../runtime/edge_security/pii.detector"
import { detectSecrets } from "../runtime/edge_security/secret.detector"
import { checkInjection } from "../runtime/edge_security/injection.precheck"

import { logInvocation } from "../observability/invocation.logger"
import { saveMetric } from "../storage/metrics.store"

import { runtimeGuard } from "../governance/runtime.guard"

export interface RunSkillOptions {
  skillId: string
  input: string
  model: string
  temperature?: number
  maxTokens?: number
  execute: (input: string, params?: {
    temperature?: number
    maxTokens?: number
  }) => Promise<{
    output: string
    tokensUsed: number
    durationMs: number
  }>
}

export async function runSkill(options: RunSkillOptions) {
  const {
    skillId,
    input,
    model,
    temperature,
    maxTokens,
    execute,
  } = options

  // -------- EDGE SECURITY --------

  const pii = scanPII(input)
  const secret = detectSecrets(input)
  const injection = checkInjection(input)

  if (pii.length || secret.length || injection) {
    throw new Error("Security check failed")
  }

  // -------- ADAPTIVE GUARD --------

  const guard = runtimeGuard({
    skillId,
    temperature,
    maxTokens,
  })

  if (!guard.allowed) {
    throw new Error(guard.reason || "Execution blocked by runtime guard")
  }

  if (guard.requireClarification) {
    // Có thể thay bằng structured response sau này
    throw new Error("Clarification required before execution")
  }

  // -------- EXECUTION --------

  const start = Date.now()

  const result = await execute(input, guard.adjustedParams)

  const end = Date.now()

  const record = {
    id: crypto.randomUUID(),
    skillId,
    timestamp: Date.now(),
    tokensUsed: result.tokensUsed,
    durationMs: result.durationMs ?? end - start,
    model,
  }

  // -------- OBSERVABILITY --------

  logInvocation(record)
  saveMetric(record)

  return result.output
}