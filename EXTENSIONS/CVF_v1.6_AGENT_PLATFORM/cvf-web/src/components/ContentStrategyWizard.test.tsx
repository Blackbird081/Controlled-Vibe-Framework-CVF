/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentStrategyWizard } from './ContentStrategyWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('ContentStrategyWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('unlocks next step when required fields are filled', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/TechStartup Blog/i),
            { target: { value: 'TechStartup Blog' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Tone: Professional/i),
            { target: { value: 'Professional but friendly' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Increase organic traffic/i),
            { target: { value: 'Increase organic traffic 50%' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
