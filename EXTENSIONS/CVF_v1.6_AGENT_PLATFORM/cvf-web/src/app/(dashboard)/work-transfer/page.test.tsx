/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WorkTransferPage from './page';

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('@/lib/agent-handoff-validator', () => ({
  validateHandoff: () => ({
    decision: 'ALLOW',
    contextCarried: true,
    outputSummary: 'Context is present and ready to move forward.',
    issues: [],
  }),
}));

vi.mock('@/components/ArtifactExportPanel', () => ({
  ArtifactExportPanel: ({ initialRequest }: { initialRequest?: { title?: string } }) => (
    <div data-testid="artifact-export-panel-mock">
      {initialRequest?.title ?? 'Export Panel'}
    </div>
  ),
}));

const AUDIT_RECORDS = [
  {
    id: 'rec-001',
    timestamp: '2026-05-16T10:00:00.000Z',
    action: 'KNOWLEDGE_INTAKE',
    actorId: 'user-1',
    actorRole: 'admin',
    targetResource: 'docs/reviews/onboarding.md',
    outcome: 'RECORDED',
  },
  {
    id: 'rec-002',
    timestamp: '2026-05-16T11:00:00.000Z',
    action: 'ARTIFACT_EXPORT',
    actorId: 'user-2',
    actorRole: 'reviewer',
    targetResource: 'docs/reviews/export.md',
    outcome: 'RECORDED',
  },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('WorkTransferPage', () => {
  it('shows loading state initially', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<WorkTransferPage />);

    expect(screen.getByText('Loading transfer history…')).toBeTruthy();
  });

  it('renders audit history records after successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: AUDIT_RECORDS }),
    } as Response);

    render(<WorkTransferPage />);

    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByText('KNOWLEDGE_INTAKE')).toBeTruthy();
      expect(screen.getByText('ARTIFACT_EXPORT')).toBeTruthy();
    });
  });

  it('shows empty state when no records are returned', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<WorkTransferPage />);

    await waitFor(() => {
      expect(screen.getByTestId('history-empty')).toBeTruthy();
    });
  });

  it('shows error state when the audit fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));

    render(<WorkTransferPage />);

    await waitFor(() => {
      expect(screen.getByTestId('history-error')).toBeTruthy();
    });
  });

  it('opens the inline export panel when a record export button is clicked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: AUDIT_RECORDS }),
    } as Response);

    render(<WorkTransferPage />);

    await waitFor(() => screen.getByTestId('export-record-rec-001'));

    fireEvent.click(screen.getByTestId('export-record-rec-001'));

    expect(screen.getByTestId('inline-export-panel')).toBeTruthy();
    expect(screen.getByTestId('artifact-export-panel-mock').textContent).toContain('KNOWLEDGE_INTAKE');
  });

  it('closes the inline panel when the same record button is clicked again', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: AUDIT_RECORDS }),
    } as Response);

    render(<WorkTransferPage />);

    await waitFor(() => screen.getByTestId('export-record-rec-001'));

    fireEvent.click(screen.getByTestId('export-record-rec-001'));
    expect(screen.getByTestId('inline-export-panel')).toBeTruthy();

    fireEvent.click(screen.getByTestId('export-record-rec-001'));
    expect(screen.queryByTestId('inline-export-panel')).toBeNull();
  });
});
