/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BusinessStrategyWizard } from './BusinessStrategyWizard';

describe('BusinessStrategyWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('requires mandatory fields before advancing', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText('VD: Có nên mở rộng thị trường miền Trung?'),
            { target: { value: 'Should we enter a new market?' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText('Mô tả về công ty, ngành, thị trường hiện tại...'),
            { target: { value: 'We are a SaaS company in APAC.' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Tăng revenue 30%/i),
            { target: { value: 'Increase revenue 30%' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
