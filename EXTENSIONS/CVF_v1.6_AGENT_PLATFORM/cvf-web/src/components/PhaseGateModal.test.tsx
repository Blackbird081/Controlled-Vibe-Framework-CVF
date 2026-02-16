/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhaseGateModal } from './PhaseGateModal';

describe('PhaseGateModal', () => {
    it('auto-checks items and enables approve when required items are present', async () => {
        const onApprove = vi.fn();
        const onReject = vi.fn();
        const onClose = vi.fn();

        const response = 'My Understanding...\nAssumption...\nIN SCOPE...';

        render(
            <PhaseGateModal
                phase="Discovery"
                response={response}
                language="en"
                onApprove={onApprove}
                onReject={onReject}
                onClose={onClose}
            />
        );

        const approveButton = screen.getByRole('button', { name: /Approve/i }) as HTMLButtonElement;
        await waitFor(() => expect(approveButton.disabled).toBe(false));

        fireEvent.click(approveButton);
        expect(onApprove).toHaveBeenCalledTimes(1);
    }, 10000);

    it('disables approve when required items are missing', () => {
        render(
            <PhaseGateModal
                phase="Design"
                response="Partial response"
                language="en"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const approveButton = screen.getByRole('button', { name: /Approve/i }) as HTMLButtonElement;
        expect(approveButton.disabled).toBe(true);
        expect(screen.getByText(/required items missing/i)).toBeTruthy();
    });

    it('calls onReject when reject button is clicked', () => {
        const onReject = vi.fn();
        render(
            <PhaseGateModal
                phase="Discovery"
                response="test"
                language="en"
                onApprove={vi.fn()}
                onReject={onReject}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText(/Request Revision/i));
        expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = vi.fn();
        render(
            <PhaseGateModal
                phase="Discovery"
                response="test"
                language="en"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={onClose}
            />
        );

        const dialog = screen.getByRole('dialog');
        fireEvent.keyDown(dialog, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('toggles checkbox item on and off', async () => {
        render(
            <PhaseGateModal
                phase="Discovery"
                response="Understanding..."
                language="en"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);

        // All start unchecked (response doesn't match autoCheck patterns)
        const firstCb = checkboxes[0] as HTMLInputElement;
        expect(firstCb.checked).toBe(false);

        // Check it manually
        fireEvent.click(firstCb);
        expect(firstCb.checked).toBe(true);

        // Uncheck it (exercises prev.filter branch — line 54)
        fireEvent.click(firstCb);
        expect(firstCb.checked).toBe(false);
    });

    it('renders Vietnamese labels when language is vi', () => {
        render(
            <PhaseGateModal
                phase="Design"
                response="test"
                language="vi"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/Tỷ lệ tuân thủ/i)).toBeTruthy();
        expect(screen.getByText(/Yêu cầu sửa/i)).toBeTruthy();
    });

    it('calls onClose via close button with vi aria-label', () => {
        const onClose = vi.fn();
        render(
            <PhaseGateModal
                phase="Discovery"
                response="test"
                language="vi"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByLabelText('Đóng'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows next phase name on approve button', async () => {
        const response = 'Understanding Assumption IN SCOPE OUT SCOPE Risk';
        render(
            <PhaseGateModal
                phase="Discovery"
                response={response}
                language="en"
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/Approve → Design/i)).toBeTruthy();
        });
    });
});
