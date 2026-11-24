/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { useProviders, mapSettingsProviderToExecutionProvider, resolveClaudeReadinessModel, selectExecutionProviderModel, nativeModelReadout } from './useExecute';
afterEach(() => vi.unstubAllGlobals());
describe('provider readiness observations', () => {
    it('clears previous readiness on failed or malformed status rather than retaining green', async () => {
        const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ providers: [{ provider: 'claude', configured: true, executionSurface: 'claude_cli_subscription' }], anyConfigured: true }) })
            .mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ providers: 'invalid' }) });
        vi.stubGlobal('fetch', fetch); const { result } = renderHook(() => useProviders());
        await act(() => result.current.fetchProviders()); expect(result.current.anyConfigured).toBe(true);
        await act(() => result.current.fetchProviders()); expect(result.current.providers).toEqual([]); expect(result.current.anyConfigured).toBe(false);
        await act(() => result.current.fetchProviders()); expect(result.current.providers).toEqual([]); expect(result.current.isLoading).toBe(false);
    });
});

describe('pure provider and native model ownership', () => {
    it('preserves selected provider/model mapping without any request effect', () => {
        const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
        expect(mapSettingsProviderToExecutionProvider()).toBeUndefined();
        expect(mapSettingsProviderToExecutionProvider('anthropic')).toBe('claude');
        expect(mapSettingsProviderToExecutionProvider('alibaba')).toBe('alibaba');
        expect(selectExecutionProviderModel({ preferences: { defaultProvider: 'anthropic' }, providers: { anthropic: { selectedModel: 'api-model' } } } as never)).toEqual({ executionProvider: 'claude', selectedModel: 'api-model' });
        expect(resolveClaudeReadinessModel({ providers: [{ provider: 'claude', executionSurface: 'claude_cli_subscription', nativeAuthState: 'available', readiness: 'live_task_ready', model: 'sonnet' }] }, 'api-model')).toBe('sonnet');
        expect(resolveClaudeReadinessModel({ providers: [{ provider: 'claude', configured: true }] }, 'api-model')).toBe('api-model');
        expect(fetch).not.toHaveBeenCalled();
    });
    it('keeps exact unknown/not-ready errors without auth or inference effects', () => {
        expect(() => resolveClaudeReadinessModel({ providers: 'invalid' }, 'old')).toThrow('Claude readiness is unknown.');
        expect(() => resolveClaudeReadinessModel({ providers: [{ provider: 'claude', executionSurface: 'claude_cli_subscription', nativeAuthState: 'unknown' }] }, 'old')).toThrow('Claude subscription is not ready. Inspect native sign-in before another run.');
    });
    // Text Encoding Exception: exact Vietnamese product strings are the readout contract.
    it('keeps native-only alias/observed rendered text and exact single space in both languages', () => {
        expect(nativeModelReadout(null, false)).toBeUndefined();
        expect(nativeModelReadout({ executionSurface: 'api' }, true)).toBeUndefined();
        expect(nativeModelReadout({ executionSurface: 'claude_cli_subscription' }, false)).toBe('Alias: sonnet; observed model: unknown');
        expect(nativeModelReadout({ executionSurface: 'claude_cli_subscription' }, true)).toBe('Bí danh: sonnet; model quan sát: chưa rõ');
        expect(nativeModelReadout({ executionSurface: 'claude_cli_subscription', observedModelId: 'fixture-observed' }, false)).toBe('Alias: sonnet; observed model: fixture-observed');
    });
});
