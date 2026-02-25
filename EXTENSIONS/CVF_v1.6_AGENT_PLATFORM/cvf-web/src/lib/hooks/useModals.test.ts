/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModals } from './useModals';

describe('useModals', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('shows onboarding after mount when onboarding is not completed', async () => {
        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
        const { result } = renderHook(() => useModals());

        await waitFor(() => {
            expect(result.current.showOnboarding).toBe(true);
        });
        expect(getItemSpy).toHaveBeenCalledWith('cvf_onboarding_complete');
    });

    it('keeps onboarding hidden when onboarding is already completed', async () => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        const { result } = renderHook(() => useModals());

        await waitFor(() => {
            expect(result.current.showOnboarding).toBe(false);
        });
    });

    it('handles onboarding completion and persists completion flag', async () => {
        const { result } = renderHook(() => useModals());

        await waitFor(() => {
            expect(result.current.showOnboarding).toBe(true);
        });

        act(() => {
            result.current.handleOnboardingComplete();
        });

        expect(result.current.showOnboarding).toBe(false);
        expect(localStorage.getItem('cvf_onboarding_complete')).toBe('true');
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
        });

        expect(result.current.showSettings).toBe(false);
        expect(result.current.showAIUsage).toBe(false);
        expect(result.current.showUserContext).toBe(false);
        expect(result.current.showApiKeyWizard).toBe(true);
    });
});
