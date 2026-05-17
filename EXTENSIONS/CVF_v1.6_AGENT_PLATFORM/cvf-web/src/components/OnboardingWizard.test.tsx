/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingWizard } from './OnboardingWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('OnboardingWizard', () => {
    it('calls onComplete when skipping', () => {
        const onComplete = vi.fn();
        render(<OnboardingWizard onComplete={onComplete} />);

        fireEvent.click(screen.getByText('Bỏ qua giới thiệu'));
        expect(onComplete).toHaveBeenCalledWith('dismiss');
    });

    it('advances steps and completes on final step', () => {
        const onComplete = vi.fn();
        render(<OnboardingWizard onComplete={onComplete} />);

        for (let i = 0; i < 4; i++) {
            fireEvent.click(screen.getByText('Tiếp tục →'));
        }

        fireEvent.click(screen.getByText('Mở governed starter path 🚀'));
        expect(onComplete).toHaveBeenCalledWith('starter');
    });

    it('teaches governed starter semantics instead of legacy 3-step framing', () => {
        render(<OnboardingWizard onComplete={vi.fn()} />);

        for (let i = 0; i < 4; i++) {
            fireEvent.click(screen.getByText('Tiếp tục →'));
        }

        expect(screen.getByText('Governed starter path')).toBeTruthy();
        expect(screen.getByText('Review packet')).toBeTruthy();
        expect(screen.getByText('Live run + freeze')).toBeTruthy();
    });
});
