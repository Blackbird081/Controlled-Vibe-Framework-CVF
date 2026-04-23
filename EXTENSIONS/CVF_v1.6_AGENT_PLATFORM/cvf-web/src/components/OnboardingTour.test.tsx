import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OnboardingTour } from './OnboardingTour';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (k: string) => k }),
}));

const STORAGE_KEY = 'cvf_onboarding_seen';

beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
});

describe('OnboardingTour', () => {
    it('renders after delay when cvf_onboarding_seen is not set', async () => {
        render(<OnboardingTour />);
        expect(screen.queryByRole('dialog')).toBeNull();
        await act(async () => { vi.advanceTimersByTime(700); });
        expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('does not render when cvf_onboarding_seen=1 is already in localStorage', async () => {
        localStorage.setItem(STORAGE_KEY, '1');
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('shows step 1 of 3 content on first render', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        expect(screen.getByText('1 / 3')).toBeTruthy();
        expect(screen.getByText(/Pick a task from the template gallery/i)).toBeTruthy();
    });

    it('advances to step 2 when Next is clicked', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('2 / 3')).toBeTruthy();
        expect(screen.getByText(/CVF checks every request/i)).toBeTruthy();
    });

    it('advances to step 3 and shows provider settings link', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('3 / 3')).toBeTruthy();
        expect(screen.getByText(/Connect an AI provider/i)).toBeTruthy();
        expect(screen.getByText(/Open Settings/i)).toBeTruthy();
    });

    it('goes back to previous step when Back is clicked', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('2 / 3')).toBeTruthy();
        fireEvent.click(screen.getByText('← Back'));
        expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('dismisses tour and sets localStorage when X button clicked', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('dismisses tour and sets localStorage when Get started is clicked', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Get started →'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('calls onDismiss callback when tour is dismissed', async () => {
        const onDismiss = vi.fn();
        render(<OnboardingTour onDismiss={onDismiss} />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not use cvf_onboarding_complete key (no conflict with OnboardingWizard)', async () => {
        render(<OnboardingTour />);
        await act(async () => { vi.advanceTimersByTime(700); });
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(localStorage.getItem('cvf_onboarding_complete')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });
});
