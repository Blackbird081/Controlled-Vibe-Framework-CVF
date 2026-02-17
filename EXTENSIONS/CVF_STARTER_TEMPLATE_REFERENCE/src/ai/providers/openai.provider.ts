// src/ai/providers/openai.provider.ts

import OpenAI from "openai";
import { AIProvider, AIExecutionResult } from "./provider.interface";

export class OpenAIProvider implements AIProvider {
  readonly providerName = "openai";

  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async execute(
    model: string,
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<AIExecutionResult> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: options?.systemPrompt ?? "",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 1500,
    });

    const output = response.choices[0]?.message?.content ?? "";

    return {
      output,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      // TODO: Implement real cost calculation using TokenEstimator + CostCalculator
      costUSD: 0,
    };
  }
}
