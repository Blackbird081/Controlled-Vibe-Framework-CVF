/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitToOpenClaw, fetchProposals } from './openclaw-config';

describe('openclaw-config API helpers', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('submits message with provider settings to /api/openclaw', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ decision: { status: 'approved' } }),
        });

        const result = await submitToOpenClaw('Deploy auth system', {
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'gemini-2.5-flash',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/openclaw');
        expect(options.method).toBe('POST');

        const payload = JSON.parse(options.body as string);
        expect(payload).toEqual({
            message: 'Deploy auth system',
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'gemini-2.5-flash',
        });
        expect(result.decision.status).toBe('approved');
    });

    it('throws an API error when submitToOpenClaw receives a non-ok response', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValue({}),
        });

        await expect(submitToOpenClaw('test')).rejects.toThrow('API error: 500');
    });

    it('returns proposals from /api/openclaw', async () => {
        const proposals = [
            {
                id: 'p-123',
                action: 'Deploy auth system',
                source: 'openclaw',
                riskLevel: 'low',
                state: 'approved',
                time: 'now',
            },
        ];
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ proposals }),
        });

        await expect(fetchProposals()).resolves.toEqual(proposals);
        expect(fetchMock).toHaveBeenCalledWith('/api/openclaw');
    });

    it('returns empty array when proposal endpoint is non-ok', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 503,
            json: vi.fn().mockResolvedValue({}),
        });

        await expect(fetchProposals()).resolves.toEqual([]);
    });

    it('returns empty array when proposal fetch fails', async () => {
        fetchMock.mockRejectedValue(new Error('network failure'));

        await expect(fetchProposals()).resolves.toEqual([]);
    });
});
