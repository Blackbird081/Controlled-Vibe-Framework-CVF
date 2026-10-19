import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ArtifactExportPanel } from './ArtifactExportPanel';
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
const result = { html: '<p>late</p>', filename: 'late.html', generatedAt: '2026-10-18T00:00:00.000Z', receiptAnchor: 'r', verification: [] };
describe('exact HTML build attempts', () => {
  it('publishes a fresh Build under StrictMode setup-cleanup-setup', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: result }) })));
    render(<StrictMode><ArtifactExportPanel renderRecovery={snapshot => <output data-testid="strict-slot">{snapshot?.result.html ?? '-'}</output>} /></StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(screen.getByTestId('strict-slot').textContent).toBe('<p>late</p>'));
  });
  it('Stop during job creation fences export before it starts', async () => {
    let resolveJob!: (value: { jobId: string; sourceRecordId: string }) => void;
    const prepareJob = vi.fn(() => new Promise<{ jobId: string; sourceRecordId: string }>(resolve => { resolveJob = resolve; }));
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    render(<ArtifactExportPanel prepareJob={prepareJob} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    expect(prepareJob).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('stop-html-build'));
    resolveJob({ jobId: '123e4567-e89b-42d3-a456-426614174001', sourceRecordId: 'ncr-synthetic-1' });
    await waitFor(() => expect(screen.getByTestId('stopped-unknown')).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    expect(prepareJob).toHaveBeenCalledTimes(1);
  });
  it('Stop before late export success prevents publication and onGenerated', async () => {
    let resolveFetch!: (value: unknown) => void;
    const fetchMock = vi.fn(() => new Promise(resolve => { resolveFetch = resolve; }));
    const onGenerated = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    render(<ArtifactExportPanel onGenerated={onGenerated} renderRecovery={snapshot => <output data-testid="job-slot">{snapshot?.result.html ?? '-'}</output>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('stop-html-build'));
    resolveFetch({ ok: true, json: async () => ({ success: true, data: result }) });
    await waitFor(() => expect(screen.getByTestId('stopped-unknown')).toBeTruthy());
    expect(screen.getByTestId('job-slot').textContent).toBe('-');
    expect(onGenerated).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('keeps a stopped exact request blocked while an edited request can Build', async () => {
    let finish!: (value: unknown) => void;
    const fetchMock = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ success: true, data: result }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<ArtifactExportPanel renderRecovery={snapshot => <output data-testid="changed-slot">{snapshot?.result.html ?? '-'}</output>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    fireEvent.click(screen.getByTestId('stop-html-build'));
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Changed request' } });
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(screen.getByTestId('changed-slot').textContent).toBe('<p>late</p>'));
    finish({ ok: true, json: async () => ({ success: true, data: { ...result, html: '<p>old</p>' } }) });
    expect(screen.getByTestId('changed-slot').textContent).toBe('<p>late</p>');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('suppresses a late failed response and a completion after unmount', async () => {
    let rejectFetch!: (reason: Error) => void;
    const fetchMock = vi.fn(() => new Promise((_resolve, reject) => { rejectFetch = reject; }));
    const onGenerated = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const view = render(<ArtifactExportPanel onGenerated={onGenerated} renderRecovery={snapshot =>
      <output data-testid="error-slot">{snapshot?.result.html ?? '-'}</output>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('stop-html-build'));
    await act(async () => { rejectFetch(new Error('late failure')); });
    expect(screen.getByTestId('stopped-unknown')).toBeTruthy();
    expect(screen.queryByText('late failure')).toBeNull();
    expect(screen.getByTestId('error-slot').textContent).toBe('-');
    expect(onGenerated).not.toHaveBeenCalled();
    view.unmount();

    let resolveSecond!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveSecond = resolve; })));
    const second = render(<ArtifactExportPanel onGenerated={onGenerated} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(resolveSecond).toBeTypeOf('function'));
    second.unmount();
    await act(async () => { resolveSecond({ ok: true, json: async () => ({ success: true, data: result }) }); });
    expect(onGenerated).not.toHaveBeenCalled();
  });
  it('marks a saved Build result stale when the frozen request is edited', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: result }) })));
    render(<ArtifactExportPanel renderRecovery={(_snapshot, state) =>
      <output data-testid="version-state">{state ?? '-'}</output>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(screen.getByTestId('version-state').textContent).toBe('current'));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Edited after Build' } });
    expect(screen.getByTestId('version-state').textContent).toBe('stale');
  });
});
