/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppBuilderWizard } from './AppBuilderWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

describe('AppBuilderWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next button when required fields are filled', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Next →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(screen.getByPlaceholderText('VD: TaskFlow'), { target: { value: 'TaskFlow' } });
        const appTypeSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(appTypeSelect, { target: { value: 'Desktop App' } });
        fireEvent.change(screen.getByPlaceholderText('Mô tả vấn đề user đang gặp phải...'), { target: { value: 'User lacks task tracking' } });
        fireEvent.change(screen.getByPlaceholderText('Ai sẽ dùng app này?'), { target: { value: 'Small teams' } });
        fireEvent.change(screen.getByPlaceholderText(/Feature A/i), { target: { value: 'Create tasks\nAssign tasks\nTrack status' } });

        expect(nextButton.disabled).toBe(false);
    });
});
