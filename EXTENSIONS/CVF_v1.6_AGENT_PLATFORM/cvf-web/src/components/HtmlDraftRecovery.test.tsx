import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlDraftRecovery } from './HtmlDraftRecovery';
import type { DisplayedResult } from './ArtifactExportPanel';

// Text Encoding Exception: localized Vietnamese user-facing copy assertions follow the existing bilingual UI convention.
const ui = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: ui.lang }) }));
const auth = vi.hoisted(() => ({ status: 'authenticated', data: { user: { userId: 'u1', orgId: 'o1', teamId: 't1' }, expires: '2999-01-01T00:00:00.000Z' } }));
vi.mock('next-auth/react', () => ({ useSession: () => auth }));
beforeEach(() => { ui.lang = 'en'; auth.status = 'authenticated'; auth.data.user = { userId: 'u1', orgId: 'o1', teamId: 't1' }; auth.data.expires = '2999-01-01T00:00:00.000Z'; });
const displayed: DisplayedResult = {
  attempt: 2,
  submitted: { title: 'Old', sourcePath: 'a', sourceContent: 'b', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'unaccepted', receiptAnchor: 'r' },
  result: { html: '<p>old</p>', filename: 'old.html', generatedAt: '2026-10-18T00:00:00.000Z', receiptAnchor: 'r', verification: [] },
};
describe('recovery companion', () => {
  it('saves the displayed submit snapshot once and reconciles by GET without export replay', async () => {
    const calls: Array<{ url: string; method: string; body?: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? 'GET', body: init?.body as string | undefined });
      if (init?.method === 'POST') return { ok: false, json: async () => ({ success: false }) };
      return { ok: false, json: async () => ({ success: false }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: () => '123e4567-e89b-42d3-a456-426614174004' });
    render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={displayed} versionState="stale" />);
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    await waitFor(() => expect(screen.getByTestId('reconcile-draft')).toBeTruthy());
    expect(JSON.parse(calls[0].body!).request.title).toBe('Old');
    expect(JSON.parse(calls[0].body!).html).toBe('<p>old</p>');
    fireEvent.click(screen.getByTestId('reconcile-draft'));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].url).toContain('id=123e4567');
    expect(calls.every(call => !call.url.includes('/export'))).toBe(true);
  });
  it('rejects an old selection response after switching records', async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn(() => new Promise(resolvePromise => { resolve = resolvePromise; }));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    fireEvent.click(screen.getByTestId('list-saved-drafts'));
    view.rerender(<HtmlDraftRecovery sourceRecordId="evt_2" displayed={null} versionState={null} />);
    resolve({ ok: true, json: async () => ({ success: true, data: [{ versionId: 'old', filename: 'old.html' }] }) });
    await waitFor(() => expect(screen.queryByText(/old.html/)).toBeNull());
  });
  it('lists and restores only an unverified draft without replay', async () => {
    const versionId = '123e4567-e89b-42d3-a456-426614174005';
    const snapshot = { versionId, sourceRecordId: 'evt_1', html: '<p>saved</p>', filename: 'saved.html', state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' };
    const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => url.includes('list=1')
      ? { success: true, data: [{ versionId, filename: 'saved.html' }] }
      : { success: true, data: snapshot } }));
    vi.stubGlobal('fetch', fetchMock);
    render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    fireEvent.click(screen.getByTestId('list-saved-drafts'));
    await waitFor(() => expect(screen.getByTestId(`restore-${versionId}`)).toBeTruthy());
    fireEvent.click(screen.getByTestId(`restore-${versionId}`));
    await waitFor(() => expect(screen.getByTestId('restored-draft').getAttribute('data-version-id')).toBe(versionId));
    expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('/export'))).toBe(true);
  });
  it('keeps an ambiguous save ID and blocks a second POST until read-only confirmation', async () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '123e4567-e89b-42d3-a456-426614174006') });
    const fetchMock = vi.fn(async () => { throw new Error('AMBIGUOUS'); });
    vi.stubGlobal('fetch', fetchMock);
    render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={displayed} versionState="current" />);
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    await waitFor(() => expect(screen.getByTestId('draft-recovery-notice').textContent).toContain('unconfirmed'));
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((screen.getByTestId('save-displayed-draft') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('reconcile-draft').textContent).toContain('174006');
  });
  it('does not publish late Save or follow-up list after a record switch', async () => {
    let finish!: (value: unknown) => void;
    vi.stubGlobal('crypto', { randomUUID: () => '123e4567-e89b-42d3-a456-426614174007' });
    const fetchMock = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={displayed} versionState="current" />);
    fireEvent.click(screen.getByTestId('save-displayed-draft'));
    view.rerender(<HtmlDraftRecovery sourceRecordId="evt_2" displayed={null} versionState={null} />);
    await act(async () => finish({ ok: true, json: async () => ({ success: true, state: 'SAVED', versionId: '123e4567-e89b-42d3-a456-426614174007' }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('reconcile-draft')).toBeNull();
    expect(screen.queryByText(/You can recover/)).toBeNull();
  });
  it('clears restored bytes on owner change and refuses expired sessions', async () => {
    const versionId = '123e4567-e89b-42d3-a456-426614174008';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => url.includes('list=1')
      ? { success: true, data: [{ versionId, filename: 'owner-only.html' }] }
      : { success: true, data: { versionId, sourceRecordId: 'evt_1', html: '<p>owner-only</p>', filename: 'owner-only.html', state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' } } })));
    const view = render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    fireEvent.click(screen.getByTestId('list-saved-drafts'));
    await waitFor(() => expect(screen.getByTestId(`restore-${versionId}`)).toBeTruthy());
    fireEvent.click(screen.getByTestId(`restore-${versionId}`));
    await waitFor(() => expect(screen.getByTestId('restored-draft')).toBeTruthy());
    auth.data.user = { ...auth.data.user, userId: 'u2' };
    view.rerender(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    expect(screen.queryByTestId('restored-draft')).toBeNull();
    auth.data.expires = '2000-01-01T00:00:00.000Z';
    view.rerender(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={displayed} versionState="current" />);
    expect((screen.getByTestId('list-saved-drafts') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('save-displayed-draft') as HTMLButtonElement).disabled).toBe(true);
  });

});

// Clarity repair (F5): neutral title and conditional pre-save guidance on the real component. Presentation assertions only; no persistence claim.
const WORDING = {
  en: { title: 'HTML drafts', pre: 'Any draft saved here is client-submitted', saved: 'Saved client-submitted draft', build: 'No packet is built yet',
    ready: 'A built packet is shown', explicit: 'no draft is saved until you choose save', listOnly: 'Show saved versions only lists drafts that were saved earlier' },
  vi: { title: 'Bản nháp HTML', pre: 'Bản nháp nào được lưu ở đây cũng do trình duyệt gửi', saved: 'Bản nháp do trình duyệt gửi', build: 'Chưa có gói nào được tạo',
    ready: 'Đang hiển thị một gói đã tạo', explicit: 'chưa có bản nháp nào được lưu cho đến khi bạn chọn lưu', listOnly: 'Xem các bản đã lưu chỉ liệt kê các bản đã lưu trước đó' },
};
describe('pre-save presentation (real component)', () => {
  it.each(['en', 'vi'] as const)('shows a neutral title and conditional pre-save guidance in %s without fetching or saving on render', async (lang) => {
    ui.lang = lang;
    const w = WORDING[lang];
    const fetchMock = vi.fn(async () => { throw new Error('UNEXPECTED_FETCH'); });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    await act(async () => { await Promise.resolve(); });
    const section = screen.getByTestId('html-draft-recovery');
    expect(section.querySelector('h4')?.textContent).toBe(w.title);
    expect(section.textContent).not.toContain(w.saved);
    expect(section.textContent).toContain(w.pre);
    expect(screen.getByTestId('draft-recovery-guidance').textContent).toContain(w.build);
    expect(screen.getByTestId('draft-recovery-guidance').textContent?.toLowerCase()).toContain(w.explicit);
    expect(screen.getByTestId('draft-recovery-guidance').textContent).toContain(w.listOnly);
    expect(screen.queryByTestId('draft-recovery-notice')).toBeNull();
    expect((screen.getByTestId('save-displayed-draft') as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={displayed} versionState="current" />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('draft-recovery-guidance').textContent).toContain(w.ready);
    expect(screen.getByTestId('draft-recovery-guidance').textContent?.toLowerCase()).toContain(w.explicit);
    expect((screen.getByTestId('save-displayed-draft') as HTMLButtonElement).disabled).toBe(false);
    expect(section.textContent).not.toContain(w.saved);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['en', 'vi'] as const)('switches to the saved wording and hides the guidance only once a saved version is listed in %s', async (lang) => {
    ui.lang = lang;
    const w = WORDING[lang];
    const versionId = '123e4567-e89b-42d3-a456-426614174009';
    const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => (url.includes('list=1')
      ? { success: true, data: [{ versionId, filename: 'saved.html' }] } : { success: false }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<HtmlDraftRecovery sourceRecordId="evt_1" displayed={null} versionState={null} />);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('list-saved-drafts'));
    await waitFor(() => expect(screen.getByTestId(`restore-${versionId}`)).toBeTruthy());
    expect(screen.queryByTestId('draft-recovery-guidance')).toBeNull();
    expect(screen.getByTestId('html-draft-recovery').textContent).toContain(w.saved);
    expect(screen.getByTestId('html-draft-recovery').textContent).not.toContain(w.pre);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('list=1');
  });
});
