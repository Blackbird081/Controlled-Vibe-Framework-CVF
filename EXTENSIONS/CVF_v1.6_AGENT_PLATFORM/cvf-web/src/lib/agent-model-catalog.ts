export type ProviderKey = 'gemini' | 'openai' | 'anthropic' | 'alibaba' | 'openrouter' | 'deepseek';

interface ModelOption {
    id: string;
    name: string;
}

export const PROVIDER_NAMES: Record<ProviderKey, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic Claude',
    alibaba: 'Alibaba DashScope',
    openrouter: 'OpenRouter',
    deepseek: 'DeepSeek',
};

// Public API model IDs reviewed 2026-11-21. Account access still depends on the provider.
export const AVAILABLE_MODELS: Record<ProviderKey, readonly ModelOption[]> = {
    gemini: [
        { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
        { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen' },
        { id: 'gemini-4-argon', name: 'Gemini 4 Argon' },
        { id: 'gemini-4-neon', name: 'Gemini 4 Neon' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    ],
    openai: [
        { id: 'gpt-6-luna', name: 'GPT-6 Luna' },
        { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra' },
        { id: 'gpt-6.2-sol', name: 'GPT-6.2 Sol' },
        { id: 'gpt-6.2-astra', name: 'GPT-6.2 Astra' },
        { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        { id: 'gpt-4o', name: 'GPT-4o' },
    ],
    anthropic: [
        { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5' },
        { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5' },
        { id: 'claude-opus-5-5', name: 'Claude Opus 5.5' },
    ],
    alibaba: [
        { id: 'qwen-plus-character', name: 'Qwen Plus Character' },
        { id: 'qwen-flash-character', name: 'Qwen Flash Character' },
    ],
    openrouter: [
        { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
        { id: 'mistralai/mistral-small-3.2-24b-instruct', name: 'Mistral Small 3.2' },
        { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3 0324' },
        { id: 'google/gemini-4-hydrogen', name: 'Gemini 4 Hydrogen' },
        { id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5' },
        { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash' },
        { id: 'qwen/qwen3.7-plus', name: 'Qwen3.7 Plus' },
    ],
    deepseek: [
        { id: 'deepseek-flash', name: 'DeepSeek V4.1 Flash' },
        { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
    ],
};

export const AGENT_CHAT_PROVIDERS = ['openai', 'gemini', 'anthropic', 'deepseek', 'openrouter'] as const;
export type AgentChatProvider = typeof AGENT_CHAT_PROVIDERS[number];

export interface AgentModelSelection {
    provider: AgentChatProvider;
    model: string;
}

export function isAgentChatProvider(provider: string): provider is AgentChatProvider {
    return (AGENT_CHAT_PROVIDERS as readonly string[]).includes(provider);
}

export function parseAgentModelSelection(value: string): AgentModelSelection | null {
    const separator = value.indexOf(':');
    if (separator < 1) return null;
    const provider = value.slice(0, separator);
    const model = value.slice(separator + 1);
    return isAgentChatProvider(provider) && AVAILABLE_MODELS[provider].some(option => option.id === model)
        ? { provider, model }
        : null;
}
