// src/ai/providers/provider.interface.ts

export interface AIExecutionResult {
  output: unknown;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
}

export interface AIProvider {
  readonly providerName: string;

  execute(
    model: string,
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<AIExecutionResult>;
}
