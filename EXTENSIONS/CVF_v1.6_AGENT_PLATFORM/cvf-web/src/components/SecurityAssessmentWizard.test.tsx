/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityAssessmentWizard } from './SecurityAssessmentWizard';

describe('SecurityAssessmentWizard', () => {
    it('blocks next step when required fields are missing', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
    });

    it('allows progressing when required fields are filled', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);

        const textboxes = screen.getAllByRole('textbox');
        fireEvent.change(textboxes[0], { target: { value: 'Portal' } });
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'Web Application' },
        });
        fireEvent.change(textboxes[1], { target: { value: 'User DB' } });
        fireEvent.change(textboxes[2], { target: { value: 'In scope: Web app' } });

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(false);
        fireEvent.click(nextButton);

        expect(screen.getAllByText(/Step 2/i).length).toBeGreaterThan(0);
    });
});
