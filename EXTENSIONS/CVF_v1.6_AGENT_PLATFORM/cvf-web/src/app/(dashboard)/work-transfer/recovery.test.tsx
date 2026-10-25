import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkTransferPage from './page';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/KnowledgeJourneyNav', () => ({ KnowledgeJourneyNav: () => null }));
vi.mock('@/components/ArtifactExportPanel', () => ({ ArtifactExportPanel: ({ renderRecovery }: { renderRecovery: (snapshot: null, state: null) => unknown }) => <div>{renderRecovery(null, null) as React.ReactNode}</div> }));
vi.mock('@/components/HtmlDraftRecovery', () => ({ HtmlDraftRecovery: ({ sourceRecordId }: { sourceRecordId: string }) => <div data-testid="recovery-record">{sourceRecordId}</div> }));
describe('work transfer recovery composition', () => {
  it('binds the companion to the selected audit record without generating export on selection', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ success: true, data: [{ id: 'evt_1', timestamp: '2026-10-18T00:00:00.000Z', action: 'review', actorId: 'u1', actorRole: 'owner', targetResource: 'a', outcome: 'OK' }] }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<WorkTransferPage />);
    await waitFor(() => expect(screen.getByTestId('export-record-evt_1')).toBeTruthy());
    fireEvent.click(screen.getByTestId('export-record-evt_1'));
    expect(screen.getByTestId('recovery-record').textContent).toBe('evt_1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
