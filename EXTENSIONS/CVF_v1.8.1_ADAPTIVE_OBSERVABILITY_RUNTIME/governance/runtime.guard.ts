// governance/runtime.guard.ts

import { generateAdaptivePolicy } from "./adaptive.policy"

export interface RuntimeExecutionParams {
  skillId: string
  temperature?: number
  maxTokens?: number
}

export interface GuardResult {
  allowed: boolean
  reason?: string
  adjustedParams: {
    temperature?: number
    maxTokens?: number
  }
  requireClarification: boolean
  mode: "normal" | "moderate" | "strict"
}

export function runtimeGuard(
  params: RuntimeExecutionParams
): GuardResult {
  const { skillId, temperature, maxTokens } = params

  const policy = generateAdaptivePolicy(skillId)

  if (policy.blockExecution) {
    return {
      allowed: false,
      reason: "Execution blocked due to high risk score",
      adjustedParams: {},
      requireClarification: true,
      mode: policy.mode,
    }
  }

  const adjustedTemperature =
    temperature !== undefined
      ? Math.min(temperature, policy.temperatureCap)
      : policy.temperatureCap

  const adjustedMaxTokens =
    maxTokens !== undefined
      ? Math.min(maxTokens, policy.maxTokensCap)
      : policy.maxTokensCap

  return {
    allowed: true,
    adjustedParams: {
      temperature: adjustedTemperature,
      maxTokens: adjustedMaxTokens,
    },
    requireClarification: policy.requireClarification,
    mode: policy.mode,
  }
}