/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { submitToOpenClaw, fetchProposals, useOpenClawConfig } from './openclaw-config';

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
        expect((result.decision as { status: string }).status).toBe('approved');
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

describe('useOpenClawConfig', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads default config when storage is empty', () => {
        const { result } = renderHook(() => useOpenClawConfig());
        expect(result.current.config).toEqual({ enabled: false, mode: 'disabled' });
        expect(result.current.statusBadge.isActive).toBe(false);
    });

    it('loads config from localStorage when present', () => {
        localStorage.setItem('cvf_openclaw_config', JSON.stringify({ enabled: true, mode: 'full' }));
        const { result } = renderHook(() => useOpenClawConfig());
        expect(result.current.config).toEqual({ enabled: true, mode: 'full' });
        expect(result.current.statusBadge.isActive).toBe(true);
    });

    it('disables mode when enabled is set to false', () => {
        const { result } = renderHook(() => useOpenClawConfig());
        act(() => {
            result.current.updateConfig({ enabled: false, mode: 'full' });
        });
        expect(result.current.config).toEqual({ enabled: false, mode: 'disabled' });
    });

    it('auto-enables proposal-only when enabling from disabled', () => {
        const { result } = renderHook(() => useOpenClawConfig());
        act(() => {
            result.current.toggleEnabled();
        });
        expect(result.current.config.enabled).toBe(true);
        expect(result.current.config.mode).toBe('proposal-only');
    });

    it('setMode updates enabled flag consistently', () => {
        const { result } = renderHook(() => useOpenClawConfig());
        act(() => {
            result.current.setMode('full');
        });
        expect(result.current.config).toEqual({ enabled: true, mode: 'full' });

        act(() => {
            result.current.setMode('disabled');
        });
        expect(result.current.config).toEqual({ enabled: false, mode: 'disabled' });
    });
});
