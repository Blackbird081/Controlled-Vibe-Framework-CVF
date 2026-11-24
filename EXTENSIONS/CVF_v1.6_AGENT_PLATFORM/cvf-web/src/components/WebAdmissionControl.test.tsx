/** @vitest-environment jsdom */
// Text Encoding Exception: Vietnamese assertions verify localized operational labels and scope copy.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebAdmissionControl from './WebAdmissionControl';
vi.mock('./HeldExecutionNotice', () => ({ default: ({ active }: { active: boolean }) => <div data-testid="held-notice-binding">{String(active)}</div> }));

let language = 'en';
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language }) }));
const fetchMock = vi.fn();
const snapshot = (overrides: Record<string, unknown> = {}) => ({
    scope: 'verified_owner_canonical_web', state: 'OPEN', revision: 0, updatedAt: null,
    observedAt: new Date().toISOString(), ownerCapacity: { used: 0, limit: 32 }, execution: null, ...overrides,
});
const execution = (overrides: Record<string, unknown> = {}) => ({
    canonicalId: 'server-canonical-id', contractRevision: 'contract-v1', sourceRevision: 'source-v1',
    state: 'OPEN', active: true, recordingStatus: 'UNCONFIRMED', providerContact: 'POSSIBLE_OR_OBSERVED',
    continuationHold: true, pendingOrdinals: 1, terminalDisposition: null, gaps: ['PORT_PENDING'],
    updatedAt: new Date().toISOString(), ...overrides,
});
const success = (control = snapshot()) => ({ ok: true, status: 200, json: async () => ({ success: true, control }) });
const failed = (code: string, status = 503) => ({ ok: false, status, json: async () => ({ success: false, code, error: 'Unavailable' }) });
async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }
async function tick(ms: number) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
const bodyAt = (index: number) => JSON.parse(fetchMock.mock.calls[index][1].body);

