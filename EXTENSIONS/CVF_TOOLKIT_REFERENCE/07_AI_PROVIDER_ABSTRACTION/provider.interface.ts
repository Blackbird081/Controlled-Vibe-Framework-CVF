// 07_AI_PROVIDER_ABSTRACTION/provider.interface.ts

import {
  AIRequest as CoreAIRequest,
  AIResponse as CoreAIResponse,
  AIProvider as CoreAIProvider
} from "../02_TOOLKIT_CORE/interfaces"

// --- Provider-specific extensions ---

export type AIProviderName = "openai" | "claude" | "gemini";

export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Re-export core types for convenience
export type { CoreAIRequest, CoreAIResponse, CoreAIProvider }

/**
 * Extended AIRequest adding provider-specific metadata.
 * Compatible with CoreAIRequest from interfaces.ts.
 */
export interface AIRequest extends CoreAIRequest {
  metadata?: Record<string, unknown>;
}

/**
 * Extended AIResponse adding provider identification.
 * Compatible with CoreAIResponse from interfaces.ts.
 */
export interface AIResponse extends CoreAIResponse {
  provider?: AIProviderName;
}

/**
 * Extended AIProvider with typed provider name and model config.
 * Compatible with CoreAIProvider from interfaces.ts.
 */
export interface AIProvider extends CoreAIProvider {
  name: AIProviderName;
  invoke(
    request: AIRequest,
    config?: AIModelConfig
  ): Promise<AIResponse>;
}
