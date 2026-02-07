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
});
