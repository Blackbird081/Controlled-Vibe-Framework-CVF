'use client';

/**
 * AI Provider Library for CVF Agent Mode
 * Supports Gemini, OpenAI, and Anthropic APIs with streaming
 */

// Types
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIStreamChunk {
    text: string;
    isComplete: boolean;
    error?: string;
}

export interface AIResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    finishReason?: string;
}

export interface AIProviderConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

// CVF System Prompt
const CVF_SYSTEM_PROMPT = `You are CVF Agent, an AI assistant that follows the Controlled-Vibe Framework methodology.

Your responses should be structured in phases:
- PHASE A (Discovery): Understand requirements, make assumptions explicit, define scope
- PHASE B (Design): Propose solutions, consider alternatives, plan implementation
- PHASE C (Build): Execute the plan, provide deliverables
- PHASE D (Review): Verify quality, suggest improvements

Always:
1. Be clear about what you're assuming
2. Ask for confirmation at checkpoints
3. Provide structured, actionable outputs
4. Use markdown formatting for clarity

Start each response by identifying which phase you're in.`;

// ==================== GEMINI PROVIDER ====================
export class GeminiProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gemini-2.0-flash';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemPrompt = CVF_SYSTEM_PROMPT;

        // Build contents array
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Add system instruction as first user message if needed
        if (systemPrompt && contents.length > 0) {
            contents[0].parts[0].text = `${systemPrompt}\n\n---\n\n${contents[0].parts[0].text}`;
        }

        const endpoint = onStream
            ? `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`
            : `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            if (onStream) {
                return await this.streamRequest(endpoint, contents, onStream);
            } else {
                return await this.standardRequest(endpoint, contents);
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Gemini API Error: ${errorMsg}`);
        }
    }

    private async standardRequest(endpoint: string, contents: Array<{ role: string; parts: { text: string }[] }>): Promise<AIResponse> {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            text,
            model: this.model,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0,
            },
            finishReason: data.candidates?.[0]?.finishReason,
        };
    }

    private async streamRequest(
        endpoint: string,
        contents: Array<{ role: string; parts: { text: string }[] }>,
        onStream: (chunk: AIStreamChunk) => void
    ): Promise<AIResponse> {
        const response = await fetch(endpoint + '&alt=sse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            fullText += text;
                            onStream({ text, isComplete: false });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== OPENAI PROVIDER ====================
export class OpenAIProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.openai.com/v1';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4o';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: CVF_SYSTEM_PROMPT };
        const allMessages = [systemMessage, ...messages];

        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                return {
                    text: data.choices[0]?.message?.content || '',
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0,
                    },
                    finishReason: data.choices[0]?.finish_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OpenAI API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.choices?.[0]?.delta?.content || '';
                        if (text) {
                            fullText += text;
                            onStream({ text, isComplete: false });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== ANTHROPIC PROVIDER ====================
export class AnthropicProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.anthropic.com/v1';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'claude-3-5-sonnet-20241022';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        // Filter out system messages and use as system param
        const userMessages = messages.filter(m => m.role !== 'system');

        const body = {
            model: this.model,
            max_tokens: 4096,
            system: CVF_SYSTEM_PROMPT,
            messages: userMessages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                const text = data.content?.[0]?.text || '';
                return {
                    text,
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.input_tokens || 0,
                        completionTokens: data.usage?.output_tokens || 0,
                        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                    },
                    finishReason: data.stop_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Anthropic API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'content_block_delta') {
                            const text = data.delta?.text || '';
                            if (text) {
                                fullText += text;
                                onStream({ text, isComplete: false });
                            }
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== UNIFIED PROVIDER ====================
export function createAIProvider(provider: AIProvider, config: AIProviderConfig) {
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(config);
        case 'openai':
            return new OpenAIProvider(config);
        case 'anthropic':
            return new AnthropicProvider(config);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// Hook for using AI in components
import { useState, useCallback } from 'react';
import { useSettings } from '@/components/Settings';

export function useAI() {
    const { settings } = useSettings();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (
        messages: AIMessage[],
        onStream?: (chunk: AIStreamChunk) => void
    ): Promise<AIResponse | null> => {
        const provider = settings.preferences.defaultProvider;
        const apiKey = settings.providers[provider]?.apiKey;

        if (!apiKey) {
            setError('No API key configured');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const aiProvider = createAIProvider(provider, { apiKey });
            const response = await aiProvider.chat(messages, onStream);
            return response;
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [settings]);

    return {
        sendMessage,
        isLoading,
        error,
        provider: settings.preferences.defaultProvider,
        hasApiKey: !!settings.providers[settings.preferences.defaultProvider]?.apiKey,
    };
}
