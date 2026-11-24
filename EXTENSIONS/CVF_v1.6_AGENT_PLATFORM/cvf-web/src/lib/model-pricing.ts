export type ModelPricing = Record<string, { input: number; output: number }>;

// Prices per 1M tokens (USD)
export const DEFAULT_MODEL_PRICING: ModelPricing = {
    // Gemini
    'gemini-3.5-flash-lite': { input: 0.30, output: 2.50 },
    'gemini-4-hydrogen': { input: 1.50, output: 7.50 },
    // Use the published post-promotion rate for budget estimates.
    'gemini-4-argon': { input: 4.00, output: 20.00 },
    'gemini-4-neon': { input: 3.00, output: 15.00 },
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-3-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    // OpenAI
    'gpt-6-luna': { input: 0.10, output: 0.50 },
    'gpt-6.1-terra': { input: 1.00, output: 5.00 },
    'gpt-6.2-sol': { input: 2.00, output: 10.00 },
    'gpt-6.2-astra': { input: 8.00, output: 40.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4.5-preview': { input: 75.00, output: 150.00 },
    'o1': { input: 15.00, output: 60.00 },
    'o3-mini': { input: 1.10, output: 4.40 },
    // Anthropic
    'claude-sonnet-5-5': { input: 2.00, output: 10.00 },
    // The higher price tier keeps estimates conservative for long prompts.
    'claude-haiku-5-5': { input: 0.50, output: 2.50 },
    'claude-opus-5-5': { input: 4.00, output: 20.00 },
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3.5-haiku': { input: 0.80, output: 4.00 },
    'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
    // DeepSeek
    'deepseek-flash': { input: 0.15, output: 0.66 },
    'deepseek-v4-pro': { input: 0.62, output: 2.99 },
    'deepseek-chat': { input: 0.27, output: 1.10 },
    'deepseek-reasoner': { input: 0.55, output: 2.19 },
    // OpenRouter publishes indicative rates. Actual charges depend on the routed endpoint.
    'google/gemini-4-hydrogen': { input: 1.50, output: 7.50 },
    'anthropic/claude-sonnet-5.5': { input: 2.00, output: 10.00 },
    'deepseek/deepseek-v4.1-flash': { input: 0.15, output: 0.66 },
    'qwen/qwen3.7-plus': { input: 0.32, output: 1.28 },
};

export const DEFAULT_FALLBACK_PRICING = { input: 1.00, output: 4.00 };

export function calculateTokenCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
    pricing: ModelPricing = DEFAULT_MODEL_PRICING,
    fallback = DEFAULT_FALLBACK_PRICING
): number {
    const selected = pricing[model] || fallback;
    const inputCost = (inputTokens / 1_000_000) * selected.input;
    const outputCost = (outputTokens / 1_000_000) * selected.output;
    return inputCost + outputCost;
}
