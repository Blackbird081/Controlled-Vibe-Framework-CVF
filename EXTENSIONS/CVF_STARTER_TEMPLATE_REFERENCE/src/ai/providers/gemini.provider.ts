// src/ai/providers/gemini.provider.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIExecutionResult } from "./provider.interface";

export class GeminiProvider implements AIProvider {
  readonly providerName = "gemini";

  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
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
    const generativeModel = this.client.getGenerativeModel({ model });

    const result = await generativeModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 1500,
      },
    });

    const output = result.response.text();

    return {
      output,
      promptTokens: 0,
      completionTokens: 0,
      // TODO: Implement real cost calculation using TokenEstimator + CostCalculator
      costUSD: 0,
    };
  }
}
