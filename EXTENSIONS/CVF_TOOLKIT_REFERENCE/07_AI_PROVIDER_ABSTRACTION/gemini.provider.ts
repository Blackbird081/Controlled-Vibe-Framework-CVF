// 07_AI_PROVIDER_ABSTRACTION/gemini.provider.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIRequest, AIResponse, AIModelConfig } from "./provider.interface";

export class GeminiProvider implements AIProvider {
  name = "gemini" as const;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async invoke(
    request: AIRequest,
    config: AIModelConfig
  ): Promise<AIResponse> {

    const model = this.client.getGenerativeModel({
      model: config.model
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: request.prompt }]
      }],
      generationConfig: {
        temperature: config.temperature ?? 0.3,
        maxOutputTokens: config.maxTokens ?? 1000
      }
    });

    return {
      output: result.response.text(),
      model: config.model,
      provider: this.name
    };
  }
}
