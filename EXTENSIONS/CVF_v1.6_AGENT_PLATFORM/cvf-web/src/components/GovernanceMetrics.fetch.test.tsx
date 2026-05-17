/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GovernanceMetrics } from './GovernanceMetrics';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

describe('GovernanceMetrics fetch behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows loading then renders fetched metrics', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: {
                    risk_index: 0.92,
                    approval_efficiency: 50,
                    stability_score: 65,
                    compliance_integrity: 30,
                },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<GovernanceMetrics />);
        expect(screen.getByText('Loading...')).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText('0.92')).toBeTruthy();
        });
        expect(screen.getByText('50%')).toBeTruthy();
        expect(screen.getByText('65%')).toBeTruthy();
        expect(screen.getByText('30%')).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledWith('/api/governance/metrics');
    });

    it('shows error when API returns non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: vi.fn(),
        }));

        render(<GovernanceMetrics />);
        await waitFor(() => {
            expect(screen.getByText('Failed to load metrics')).toBeTruthy();
        });
    });

    it('falls back to zeros when response has missing data fields', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ data: {} }),
        }));

        render(<GovernanceMetrics />);
        await waitFor(() => {
            expect(screen.getByText('0.00')).toBeTruthy();
        });
        expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(3);
    });

    it('updates values when prop data changes', () => {
        const { rerender } = render(
            <GovernanceMetrics data={{ riskIndex: 0.2, approvalEfficiency: 40, stabilityScore: 60, complianceIntegrity: 80 }} />
        );
        expect(screen.getByText('0.20')).toBeTruthy();
        expect(screen.getByText('40%')).toBeTruthy();

        rerender(
            <GovernanceMetrics data={{ riskIndex: 0.7, approvalEfficiency: 90, stabilityScore: 20, complianceIntegrity: 50 }} />
        );
        expect(screen.getByText('0.70')).toBeTruthy();
        expect(screen.getByText('90%')).toBeTruthy();
        expect(screen.getByText('20%')).toBeTruthy();
        expect(screen.getByText('50%')).toBeTruthy();
    });
});
