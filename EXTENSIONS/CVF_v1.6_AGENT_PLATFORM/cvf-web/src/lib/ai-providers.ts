'use client';

/**
 * AI Provider Library for CVF Agent Mode
 * Supports Gemini, OpenAI, and Anthropic APIs with streaming
 */

import { detectSpecMode } from '@/lib/agent-chat';
import { getCVFSystemPrompt } from './cvf-system-prompt';
import { AssistantRateLimitError } from './assistant-rate-limit';
import { GOVERNED_ROUTE_DEFAULT_MODEL } from './governed-route-providers';

export { getCVFSystemPrompt } from './cvf-system-prompt';

// Types
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'alibaba' | 'openrouter' | 'deepseek';

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
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    language?: 'vi' | 'en';
}

const MOCK_AI_ENABLED = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';

class MockProvider {
    private model: string;
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.model = config.model || 'mock-ai';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const lastMessage = messages[messages.length - 1]?.content || '';
        const mode = detectSpecMode(lastMessage);

        const text = this.language === 'vi'
            ? this.buildVietnameseResponse(mode)
            : this.buildEnglishResponse(mode);

        if (onStream) {
            onStream({ text, isComplete: false });
            onStream({ text: '', isComplete: true });
        }

        const totalTokens = Math.max(1, Math.ceil(text.length / 4));

        return {
            text,
            model: this.model,
            usage: {
                promptTokens: Math.max(1, Math.ceil(lastMessage.length / 4)),
                completionTokens: totalTokens,
                totalTokens: totalTokens + Math.max(1, Math.ceil(lastMessage.length / 4)),
            },
            finishReason: 'stop',
        };
    }

    private buildVietnameseResponse(mode: 'simple' | 'governance' | 'full'): string {
        if (mode === 'full') {
            return `MOCK_FULL_RESPONSE

## PHASE A: Discovery Summary

### Hiểu biết của tôi
Mục tiêu là tạo kết quả có cấu trúc, rõ ràng và dùng được ngay.

### Giả định
- Giả định 1: Phạm vi tập trung vào deliverables chính.
- Giả định 2: Ưu tiên tính rõ ràng hơn độ chi tiết.

### Định nghĩa Scope
IN SCOPE:
- Phân tích và tóm tắt yêu cầu chính
- Đưa ra cấu trúc kết quả

OUT OF SCOPE:
- Tối ưu hóa triển khai chi tiết

### Ràng buộc
- Ràng buộc thời gian: triển khai nhanh

### Câu hỏi làm rõ
- Không có
`;
        }

        if (mode === 'governance') {
            return `MOCK_GOVERNANCE_RESPONSE

## Governance Response

### Tóm tắt
- Kết quả có cấu trúc rõ ràng
- Có checklist hành động

### Action Items
1. Xác nhận scope
2. Thực thi deliverables
3. Review kết quả
`;
        }

        return `MOCK_SIMPLE_RESPONSE

## Simple Response

- Kết quả gọn, dễ hiểu
- Có thể dùng ngay cho bước tiếp theo
`;
    }

    private buildEnglishResponse(mode: 'simple' | 'governance' | 'full'): string {
        if (mode === 'full') {
            return `MOCK_FULL_RESPONSE

## PHASE A: Discovery Summary

### My Understanding
The goal is to deliver structured, actionable output.

### Assumptions
- Assumption 1: Focus on primary deliverables.
- Assumption 2: Clarity is prioritized over depth.

### Scope Definition
IN SCOPE:
- Summarize the core request
- Produce a structured output

OUT OF SCOPE:
- Detailed implementation optimization

### Constraints
- Constraint: Fast turnaround

### Clarification Questions
- None
`;
        }

        if (mode === 'governance') {
            return `MOCK_GOVERNANCE_RESPONSE

## Governance Response

### Summary
- Structured output with guardrails
- Action checklist included

### Action Items
1. Confirm scope
2. Execute deliverables
3. Review outcome
`;
        }

        return `MOCK_SIMPLE_RESPONSE

## Simple Response

- Clear, concise output
- Ready for next step
`;
    }
}

interface StreamPayload {
    error?: { message?: string };
}

