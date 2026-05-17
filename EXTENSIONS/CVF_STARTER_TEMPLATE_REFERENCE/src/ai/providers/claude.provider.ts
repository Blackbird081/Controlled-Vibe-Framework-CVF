// src/ai/providers/claude.provider.ts

import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, AIExecutionResult } from "./provider.interface";

export class ClaudeProvider implements AIProvider {
  readonly providerName = "claude";

  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
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
    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 1500,
      temperature: options?.temperature ?? 0.2,
      system: options?.systemPrompt ?? "",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output =
      response.content?.[0]?.type === "text"
        ? response.content[0].text
        : "";

    return {
      output,
      promptTokens: response.usage?.input_tokens ?? 0,
      completionTokens: response.usage?.output_tokens ?? 0,
      // TODO: Implement real cost calculation using TokenEstimator + CostCalculator
      costUSD: 0,
    };
  }
}
