import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArtifactExportPanel } from './ArtifactExportPanel';
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
describe('panel recovery slot', () => {
  it('delivers the exact displayed request and result, not later form edits or superseded responses', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: {
      html: '<p>one</p>', filename: 'one.html', generatedAt: '2026-10-18T00:00:00.000Z', receiptAnchor: 'r', verification: [],
    } }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<ArtifactExportPanel renderRecovery={(snapshot, state) => <output data-testid="slot">{snapshot?.submitted?.title ?? '-'}|{snapshot?.result.html ?? '-'}|{state}</output>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await waitFor(() => expect(screen.getByTestId('slot').textContent).toContain('<p>one</p>|current'));
    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Changed' } });
    expect(screen.getByTestId('slot').textContent).toContain('CVF HTML Review Packet|<p>one</p>|stale');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
