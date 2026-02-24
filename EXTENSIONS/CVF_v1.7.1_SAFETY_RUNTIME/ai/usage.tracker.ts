import type { AIGenerationResponse, UsageRecord } from "../types/index"

const usageHistory: UsageRecord[] = []

export function recordUsage(
  response: AIGenerationResponse
) {
  usageHistory.push({
    timestamp: Date.now(),
    totalTokens: response.usage?.totalTokens,
    model: response.model,
  })
}

export function getUsageHistory(): readonly UsageRecord[] {
  return usageHistory
}