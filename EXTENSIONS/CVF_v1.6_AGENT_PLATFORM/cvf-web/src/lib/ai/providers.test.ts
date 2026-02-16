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
    });

    describe('executeAI — unknown provider', () => {
        it('returns error for unknown provider', async () => {
            const result = await executeAI('deepseek' as any, 'key', 'hello');
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
    });
});
