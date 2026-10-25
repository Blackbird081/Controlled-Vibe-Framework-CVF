import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkTransferPage from './page';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/KnowledgeJourneyNav', () => ({ KnowledgeJourneyNav: () => null }));
vi.mock('@/components/HtmlJobControls', () => ({ HtmlJobControls: ({ sourceRecordId, initialRequest }: {
  sourceRecordId: string; initialRequest: { sourceContent: string } }) =>
  <div data-testid="selected-job-controls" data-record={sourceRecordId}>{initialRequest.sourceContent}</div> }));
describe('Work Transfer synthetic job composition', () => {
  it('binds the selected synthetic audit source without starting Build on selection', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ success: true, data: [{ id: 'ncr-synthetic-1',
      timestamp: '2026-10-18T00:00:00.000Z', action: 'review', actorId: 'u1', actorRole: 'owner',
      targetResource: 'target', outcome: 'OK' }] }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<WorkTransferPage />);
    await waitFor(() => expect(screen.getByTestId('export-record-ncr-synthetic-1')).toBeTruthy());
    fireEvent.click(screen.getByTestId('export-record-ncr-synthetic-1'));
    expect(screen.getByTestId('selected-job-controls').getAttribute('data-record')).toBe('ncr-synthetic-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
