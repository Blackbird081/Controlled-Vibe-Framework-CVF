import type {
  AIProviderAdapter,
  AIGenerationRequest,
  AIGenerationResponse,
} from "../types/index"

export interface DirectLLMClient {
  generate(request: AIGenerationRequest): Promise<AIGenerationResponse>
}

let directClient: DirectLLMClient | null = null

export function registerDirectLLMClient(client: DirectLLMClient) {
  directClient = client
}

export class DirectProviderAdapter implements AIProviderAdapter {
  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (!directClient) {
      throw new Error("Direct LLM client not registered")
    }

    return directClient.generate(request)
  }
}