async function* readStream<T extends StreamPayload>(response: Response): AsyncGenerator<T> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let ended = false;
    try {
        while (!ended) {
            const { done, value } = await reader.read();
            ended = done;
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = done ? '' : lines.pop() ?? '';
            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') return;

                let data: T;
                try {
                    data = JSON.parse(payload);
                } catch {
                    // Ignore malformed events, as in the original provider streams.
                    continue;
                }
                if (!data || typeof data !== 'object') continue;
                if (data.error) throw new Error(data.error.message || 'Provider stream failed');
                yield data;
            }
        }
    } finally {
        if (!ended) await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}

interface GeminiPayload extends StreamPayload {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        finishReason?: string;
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}

function geminiText(payload: GeminiPayload): string {
    return (payload.candidates?.[0]?.content?.parts ?? [])
        .filter(part => !part.thought)
        .map(part => part.text ?? '')
        .join('');
}

function geminiUsage(usage: GeminiPayload['usageMetadata']): NonNullable<AIResponse['usage']> {
    return {
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
    };
}

// ==================== GEMINI PROVIDER ====================
export class GeminiProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gemini-3.5-flash-lite';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const isGemini4 = /^gemini-4(?:[.-]|$)/i.test(this.model);
        const supportsLegacySampling = !isGemini4 && !/^gemini-3\.[5-9](?:[.-]|$)/i.test(this.model);
        const systemPrompt = getCVFSystemPrompt(this.language);

        // Build contents array
        const contents = (supportsLegacySampling ? messages : messages.filter(msg => msg.role !== 'system')).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        if (supportsLegacySampling && systemPrompt && contents.length > 0) {
            contents[0].parts[0].text = `${systemPrompt}\n\n---\n\n${contents[0].parts[0].text}`;
        }

        const method = onStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
        const endpoint = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:${method}`;

        try {
            if (!supportsLegacySampling && contents.findLast(turn => turn.parts[0].text.trim())?.role === 'model') {
                throw new Error('Finish the conversation with a user message.');
            }
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
                body: JSON.stringify({
                    contents,
                    ...(!supportsLegacySampling && { systemInstruction: { parts: [{
                        text: [systemPrompt, ...messages.filter(msg => msg.role === 'system').map(msg => msg.content)].join('\n\n'),
                    }] } }),
                    generationConfig: {
                        maxOutputTokens: 8192,
                        ...(supportsLegacySampling && { temperature: 0.7 }),
                        ...(isGemini4 && { thinkingConfig: { thinkingLevel: 'LOW' } }),
                    },
                }),
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error('HTTP 401');
                if (response.status === 429) throw new AssistantRateLimitError(response.headers?.get('Retry-After') ?? null);
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }
            if (onStream) {
                return await this.streamResponse(response, onStream);
            }
            const data = await response.json() as GeminiPayload;
            return {
                text: geminiText(data),
                model: this.model,
                usage: geminiUsage(data.usageMetadata),
                finishReason: data.candidates?.[0]?.finishReason,
            };
        } catch (error: unknown) {
            if (error instanceof AssistantRateLimitError) throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Gemini API Error: ${errorMsg}`);
        }
    }

    private async streamResponse(
        response: Response,
        onStream: (chunk: AIStreamChunk) => void
    ): Promise<AIResponse> {
        const result: AIResponse = { text: '', model: this.model, finishReason: 'stop' };
        for await (const data of readStream<GeminiPayload>(response)) {
            const text = geminiText(data);
            if (text) {
                result.text += text;
                onStream({ text, isComplete: false });
            }
            if (data.usageMetadata) result.usage = geminiUsage(data.usageMetadata);
            result.finishReason = data.candidates?.[0]?.finishReason ?? result.finishReason;
        }

        onStream({ text: '', isComplete: true });
        return result;
    }
}

