import { DEFAULT_MODEL_PRICING } from './model-pricing';

// Rough token estimate: 4 chars per token
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export function checkBudget(prompt: string): boolean {
    const limit = Number(process.env.CVF_MAX_TOKENS || 8000);
    const estimated = estimateTokens(prompt);
    return estimated <= limit;
}

export function estimateCost(model: string, prompt: string): number {
    const pricing = DEFAULT_MODEL_PRICING[model] || DEFAULT_MODEL_PRICING['gpt-4o-mini'];
    const tokens = estimateTokens(prompt);
    const inputRate = pricing?.input || 0;
    return (tokens / 1_000_000) * inputRate;
}
