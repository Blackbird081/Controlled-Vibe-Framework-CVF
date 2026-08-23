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

function openTour() {
    act(() => {
        window.dispatchEvent(new CustomEvent('cvf:openTour'));
    });
}

describe('OnboardingTour', () => {
    it('renders when cvf:openTour event is dispatched', () => {
        render(<OnboardingTour />);
        expect(screen.queryByRole('dialog')).toBeNull();
        openTour();
        expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('shows step 1 of 4 content on first render', () => {
        render(<OnboardingTour />);
        openTour();
        expect(screen.getByText('1 / 4')).toBeTruthy();
        expect(screen.getByText(/Pick a task from the template gallery/i)).toBeTruthy();
    });

    it('advances to step 2 when Next is clicked', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('2 / 4')).toBeTruthy();
        expect(screen.getByText(/CVF checks every request/i)).toBeTruthy();
    });

    it('advances to step 3 and shows provider settings link', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('3 / 4')).toBeTruthy();
        expect(screen.getByText(/Connect an AI provider/i)).toBeTruthy();
        expect(screen.getByText(/Open Settings/i)).toBeTruthy();
    });

    it('advances to step 4 and explains the evidence receipt', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('4 / 4')).toBeTruthy();
        expect(screen.getByText(/Keep the evidence receipt/i)).toBeTruthy();
    });

    it('goes back to previous step when Back is clicked', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByText('Next →'));
        expect(screen.getByText('2 / 4')).toBeTruthy();
        fireEvent.click(screen.getByText('← Back'));
        expect(screen.getByText('1 / 4')).toBeTruthy();
    });

    it('dismisses tour and sets localStorage when X button clicked', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('dismisses tour and sets localStorage when Get started is clicked', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.click(screen.getByText('Get started →'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('calls onDismiss callback when tour is dismissed', () => {
        const onDismiss = vi.fn();
        render(<OnboardingTour onDismiss={onDismiss} />);
        openTour();
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not use cvf_onboarding_complete key (no conflict with OnboardingWizard)', () => {
        render(<OnboardingTour />);
        openTour();
        fireEvent.click(screen.getByLabelText('Skip tour'));
        expect(localStorage.getItem('cvf_onboarding_complete')).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });
});
