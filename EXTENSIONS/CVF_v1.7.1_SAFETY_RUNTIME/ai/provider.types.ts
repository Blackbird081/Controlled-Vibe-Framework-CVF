export type AIProviderType = "OPENCLAW" | "DIRECT_LLM" | "LOCAL"

export interface AIGenerationRequest {
  systemPrompt?: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface AIGenerationResponse {
  content: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  model?: string
}
