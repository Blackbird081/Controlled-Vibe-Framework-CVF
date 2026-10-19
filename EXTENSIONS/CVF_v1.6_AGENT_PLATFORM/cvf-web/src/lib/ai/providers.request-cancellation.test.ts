import { afterEach, describe, expect, it, vi } from 'vitest';
import { executeAI } from './providers';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); delete process.env.CVF_AI_PROVIDER_TIMEOUT_MS; });

describe('selected Alibaba request cancellation', () => {
    it('passes a composed signal to fetch and returns only fixed cancellation data', async () => {
        const incoming = new AbortController();
        let observed: AbortSignal | undefined;
        const fetchMock = vi.fn((_url: string, init: RequestInit) => {
            observed = init.signal as AbortSignal;
            return new Promise<Response>((_resolve, reject) => {
                observed!.addEventListener('abort', () => reject(new Error('private reason from abort')), { once: true });
            });
        });
        vi.stubGlobal('fetch', fetchMock);
        const pending = executeAI('alibaba', 'test-key', 'synthetic prompt', { model: 'qwen-flash', signal: incoming.signal });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(observed?.aborted).toBe(false);
        incoming.abort('private reason from caller');
        expect(observed?.aborted).toBe(true);
        const result = await pending;
        expect(result).toMatchObject({ success: false, diagnostic: { class: 'request_cancelled', retryable: false, userAction: 'none' } });
        expect(JSON.stringify(result)).not.toContain('private reason');
    });

    it('rejects a provider that ignores abort and returns a late success', async () => {
        const incoming = new AbortController();
        let complete!: (value: Response) => void;
        vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { complete = resolve; })));
        const pending = executeAI('alibaba', 'test-key', 'synthetic prompt', { model: 'qwen-flash', signal: incoming.signal });
        incoming.abort('private reason');
        complete({ ok: true, json: async () => ({ choices: [{ message: { content: 'late output' }, finish_reason: 'stop' }] }) } as Response);
        const result = await pending;
        expect(result.success).toBe(false);
        expect(result.output).toBeUndefined();
        expect(result.diagnostic?.class).toBe('request_cancelled');
    });

    it('keeps the no-signal Alibaba neighbor successful', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true, json: async () => ({ choices: [{ message: { content: 'normal output' }, finish_reason: 'stop' }] }),
        })));
        const result = await executeAI('alibaba', 'test-key', 'synthetic prompt', { model: 'qwen-flash' });
        expect(result.success).toBe(true);
        expect(result.output).toBe('normal output');
    });

    it('keeps the provider deadline distinct and retryable', async () => {
        vi.useFakeTimers();
        process.env.CVF_AI_PROVIDER_TIMEOUT_MS = '1000';
        vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
            (init.signal as AbortSignal).addEventListener('abort', () => reject(new Error('deadline abort')), { once: true });
        })));
        const pending = executeAI('alibaba', 'test-key', 'synthetic prompt', { model: 'qwen-flash' });
        await vi.advanceTimersByTimeAsync(1000);
        const result = await pending;
        expect(result).toMatchObject({ success: false, diagnostic: { class: 'provider_timeout', retryable: true, userAction: 'wait_and_retry' } });
    });
});
