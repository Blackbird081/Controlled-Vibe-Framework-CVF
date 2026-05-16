/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArtifactExportPanel, type ArtifactExportResult } from './ArtifactExportPanel';

let mockLanguage: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: mockLanguage }),
}));

const EXPORT_RESULT: ArtifactExportResult = {
  html: '<!doctype html><html lang="en"><body><main><h1>Review Packet</h1></main></body></html>',
  filename: 'review-packet.html',
  receiptAnchor: 'receipt-review-packet',
  generatedAt: '2026-05-16T10:00:00.000Z',
  verification: [
    { label: 'Source reference recorded', passed: true, detail: 'docs/reviews/review-packet.md' },
    { label: 'Review boundary visible', passed: true, detail: 'HTML review packet only.' },
  ],
};

describe('ArtifactExportPanel', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: EXPORT_RESULT }),
    }));

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the English HTML export surface', () => {
    render(<ArtifactExportPanel />);

    expect(screen.getByText('Review Packet Export')).toBeTruthy();
    expect(screen.getByText(/HTML only/i)).toBeTruthy();
    expect(screen.getByLabelText('Title')).toBeTruthy();
    expect(screen.getByLabelText('Source reference')).toBeTruthy();
    expect(screen.getByText('Build HTML')).toBeTruthy();
  });

  it('renders Vietnamese labels when the app language is Vietnamese', () => {
    mockLanguage = 'vi';
    render(<ArtifactExportPanel />);

    expect(screen.getByText('Xuất gói rà soát')).toBeTruthy();
    expect(screen.getByLabelText('Tiêu đề')).toBeTruthy();
    expect(screen.getByText('Tạo HTML')).toBeTruthy();
  });

  it('posts the artifact source and renders the returned candidate', async () => {
    const onGenerated = vi.fn();
    render(<ArtifactExportPanel onGenerated={onGenerated} />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Review Packet' },
    });
    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/artifacts/export', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(onGenerated).toHaveBeenCalledWith(EXPORT_RESULT);
    });

    const fetchCalls = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls;
    const requestBody = JSON.parse(String(fetchCalls[0][1].body));
    expect(requestBody.title).toBe('Review Packet');
    expect(requestBody.claimBoundary).toMatch(/HTML review packet/i);
    expect(screen.getByText('#receipt-review-packet')).toBeTruthy();
    expect(screen.getByTitle('Preview')).toBeTruthy();
    expect(screen.getByText('Source reference recorded')).toBeTruthy();
    expect(screen.getByText('2/2')).toBeTruthy();
  });

  it('copies generated HTML after a candidate is available', async () => {
    render(<ArtifactExportPanel initialResult={EXPORT_RESULT} />);

    fireEvent.click(screen.getByText('Copy HTML'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(EXPORT_RESULT.html);
      expect(screen.getByText('Copied')).toBeTruthy();
    });
  });
});
