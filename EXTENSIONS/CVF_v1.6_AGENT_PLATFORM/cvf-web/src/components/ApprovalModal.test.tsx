import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalModal } from './ApprovalModal';

describe('ApprovalModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        requestId: 'req-001',
        riskLevel: 'R3',
        reasons: ['High risk code change', 'Security-sensitive area'],
        requiredApprovers: ['TEAM_LEAD', 'SECURITY_OFFICER'],
        onSubmit: vi.fn().mockResolvedValue(undefined),
        language: 'en' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when not open', () => {
        const { container } = render(<ApprovalModal {...defaultProps} isOpen={false} />);
        expect(container.innerHTML).toBe('');
    });

    it('shows risk level and reasons', () => {
        render(<ApprovalModal {...defaultProps} />);
        expect(screen.getByText('R3')).toBeDefined();
        expect(screen.getByText('High risk code change')).toBeDefined();
        expect(screen.getByText('Security-sensitive area')).toBeDefined();
    });

    it('shows required approvers', () => {
        render(<ApprovalModal {...defaultProps} />);
        expect(screen.getByText('TEAM LEAD')).toBeDefined();
        expect(screen.getByText('SECURITY OFFICER')).toBeDefined();
    });

    it('disables submit when justification is too short', () => {
        render(<ApprovalModal {...defaultProps} />);
        const submitBtn = screen.getByText('Submit for Approval');
        expect(submitBtn.hasAttribute('disabled') || submitBtn.closest('button')?.disabled).toBe(true);
    });

    it('enables submit when justification is >= 50 chars', () => {
        render(<ApprovalModal {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/minimum 50 characters/i);
        fireEvent.change(textarea, { target: { value: 'A'.repeat(50) } });
        const submitBtn = screen.getByText('Submit for Approval');
        expect(submitBtn.closest('button')?.disabled).toBe(false);
    });

    it('calls onSubmit with comment and closes', async () => {
        render(<ApprovalModal {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/minimum 50 characters/i);
        fireEvent.change(textarea, { target: { value: 'A'.repeat(60) } });
        fireEvent.click(screen.getByText('Submit for Approval'));
        
        await waitFor(() => {
            expect(defaultProps.onSubmit).toHaveBeenCalledWith('A'.repeat(60));
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('shows error when submit fails', async () => {
        const failSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
        render(<ApprovalModal {...defaultProps} onSubmit={failSubmit} />);
        const textarea = screen.getByPlaceholderText(/minimum 50 characters/i);
        fireEvent.change(textarea, { target: { value: 'A'.repeat(60) } });
        fireEvent.click(screen.getByText('Submit for Approval'));
        
        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeDefined();
        });
    });

    it('renders in Vietnamese', () => {
        render(<ApprovalModal {...defaultProps} language="vi" />);
        expect(screen.getAllByText(/Yêu cầu duyệt/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Gửi yêu cầu duyệt')).toBeDefined();
    });
});
