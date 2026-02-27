import { apiGet, apiPost } from "./cvf.api"
import { AISettings } from "../types/ai.types"

export async function getAISettings(): Promise<AISettings> {
  return apiGet("/ai-settings")
}

export async function updateAISettings(settings: AISettings): Promise<AISettings> {
  return apiPost("/ai-settings", settings)
}