interface ChatCompletionPayload extends StreamPayload {
    choices?: Array<{
        delta?: { content?: string | null };
        message?: { content?: string | null };
        finish_reason?: string | null;
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

function chatCompletionUsage(usage: ChatCompletionPayload['usage']): NonNullable<AIResponse['usage']> {
    return {
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
    };
}

function gpt6ReasoningEffort(model: string): 'none' | 'low' {
    return /^(gpt-6-luna|gpt-6\.1-terra)(?:-|$)/i.test(model) ? 'none' : 'low';
}

async function readChatCompletion(
    response: Response,
    model: string,
    onStream?: (chunk: AIStreamChunk) => void,
): Promise<AIResponse> {
    if (!onStream) {
        const data = await response.json() as ChatCompletionPayload;
        return {
            text: data.choices?.[0]?.message?.content ?? '',
            model,
            usage: chatCompletionUsage(data.usage),
            finishReason: data.choices?.[0]?.finish_reason ?? undefined,
        };
    }

    const result: AIResponse = { text: '', model, finishReason: 'stop' };
    for await (const data of readStream<ChatCompletionPayload>(response)) {
        const choice = data.choices?.[0];
        const text = choice?.delta?.content;
        if (text) {
            result.text += text;
            onStream({ text, isComplete: false });
        }
        if (data.usage) result.usage = chatCompletionUsage(data.usage);
        if (choice?.finish_reason === 'error') throw new Error('Provider stream failed');
        result.finishReason = choice?.finish_reason ?? result.finishReason;
    }
    onStream({ text: '', isComplete: true });
    return result;
}

// ==================== OPENAI PROVIDER ====================
export class OpenAIProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.openai.com/v1';

    private language: 'vi' | 'en';
    private deepSeekThinking?: 'enabled' | 'disabled';

    constructor(config: AIProviderConfig, deepSeekThinking?: 'enabled' | 'disabled') {
        this.apiKey = config.apiKey;
        this.model = config.model || GOVERNED_ROUTE_DEFAULT_MODEL;
        this.baseUrl = config.baseUrl || this.baseUrl;
        this.language = config.language || 'vi';
        this.deepSeekThinking = deepSeekThinking;
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];
        const body: Record<string, unknown> = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            stream: !!onStream,
        };
        if (this.deepSeekThinking) {
            body.thinking = { type: this.deepSeekThinking };
            body.max_tokens = 4096;
        } else if (/^gpt-6(?:[.-]|$)/i.test(this.model)) {
            body.reasoning_effort = gpt6ReasoningEffort(this.model);
            body.max_completion_tokens = 4096;
            if (onStream) body.stream_options = { include_usage: true };
        } else if (/^(gpt-5|o[134])/i.test(this.model)) {
            body.max_completion_tokens = 4096;
        } else {
            body.temperature = 0.7;
            body.max_tokens = 4096;
        }
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
                if (response.status === 401) throw new Error('HTTP 401');
                if (response.status === 429) throw new AssistantRateLimitError(response.headers?.get('Retry-After') ?? null);
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            return await readChatCompletion(response, this.model, onStream);
        } catch (error: unknown) {
            if (error instanceof AssistantRateLimitError) throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OpenAI API Error: ${errorMsg}`);
        }
    }
}

interface AnthropicUsage { input_tokens?: number; output_tokens?: number }

interface AnthropicStreamPayload extends StreamPayload {
    type?: string;
    content_block?: { type?: string; text?: string };
    delta?: { type?: string; text?: string; stop_reason?: string | null };
    message?: { usage?: AnthropicUsage };
    usage?: AnthropicUsage;
}

// ==================== ANTHROPIC PROVIDER ====================
export class AnthropicProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.anthropic.com/v1';

    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'claude-sonnet-5-5';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        // Filter out system messages and use as system param
        const userMessages = messages.filter(m => m.role !== 'system');

        const body = {
            model: this.model,
            max_tokens: 4096,
            system: getCVFSystemPrompt(this.language),
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
                if (response.status === 401) throw new Error('HTTP 401');
                if (response.status === 429) throw new AssistantRateLimitError(response.headers?.get('Retry-After') ?? null);
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                const blocks: NonNullable<AnthropicStreamPayload['content_block']>[] = data.content ?? [];
                const text = blocks.filter(block => !block.type || block.type === 'text').map(block => block.text ?? '').join('');
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
            if (error instanceof AssistantRateLimitError) throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Anthropic API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const result: AIResponse = { text: '', model: this.model, finishReason: 'stop' };
        for await (const data of readStream<AnthropicStreamPayload>(response)) {
            const block = data.type === 'content_block_start' ? data.content_block : undefined;
            const delta = data.type === 'content_block_delta' ? data.delta : undefined;
            const text = block?.type === 'text' ? block.text : delta?.type === 'text_delta' || !delta?.type ? delta?.text : undefined;
            if (text) {
                result.text += text;
                onStream({ text, isComplete: false });
            }
            const usage = data.usage ?? data.message?.usage;
            if (usage) {
                const promptTokens = usage.input_tokens ?? result.usage?.promptTokens ?? 0;
                const completionTokens = usage.output_tokens ?? result.usage?.completionTokens ?? 0;
                result.usage = { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
            }
            result.finishReason = data.delta?.stop_reason ?? result.finishReason;
        }

        onStream({ text: '', isComplete: true });
        return result;
    }
}

// ==================== ALIBABA DASHSCOPE PROVIDER ====================
export class AlibabaDashScopeWebProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'qwen-flash';
        this.language = config.language || 'vi';
    }

    private isStreamingOnlyModel(): boolean {
        return /^qvq-/i.test(this.model);
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];
        const isStreamingOnly = this.isStreamingOnlyModel();

        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: !!onStream || isStreamingOnly,
            ...((!!onStream || isStreamingOnly) ? { stream_options: { include_usage: true } } : {}),
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
                if (response.status === 401) throw new Error('HTTP 401');
                if (response.status === 429) throw new AssistantRateLimitError(response.headers?.get('Retry-After') ?? null);
                const error = await response.json();
                if (isStreamingOnly && error.error?.code === 'model_not_supported') {
                    throw new Error(
                        `Alibaba model ${this.model} is not supported on the current compatible-mode endpoint. ` +
                        'Try qvq-max or use a provider-specific endpoint/adapter that supports this snapshot model.'
                    );
                }
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream || isStreamingOnly) {
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
            if (error instanceof AssistantRateLimitError) throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Alibaba DashScope API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let reasoningText = '';
        let buffer = '';
        let usage: AIResponse['usage'] | undefined;
        let finishReason: string | undefined;

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
                        const reasoning = data.choices?.[0]?.delta?.reasoning_content || '';
                        if (text) {
                            fullText += text;
                            onStream?.({ text, isComplete: false });
                        }
                        if (reasoning) {
                            reasoningText += reasoning;
                        }
                        if (typeof data.choices?.[0]?.finish_reason === 'string') {
                            finishReason = data.choices[0].finish_reason;
                        }
                        if (data.usage) {
                            usage = {
                                promptTokens: data.usage?.prompt_tokens || 0,
                                completionTokens: data.usage?.completion_tokens || 0,
                                totalTokens: data.usage?.total_tokens || 0,
                            };
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream?.({ text: '', isComplete: true });

        return {
            text: fullText || reasoningText,
            model: this.model,
            usage,
            finishReason: finishReason || 'stop',
        };
    }
}

// ==================== OPENROUTER PROVIDER ====================
export class OpenRouterProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://openrouter.ai/api/v1';
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'meta-llama/llama-4-maverick';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];

        const gpt6 = this.model.startsWith('openai/') && /^gpt-6(?:[.-]|$)/i.test(this.model.slice(7));
        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            ...(gpt6
                ? { reasoning_effort: gpt6ReasoningEffort(this.model.slice(7)), max_completion_tokens: 4096 }
                : { temperature: 0.7, max_tokens: 4096 }),
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://cvf.dev',
                    'X-Title': 'CVF Agent Platform',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('HTTP 401');
                if (response.status === 429) throw new AssistantRateLimitError(response.headers?.get('Retry-After') ?? null);
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            return await readChatCompletion(response, this.model, onStream);
        } catch (error: unknown) {
            if (error instanceof AssistantRateLimitError) throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OpenRouter API Error: ${errorMsg}`);
        }
    }

}

// ==================== UNIFIED PROVIDER ====================
export function createAIProvider(provider: AIProvider, config: AIProviderConfig) {
    if (MOCK_AI_ENABLED) {
        return new MockProvider(config);
    }
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(config);
        case 'openai':
            return new OpenAIProvider(config);
        case 'anthropic':
            return new AnthropicProvider(config);
        case 'alibaba':
            return new AlibabaDashScopeWebProvider(config);
        case 'openrouter':
            return new OpenRouterProvider(config);
        case 'deepseek': {
            const { model } = config;
            const isLegacy = model === 'deepseek-chat' || model === 'deepseek-reasoner';
            return new OpenAIProvider({
                ...config,
                model: !model || isLegacy ? 'deepseek-flash' : model,
                baseUrl: 'https://api.deepseek.com',
            }, model === 'deepseek-reasoner' ? 'enabled' : 'disabled');
        }
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
        const { apiKey, selectedModel } = settings.providers[provider] ?? {};

        if (!apiKey) {
            setError('No API key configured');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const aiProvider = createAIProvider(provider, {
                apiKey,
                model: provider === 'alibaba' ? undefined : selectedModel,
            });
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
