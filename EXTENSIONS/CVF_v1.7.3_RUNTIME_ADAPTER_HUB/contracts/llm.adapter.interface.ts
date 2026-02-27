// contracts/llm.adapter.interface.ts
// CVF v1.7.3 — LLM Adapter Contract
// Defines the interface for LLM providers (OpenAI, Claude, Local, etc.)

export interface LLMRequest {
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    metadata?: Record<string, unknown>
}

export interface LLMUsage {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
}

export interface LLMResponse {
    content: string
    usage?: LLMUsage
    raw?: unknown
}

export interface LLMAdapter {

    /**
     * Unique adapter name (e.g., "openai", "claude", "local-llama")
     */
    readonly name: string

    /**
     * Send a prompt to the LLM and return the full completion
     */
    generate(request: LLMRequest): Promise<LLMResponse>

    /**
     * Optional streaming support
     * If not implemented, adapter may throw NotImplementedError
     */
    stream?(
        request: LLMRequest,
        onToken: (token: string) => void
    ): Promise<LLMResponse>
}
