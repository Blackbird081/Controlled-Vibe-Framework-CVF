/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: Vietnamese copy is verified for unavailable metrics.
import enLabels from '@/lib/i18n/en.json';
import viLabels from '@/lib/i18n/vi.json';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GovernanceMetrics } from './GovernanceMetrics';

let language: 'vi' | 'en' = 'en';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language, t: (key: string) => ((language === 'vi' ? viLabels : enLabels) as Record<string, string>)[key] ?? key }),
}));

describe('GovernanceMetrics fetch behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        language = 'en';
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
            expect(screen.getByText('Could not load monitoring data')).toBeTruthy();
        });
    });

    it('gives a sign-in action when the session has expired', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
        render(<GovernanceMetrics />);

        expect(await screen.findByText('Your session has expired. Please sign in again.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login');
        expect(screen.queryByText('Could not load monitoring data')).toBeNull();
    });

    it('shows unavailable fields in neutral text beside a measured zero', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ status: 'ok', data: { approval_efficiency: 0 } }),
        }));

        render(<GovernanceMetrics />);
        expect((await screen.findByText('0%')).classList.contains('text-red-500')).toBe(true);
        expect(screen.getAllByText('No data yet')).toHaveLength(3);
        expect(screen.getAllByText('No data yet').every(value => value.classList.contains('text-gray-600'))).toBe(true);
        expect(screen.queryByText('0.00')).toBeNull();
    });

    const zeroMetrics = { risk_index: 0, approval_efficiency: 0, stability_score: 0, compliance_integrity: 0 };

    it('treats the API fallback payload as missing even when all values are zero', async () => {
        language = 'vi';
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'ok', fallback: true, data: zeroMetrics }),
        }));

        render(<GovernanceMetrics />);
        expect(await screen.findAllByText('Chưa có dữ liệu')).toHaveLength(4);
        expect(screen.queryByText('0%')).toBeNull();
        expect(screen.queryByText('0.00')).toBeNull();
    });

    it('shows real zero values from the API with measured metric styling', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'ok', data: zeroMetrics }),
        }));

        render(<GovernanceMetrics />);
        expect((await screen.findByText('0.00')).classList.contains('text-green-500')).toBe(true);
        expect(screen.getAllByText('0%')).toHaveLength(3);
        expect(screen.queryByText('No data yet')).toBeNull();
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
