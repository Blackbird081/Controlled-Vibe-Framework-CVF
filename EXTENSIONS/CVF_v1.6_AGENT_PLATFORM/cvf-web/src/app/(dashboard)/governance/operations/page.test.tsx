/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GovernanceOperationsPage from './page';

const fetchMock = vi.fn();
const writeTextMock = vi.fn();

function setupFetch(role = 'developer') {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/api/auth/me')) {
            return {
                ok: role !== 'anonymous',
                json: async () => role === 'anonymous'
                    ? { authenticated: false }
                    : { authenticated: true, user: 'Test User', role },
            };
        }
        if (url.endsWith('/api/system/jobs') && init?.method === 'POST') {
            return {
                ok: true,
                json: async () => ({
                    jobId: 'job-1',
                    status: 'succeeded',
                    decision: 'allowed',
                    decisionReason: 'role_authorized',
                }),
            };
        }
        if (url.endsWith('/api/system/jobs')) {
            return {
                ok: true,
                json: async () => ({
                    auditPath: '.cvf/runtime/web-governance-jobs.jsonl',
                    jobs: [
                        {
                            eventId: 'evt-1',
                            jobId: 'job-1',
                            jobType: 'cvf_doctor',
                            status: 'succeeded',
                            decision: 'allowed',
                            decisionReason: 'role_authorized',
                            requestedBy: 'Test User',
                            role: 'operator',
                            recordedAt: '2026-05-08T00:00:00.000Z',
                            providerLane: null,
                            stdoutSummary: 'ok',
                            stderrSummary: '',
                        },
                    ],
                }),
            };
        }
        return { ok: false, json: async () => ({}) };
    });
}

describe('GovernanceOperationsPage', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        writeTextMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: writeTextMock,
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders authenticated operator controls and submits an allowlisted job', async () => {
        setupFetch('developer');
        render(<GovernanceOperationsPage />);

        expect(await screen.findByText('operator')).toBeTruthy();
        fireEvent.click(screen.getAllByRole('button', { name: 'Run' })[0]);

        await waitFor(() => {
            const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
            expect(postCall).toBeTruthy();
        });
        expect(await screen.findByText(/Runtime Doctor: succeeded/)).toBeTruthy();
    });

    it('limits anonymous local mode to runtime doctor', async () => {
        setupFetch('anonymous');
        render(<GovernanceOperationsPage />);

        expect(await screen.findByText('anonymous_local')).toBeTruthy();
        expect(screen.getByText('Local anonymous mode is limited to read-only diagnostics.')).toBeTruthy();
        expect(screen.getAllByText('Local anonymous mode can only run Runtime Doctor.').length).toBeGreaterThan(0);
    });

    it('copies redacted audit summary', async () => {
        setupFetch('developer');
        render(<GovernanceOperationsPage />);

        fireEvent.click(await screen.findByRole('button', { name: /Copy Summary/i }));

        await waitFor(() => {
            expect(writeTextMock).toHaveBeenCalled();
        });
        expect(await screen.findByText('Redacted audit summary copied.')).toBeTruthy();
    });
});
