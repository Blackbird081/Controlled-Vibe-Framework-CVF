/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhaseGateModal } from './PhaseGateModal';

describe('PhaseGateModal extra', () => {
    it('disables approve when missing required items and allows reject/close', () => {
        const onApprove = vi.fn();
        const onReject = vi.fn();
        const onClose = vi.fn();

        render(
            <PhaseGateModal
                phase="Discovery"
                response="No required items here"
                language="en"
                onApprove={onApprove}
                onReject={onReject}
                onClose={onClose}
            />
        );

        const approve = screen.getByText(/Approve/i).closest('button');
        expect(approve?.hasAttribute('disabled')).toBe(true);

        fireEvent.click(screen.getByText(/Request Revision/i));
        const closeButtons = screen.getAllByText('✕');
        fireEvent.click(closeButtons[1]);

        expect(onReject).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('toggles checklist items and updates compliance', () => {
        const onApprove = vi.fn();
        const onReject = vi.fn();
        const onClose = vi.fn();

        render(
            <PhaseGateModal
                phase="Design"
                response="No auto checks"
                language="vi"
                onApprove={onApprove}
                onReject={onReject}
                onClose={onClose}
            />
        );

        const firstCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(firstCheckbox);

        const approveButton = screen.getByText(/Duyệt →/i).closest('button');
        expect(approveButton).toBeTruthy();
        expect(approveButton?.hasAttribute('disabled')).toBe(true);
    });
});
