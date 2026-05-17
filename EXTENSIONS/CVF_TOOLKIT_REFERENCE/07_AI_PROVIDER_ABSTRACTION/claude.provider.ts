// 07_AI_PROVIDER_ABSTRACTION/claude.provider.ts

import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, AIRequest, AIResponse, AIModelConfig } from "./provider.interface";

export class ClaudeProvider implements AIProvider {
  name = "claude" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async invoke(
    request: AIRequest,
    config: AIModelConfig
  ): Promise<AIResponse> {

    const response = await this.client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens ?? 1000,
      temperature: config.temperature ?? 0.3,
      system: request.systemPrompt,
      messages: [
        {
          role: "user",
          content: request.prompt
        }
      ]
    });

    return {
      output: response.content[0].text,
      model: config.model,
      provider: this.name,
      usage: {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }]
      });
      return true;
    } catch {
      return false;
    }
  }
}
