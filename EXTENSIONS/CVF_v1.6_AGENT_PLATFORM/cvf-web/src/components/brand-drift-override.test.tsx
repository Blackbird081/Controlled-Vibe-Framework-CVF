import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandDriftIndicator, type BrandDriftData } from './BrandDriftIndicator';
import { OverrideRequestModal } from './OverrideRequestModal';
import { ActiveOverrides, type ActiveOverride } from './ActiveOverrides';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

describe('BrandDriftIndicator', () => {
    it('renders compliant status', () => {
        const data: BrandDriftData = {
            driftScore: 5,
            status: 'COMPLIANT',
            changedFields: [],
            lastChecked: new Date().toISOString(),
        };
        render(<BrandDriftIndicator data={data} />);
        expect(screen.getByText(/Compliant/)).toBeDefined();
        expect(screen.getByText('5%')).toBeDefined();
    });

    it('renders drifting status with changed fields', () => {
        const data: BrandDriftData = {
            driftScore: 65,
            status: 'DRIFTING',
            changedFields: ['system_prompt', 'temperature'],
            lastChecked: new Date().toISOString(),
        };
        render(<BrandDriftIndicator data={data} />);
        expect(screen.getByText(/Drifting/)).toBeDefined();
        expect(screen.getByText('system_prompt')).toBeDefined();
        expect(screen.getByText('temperature')).toBeDefined();
    });

    it('renders frozen status', () => {
        const data: BrandDriftData = {
            driftScore: 0,
            status: 'FROZEN',
            changedFields: [],
            lastChecked: new Date().toISOString(),
        };
        render(<BrandDriftIndicator data={data} />);
        expect(screen.getByText(/Frozen/)).toBeDefined();
    });

    it('renders compact mode', () => {
        const data: BrandDriftData = {
            driftScore: 30,
            status: 'DRIFTING',
            changedFields: [],
            lastChecked: new Date().toISOString(),
        };
        const { container } = render(<BrandDriftIndicator data={data} compact />);
        expect(container.querySelector('span')).toBeDefined();
    });
});

describe('OverrideRequestModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        requestId: 'req-001',
        blockedAction: 'BLOCK',
        riskLevel: 'R3',
        onSubmit: vi.fn().mockResolvedValue(undefined),
        language: 'en' as const,
    };

    beforeEach(() => vi.clearAllMocks());

    it('renders nothing when not open', () => {
        const { container } = render(<OverrideRequestModal {...defaultProps} isOpen={false} />);
        expect(container.innerHTML).toBe('');
    });

    it('shows blocked action and risk level', () => {
        render(<OverrideRequestModal {...defaultProps} />);
        expect(screen.getByText('BLOCK')).toBeDefined();
        expect(screen.getByText('R3')).toBeDefined();
    });

    it('disables submit without justification and risk ack', () => {
        render(<OverrideRequestModal {...defaultProps} />);
        const submitBtn = screen.getByText('Submit Override Request');
        expect(submitBtn.closest('button')?.disabled).toBe(true);
    });

    it('enables submit with valid data', () => {
        render(<OverrideRequestModal {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/minimum 50 characters/i);
        fireEvent.change(textarea, { target: { value: 'A'.repeat(60) } });
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        const submitBtn = screen.getByText('Submit Override Request');
        expect(submitBtn.closest('button')?.disabled).toBe(false);
    });

    it('calls onSubmit with override data', async () => {
        render(<OverrideRequestModal {...defaultProps} />);
        const textarea = screen.getByPlaceholderText(/minimum 50 characters/i);
        fireEvent.change(textarea, { target: { value: 'A'.repeat(60) } });
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByText('Submit Override Request'));

        await waitFor(() => {
            expect(defaultProps.onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestId: 'req-001',
                    justification: 'A'.repeat(60),
                    riskAcknowledged: true,
                })
            );
        });
    });
});

describe('ActiveOverrides', () => {
    it('shows no overrides message when empty', () => {
        render(<ActiveOverrides overrides={[]} />);
        expect(screen.getByText('No active overrides')).toBeDefined();
    });

    it('renders override entries', () => {
        const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const overrides: ActiveOverride[] = [
            {
                id: 'ovr-1',
                requestId: 'req-001-long-id-hash',
                scope: 'request',
                approvedBy: 'admin',
                expiresAt: futureDate,
                createdAt: new Date().toISOString(),
                justification: 'Test override',
            },
        ];
        render(<ActiveOverrides overrides={overrides} />);
        expect(screen.getByText(/req-001-long/)).toBeDefined();
        expect(screen.getByText(/admin/)).toBeDefined();
    });

    it('renders compact mode', () => {
        render(<ActiveOverrides overrides={[]} compact />);
        expect(screen.getByText(/0/)).toBeDefined();
    });

    it('shows urgent warning for overrides expiring soon', () => {
        const soonDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
        const overrides: ActiveOverride[] = [
            {
                id: 'ovr-2',
                requestId: 'req-urgent-test-id',
                scope: 'project',
                approvedBy: 'security',
                expiresAt: soonDate,
                createdAt: new Date().toISOString(),
                justification: 'Urgent override',
            },
        ];
        render(<ActiveOverrides overrides={overrides} />);
        expect(screen.getByText(/Expiring soon/)).toBeDefined();
    });
});
