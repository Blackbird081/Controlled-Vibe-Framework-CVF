/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDesignWizard } from './ProductDesignWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('ProductDesignWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next step when problem definition is filled', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText(/Tiếp tục/ ) as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/TaskFlow Mobile/i),
            { target: { value: 'TaskFlow Mobile' } }
        );

        const typeSelect = screen.getByRole('combobox');
        fireEvent.change(typeSelect, { target: { value: 'Web App' } });

        fireEvent.change(
            screen.getByPlaceholderText(/Người dùng gặp khó khăn/i),
            { target: { value: 'Users struggle to coordinate tasks across teams.' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Người dùng đang làm gì/i),
            { target: { value: 'They use spreadsheets and chat apps.' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
