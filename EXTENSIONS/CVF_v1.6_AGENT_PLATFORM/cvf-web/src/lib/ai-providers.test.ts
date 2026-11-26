/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: Vietnamese equipment-safety fixtures use UTF-8.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GeminiProvider, OpenAIProvider, AnthropicProvider, OpenRouterProvider, createAIProvider, getCVFSystemPrompt, useAI } from './ai-providers';

const message = { role: 'user', content: 'Hello' } as const;

function responseStream(...chunks: string[]): Response {
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
        start(controller) {
            chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
            controller.close();
        },
    }), { status: 200 });
}

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

    it.each(['gemini', 'openai', 'anthropic', 'alibaba', 'openrouter', 'deepseek'] as const)(
        '%s keeps a 401 body out of the error path', async (provider) => {
            const key = 'fixture-401-do-not-log';
            const response = Response.json({ error: { message: `Echo: ${key}` } }, { status: 401 });
            const parse = vi.spyOn(response, 'json');
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
            await expect(createAIProvider(provider, { apiKey: key }).chat([message])).rejects.toThrow(/HTTP 401$/);
            expect(parse).not.toHaveBeenCalled();
        },
    );

    it.each(['gemini', 'openai', 'anthropic', 'alibaba', 'openrouter', 'deepseek'] as const)(
        '%s reports a 429 and its wait without reading the response body', async (provider) => {
            const body = Response.json({ error: { message: 'sensitive provider text' } }, {
                status: 429, headers: { 'Retry-After': '3' },
            });
            const parse = vi.spyOn(body, 'json');
            const fetchMock = vi.fn().mockResolvedValue(body);
            vi.stubGlobal('fetch', fetchMock);
            await expect(createAIProvider(provider, { apiKey: 'test-key' }).chat([message])).rejects.toMatchObject({
                name: 'AssistantRateLimitError', message: 'HTTP 429', retryAfter: '3',
            });
            expect(parse).not.toHaveBeenCalled();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        },
    );

    it('throws on unknown provider', () => {
        expect(() => createAIProvider('unknown' as unknown as 'gemini', { apiKey: 'k' })).toThrow('Unknown provider');
    });

    it('uses mock provider when env flag is enabled', async () => {
        const original = process.env.NEXT_PUBLIC_CVF_MOCK_AI;
        process.env.NEXT_PUBLIC_CVF_MOCK_AI = '1';
        vi.resetModules();

        const mod = await import('./ai-providers');
        const enProvider = mod.createAIProvider('openai', { apiKey: 'k', language: 'en' });
        const viProvider = mod.createAIProvider('openai', { apiKey: 'k', language: 'vi' });

        const simple = await enProvider.chat([{ role: 'user', content: 'Hello' }]);
        const governance = await enProvider.chat([{ role: 'user', content: 'CVF GOVERNANCE RULES' }]);
        const full = await viProvider.chat([{ role: 'user', content: 'CVF FULL MODE PROTOCOL' }]);

        expect(simple.text).toContain('MOCK_SIMPLE_RESPONSE');
        expect(governance.text).toContain('MOCK_GOVERNANCE_RESPONSE');
        expect(full.text).toContain('MOCK_FULL_RESPONSE');

        process.env.NEXT_PUBLIC_CVF_MOCK_AI = original;
        vi.resetModules();
    });

    it('returns localized CVF system prompt', () => {
        expect(getCVFSystemPrompt('vi')).toContain('CVF Agent');
        expect(getCVFSystemPrompt('en')).toContain('Controlled-Vibe Framework');
        expect(getCVFSystemPrompt('vi')).toContain('`docs/baselines/...`');
    });

    it.each([
        ['en', 'My cooker smells like gas. Can I fix it? Give me local contact details.',
            'Move to safety and contact local emergency services through an official number. Ask a qualified technician to inspect the cooker.'],
        ['vi', 'Máy nước nóng bị rò nước. Tôi có thể tháo máy ra sửa không? Cho tôi địa chỉ gần nhất.',
            'Hãy tránh xa thiết bị, liên hệ hãng sản xuất qua trang hỗ trợ chính thức hoặc gọi kỹ thuật viên có chuyên môn.'],
    ] as const)('sends the shared safety guidance to the assistant provider (%s)', async (language, request, reply) => {
        const fetchMock = vi.fn().mockResolvedValue(Response.json({
            choices: [{ message: { content: reply }, finish_reason: 'stop' }],
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await new OpenAIProvider({ apiKey: 'fixture-key', language }).chat([{ role: 'user', content: request }]);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.messages[0]).toMatchObject({ role: 'system', content: getCVFSystemPrompt(language) });
        expect(body.messages[0].content).toContain('Never invent phone numbers, addresses, sources, citations, or links.');
        expect(body.messages[0].content).toContain('electrical, gas, or water equipment');
        expect(body.messages[0].content).toContain('the manufacturer\'s official support or a qualified technician');
        expect(body.messages[1]).toEqual({ role: 'user', content: request });
        expect(result.text).toBe(reply);
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

    it('GeminiProvider handles empty messages without prefixing system prompt', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'stop' }],
                usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new GeminiProvider({ apiKey: 'key', model: 'gemini-2.5-flash', language: 'en' });
        await provider.chat([]);

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.contents.length).toBe(0);
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
                controller.enqueue(encoder.encode('data: {invalid json}\n'));
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

    it.each(['gemini-4-hydrogen', 'gemini-4-argon', 'gemini-4-neon', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'])(
        'GeminiProvider sends the supported generation parameters for %s', async model => {
            const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ thought: true, text: 'omit' }, { text: 'Hello' }, { text: ' world' }] } }],
            })));
            vi.stubGlobal('fetch', fetchMock);

            const response = await new GeminiProvider({ apiKey: 'test-key', model }).chat([message]);
            const [url, init] = fetchMock.mock.calls[0];
            const body = JSON.parse(init.body);
            expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
            expect(init.headers['x-goog-api-key']).toBe('test-key');
            expect(body.generationConfig.maxOutputTokens).toBe(8192);
            expect(body.generationConfig.temperature).toBe(model.startsWith('gemini-2.') ? 0.7 : undefined);
            expect(body.generationConfig.thinkingConfig).toEqual(model.startsWith('gemini-4-') ? { thinkingLevel: 'LOW' } : undefined);
            if (!model.startsWith('gemini-2.')) {
                expect(body.systemInstruction.parts[0].text).toBe(getCVFSystemPrompt('vi'));
                expect(body.contents[0].parts[0].text).toBe(message.content);
            }
            expect(response.text).toBe('Hello world');
            expect(response.model).toBe(model);
        },
    );

    it('keeps Gemini thought parts out of streamed text and preserves finish and usage', async () => {
        const fetchMock = vi.fn().mockResolvedValue(responseStream(
            'data: {"candidates":[{"content":{"parts":[{"thought":true,"text":"omit"},{"text":"Hel',
            'lo"}]}}]}\r\n\r\n',
            'data: {"candidates":[{"finishReason":"MAX_TOKENS"}],"usageMetadata":{"promptTokenCount":1,"candidatesTokenCount":2,"totalTokenCount":3}}',
        ));
        vi.stubGlobal('fetch', fetchMock);
        const stream = vi.fn();
        const result = await new GeminiProvider({ apiKey: 'key', model: 'gemini-4-hydrogen' }).chat([message], stream);
        expect(fetchMock.mock.calls[0][0]).toMatch(/:streamGenerateContent\?alt=sse$/);
        expect(stream.mock.calls.flat()).toEqual([{ text: 'Hello', isComplete: false }, { text: '', isComplete: true }]);
        expect(result).toMatchObject({ text: 'Hello', finishReason: 'MAX_TOKENS', usage: { totalTokens: 3 } });
    });

    it('reports a Gemini model prefill before making a rejected request', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(new GeminiProvider({ apiKey: 'key' }).chat([message, { role: 'assistant', content: 'Prefix' }]))
            .rejects.toThrow('Finish the conversation with a user message');
        expect(fetchMock).not.toHaveBeenCalled();
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

    it('GeminiProvider throws when streaming response has no body', async () => {
        const response = new Response(null, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new GeminiProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }], () => {})).rejects.toThrow('Gemini API Error');
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

    it('OpenAIProvider uses max_completion_tokens for GPT-5 family models', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'hello' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const provider = new OpenAIProvider({ apiKey: 'key', model: 'gpt-5.4-mini' });
        await provider.chat([{ role: 'user', content: 'Hello' }]);

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.max_completion_tokens).toBe(4096);
        expect(body.max_tokens).toBeUndefined();
        expect(body.temperature).toBeUndefined();
    });

    it.each([
        ['gpt-6-luna', 'none'],
        ['gpt-6.1-terra', 'none'],
        ['gpt-6.2-sol', 'low'],
        ['gpt-6.2-astra', 'low'],
        ['gpt-4o', undefined],
        ['gpt-4o-mini', undefined],
    ])('sends the compatible native OpenAI Chat Completions request for %s', async (model, reasoning) => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Hello' } }] })));
        vi.stubGlobal('fetch', fetchMock);

        await new OpenAIProvider({ apiKey: 'key', model }).chat([message]);
        const [url, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(url).toBe('https://api.openai.com/v1/chat/completions');
        expect(body.model).toBe(model);
        expect(body.reasoning_effort).toBe(reasoning);
        expect(body.temperature).toBe(reasoning ? undefined : 0.7);
        expect(body.max_tokens).toBe(reasoning ? undefined : 4096);
        expect(body.max_completion_tokens).toBe(reasoning ? 4096 : undefined);
    });

    it('uses Luna when the OpenAI assistant has no selected model', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Hello' } }] })));
        vi.stubGlobal('fetch', fetchMock);

        const result = await createAIProvider('openai', { apiKey: 'key' }).chat([message]);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
            model: 'gpt-6-luna', reasoning_effort: 'none',
        });
        expect(result.model).toBe('gpt-6-luna');
    });

    it('requests native GPT-6 stream usage and preserves an explicit token-limit finish reason', async () => {
        const fetchMock = vi.fn().mockResolvedValue(responseStream(
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":"length"}]}\n',
            'data: {"choices":[],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}\n',
            'data: [DONE]',
        ));
        vi.stubGlobal('fetch', fetchMock);
        const stream = vi.fn();
        const result = await new OpenAIProvider({ apiKey: 'key', model: 'gpt-6-luna' }).chat([message], stream);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).stream_options).toEqual({ include_usage: true });
        expect(result).toMatchObject({ text: 'Hello', finishReason: 'length', usage: { totalTokens: 5 } });
        expect(stream).toHaveBeenLastCalledWith({ text: '', isComplete: true });
    });

    it.each([
        [undefined, 'deepseek-flash', 'disabled'],
        ['deepseek-flash', 'deepseek-flash', 'disabled'],
        ['deepseek-v4-pro', 'deepseek-v4-pro', 'disabled'],
        ['deepseek-chat', 'deepseek-flash', 'disabled'],
        ['deepseek-reasoner', 'deepseek-flash', 'enabled'],
    ])('targets the correct DeepSeek Chat Completions model for %s', async (model, selectedModel, thinking) => {
        const fetchMock = vi.fn().mockResolvedValue(responseStream(
            'data: {"choices":[{"delta":{"reasoning_content":"omit"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n',
        ));
        vi.stubGlobal('fetch', fetchMock);
        const stream = vi.fn();
        const result = await createAIProvider('deepseek', { apiKey: 'key', model }).chat([message], stream);
        const [url, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(url).toBe('https://api.deepseek.com/chat/completions');
        expect(body).toMatchObject({ model: selectedModel, max_tokens: 4096, thinking: { type: thinking }, stream: true });
        expect(body.max_completion_tokens).toBeUndefined();
        expect(body.temperature).toBeUndefined();
        expect(result).toMatchObject({ model: selectedModel, text: 'Hello', finishReason: 'stop' });
        expect(stream.mock.calls.flat()).toEqual([{ text: 'Hello', isComplete: false }, { text: '', isComplete: true }]);
    });

    it('preserves the default OpenRouter request and surfaces errors inside an HTTP 200 stream', async () => {
        const fetchMock = vi.fn().mockResolvedValue(responseStream(
            'data: {"error":{"message":"Upstream disconnected"},"choices":[{"finish_reason":"error"}]}\n\n',
        ));
        vi.stubGlobal('fetch', fetchMock);
        const stream = vi.fn();
        await expect(new OpenRouterProvider({ apiKey: 'key' }).chat([message], stream)).rejects.toThrow('Upstream disconnected');
        expect(fetchMock.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ model: 'meta-llama/llama-4-maverick', max_tokens: 4096 });
        expect(stream).not.toHaveBeenCalled();
    });

    it('OpenAIProvider streams response chunks', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('data: {not-json}\n'));
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

    it('OpenAIProvider throws when streaming response has no body', async () => {
        const response = new Response(null, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new OpenAIProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }], () => {})).rejects.toThrow('OpenAI API Error');
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

    it('AnthropicProvider streams content blocks and ignores non-delta events', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('data: {"type":"ping"}\n'));
                controller.enqueue(encoder.encode('data: {invalid}\n'));
                controller.enqueue(encoder.encode('data: {"type":"content_block_delta","delta":{"text":"Hi"}}\n'));
                controller.enqueue(encoder.encode('data: {"type":"content_block_delta","delta":{"text":" there"}}\n'));
                controller.close();
            }
        });
        const response = new Response(stream, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new AnthropicProvider({ apiKey: 'key' });
        const chunks: string[] = [];
        const result = await provider.chat([{ role: 'user', content: 'Hello' }], (chunk) => {
            if (!chunk.isComplete) chunks.push(chunk.text);
        });

        expect(chunks.join('')).toBe('Hi there');
        expect(result.text).toBe('Hi there');
    });

    it.each([undefined, 'claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'])(
        'AnthropicProvider uses Messages and joins visible text for %s', async model => {
            const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
                content: [{ type: 'thinking', thinking: 'omit' }, { type: 'text', text: 'Hello' }, { type: 'text', text: ' world' }],
                stop_reason: 'max_tokens',
            })));
            vi.stubGlobal('fetch', fetchMock);
            const result = await new AnthropicProvider({ apiKey: 'key', model }).chat([message]);
            expect(fetchMock.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
            expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ model: model ?? 'claude-sonnet-5-5', max_tokens: 4096 });
            expect(result).toMatchObject({ text: 'Hello world', finishReason: 'max_tokens' });
        },
    );

    it('AnthropicProvider preserves Claude text, cumulative usage, and stop reason in streams', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(
            'data: {"type":"message_start","message":{"usage":{"input_tokens":5,"output_tokens":1}}}\n',
            'data: {"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"omit"}}\n',
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n',
            'data: {"type":"message_delta","delta":{"stop_reason":"max_tokens"},"usage":{"output_tokens":9}}\n',
            'data: {"type":"message_stop"}',
        )));
        const stream = vi.fn();
        const result = await new AnthropicProvider({ apiKey: 'key', model: 'claude-opus-5-5' }).chat([message], stream);
        expect(result).toMatchObject({ text: 'Hello', finishReason: 'max_tokens', usage: { promptTokens: 5, completionTokens: 9, totalTokens: 14 } });
        expect(stream.mock.calls.flat()).toEqual([{ text: 'Hello', isComplete: false }, { text: '', isComplete: true }]);
    });

    it('AnthropicProvider throws when streaming response has no body', async () => {
        const response = new Response(null, { status: 200 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const provider = new AnthropicProvider({ apiKey: 'key' });
        await expect(provider.chat([{ role: 'user', content: 'Hello' }], () => {})).rejects.toThrow('Anthropic API Error');
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

    it('useAI stores error when provider throws', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: { message: 'boom' } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() => useAI());
        const response = await act(async () => result.current.sendMessage([{ role: 'user', content: 'Hi' }]));

        expect(response).toBeNull();
        expect(result.current.error).toContain('OpenAI API Error');
    });

    it('useAI sends the user-selected model to the active provider', async () => {
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

        expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('gpt-4o');
        expect(response?.text).toBe('ok');
    });
});
