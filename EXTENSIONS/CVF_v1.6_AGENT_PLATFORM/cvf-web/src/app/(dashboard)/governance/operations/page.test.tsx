/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OperationsClient from './OperationsClient';

const fetchMock = vi.fn();
const writeTextMock = vi.fn();
const verifySessionCookieMock = vi.fn();

vi.mock('@/lib/middleware-auth', () => ({
    verifySessionCookie: (...args: unknown[]) => verifySessionCookieMock(...args),
}));

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

function setupDeferredFetch() {
    let resolveAuthMe: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | null = null;
    const authMePromise = new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
        resolveAuthMe = resolve;
    });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/api/auth/me')) {
            return authMePromise;
        }
        if (url.endsWith('/api/system/jobs')) {
            return {
                ok: true,
                json: async () => ({ auditPath: '.cvf/runtime/web-governance-jobs.jsonl', jobs: [] }),
            };
        }
        return { ok: false, json: async () => ({}) };
    });
    return {
        resolveAuthMe: () => resolveAuthMe?.({
            ok: true,
            json: async () => ({ authenticated: true, user: 'Test User', role: 'developer' }),
        }),
    };
}

describe('GovernanceOperationsPage', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        writeTextMock.mockReset();
        verifySessionCookieMock.mockReset();
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
        render(<OperationsClient />);

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
        render(<OperationsClient />);

        expect(await screen.findByText('anonymous_local')).toBeTruthy();
        expect(screen.getByText('Local anonymous mode is limited to read-only diagnostics.')).toBeTruthy();
        expect(screen.getAllByText('Local anonymous mode can only run Runtime Doctor.').length).toBeGreaterThan(0);
    });

    it('copies redacted audit summary', async () => {
        setupFetch('developer');
        render(<OperationsClient />);

        fireEvent.click(await screen.findByRole('button', { name: /Copy Summary/i }));

        await waitFor(() => {
            expect(writeTextMock).toHaveBeenCalled();
        });
        expect(await screen.findByText('Redacted audit summary copied.')).toBeTruthy();
    });

    it('server wrapper passes reviewer role/user from mocked ambient session', async () => {
        const { resolveAuthMe } = setupDeferredFetch();
        verifySessionCookieMock.mockResolvedValue({
            user: 'Reviewer User',
            role: 'reviewer',
        });
        const { default: GovernanceOperationsPage } = await import('./page');
        const element = await GovernanceOperationsPage();
        render(element);

        expect(verifySessionCookieMock).toHaveBeenCalledWith();
        expect(await screen.findByText('reviewer')).toBeTruthy();
        expect(screen.getByText('Reviewer User')).toBeTruthy();
        resolveAuthMe();
    });

    it('client renders reviewer before a deferred auth refresh resolves and the fetch ledger contains /api/auth/me', async () => {
        const { resolveAuthMe } = setupDeferredFetch();
        render(<OperationsClient initialRole="reviewer" initialUser="Reviewer User" />);

        expect(await screen.findByText('reviewer')).toBeTruthy();
        expect(screen.getByText('Reviewer User')).toBeTruthy();

        await waitFor(() => {
            const authMeCall = fetchMock.mock.calls.find(([input]) => {
                const url = typeof input === 'string' ? input : input.toString();
                return url.endsWith('/api/auth/me');
            });
            expect(authMeCall).toBeTruthy();
        });

        resolveAuthMe();
        await waitFor(() => {
            expect(screen.getByText('reviewer')).toBeTruthy();
        });
    });
});
