/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingCampaignWizard } from './MarketingCampaignWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('MarketingCampaignWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('requires campaign goal fields before advancing', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/Q1 Product Launch/i),
            { target: { value: 'Q1 Product Launch' } }
        );

        const typeSelect = screen.getByRole('combobox');
        fireEvent.change(typeSelect, { target: { value: 'Lead Generation' } });

        fireEvent.change(
            screen.getByPlaceholderText(/Tăng 20% traffic/i),
            { target: { value: 'Increase traffic 20%, generate 500 leads' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Traffic: \+20%/i),
            { target: { value: 'Traffic +20%\nLeads 500\nConversion 3%' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/01\/02\/2026/i),
            { target: { value: '01/02/2026 - 28/02/2026' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
