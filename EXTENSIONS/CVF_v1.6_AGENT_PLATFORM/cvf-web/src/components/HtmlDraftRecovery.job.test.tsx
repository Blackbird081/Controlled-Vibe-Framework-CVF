import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HtmlDraftRecovery } from './HtmlDraftRecovery';
import type { DisplayedResult } from './ArtifactExportPanel';
import { readPendingJobJournal, writePendingJobJournal } from './useHtmlBuildAttempts';
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('next-auth/react', () => ({ useSession: () => ({ status: 'authenticated', data: { user: { userId: 'u1', orgId: 'o1', teamId: 't1' }, expires: '2999-01-01T00:00:00.000Z' } }) }));
const versionId = '123e4567-e89b-42d3-a456-426614174004';
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const sourceRecordId = 'ncr-synthetic-recovery';
const displayed: DisplayedResult = { attempt: 1, submitted: { title: 'Old', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD',
  status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' }, result: { html: '<p>old</p>', filename: 'old.html',
  generatedAt: '2026-10-18T00:00:00.000Z', receiptAnchor: 'r', verification: [] }, job: { jobId, sourceRecordId } };
describe('job draft recovery', () => {
  it('discards malformed journals and refuses a second unresolved operation', () => {
    sessionStorage.clear();
    const scope = { sourceRecordId, owner: { userId: 'u1', orgId: 'o1', teamId: 't1' } };
    sessionStorage.setItem('cvf-html-job-pending-v1', JSON.stringify({ schema: 'cvf.htmlJobPending.v1', ...scope,
      jobId, operation: 'LINK_VERSION', extra: 'untrusted' }));
    expect(readPendingJobJournal(scope)).toBeNull();
    expect(sessionStorage.getItem('cvf-html-job-pending-v1')).toBeNull();
    sessionStorage.setItem('cvf-html-job-pending-v1', 'x'.repeat(600));
    expect(readPendingJobJournal(scope)).toBeNull();
    const first = { schema: 'cvf.htmlJobPending.v1' as const, ...scope, jobId, versionId,
      operation: 'SAVE_DRAFT' as const };
    expect(writePendingJobJournal(first)).toBe(true);
    expect(writePendingJobJournal({ ...first, versionId: '123e4567-e89b-42d3-a456-426614174005' })).toBe(false);
    sessionStorage.clear();
  });
  it('holds Save when session storage cannot journal, with zero POST', () => {
    sessionStorage.clear(); vi.stubGlobal('crypto', { randomUUID: () => versionId });
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled'); });
    render(<HtmlDraftRecovery sourceRecordId={sourceRecordId} displayed={displayed} versionState="current" jobMode />);
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    expect(fetchMock).not.toHaveBeenCalled();
    storage.mockRestore(); sessionStorage.clear();
  });
  it('journals the ID before Save, then reload reconciles with GET only', async () => {
    sessionStorage.clear(); vi.stubGlobal('crypto', { randomUUID: () => versionId });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => init?.method === 'POST'
      ? { ok: false, json: async () => ({ success: false }) }
      : { ok: true, json: async () => ({ success: true, data: { versionId, sourceRecordId, html: '<p>old</p>',
        filename: 'old.html', state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' } }) });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<HtmlDraftRecovery sourceRecordId={sourceRecordId} displayed={displayed} versionState="current" jobMode />);
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    await waitFor(() => expect(screen.getByTestId('reconcile-draft')).toBeTruthy());
    expect(JSON.parse(sessionStorage.getItem('cvf-html-job-pending-v1')!).versionId).toBe(versionId);
    view.unmount();
    render(<HtmlDraftRecovery sourceRecordId={sourceRecordId} displayed={displayed} versionState="current" jobMode />);
    fireEvent.click(screen.getByTestId('reconcile-draft'));
    await waitFor(() => expect(screen.getByTestId('restored-draft')).toBeTruthy());
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(sessionStorage.getItem('cvf-html-job-pending-v1')).toBeNull();
    sessionStorage.clear();
  });
});
