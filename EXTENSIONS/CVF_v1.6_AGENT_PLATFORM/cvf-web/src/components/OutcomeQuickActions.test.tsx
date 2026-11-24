import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeQuickActions } from './OutcomeQuickActions';

describe('OutcomeQuickActions', () => {
    it('renders the six English outcome buttons', () => {
        render(<OutcomeQuickActions lang="en" onSelectTemplate={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Application requirements specification' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Standard operating procedure' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Contract review' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Landing page content' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Meeting summary' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Proposal' })).toBeTruthy();
    });

    it('renders Vietnamese labels', () => {
        render(<OutcomeQuickActions lang="vi" onSelectTemplate={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Bản yêu cầu ứng dụng' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Quy trình vận hành' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Rà soát hợp đồng' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Nội dung trang giới thiệu' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Tóm tắt cuộc họp' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Bản đề xuất' })).toBeTruthy();
    });

    it('selects the matching template id for each action', () => {
        const onSelectTemplate = vi.fn();
        render(<OutcomeQuickActions lang="en" onSelectTemplate={onSelectTemplate} />);

        fireEvent.click(screen.getByRole('button', { name: 'Application requirements specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Standard operating procedure' }));
        fireEvent.click(screen.getByRole('button', { name: 'Contract review' }));
        fireEvent.click(screen.getByRole('button', { name: 'Landing page content' }));
        fireEvent.click(screen.getByRole('button', { name: 'Meeting summary' }));
        fireEvent.click(screen.getByRole('button', { name: 'Proposal' }));

        expect(onSelectTemplate).toHaveBeenNthCalledWith(1, 'app_requirements_spec');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(2, 'documentation');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(3, 'home_contract_review');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(4, 'web_build_handoff');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(5, 'meeting_notes');
        expect(onSelectTemplate).toHaveBeenNthCalledWith(6, 'home_proposal');
    });
});
// Text Encoding Exception: tests cover the Vietnamese outcome labels.
