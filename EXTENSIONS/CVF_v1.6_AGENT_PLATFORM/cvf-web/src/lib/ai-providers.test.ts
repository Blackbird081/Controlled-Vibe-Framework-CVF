/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GeminiProvider, OpenAIProvider, AnthropicProvider, createAIProvider, getCVFSystemPrompt, useAI } from './ai-providers';

let settings = {
    preferences: { defaultProvider: 'openai' },
    providers: {
        gemini: { apiKey: '', selectedModel: 'gemini-2.5-flash' },
        openai: { apiKey: 'test-key', selectedModel: 'gpt-4o' },
        anthropic: { apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
    },
};

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings }),
}));

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('ai-providers', () => {
    beforeEach(() => {
        settings = {
            preferences: { defaultProvider: 'openai' },
            providers: {
                gemini: { apiKey: '', selectedModel: 'gemini-2.5-flash' },
                openai: { apiKey: 'test-key', selectedModel: 'gpt-4o' },
                anthropic: { apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
            },
        };
    });

    it('creates provider instances', () => {
        expect(createAIProvider('gemini', { apiKey: 'k' })).toBeInstanceOf(GeminiProvider);
        expect(createAIProvider('openai', { apiKey: 'k' })).toBeInstanceOf(OpenAIProvider);
        expect(createAIProvider('anthropic', { apiKey: 'k' })).toBeInstanceOf(AnthropicProvider);
    });

    it('returns localized CVF system prompt', () => {
        expect(getCVFSystemPrompt('vi')).toContain('CVF Agent');
        expect(getCVFSystemPrompt('en')).toContain('Controlled-Vibe Framework');
    });

    it('GeminiProvider parses standard response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'stop' }],
                usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new GeminiProvider({ apiKey: 'key', model: 'gemini-2.5-flash' });
        const response = await provider.chat([{ role: 'user', content: 'Hello' }]);

        expect(fetchMock).toHaveBeenCalled();
        expect(response.text).toBe('hi');
        expect(response.usage?.totalTokens).toBe(3);
    });

    it('GeminiProvider prefixes system prompt into the first message', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'stop' }],
                usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new GeminiProvider({ apiKey: 'key', model: 'gemini-2.5-flash', language: 'en' });
        await provider.chat([{ role: 'user', content: 'Hello' }]);

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.contents[0].parts[0].text).toContain(getCVFSystemPrompt('en'));
    });

    it('GeminiProvider streams response chunks', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}]}\n'));
                controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":" there"}]}}]}\n'));
                controller.close();
            }
        });
        const response = new Response(stream, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new GeminiProvider({ apiKey: 'key', model: 'gemini-2.5-flash' });
        const chunks: string[] = [];
        const result = await provider.chat([{ role: 'user', content: 'Hello' }], (chunk) => {
            if (!chunk.isComplete) chunks.push(chunk.text);
        });

        expect(chunks.join('')).toBe('Hi there');
        expect(result.text).toBe('Hi there');
    });

    it('GeminiProvider throws when API fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: { message: 'bad request' } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new GeminiProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }])).rejects.toThrow('Gemini API Error');
    });

    it('OpenAIProvider parses standard response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'hello' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new OpenAIProvider({ apiKey: 'key', model: 'gpt-4o' });
        const response = await provider.chat([{ role: 'user', content: 'Hello' }]);

        expect(fetchMock).toHaveBeenCalled();
        expect(response.text).toBe('hello');
        expect(response.usage?.totalTokens).toBe(3);
    });

    it('OpenAIProvider streams response chunks', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"He"}}]}\n'));
                controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"llo"}}]}\n'));
                controller.enqueue(encoder.encode('data: [DONE]\n'));
                controller.close();
            }
        });
        const response = new Response(stream, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new OpenAIProvider({ apiKey: 'key', model: 'gpt-4o' });
        const chunks: string[] = [];
        const result = await provider.chat([{ role: 'user', content: 'Hello' }], (chunk) => {
            if (!chunk.isComplete) chunks.push(chunk.text);
        });

        expect(chunks.join('')).toBe('Hello');
        expect(result.text).toBe('Hello');
    });

    it('OpenAIProvider throws when API fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: { message: 'unauthorized' } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new OpenAIProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }])).rejects.toThrow('OpenAI API Error');
    });

    it('AnthropicProvider parses standard response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [{ text: 'hey' }],
                usage: { input_tokens: 2, output_tokens: 3 },
                stop_reason: 'end_turn',
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new AnthropicProvider({ apiKey: 'key', model: 'claude-sonnet-4-20250514' });
        const response = await provider.chat([{ role: 'user', content: 'Hello' }]);

        expect(fetchMock).toHaveBeenCalled();
        expect(response.text).toBe('hey');
        expect(response.usage?.totalTokens).toBe(5);
    });

    it('AnthropicProvider throws when API fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: { message: 'bad request' } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new AnthropicProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }])).rejects.toThrow('Anthropic API Error');
    });

    it('useAI returns error when API key is missing', async () => {
        settings = {
            preferences: { defaultProvider: 'openai' },
            providers: {
                gemini: { apiKey: '', selectedModel: 'gemini-2.5-flash' },
                openai: { apiKey: '', selectedModel: 'gpt-4o' },
                anthropic: { apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
            },
        };

        const { result } = renderHook(() => useAI());
        const response = await act(async () => result.current.sendMessage([{ role: 'user', content: 'Hi' }]));

        expect(response).toBeNull();
        expect(result.current.error).toBe('No API key configured');
    });

    it('useAI sends message with provider', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() => useAI());
        const response = await act(async () => result.current.sendMessage([{ role: 'user', content: 'Hi' }]));

        expect(fetchMock).toHaveBeenCalled();
        expect(response?.text).toBe('ok');
    });
});