describe('WebAdmissionControl', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-13T13:00:00.000Z'));
        language = 'en';
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

    it('shows unknown until the first owner-scoped server observation arrives', async () => {
        let resolve!: (value: ReturnType<typeof success>) => void;
        fetchMock.mockReturnValue(new Promise(r => { resolve = r; }));
        render(<WebAdmissionControl />);
        expect(screen.getByRole('status').textContent).toBe('Current status unknown');
        expect(screen.getByTestId('held-notice-binding').textContent).toBe('true');
        await flush();
        expect(bodyAt(0)).toEqual({ action: 'status' });
        resolve(success()); await flush();
        expect(screen.getByText(/Verified account \/ organization \/ team scope, across sessions/)).toBeTruthy();
        expect(screen.getByText('No admitted execution observed for this owner.')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toBe('New admissions may be considered');
        expect(screen.queryByText(/AI running/)).toBeNull();
        expect(screen.getByText('2026-11-13T13:00:00.000Z')).toBeTruthy();
    });

    it('sends Stop without cancelling an execution request or claiming provider cancellation', async () => {
        fetchMock.mockResolvedValueOnce(success()).mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 1 })));
        render(<WebAdmissionControl />); await flush();
        fireEvent.click(screen.getByRole('button', { name: 'Stop new admissions' })); await flush();
        expect(bodyAt(1)).toEqual({ action: 'stop' });
        expect(fetchMock.mock.calls.every(call => call[0] === '/api/execute/control')).toBe(true);
        expect(screen.getByRole('status').textContent).toBe('New admissions stopped');
        expect(screen.getByText(/does not confirm process cancellation/)).toBeTruthy();
    });

    it('resumes only explicitly with the latest observed revision; refresh stays readonly', async () => {
        fetchMock.mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 8 })))
            .mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 9 })))
            .mockResolvedValueOnce(success(snapshot({ revision: 10 })));
        render(<WebAdmissionControl />); await flush();
        fireEvent.click(screen.getByRole('button', { name: 'Refresh status' })); await flush();
        expect(bodyAt(1)).toEqual({ action: 'status' });
        fireEvent.click(screen.getByRole('button', { name: 'Resume admissions' })); await flush();
        expect(bodyAt(2)).toEqual({ action: 'resume', expectedRevision: 9 });
    });

    it('keeps failed mutation unknown and Resume disabled until a fresh status read succeeds', async () => {
        fetchMock.mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 3 })))
            .mockResolvedValueOnce(failed('JOURNAL_COMMIT_UNKNOWN'))
            .mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 4 })));
        render(<WebAdmissionControl />); await flush();
        fireEvent.click(screen.getByRole('button', { name: 'Resume admissions' }));
        expect(screen.getByRole('alert').textContent).toContain('Waiting for the server to confirm the change.');
        await flush();
        expect(screen.getByRole('status').textContent).toBe('Current status unknown');
        expect((screen.getByRole('button', { name: 'Resume admissions' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByRole('alert').textContent).toContain('The server could not confirm whether the change was saved.');
        expect(screen.getByRole('alert').getAttribute('data-control-code')).toBe('JOURNAL_COMMIT_UNKNOWN');
        await tick(2000);
        expect(bodyAt(2)).toEqual({ action: 'status' });
        expect(screen.getByRole('status').textContent).toBe('New admissions stopped');
        expect(fetchMock.mock.calls.filter((_, i) => bodyAt(i).action === 'resume')).toHaveLength(1);
    });

    it.each(['JOURNAL_BUSY', 'CONTROL_MIGRATION_REQUIRED', 'JOURNAL_UNAVAILABLE', 'JOURNAL_NOT_READY', 'ADMISSION_CAPACITY', 'FUTURE_CONTROL_CODE'])(
        'explains %s through a readable, fail-closed alert', async code => {
            fetchMock.mockResolvedValue(failed(code)); render(<WebAdmissionControl />); await flush();
            expect(screen.getByRole('region', { name: 'Web admission control' })).toBeTruthy();
            expect(screen.getByRole('alert').getAttribute('data-control-code')).toBe(code);
            expect(screen.getByRole('alert').textContent).not.toContain(code);
            if (code === 'FUTURE_CONTROL_CODE') expect(screen.getByRole('alert').textContent).toContain('Status unavailable');
            expect(screen.getByRole('status').textContent).toBe('Current status unknown');
        },
    );

    it.each([['en', 'Status unavailable'], ['vi', 'Chưa thể kiểm tra trạng thái']])(
        'shows a human status-unavailable label in %s', async (selectedLanguage, expected) => {
            language = selectedLanguage;
            fetchMock.mockResolvedValue(failed('STATUS_UNAVAILABLE'));
            render(<WebAdmissionControl />); await flush();
            expect(screen.getByRole('alert').textContent).toContain(expected);
            expect(screen.getByRole('alert').textContent).not.toContain('STATUS_UNAVAILABLE');
        },
    );

    it.each([
        ['en', 'Control access unavailable', 'Sign in with a verified account or contact your administrator.'],
        ['vi', 'Chưa có quyền truy cập điều khiển', 'Hãy đăng nhập bằng tài khoản đã xác minh hoặc liên hệ người quản trị.'],
    ])('explains a 401 without implying an unknown server state in %s', async (selectedLanguage, status, guidance) => {
        language = selectedLanguage;
        fetchMock.mockResolvedValue(failed('UNAUTHORIZED', 401)); render(<WebAdmissionControl />); await flush();
        expect(screen.getByText(status).closest('details')?.open).toBe(false);
        expect(screen.getByRole('status').textContent).toBe(status);
        expect(screen.getByRole('alert').textContent).toContain(guidance);
        expect((screen.getByRole('button', { name: selectedLanguage === 'vi' ? 'Dừng nhận lượt mới' : 'Stop new admissions' }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', { name: selectedLanguage === 'vi' ? 'Cho phép nhận lại' : 'Resume admissions' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('rejects malformed observations and does not turn old observations into a healthy status', async () => {
        fetchMock.mockResolvedValueOnce(success(snapshot({ revision: -1 })))
            .mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', observedAt: '2026-11-13T12:59:00.000Z' })));
        render(<WebAdmissionControl />); await flush();
        expect(screen.getByRole('alert').textContent).toContain('The server response could not be verified. Refresh status to try again.');
        await tick(2000);
        expect(screen.getByRole('status').textContent).toBe('Current status unknown');
        expect(screen.getByText(/Stale/)).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Resume admissions' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('rejects revision regression and preserves the last observed revision', async () => {
        fetchMock.mockResolvedValueOnce(success(snapshot({ state: 'STOPPED', revision: 7 })))
            .mockResolvedValueOnce(success(snapshot({ revision: 6 })));
        render(<WebAdmissionControl />); await flush(); await tick(2000);
        expect(screen.getByRole('alert').textContent).toContain('The server response could not be verified. Refresh status to try again.');
        expect(screen.getByText(/Control revision: 7/)).toBeTruthy();
    });

    it('projects canonical identity, possible contact, pending recording and evidence gaps at 1s intervals', async () => {
        fetchMock.mockImplementation(async () => success(snapshot({ execution: execution() })));
        render(<WebAdmissionControl />); await flush();
        expect(screen.getByText('server-canonical-id')).toBeTruthy();
        expect(screen.getByText(/POSSIBLE_OR_OBSERVED/)).toBeTruthy();
        expect(screen.getByText(/PORT_PENDING/)).toBeTruthy();
        expect(screen.getByText(/Pending attempts: 1/)).toBeTruthy();
        expect(screen.getByText(/Not recorded/)).toBeTruthy();
        await tick(999); expect(fetchMock).toHaveBeenCalledTimes(1);
        await tick(1); expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([['en', 'Technical details'], ['vi', 'Chi tiết kỹ thuật']])(
        'keeps raw status and identity inside closed technical details in %s', async (selectedLanguage, label) => {
            language = selectedLanguage;
            fetchMock.mockResolvedValue(success(snapshot({ execution: execution() })));
            render(<WebAdmissionControl />); await flush();

            const details = screen.getByText(label, { selector: 'summary' }).parentElement as HTMLDetailsElement;
            expect(details.open).toBe(false);
            for (const code of ['server-canonical-id', 'POSSIBLE_OR_OBSERVED', 'UNCONFIRMED', 'PORT_PENDING', 'contract-v1']) {
                expect(screen.getByText(new RegExp(code)).closest('details')).toBe(details);
            }
            expect(details.contains(screen.getByRole('status'))).toBe(false);
        },
    );

    it('does not overlap polling requests and ignores a late response after unmount', async () => {
        let resolve!: (value: ReturnType<typeof success>) => void;
        fetchMock.mockReturnValue(new Promise(r => { resolve = r; }));
        const { unmount } = render(<WebAdmissionControl />);
        await tick(4000); expect(fetchMock).toHaveBeenCalledTimes(1);
        const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
        unmount(); expect(signal.aborted).toBe(true);
        resolve(success()); await flush(); await tick(10000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('bounds an unavailable control read and recovers using status without automatic mutation', async () => {
        fetchMock.mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })).mockResolvedValue(success());
        render(<WebAdmissionControl />); await flush(); await tick(5000);
        expect(screen.getByRole('status').textContent).toBe('Current status unknown');
        await tick(2000);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(bodyAt(1)).toEqual({ action: 'status' });
    });

    it('discloses exhausted owner capacity without promising admission from OPEN', async () => {
        fetchMock.mockResolvedValue(success(snapshot({ ownerCapacity: { used: 32, limit: 32 } })));
        render(<WebAdmissionControl />); await flush();
        expect(screen.getByText(/Owner capacity: 32\/32/)).toBeTruthy();
        expect(screen.getByText(/Open status does not guarantee admission/)).toBeTruthy();
    });

    it('uses Vietnamese labels and persistent scope explanation', async () => {
        language = 'vi'; fetchMock.mockResolvedValue(success()); render(<WebAdmissionControl />); await flush();
        expect(screen.getByRole('region', { name: 'Kiểm soát lượt chạy Web' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Dừng nhận lượt mới' })).toBeTruthy();
        expect(screen.getByText(/áp dụng trên các phiên/)).toBeTruthy();
    });
});
