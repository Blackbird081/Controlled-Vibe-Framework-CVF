import type { AIProviderAdapter, AIGenerationRequest, AIGenerationResponse } from "../types/index"
import { enforceProviderPolicy } from "./provider.policy"
import { recordUsage } from "./usage.tracker"
import { logAIGeneration } from "./audit.logger"

let activeProvider: AIProviderAdapter | null = null

export function setActiveProvider(provider: AIProviderAdapter) {
  activeProvider = provider
}

export function getActiveProvider(): AIProviderAdapter {
  if (!activeProvider) {
    throw new Error("No active AI provider set")
  }
  return activeProvider
}

export async function governedGenerate(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {

  // 1. Enforce policy before call
  enforceProviderPolicy(request)

  const provider = getActiveProvider()

  // 2. Generate
  const response = await provider.generate(request)

  // 3. Record usage
  recordUsage(response)

  // 4. Audit log
  logAIGeneration(request, response)

  return response
}