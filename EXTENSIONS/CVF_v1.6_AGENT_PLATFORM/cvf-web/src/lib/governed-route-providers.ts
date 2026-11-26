// Text Encoding Exception: Vietnamese product copy needs its native characters.
/**
 * Providers the governed `/api/execute` route can run: Alibaba and OpenAI always, Claude only through the native
 * subscription lane (reported by the server). Everything else is shown as unavailable instead of silently selectable.
 */
export type GovernedRouteProviderKey = 'gemini' | 'openai' | 'anthropic' | 'alibaba' | 'openrouter' | 'deepseek';

export const GOVERNED_ROUTE_UNSUPPORTED_NOTE = 'Chưa hỗ trợ trên đường kiểm soát / Not supported on the governed route';

export const GOVERNED_ROUTE_DEFAULT_PROVIDER: GovernedRouteProviderKey = 'openai';
export const GOVERNED_ROUTE_DEFAULT_MODEL = 'gpt-6-luna';
export const GOVERNED_ROUTE_OPENAI_MODELS: readonly string[] = ['gpt-6-luna', 'gpt-6.1-terra', 'gpt-4o-mini', 'gpt-4o'];

export function isGovernedRouteProvider(provider: string, nativeClaude = false): boolean {
    return provider === 'openai' || provider === 'alibaba' || (provider === 'anthropic' && nativeClaude);
}
