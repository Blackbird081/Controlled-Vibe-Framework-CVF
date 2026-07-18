import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeQuickActions } from './OutcomeQuickActions';

describe('OutcomeQuickActions', () => {
    it('renders the six English outcome buttons', () => {
        render(<OutcomeQuickActions lang="en" onSelectTemplate={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Create PRD' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Generate SOP' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Review Contract' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Build Landing Page' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Summarize Meeting' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Create Proposal' })).toBeTruthy();
    });

    it('renders Vietnamese labels', () => {
        render(<OutcomeQuickActions lang="vi" onSelectTemplate={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Tạo PRD' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Tạo SOP' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Review hợp đồng' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Viết landing page' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Tóm tắt meeting' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Viết proposal' })).toBeTruthy();
    });

    it('selects the matching template id for each action', () => {
        const onSelectTemplate = vi.fn();
        render(<OutcomeQuickActions lang="en" onSelectTemplate={onSelectTemplate} />);

        fireEvent.click(screen.getByRole('button', { name: 'Create PRD' }));
        fireEvent.click(screen.getByRole('button', { name: 'Generate SOP' }));
        fireEvent.click(screen.getByRole('button', { name: 'Review Contract' }));
        fireEvent.click(screen.getByRole('button', { name: 'Build Landing Page' }));
        fireEvent.click(screen.getByRole('button', { name: 'Summarize Meeting' }));
        fireEvent.click(screen.getByRole('button', { name: 'Create Proposal' }));

        expect(onSelectTemplate).toHaveBeenNthCalledWith(1, 'app_builder_complete');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(2, 'documentation');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(3, 'tos_review');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(4, 'web_build_handoff');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(5, 'meeting_notes');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(6, 'email_template');
    });
});
