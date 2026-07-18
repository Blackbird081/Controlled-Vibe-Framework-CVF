/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RuntimeMonitorPage from './page';

const fetchMock = vi.fn();
let language: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language }),
}));

function snapshot() {
    return {
        mode: 'READ_ONLY_MODE',
        generatedAt: '2026-05-17T00:00:00.000Z',
        panels: {
            sessions: [{
                sessionId: 'job-1',
                provider: 'alibaba',
                status: 'ACTIVE',
                source: 'CVF_AGENT_SESSION_MONITOR',
            }],
            tokenContext: [{
                sessionId: 'job-1',
                provider: 'alibaba',
                contextWarningLevel: 'UNKNOWN',
                verifiedSource: false,
                source: 'CVF_TOKEN_CONTEXT_METER',
            }],
            rateLimits: [{
                provider: 'alibaba',
                quotaPressureLevel: 'NORMAL',
                resetWindow: '2026-05-18T00:00:00.000Z',
                source: 'CVF_RATE_LIMIT_WATCHER',
            }],
            processes: [{
                command: 'next-server-process',
                pid: 123,
                status: 'RUNNING',
                source: 'CVF_PROCESS_PORT_GUARD',
            }],
            ports: [],
            alerts: [{
                alertId: 'alert-1',
                severity: 'NOTICE',
                eventType: 'CONTEXT_USAGE_UNAVAILABLE',
                message: 'Token and context usage are not verified for this view yet.',
                recommendedAction: 'Review the source before deciding next steps.',
                policyRequired: false,
                source: 'CVF_TOKEN_CONTEXT_METER',
                createdAt: '2026-05-17T00:00:00.000Z',
            }],
            events: [{ eventId: 'event-1' }, { eventId: 'event-2' }],
        },
        summary: {
            activeSessions: 1,
            highestSeverity: 'NOTICE',
            policyRequiredCount: 0,
            alertsBySeverity: {
                INFO: 0,
                NOTICE: 1,
                WARNING: 0,
                HIGH: 0,
                CRITICAL: 0,
            },
        },
        emptyStates: {
            sessions: 'No active governed runtime session detected. Observability is standing by.',
            tokenContext: 'No verified token metadata is available yet. CVF will not guess usage.',
            ports: 'No managed port record is visible to the web process.',
        },
        blockedInterventions: ['approve', 'kill_process', 'close_port', 'reroute_provider', 'change_policy', 'delete_audit'],
        claimBoundary: 'read-only',
    };
}

describe('RuntimeMonitorPage', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => snapshot(),
        });
        vi.stubGlobal('fetch', fetchMock);
        language = 'en';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders the read-only runtime dashboard in English', async () => {
        render(<RuntimeMonitorPage />);

        expect(await screen.findByText('Runtime Monitor')).toBeTruthy();
        expect(screen.getByText('Read-only')).toBeTruthy();
        expect(screen.getByText('job-1')).toBeTruthy();
        expect(screen.getAllByText(/CVF_TOKEN_CONTEXT_METER/).length).toBeGreaterThan(0);
        expect(screen.getByText(/It will not approve AI work/)).toBeTruthy();
    });

    it('renders Vietnamese copy through the same page', async () => {
        language = 'vi';
        render(<RuntimeMonitorPage />);

        expect(await screen.findByText('Bảng theo dõi runtime')).toBeTruthy();
        expect(screen.getByText('Chỉ xem')).toBeTruthy();
        expect(screen.getByText(/Trang này không phê duyệt việc AI/)).toBeTruthy();
    });

    it('refreshes the runtime snapshot on demand', async () => {
        render(<RuntimeMonitorPage />);
        await screen.findByText('Runtime Monitor');

        fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });
});
