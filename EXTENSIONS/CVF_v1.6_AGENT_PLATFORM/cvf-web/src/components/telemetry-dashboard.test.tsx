import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GovernanceMetrics } from './GovernanceMetrics';
import { RiskTrendChart, computeTrend, type RiskTrendPoint } from './RiskTrendChart';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

describe('GovernanceMetrics', () => {
    const mockData = {
        riskIndex: 0.42,
        approvalEfficiency: 85,
        stabilityScore: 92,
        complianceIntegrity: 78,
    };

    it('renders 4 metric cards with data', () => {
        render(<GovernanceMetrics data={mockData} />);
        expect(screen.getByText('0.42')).toBeDefined();
        expect(screen.getByText('85%')).toBeDefined();
        expect(screen.getByText('92%')).toBeDefined();
        expect(screen.getByText('78%')).toBeDefined();
    });

    it('renders card labels', () => {
        render(<GovernanceMetrics data={mockData} />);
        expect(screen.getByText(/Risk Index/)).toBeDefined();
        expect(screen.getByText(/Approval Efficiency/)).toBeDefined();
        expect(screen.getByText(/Governance Stability/)).toBeDefined();
        expect(screen.getByText(/Compliance Integrity/)).toBeDefined();
    });

    it('renders zero values when no data', () => {
        render(<GovernanceMetrics data={{ riskIndex: 0, approvalEfficiency: 0, stabilityScore: 0, complianceIntegrity: 0 }} />);
        expect(screen.getByText('0.00')).toBeDefined();
        expect(screen.getAllByText('0%').length).toBe(3);
    });
});

describe('RiskTrendChart', () => {
    const mockData: RiskTrendPoint[] = [
        { date: '2026-01-01', riskScore: 0.3 },
        { date: '2026-01-02', riskScore: 0.35 },
        { date: '2026-01-03', riskScore: 0.5, event: 'approved' },
        { date: '2026-01-04', riskScore: 0.45 },
        { date: '2026-01-05', riskScore: 0.6, event: 'rejected' },
    ];

    it('renders chart with data', () => {
        render(<RiskTrendChart data={mockData} />);
        expect(screen.getByText(/Risk Trends/)).toBeDefined();
    });

    it('shows time range buttons', () => {
        render(<RiskTrendChart data={mockData} />);
        expect(screen.getByText('7 days')).toBeDefined();
        expect(screen.getByText('30 days')).toBeDefined();
        expect(screen.getByText('90 days')).toBeDefined();
    });

    it('shows no data message when empty', () => {
        render(<RiskTrendChart data={[]} />);
        expect(screen.getByText('No data yet')).toBeDefined();
    });

    it('shows trend indicator', () => {
        render(<RiskTrendChart data={mockData} />);
        // Data has increasing trend
        expect(screen.getByText(/Increasing|Stable|Decreasing/)).toBeDefined();
    });
});

describe('computeTrend', () => {
    it('returns stable for single point', () => {
        expect(computeTrend([{ date: '2026-01-01', riskScore: 0.5 }])).toBe('stable');
    });

    it('returns increasing for rising scores', () => {
        const points: RiskTrendPoint[] = [
            { date: '2026-01-01', riskScore: 0.1 },
            { date: '2026-01-02', riskScore: 0.2 },
            { date: '2026-01-03', riskScore: 0.5 },
            { date: '2026-01-04', riskScore: 0.8 },
        ];
        expect(computeTrend(points)).toBe('increasing');
    });

    it('returns decreasing for falling scores', () => {
        const points: RiskTrendPoint[] = [
            { date: '2026-01-01', riskScore: 0.9 },
            { date: '2026-01-02', riskScore: 0.8 },
            { date: '2026-01-03', riskScore: 0.3 },
            { date: '2026-01-04', riskScore: 0.1 },
        ];
        expect(computeTrend(points)).toBe('decreasing');
    });

    it('returns stable for flat scores', () => {
        const points: RiskTrendPoint[] = [
            { date: '2026-01-01', riskScore: 0.5 },
            { date: '2026-01-02', riskScore: 0.51 },
            { date: '2026-01-03', riskScore: 0.49 },
            { date: '2026-01-04', riskScore: 0.5 },
        ];
        expect(computeTrend(points)).toBe('stable');
    });
});
