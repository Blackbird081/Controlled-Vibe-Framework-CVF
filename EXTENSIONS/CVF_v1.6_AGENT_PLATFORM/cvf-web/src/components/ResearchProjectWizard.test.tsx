/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchProjectWizard } from './ResearchProjectWizard';

describe('ResearchProjectWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('unlocks next step after required research fields are filled', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText(/Impact of AI on Software Development/i),
            { target: { value: 'Impact of AI on engineering productivity' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/RQ1:/i),
            { target: { value: 'RQ1: How does AI coding affect productivity?\nRQ2: Quality impacts?' } }
        );

        const typeSelect = screen.getByRole('combobox');
        fireEvent.change(typeSelect, { target: { value: 'Survey' } });

        fireEvent.change(
            screen.getByPlaceholderText(/Why is this research important/i),
            { target: { value: 'Fills a gap on AI impact in SMEs.' } }
        );

        expect(nextButton.disabled).toBe(false);
    });
});
