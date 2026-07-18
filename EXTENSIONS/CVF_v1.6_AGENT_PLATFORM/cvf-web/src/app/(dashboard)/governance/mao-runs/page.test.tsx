/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MaoDurableRunReadoutReport } from '@/lib/server/mao-durable-run-readout';

const getMaoDurableRunReadoutMock = vi.fn<() => Promise<MaoDurableRunReadoutReport>>();

vi.mock('@/lib/server/mao-durable-run-readout', () => ({
    getMaoDurableRunReadout: () => getMaoDurableRunReadoutMock(),
}));

function baseReport(overrides: Partial<MaoDurableRunReadoutReport> = {}): MaoDurableRunReadoutReport {
    return {
        state: 'EMPTY',
        generatedAt: '2026-07-18T00:00:00.000Z',
        boundary: 'Read-only durable-event projection over an existing MAO run store.',
        diagnosticClass: null,
        totalRuns: 0,
        runs: [],
        ...overrides,
    };
}

describe('MaoDurableRunsPage', () => {
    afterEach(() => {
        getMaoDurableRunReadoutMock.mockReset();
    });

    it('renders the available state with run/task fields and no mutation control', async () => {
        getMaoDurableRunReadoutMock.mockResolvedValue(
            baseReport({
                state: 'AVAILABLE',
                totalRuns: 1,
                runs: [
                    {
                        taskGraphId: 'graph-abc',
                        eventCount: 2,
                        taskCount: 1,
                        timeoutCount: 1,
                        latestEventAt: '2026-07-18T00:05:00.000Z',
                        tasks: [
                            {
                                taskId: 'task-1',
                                state: 'timed_out',
                                terminalOutcome: null,
                                lastEventId: 'evt-2',
                                lastSequence: 2,
                            },
                        ],
                    },
                ],
            }),
        );

        const { default: MaoDurableRunsPage } = await import('./page');
        render(await MaoDurableRunsPage());

        expect(screen.getByText('graph-abc')).toBeTruthy();
        expect(screen.getByText('task-1')).toBeTruthy();
        expect(screen.getByText('timed_out')).toBeTruthy();
        expect(screen.getByText('Available')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.queryByText(/launch/i)).toBeNull();
        expect(screen.queryByText(/cancel/i)).toBeNull();
        expect(screen.queryByText(/retry/i)).toBeNull();
        expect(screen.queryByText(/refresh/i)).toBeNull();
    });

    it('renders the empty state with no runs', async () => {
        getMaoDurableRunReadoutMock.mockResolvedValue(baseReport({ state: 'EMPTY' }));

        const { default: MaoDurableRunsPage } = await import('./page');
        render(await MaoDurableRunsPage());

        expect(screen.getByText('No durable MAO runs have been discovered yet.')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the unavailable state with a secret-safe diagnostic class and no raw config path', async () => {
        getMaoDurableRunReadoutMock.mockResolvedValue(
            baseReport({ state: 'UNAVAILABLE', diagnosticClass: 'MAO_RUN_STORE_NOT_CONFIGURED' }),
        );

        const { default: MaoDurableRunsPage } = await import('./page');
        const { container } = render(await MaoDurableRunsPage());

        expect(screen.getByText('Durable run data is currently unavailable.')).toBeTruthy();
        expect(screen.getByText('MAO_RUN_STORE_NOT_CONFIGURED')).toBeTruthy();
        expect(container.textContent).not.toContain('CVF_MAO_DURABLE_RUN_PATH');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('states the durable-event-only boundary and evidence/heartbeat exclusion, and links to governance overview', async () => {
        getMaoDurableRunReadoutMock.mockResolvedValue(baseReport());

        const { default: MaoDurableRunsPage } = await import('./page');
        render(await MaoDurableRunsPage());

        expect(screen.getByText(/Read-only durable-event projection/)).toBeTruthy();
        expect(screen.getByText(/excludes evidence records, evidence milestones, evidence freshness, heartbeat/)).toBeTruthy();
        const link = screen.getByRole('link', { name: /Governance Overview/i });
        expect(link.getAttribute('href')).toBe('/governance');
    });
});
