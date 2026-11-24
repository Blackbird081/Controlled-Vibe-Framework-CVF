/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModals } from './useModals';

describe('useModals', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('starts a first-time user without opening legacy onboarding', async () => {
        const { result } = renderHook(() => useModals());
        await act(async () => { await Promise.resolve(); });
        expect(result.current.showOnboarding).toBe(false);
        expect(result.current.showQuickStart).toBe(false);
    });

    it('opens the legacy starter only on explicit request', () => {
        const { result } = renderHook(() => useModals());
        act(() => result.current.openModal('quickStart'));
        expect(result.current.showQuickStart).toBe(true);
    });

    it('respects permission gates for settings, ai usage, and context modals', () => {
        const { result } = renderHook(() => useModals({
            canUseSettings: false,
            canUseAIUsage: false,
            canUseContext: false,
        }));

        act(() => {
            result.current.openModal('settings');
            result.current.openModal('aiUsage');
            result.current.openModal('userContext');
            result.current.openModal('apiKeyWizard');
            result.current.openModal('quickStart');
        });

        expect(result.current.showSettings).toBe(false);
        expect(result.current.showAIUsage).toBe(false);
        expect(result.current.showUserContext).toBe(false);
        expect(result.current.showApiKeyWizard).toBe(false);
        expect(result.current.showQuickStart).toBe(true);
    });
});
