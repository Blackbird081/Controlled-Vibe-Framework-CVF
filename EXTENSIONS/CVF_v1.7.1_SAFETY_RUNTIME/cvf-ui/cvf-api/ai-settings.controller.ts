import { AISettingsRequest } from "./api.types"

let activeSettings: AISettingsRequest = {
  provider: "DIRECT_LLM",
  maxTokens: 2000,
  temperature: 0.2,
}

export function updateAISettings(request: AISettingsRequest) {
  activeSettings = {
    ...activeSettings,
    ...request,
  }

  return activeSettings
}

export function getAISettings() {
  return activeSettings
}
