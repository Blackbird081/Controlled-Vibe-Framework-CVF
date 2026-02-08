/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataAnalysisWizard } from './DataAnalysisWizard';

describe('DataAnalysisWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next button after required fields are completed', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/Identify factors affecting customer churn/i),
            { target: { value: 'Identify churn drivers' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/What drives customer churn/i),
            { target: { value: 'What drives churn? Which segments are at risk?' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Customer database/i),
            { target: { value: 'Customer DB, transaction logs, support tickets' } }
        );

        const analysisTypeSelect = screen.getByRole('combobox');
        fireEvent.change(analysisTypeSelect, { target: { value: 'Descriptive' } });

        expect(nextButton.disabled).toBe(false);
    });
});
