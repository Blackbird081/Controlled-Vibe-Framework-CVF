/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

const exportMock = vi.fn();
const clearMock = vi.fn();
let analyticsState = {
    events: [] as Array<{ id: string; type: string; timestamp: number; data?: Record<string, unknown> }>,
    clearEvents: clearMock,
    enabled: true,
};
let executionsState: Array<{
    id: string;
    templateId: string;
    templateName: string;
    category?: string;
    input: unknown;
    intent: string;
    status: string;
    result?: string;
    qualityScore?: number;
    createdAt: Date;
}> = [];

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/analytics', () => ({
    exportAnalyticsEvents: (format: 'json' | 'csv') => exportMock(format),
    useAnalyticsEvents: () => analyticsState,
}));

vi.mock('@/lib/store', () => ({
    useExecutionStore: () => ({
        executions: executionsState,
    }),
}));

describe('AnalyticsDashboard', () => {
    beforeEach(() => {
        exportMock.mockClear();
        clearMock.mockClear();
        executionsState = [
            {
                id: 'exec1',
                templateId: 't1',
                templateName: 'Template A',
                category: 'marketing',
                input: {},
                intent: 'intent',
                status: 'completed',
                result: 'accepted',
                qualityScore: 8,
                createdAt: new Date('2026-02-07T10:00:00Z'),
            },
        ];
        analyticsState = {
            events: [
                {
                    id: 'evt1',
                    type: 'skill_viewed',
                    timestamp: Date.now(),
                    data: { skillId: 'skill-1', skillTitle: 'Skill One', domain: 'App Development' },
                },
                {
                    id: 'evt2',
                    type: 'skill_viewed',
                    timestamp: Date.now(),
                    data: { skillId: 'skill-2', skillTitle: 'Skill Two', domain: 'Marketing' },
                },
            ],
            clearEvents: clearMock,
            enabled: true,
        };
    });

    it('renders top skills and domain usage', () => {
        render(<AnalyticsDashboard />);

        expect(screen.getByText('📚 Skill phổ biến')).toBeTruthy();
        expect(screen.getByText('Skill One')).toBeTruthy();
        expect(screen.getByText('App Development')).toBeTruthy();
        expect(screen.getByText('🏷️ Theo lĩnh vực')).toBeTruthy();
        expect(screen.getByText('Marketing')).toBeTruthy();
    });

    it('exports analytics data', () => {
        render(<AnalyticsDashboard />);
        fireEvent.click(screen.getByText('Export JSON'));
        fireEvent.click(screen.getByText('Export CSV'));
        expect(exportMock).toHaveBeenCalledWith('json');
        expect(exportMock).toHaveBeenCalledWith('csv');
    });

    it('shows disabled banner when analytics is off', () => {
        analyticsState.enabled = false;
        render(<AnalyticsDashboard />);
        expect(screen.getByText(/Analytics đang tắt/i)).toBeTruthy();
    });

    it('renders empty states when no data is available', () => {
        executionsState = [];
        analyticsState = {
            events: [],
            clearEvents: clearMock,
            enabled: true,
        };

        render(<AnalyticsDashboard />);

        expect(screen.getByText(/Chưa có dữ liệu\. Hãy chạy một vài templates!/i)).toBeTruthy();
        expect(screen.getByText(/Chưa có dữ liệu skill/i)).toBeTruthy();
        expect(screen.getByText(/Chưa có dữ liệu domain/i)).toBeTruthy();
        expect(screen.getByText('Chưa có dữ liệu')).toBeTruthy();
        expect(screen.getByText(/Chưa có events/i)).toBeTruthy();
    });

    it('renders rejected distribution and handles older activity', () => {
        executionsState = [
            {
                id: 'exec1',
                templateId: 't1',
                templateName: 'Template A',
                category: 'marketing',
                input: {},
                intent: 'intent',
                status: 'completed',
                result: 'accepted',
                qualityScore: 9,
                createdAt: new Date('2026-02-06T10:00:00Z'),
            },
            {
                id: 'exec2',
                templateId: 't2',
                templateName: 'Template B',
                category: 'marketing',
                input: {},
                intent: 'intent',
                status: 'completed',
                result: 'rejected',
                createdAt: new Date('2026-01-20T10:00:00Z'),
            },
        ];
        analyticsState = {
            events: [
                {
                    id: 'evt1',
                    type: 'execution_created',
                    timestamp: Date.now(),
                },
                {
                    id: 'evt2',
                    type: 'tools_opened',
                    timestamp: Date.now() - 9 * 24 * 60 * 60 * 1000,
                },
                {
                    id: 'evt3',
                    type: 'skill_viewed',
                    timestamp: Date.now(),
                    data: { skillId: 'skill-3', skillTitle: 'Skill Three', domain: 123 },
                },
            ],
            clearEvents: clearMock,
            enabled: true,
        };

        render(<AnalyticsDashboard />);

        expect(screen.getByText(/✅ 1/)).toBeTruthy();
        expect(screen.getByText(/❌ 1/)).toBeTruthy();
        expect(screen.getAllByText('execution_created').length).toBeGreaterThan(0);
        expect(screen.getAllByText('tools_opened').length).toBeGreaterThan(0);
        expect(screen.getByText('Skill Three')).toBeTruthy();
    });

    it('renders enforcement stats with enforcement_decision events', () => {
        analyticsState = {
            events: [
                {
                    id: 'e1', type: 'enforcement_decision', timestamp: Date.now(),
                    data: { status: 'BLOCKED', source: 'spec-gate' },
                },
                {
                    id: 'e2', type: 'enforcement_decision', timestamp: Date.now() - 1000,
                    data: { status: 'ALLOWED', source: 'manual' },
                },
                {
                    id: 'e3', type: 'enforcement_decision', timestamp: Date.now() - 2000,
                    data: { status: 'BLOCKED', source: 'spec-gate' },
                },
                {
                    id: 'e4', type: 'pre_uat_failed', timestamp: Date.now(),
                    data: {},
                },
            ],
            clearEvents: clearMock,
            enabled: true,
        };

        render(<AnalyticsDashboard />);

        // Should show enforcement stats: 3 decisions logged, 1 pre-UAT fail
        expect(document.body.textContent).toContain('3');
        expect(document.body.textContent).toContain('1');
        // Top status should be BLOCKED (2 occurrences)
        expect(document.body.textContent).toContain('BLOCKED');
        expect(document.body.textContent).toContain('ALLOWED');
        // Sources
        expect(document.body.textContent).toContain('spec-gate');
        expect(document.body.textContent).toContain('manual');
    });

    it('renders enforcement empty states when no enforcement events exist', () => {
        analyticsState = {
            events: [
                { id: 'e1', type: 'skill_viewed', timestamp: Date.now(), data: { skillId: 'x', skillTitle: 'X', domain: 'D' } },
            ],
            clearEvents: clearMock,
            enabled: true,
        };

        render(<AnalyticsDashboard />);

        // With no enforcement events, should show N/A for top status
        expect(document.body.textContent).toContain('N/A');
    });
});
