
import type {
  AIProviderAdapter,
  AIGenerationRequest,
  AIGenerationResponse,
} from "../types/index";

export interface OpenClawClient {
  generate(payload: {
    system?: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<{
    content: string;
    usage?: any;
    model?: string;
  }>;
}

let openClawClient: OpenClawClient | null = null;

export function registerOpenClawClient(client: OpenClawClient) {
  openClawClient = client;
}

export class OpenClawAdapter implements AIProviderAdapter {
  async generate(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    if (!openClawClient) {
      throw new Error("OpenClaw client not registered");
    }

    const result = await openClawClient.generate({
      system: request.systemPrompt,
      prompt: request.userPrompt,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    return {
      content: result.content,
      usage: result.usage,
      model: result.model,
    };
  }
}