import type { AIGenerationRequest } from "../types/index"

export interface ProviderPolicy {
  maxTokens?: number
  allowTemperature?: boolean
  blockedKeywords?: string[]
}

let activePolicy: ProviderPolicy = {}

export function setProviderPolicy(policy: ProviderPolicy) {
  activePolicy = policy
}

export function enforceProviderPolicy(
  request: AIGenerationRequest
) {
  if (
    activePolicy.maxTokens &&
    request.maxTokens &&
    request.maxTokens > activePolicy.maxTokens
  ) {
    throw new Error("Token limit exceeds provider policy")
  }

  if (
    activePolicy.allowTemperature === false &&
    request.temperature !== undefined
  ) {
    throw new Error("Temperature override not allowed")
  }

  if (
    activePolicy.blockedKeywords &&
    activePolicy.blockedKeywords.length > 0
  ) {
    for (const keyword of activePolicy.blockedKeywords) {
      if (request.userPrompt.includes(keyword)) {
        throw new Error(
          `Prompt contains blocked keyword: ${keyword}`
        )
      }
    }
  }
}