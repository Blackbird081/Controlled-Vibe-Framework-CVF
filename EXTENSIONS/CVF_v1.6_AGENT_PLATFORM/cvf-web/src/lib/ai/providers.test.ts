/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAI } from './providers';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('ai/providers', () => {
    beforeEach(() => {
        fetchMock.mockReset();
    });

    describe('executeAI — OpenAI', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello from OpenAI' } }],
                    usage: { total_tokens: 50 },
                }),
            });

            const result = await executeAI('openai', 'sk-test', 'Say hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from OpenAI');
            expect(result.provider).toBe('openai');
            expect(result.tokensUsed).toBe(50);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
        });

        it('handles API error response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'Rate limit exceeded' } }),
            });

            const result = await executeAI('openai', 'sk-test', 'Say hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit');
        });

        it('handles API error without message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const result = await executeAI('openai', 'sk-test', 'Say hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('OpenAI API error');
        });

        it('handles network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network failed'));

            const result = await executeAI('openai', 'sk-test', 'Say hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network failed');
        });

        it('uses custom model and options', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }],
                    usage: { total_tokens: 10 },
                }),
            });

            await executeAI('openai', 'sk-test', 'Hello', {
                model: 'gpt-4-turbo',
                maxTokens: 2000,
                temperature: 0.5,
            });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('gpt-4-turbo');
            expect(body.max_tokens).toBe(2000);
            expect(body.temperature).toBe(0.5);
        });
    });

    describe('executeAI — Claude', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    content: [{ text: 'Hello from Claude' }],
                    usage: { input_tokens: 20, output_tokens: 30 },
                }),
            });

            const result = await executeAI('claude', 'sk-ant-test', 'Say hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from Claude');
            expect(result.provider).toBe('claude');
            expect(result.tokensUsed).toBe(50);
        });

        it('handles Claude API error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'Overloaded' } }),
            });

            const result = await executeAI('claude', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Overloaded');
        });

        it('handles network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Timeout'));

            const result = await executeAI('claude', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Timeout');
        });

        it('sends correct headers', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    content: [{ text: 'ok' }],
                    usage: { input_tokens: 1, output_tokens: 1 },
                }),
            });

            await executeAI('claude', 'my-api-key', 'Hello');
            const headers = fetchMock.mock.calls[0][1].headers;
            expect(headers['x-api-key']).toBe('my-api-key');
            expect(headers['anthropic-version']).toBe('2023-06-01');
        });

        it('uses custom model when provided', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    content: [{ text: 'custom model response' }],
                    usage: { input_tokens: 10, output_tokens: 20 },
                }),
            });

            const result = await executeAI('claude', 'sk-ant-test', 'Hello', {
                model: 'claude-3-opus-20240229',
            });
            expect(result.success).toBe(true);
            expect(result.model).toBe('claude-3-opus-20240229');
            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('claude-3-opus-20240229');
        });
    });

    describe('executeAI — Gemini', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
                }),
            });

            const result = await executeAI('gemini', 'key-test', 'Say hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from Gemini');
            expect(result.provider).toBe('gemini');
        });

        it('handles Gemini API error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'Invalid key' } }),
            });

            const result = await executeAI('gemini', 'key-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid key');
        });

        it('handles network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('DNS failure'));

            const result = await executeAI('gemini', 'key-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('DNS failure');
        });

        it('includes API key in URL', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'ok' }] } }],
                }),
            });

            await executeAI('gemini', 'my-gem-key', 'Hello');
            const url = fetchMock.mock.calls[0][0];
            expect(url).toContain('key=my-gem-key');
        });

        it('uses custom model when provided', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'custom' }] } }],
                }),
            });

            const result = await executeAI('gemini', 'key-test', 'Hello', {
                model: 'gemini-1.5-pro',
            });
            expect(result.success).toBe(true);
            expect(result.model).toBe('gemini-1.5-pro');
        });
    });

    describe('executeAI — Alibaba DashScope', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello from Alibaba' } }],
                    usage: { total_tokens: 42 },
                }),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from Alibaba');
            expect(result.provider).toBe('alibaba');
            expect(result.tokensUsed).toBe(42);
        });

        it('handles Alibaba API error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'Alibaba error' } }),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Alibaba error');
        });

        it('handles Alibaba API error without message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Alibaba DashScope API error');
        });

        it('handles Alibaba network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Alibaba timeout'));

            const result = await executeAI('alibaba', 'ali-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Alibaba timeout');
        });

        it('handles Alibaba non-Error thrown objects', async () => {
            fetchMock.mockRejectedValueOnce('alibaba string error');

            const result = await executeAI('alibaba', 'ali-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
        });

        it('uses custom model and options for Alibaba', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'custom alibaba' } }],
                    usage: { total_tokens: 11 },
                }),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello', {
                model: 'qwen-max',
                maxTokens: 1234,
                temperature: 0.2,
            });

            expect(result.success).toBe(true);
            expect(result.model).toBe('qwen-max');
            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('qwen-max');
            expect(body.max_tokens).toBe(1234);
            expect(body.temperature).toBe(0.2);
        });

        it('supports QVQ streaming-only models on the compatible endpoint', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: async () => [
                    'data: {"choices":[{"delta":{"content":"","role":"assistant","reasoning_content":"Thinking"},"index":0,"finish_reason":null}],"usage":null}',
                    'data: {"choices":[{"delta":{"content":"OK"},"index":0,"finish_reason":"stop"}],"usage":null}',
                    'data: {"choices":[],"usage":{"total_tokens":105}}',
                    'data: [DONE]',
                ].join('\n'),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello', {
                model: 'qvq-max',
            });

            expect(result.success).toBe(true);
            expect(result.output).toBe('OK');
            expect(result.tokensUsed).toBe(105);

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('qvq-max');
            expect(body.stream).toBe(true);
            expect(body.stream_options).toEqual({ include_usage: true });
        });

        it('surfaces explicit compatibility guidance for unsupported QVQ snapshots', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: {
                        message: 'Unsupported model `qvq-max-2025-03-25` for OpenAI compatibility mode.',
                        code: 'model_not_supported',
                    },
                }),
            });

            const result = await executeAI('alibaba', 'ali-key', 'Hello', {
                model: 'qvq-max-2025-03-25',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('not supported on the current compatible-mode endpoint');
            expect(result.error).toContain('qvq-max');
        });
    });

    describe('executeAI — OpenRouter', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello from OpenRouter' } }],
                    usage: { total_tokens: 33 },
                }),
            });

            const result = await executeAI('openrouter', 'or-key', 'Hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from OpenRouter');
            expect(result.provider).toBe('openrouter');
            expect(result.tokensUsed).toBe(33);
        });

        it('handles OpenRouter API error without message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const result = await executeAI('openrouter', 'or-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('OpenRouter API error');
        });

        it('handles OpenRouter API error with message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'OpenRouter error' } }),
            });

            const result = await executeAI('openrouter', 'or-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('OpenRouter error');
        });

        it('handles OpenRouter network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('OpenRouter down'));

            const result = await executeAI('openrouter', 'or-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('OpenRouter down');
        });

        it('handles OpenRouter non-Error thrown objects', async () => {
            fetchMock.mockRejectedValueOnce('openrouter string error');

            const result = await executeAI('openrouter', 'or-key', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
        });

        it('sends OpenRouter headers', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'ok' } }],
                    usage: { total_tokens: 1 },
                }),
            });

            await executeAI('openrouter', 'or-key', 'Hello');
            const headers = fetchMock.mock.calls[0][1].headers;
            expect(headers['HTTP-Referer']).toBe('https://cvf.dev');
            expect(headers['X-Title']).toBe('CVF Agent Platform');
        });

        it('uses custom model and options for OpenRouter', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'custom openrouter' } }],
                    usage: { total_tokens: 9 },
                }),
            });

            const result = await executeAI('openrouter', 'or-key', 'Hello', {
                model: 'openrouter/custom-model',
                maxTokens: 2222,
                temperature: 0.4,
            });

            expect(result.success).toBe(true);
            expect(result.model).toBe('openrouter/custom-model');
            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('openrouter/custom-model');
            expect(body.max_tokens).toBe(2222);
            expect(body.temperature).toBe(0.4);
        });
    });

    describe('executeAI — DeepSeek', () => {
        it('returns success with parsed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello from DeepSeek' } }],
                    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
                }),
            });

            const result = await executeAI('deepseek', 'sk-test', 'Hello');
            expect(result.success).toBe(true);
            expect(result.output).toBe('Hello from DeepSeek');
            expect(result.provider).toBe('deepseek');
            expect(result.tokensUsed).toBe(12);
            expect(result.usage?.inputTokens).toBe(5);
            expect(result.usage?.outputTokens).toBe(7);
        });

        it('uses the direct DeepSeek endpoint and custom options', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'custom deepseek' } }],
                    usage: { total_tokens: 9 },
                }),
            });

            const result = await executeAI('deepseek', 'sk-test', 'Hello', {
                model: 'deepseek-reasoner',
                maxTokens: 2048,
                temperature: 0.3,
            });

            expect(result.success).toBe(true);
            expect(fetchMock.mock.calls[0][0]).toBe('https://api.deepseek.com/chat/completions');
            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe('deepseek-reasoner');
            expect(body.max_tokens).toBe(2048);
            expect(body.temperature).toBe(0.3);
        });

        it('handles DeepSeek API errors', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'DeepSeek auth failed' } }),
            });

            const result = await executeAI('deepseek', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('DeepSeek auth failed');
        });
    });

    describe('executeAI — unknown provider', () => {
        it('returns error for unknown provider', async () => {
            const result = await executeAI('not-a-provider' as unknown as Parameters<typeof executeAI>[0], 'key', 'hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown provider');
        });
    });

    describe('executeAI — error type handling', () => {
        it('handles non-Error thrown objects', async () => {
            fetchMock.mockRejectedValueOnce('string error');

            const result = await executeAI('openai', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
        });

        it('handles non-Error thrown objects for Claude', async () => {
            fetchMock.mockRejectedValueOnce('claude string error');

            const result = await executeAI('claude', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
        });

        it('handles non-Error thrown objects for Gemini', async () => {
            fetchMock.mockRejectedValueOnce(42);

            const result = await executeAI('gemini', 'key-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
        });

        it('handles Claude API error without message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const result = await executeAI('claude', 'sk-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Claude API error');
        });

        it('handles Gemini API error without message', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const result = await executeAI('gemini', 'key-test', 'Hello');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Gemini API error');
        });
    });
});
