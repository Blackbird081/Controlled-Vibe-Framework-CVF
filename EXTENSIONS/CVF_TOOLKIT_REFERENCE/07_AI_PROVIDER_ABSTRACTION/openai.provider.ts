// 07_AI_PROVIDER_ABSTRACTION/openai.provider.ts

import OpenAI from "openai";
import { AIProvider, AIRequest, AIResponse, AIModelConfig } from "./provider.interface";

export class OpenAIProvider implements AIProvider {
  name = "openai" as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async invoke(
    request: AIRequest,
    config: AIModelConfig
  ): Promise<AIResponse> {

    const response = await this.client.chat.completions.create({
      model: config.model,
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 1000,
      messages: [
        { role: "system", content: request.systemPrompt ?? "" },
        { role: "user", content: request.prompt }
      ]
    });

    return {
      output: response.choices[0].message.content ?? "",
      model: config.model,
      provider: this.name,
      usage: response.usage
    };
  }
}
