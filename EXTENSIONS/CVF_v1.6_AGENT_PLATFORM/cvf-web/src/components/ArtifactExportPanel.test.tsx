/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: asserts against localized Vietnamese copy from ArtifactExportPanel's existing convention.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import {
  ArtifactExportPanel,
  buildPreviewDocument,
  containPreviewNavigation,
  PREVIEW_FRAME_POLICY,
  type ArtifactExportResult,
} from './ArtifactExportPanel';

let mockLanguage: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: mockLanguage }),
}));

const EXPORT_RESULT: ArtifactExportResult = {
  html: '<!doctype html><html lang="en"><body><main><h1>Review Packet</h1></main></body></html>',
  filename: 'review-packet.html',
  receiptAnchor: 'receipt-review-packet',
  generatedAt: '2026-05-16T10:00:00.000Z',
  governanceState: 'DRAFT_UNACCEPTED',
  verification: [
    { label: 'Source reference recorded', passed: true, detail: 'docs/reviews/review-packet.md' },
    { label: 'Review boundary visible', passed: true, detail: 'HTML review packet only.' },
  ],
};

// jsdom stand-in for the print popup only: native popup, opener, sandbox/CSP enforcement,
// layout height and print behavior are proven in tests/e2e/artifact-export-print-browser.spec.ts.
function makePopup(options: { detachable?: boolean } = {}) {
  const popupDoc = document.implementation.createHTMLDocument('popup');
  let opener: unknown = { sentinel: 'app window' };
  const openerAtInsert: unknown[] = [];
  const printWindow = {
    get opener() { return opener; },
    set opener(value: unknown) { if (options.detachable !== false) opener = value; },
    document: popupDoc,
    focus: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
  };
  const append = popupDoc.body.appendChild.bind(popupDoc.body);
  vi.spyOn(popupDoc.body, 'appendChild').mockImplementation(((node: Node) => { openerAtInsert.push(printWindow.opener); return append(node); }) as typeof popupDoc.body.appendChild);
  const writeSpy = vi.spyOn(popupDoc, 'write');
  const frames = () => ({
    probe: popupDoc.querySelector('iframe[sandbox="allow-same-origin"]') as HTMLIFrameElement | null,
    view: popupDoc.querySelector('iframe[sandbox=""]') as HTMLIFrameElement | null,
  });
  // The measuring frame's document is not laid out in jsdom, so its height is supplied.
  const finishProbe = (probe: HTMLIFrameElement, scrollHeight: number) => {
    Object.defineProperty(probe, 'contentDocument', { value: { documentElement: { scrollHeight }, body: { scrollHeight } }, configurable: true });
    probe.dispatchEvent(new Event('load'));
  };
  return { popupDoc, printWindow, openerAtInsert, writeSpy, frames, finishProbe };
}

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

  it('shows the pre-generate disclosure before the Build HTML button in English', () => {
    render(<ArtifactExportPanel />);

    const disclosure = screen.getByTestId('pre-generate-disclosure');
    expect(disclosure.textContent).toMatch(/may send a short excerpt of your text/i);
    expect(
      disclosure.compareDocumentPosition(screen.getByText('Build HTML')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the pre-generate disclosure in Vietnamese', () => {
    mockLanguage = 'vi';
    render(<ArtifactExportPanel />);

    expect(screen.getByTestId('pre-generate-disclosure').textContent).toMatch(/có thể gửi một đoạn ngắn nội dung/);
  });

  it('shows an absent-receipt note when a generated result carries no governance receipt', async () => {
    render(<ArtifactExportPanel />);

    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(screen.getByTestId('governance-receipt-absent-note').textContent).toMatch(
        /does not necessarily mean nothing was sent/i,
      );
    });
    expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
  });

  it('shows the timeout and attempt ID without offering an approval badge', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, data: {
        ...EXPORT_RESULT,
        governanceReceiptStatus: 'TIMED_OUT',
        governanceReceiptAttemptId: 'artifact-proof-timeout-1',
      } }),
    });
    render(<ArtifactExportPanel />);
    fireEvent.click(screen.getByText('Build HTML'));
    await waitFor(() => expect(screen.getByTestId('governance-receipt-absent-note').textContent)
      .toMatch(/may still have processed the request/i));
    expect(screen.getByTestId('governance-receipt-attempt-id').textContent).toBe('artifact-proof-timeout-1');
    expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
    expect(screen.getByTestId('artifact-draft-state')).toBeTruthy();
  });

  it('shows a governance receipt badge instead of the absent-receipt note when a receipt is present', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { ...EXPORT_RESULT, governanceState: 'RECEIPT_ALLOW_REVIEW_REQUIRED', governanceReceipt: { receiptId: 'r1', decision: 'APPROVED', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0' } },
      }),
    });
    render(<ArtifactExportPanel />);

    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(screen.getByTestId('governance-receipt-badge').textContent).toMatch(/Final artifact acceptance is still required/);
    });
    expect(screen.queryByTestId('governance-receipt-absent-note')).toBeNull();
  });

  it('shows DENY as draft and unaccepted, without a positive receipt badge', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, data: { ...EXPORT_RESULT, governanceReceipt: {
        receiptId: 'r-deny', decision: 'DENY', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0',
      } } }),
    });
    render(<ArtifactExportPanel />);
    fireEvent.click(screen.getByText('Build HTML'));
    await waitFor(() => expect(screen.getByTestId('governance-receipt-denied-note').textContent).toMatch(/draft and unaccepted/));
    expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
    expect(screen.getByTestId('artifact-draft-state').textContent).toMatch(/DRAFT \/ UNACCEPTED/);
  });

  it('shows an ALLOW evaluation as evidence without calling it artifact approval', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, data: { ...EXPORT_RESULT, governanceReceiptStatus: 'PRESENT', governanceReceipt: {
        receiptId: 'r-allow', decision: 'ALLOW', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0',
      } } }),
    });
    render(<ArtifactExportPanel />);
    fireEvent.click(screen.getByText('Build HTML'));
    await waitFor(() => expect(screen.getByTestId('governance-receipt-evaluated-note').textContent)
      .toMatch(/not artifact approval/i));
    expect(screen.queryByTestId('governance-receipt-denied-note')).toBeNull();
    expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
  });

  it('keeps an approved receipt truthful when presentation checks leave the packet draft', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, data: { ...EXPORT_RESULT, governanceReceipt: {
        receiptId: 'r-approved', decision: 'APPROVED', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0',
      } } }),
    });
    render(<ArtifactExportPanel />);
    fireEvent.click(screen.getByText('Build HTML'));
    await waitFor(() => expect(screen.getByTestId('governance-approved-checks-note').textContent).toMatch(/Presentation checks still need attention/));
    expect(screen.queryByTestId('governance-receipt-denied-note')).toBeNull();
    expect(screen.getByTestId('artifact-draft-state')).toBeTruthy();
  });

  it('maps the secret-pattern rejection to plain-language recovery, keeping the raw error as secondary detail', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'Potential secret-like value detected in source content.' }),
    });
    render(<ArtifactExportPanel />);

    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(screen.getByTestId('export-error-recovery').textContent).toMatch(/private key or token/i);
    });
    expect(screen.getByTestId('export-error-detail').textContent).toBe(
      'Potential secret-like value detected in source content.',
    );
  });

  it('maps the missing-field rejection to plain-language recovery, keeping the raw error as secondary detail', async () => {
    (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'Missing required artifact export fields.' }),
    });
    render(<ArtifactExportPanel />);

    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(screen.getByTestId('export-error-recovery').textContent).toMatch(/fill in the missing fields/i);
    });
    expect(screen.getByTestId('export-error-detail').textContent).toBe('Missing required artifact export fields.');
  });

  it('keeps an unrelated or network error generic, without a secondary detail line', async () => {
    (fetch as unknown as { mockRejectedValue: (v: unknown) => void }).mockRejectedValue(new Error('Failed to fetch'));
    render(<ArtifactExportPanel />);

    fireEvent.click(screen.getByText('Build HTML'));

    await waitFor(() => {
      expect(screen.getByTestId('export-error-recovery').textContent).toBe('Failed to fetch');
    });
    expect(screen.queryByTestId('export-error-detail')).toBeNull();
  });

  describe('F-01 secret refusal recovery', () => {
    const CANONICAL = 'Potential secret-like value detected in artifact export fields.';
    const LEGACY = 'Potential secret-like value detected in source content.';
    const RECOVERY_EN = 'This text looks like it may contain a private key or token. Remove that value and try again.';
    const RECOVERY_VI = 'Nội dung này có vẻ chứa khóa riêng tư hoặc mã token. Hãy xóa giá trị đó rồi thử lại.';

    const refuseWith = (error: string) => {
      (fetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error }),
      });
    };

    it('SR-01 shows the English recovery for the current route refusal, keeps the raw error and builds nothing', async () => {
      refuseWith(CANONICAL);
      const onGenerated = vi.fn();
      render(<ArtifactExportPanel onGenerated={onGenerated} />);

      fireEvent.click(screen.getByText('Build HTML'));

      await waitFor(() => {
        expect(screen.getByTestId('export-error-recovery').textContent).toBe(RECOVERY_EN);
      });
      expect(screen.getByTestId('export-error-detail').textContent).toBe(CANONICAL);
      expect(onGenerated).not.toHaveBeenCalled();
      expect(screen.queryByTestId('artifact-draft-state')).toBeNull();
    });

    it('SR-02 shows the Vietnamese recovery for the current route refusal, keeps the raw error and builds nothing', async () => {
      mockLanguage = 'vi';
      refuseWith(CANONICAL);
      const onGenerated = vi.fn();
      render(<ArtifactExportPanel onGenerated={onGenerated} />);

      fireEvent.click(screen.getByText('Tạo HTML'));

      await waitFor(() => {
        expect(screen.getByTestId('export-error-recovery').textContent).toBe(RECOVERY_VI);
      });
      expect(screen.getByTestId('export-error-detail').textContent).toBe(CANONICAL);
      expect(onGenerated).not.toHaveBeenCalled();
      expect(screen.queryByTestId('artifact-draft-state')).toBeNull();
    });

    it('SR-03 pins the mocked error to the single secret-refusal literal in the read-only route source', () => {
      const routePath = resolve(process.cwd(), 'src/app/api/artifacts/export/route.ts');
      const source = readFileSync(routePath, 'utf8');
      const literals = [...source.matchAll(/error:\s*'([^']*secret-like[^']*)'/g)].map(match => match[1]);

      expect(literals).toEqual([CANONICAL]);
    });

    it('SR-04 still shows the recovery for the legacy literal and keeps the raw error', async () => {
      refuseWith(LEGACY);
      render(<ArtifactExportPanel />);

      fireEvent.click(screen.getByText('Build HTML'));
      await waitFor(() => {
        expect(screen.getByTestId('export-error-recovery').textContent).toBe(RECOVERY_EN);
      });
      expect(screen.getByTestId('export-error-detail').textContent).toBe(LEGACY);
    });
    it('SR-05 leaves an unrelated error that only mentions secrets as the raw fallback', async () => {
      const unrelated = 'Possible secret-like private key text elsewhere.';
      refuseWith(unrelated);
      render(<ArtifactExportPanel />);
      fireEvent.click(screen.getByText('Build HTML'));
      await waitFor(() => {
        expect(screen.getByTestId('export-error-recovery').textContent).toBe(unrelated);
      });
      expect(screen.queryByTestId('export-error-detail')).toBeNull();
    });
  });
  describe('B1 version binding', () => {
    type Deferred = { promise: Promise<unknown>; resolve: (v: unknown) => void };
    const deferred = (): Deferred => {
      let resolve: (v: unknown) => void = () => undefined;
      const promise = new Promise<unknown>(r => { resolve = r; });
      return { promise, resolve };
    };
    const okResponse = (data: ArtifactExportResult) => ({
      ok: true, status: 200, json: async () => ({ success: true, data }),
    });
    const failResponse = (error: string) => ({
      ok: false, status: 500, json: async () => ({ success: false, error }),
    });
    const resultFor = (tag: string, extra: Partial<ArtifactExportResult> = {}): ArtifactExportResult => ({
      ...EXPORT_RESULT,
      html: `<!doctype html><html><body><h1>synthetic ${tag}</h1></body></html>`,
      receiptAnchor: `receipt-${tag}`,
      filename: `packet-${tag}.html`,
      ...extra,
    });
    const fetchMock = () => fetch as unknown as {
      mockResolvedValueOnce: (v: unknown) => void;
      mockImplementationOnce: (fn: () => Promise<unknown>) => void;
      mock: { calls: Array<[string, RequestInit]> };
    };
    const buildButton = () => screen.getByRole('button', { name: /Build HTML|Generating/ });
    const iframeHtml = () => (screen.getByTitle('Preview') as HTMLIFrameElement).getAttribute('srcdoc');
    const noticeState = () => screen.getByTestId('artifact-version-notice').getAttribute('data-version-state');
    it('snapshots all seven request fields at submit', async () => {
      render(<ArtifactExportPanel />);
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic A' } });
      fireEvent.change(screen.getByLabelText('Source reference'), { target: { value: 'docs/synthetic-a.md' } });
      fireEvent.change(screen.getByLabelText('Record type'), { target: { value: 'POINTER_RECORD' } });
      fireEvent.change(screen.getByLabelText('Review status'), { target: { value: 'REVIEW' } });
      fireEvent.change(screen.getByLabelText('Receipt reference'), { target: { value: 'receipt-synth-a' } });
      fireEvent.change(screen.getByLabelText('Review boundary'), { target: { value: 'boundary A' } });
      fireEvent.change(screen.getByLabelText('Source notes'), { target: { value: 'notes A' } });
      fireEvent.click(buildButton());
      await waitFor(() => expect(screen.getByTestId('artifact-version-notice')).toBeTruthy());
      expect(JSON.parse(String(fetchMock().mock.calls[0][1].body))).toEqual({
        title: 'Synthetic A',
        sourcePath: 'docs/synthetic-a.md',
        sourceContent: 'notes A',
        memoryClass: 'POINTER_RECORD',
        status: 'REVIEW',
        claimBoundary: 'boundary A',
        receiptAnchor: 'receipt-synth-a',
      });
      expect(noticeState()).toBe('current');
    });
    for (const [field, value] of [
      ['Title', 'Synthetic title B'],
      ['Review boundary', 'Synthetic boundary B'],
      ['Source reference', 'docs/other.md'],
      ['Review status', 'FINAL'],
      ['Receipt reference', 'receipt-other'],
    ] as const) {
      it(`marks the prior version stale when only ${field} changes and source notes stay identical`, async () => {
        fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        await waitFor(() => expect(noticeState()).toBe('current'));
        const sourceNotes = (screen.getByLabelText('Source notes') as HTMLTextAreaElement).value;
        fireEvent.change(screen.getByLabelText(field), { target: { value } });
        expect((screen.getByLabelText('Source notes') as HTMLTextAreaElement).value).toBe(sourceNotes);
        expect(noticeState()).toBe('stale');
        expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/Earlier version \(build #1\)/);
        expect(screen.getByTestId('artifact-version-tag').textContent).toMatch(/earlier version/);
        expect(iframeHtml()).toContain('synthetic A');
        expect(screen.getByText('#receipt-A')).toBeTruthy();
        expect(screen.getByTestId('artifact-draft-state')).toBeTruthy();
      });
    }
    it('returns to current when the form is edited back to the submitted values', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      const original = (screen.getByLabelText('Title') as HTMLInputElement).value;
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'changed' } });
      expect(noticeState()).toBe('stale');
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: original } });
      expect(noticeState()).toBe('current');
    });
    it('does not present a response as the edited form when the form changes while the request is pending', async () => {
      const d = deferred();
      fetchMock().mockImplementationOnce(() => d.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Review boundary'), { target: { value: 'edited while pending' } });
      d.resolve(okResponse(resultFor('A', {
        governanceState: 'RECEIPT_ALLOW_REVIEW_REQUIRED',
        governanceReceipt: { receiptId: 'r-a', decision: 'APPROVED', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0' },
      })));
      await waitFor(() => expect(screen.getByTestId('artifact-version-notice')).toBeTruthy());
      expect(noticeState()).toBe('stale');
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/Earlier version \(build #1\)/);
      expect(screen.getByTestId('governance-receipt-badge').textContent).toMatch(/Final artifact acceptance is still required/);
      const body = JSON.parse(String(fetchMock().mock.calls[0][1].body));
      expect(body.claimBoundary).not.toBe('edited while pending');
    });
    it('lets the latest attempt win when an older attempt succeeds late', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      const onGenerated = vi.fn();
      render(<ArtifactExportPanel onGenerated={onGenerated} />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      const resultB = resultFor('B');
      dB.resolve(okResponse(resultB));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      expect(noticeState()).toBe('current');
      dA.resolve(okResponse(resultFor('A')));
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(iframeHtml()).toContain('synthetic B');
      expect(screen.getByText('#receipt-B')).toBeTruthy();
      expect(screen.queryByText('#receipt-A')).toBeNull();
      expect(noticeState()).toBe('current');
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/build #2/);
      expect(onGenerated).toHaveBeenCalledTimes(1);
      expect(onGenerated).toHaveBeenCalledWith(resultB);
    });
    it('does not let a superseded attempt dismiss the busy state of the newer attempt', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      dA.resolve(okResponse(resultFor('A')));
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(buildButton().getAttribute('aria-busy')).toBe('true');
      expect(screen.getByText('Generating')).toBeTruthy();
      expect(screen.queryByTestId('artifact-version-notice')).toBeNull();
      dB.resolve(okResponse(resultFor('B')));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      expect(buildButton().getAttribute('aria-busy')).toBe('false');
    });
    it('ignores a superseded attempt error and keeps the newer result', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      dB.resolve(okResponse(resultFor('B')));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      dA.resolve(failResponse('late failure from attempt A'));
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(screen.queryByTestId('export-error-recovery')).toBeNull();
      expect(iframeHtml()).toContain('synthetic B');
    });
    it('does not erase a valid earlier result when a newer attempt fails, and attaches the error to the newer attempt', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      fetchMock().mockResolvedValueOnce(failResponse('synthetic outage'));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(iframeHtml()).toContain('synthetic A'));
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      await waitFor(() => expect(screen.getByTestId('export-error-recovery').textContent).toBe('synthetic outage'));
      expect(iframeHtml()).toContain('synthetic A');
      expect(noticeState()).toBe('stale');
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/build #1/);
    });
    it('labels an initialResult conservatively as unknown source, never as matching the form', () => {
      render(<ArtifactExportPanel initialResult={EXPORT_RESULT} />);
      expect(noticeState()).toBe('unknown');
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/unknown source/i);
      expect(screen.getByTestId('artifact-version-notice').textContent).not.toMatch(/still matches/i);
      expect(screen.getByTestId('artifact-version-tag').textContent).toMatch(/Source unknown/);
      expect(screen.getByTestId('artifact-draft-state')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Copy HTML' }).getAttribute('aria-describedby'))
        .toBe('artifact-version-notice');
    });
    it('keeps the draft and ALLOW distinction truthful for a stale result', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A', {
        governanceReceiptStatus: 'PRESENT',
        governanceReceipt: { receiptId: 'r-allow', decision: 'ALLOW', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0' },
      })));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(screen.getByTestId('governance-receipt-evaluated-note')).toBeTruthy());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      expect(noticeState()).toBe('stale');
      expect(screen.getByTestId('governance-receipt-evaluated-note').textContent).toMatch(/not artifact approval/i);
      expect(screen.queryByTestId('governance-receipt-badge')).toBeNull();
      expect(screen.getByTestId('artifact-draft-state').textContent).toMatch(/DRAFT \/ UNACCEPTED/);
    });
    it('copies, downloads and prints the displayed older version while the notice stays visible', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      const blobs: Blob[] = [];
      const createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:synthetic'; });
      const revokeObjectURL = vi.fn();
      const urlApi = URL as unknown as Record<string, unknown>;
      const priorCreate = urlApi.createObjectURL;
      const priorRevoke = urlApi.revokeObjectURL;
      urlApi.createObjectURL = createObjectURL;
      urlApi.revokeObjectURL = revokeObjectURL;
      onTestFinished(() => { urlApi.createObjectURL = priorCreate; urlApi.revokeObjectURL = priorRevoke; });
      const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      const popup = makePopup();
      const { popupDoc, printWindow, openerAtInsert, writeSpy, frames, finishProbe } = popup;
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.change(screen.getByLabelText('Review boundary'), { target: { value: 'Synthetic boundary B' } });
      expect(noticeState()).toBe('stale');
      for (const name of ['Copy HTML', 'Download HTML', 'Print preview']) {
        expect(screen.getByRole('button', { name }).getAttribute('aria-describedby')).toBe('artifact-version-notice');
      }
      const html = resultFor('A').html;
      fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }));
      await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(html));
      fireEvent.click(screen.getByRole('button', { name: 'Download HTML' }));
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(anchorClick).toHaveBeenCalledTimes(1);
      const blobText = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blobs[0]);
      });
      expect(blobText).toBe(html);
      fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
      expect(openSpy).toHaveBeenCalledTimes(1);
      // `noopener` would make window.open return null and lose the handle; opener is detached instead.
      expect(openSpy.mock.calls[0][2]).toBeUndefined();
      // Isolation is in place before any frame exists: a CSP meta first, then only a measuring
      // frame; the displayed older version is delivered solely as srcdoc, never written.
      const policy = popupDoc.querySelector('meta[http-equiv="Content-Security-Policy"]');
      expect(policy?.getAttribute('content')).toMatch(/default-src 'none'/);
      expect(policy?.getAttribute('content')).not.toMatch(/script-src|connect-src|unsafe-eval/);
      const { probe } = frames();
      expect(probe).not.toBeNull();
      expect(probe!.getAttribute('srcdoc')).toBe(html);
      expect(frames().view).toBeNull();
      expect(openerAtInsert[0]).toBeNull();
      expect(writeSpy).not.toHaveBeenCalled();
      expect(printWindow.print).not.toHaveBeenCalled();
      // Measured height sizes the printed frame; print waits for that frame's own content load.
      finishProbe(probe!, 1234);
      const view = frames().view;
      expect(view).not.toBeNull();
      expect(view!.getAttribute('sandbox')).toBe('');
      expect(view!.getAttribute('srcdoc')).toBe(html);
      expect(view!.style.height).toBe('1236px');
      expect(frames().probe).toBeNull();
      expect(printWindow.print).not.toHaveBeenCalled();
      view!.dispatchEvent(new Event('load'));
      expect(printWindow.print).toHaveBeenCalledTimes(1);
      expect(printWindow.close).not.toHaveBeenCalled();
      expect(screen.queryByTestId('artifact-print-blocked')).toBeNull();
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/copy, download and print/);
      expect(noticeState()).toBe('stale');
    });
    it('tells the user when the print window is blocked and writes nothing', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      vi.spyOn(window, 'open').mockReturnValue(null);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
      expect(screen.getByTestId('artifact-print-blocked').textContent).toMatch(/Allow pop-ups/);
    });
    it('closes the print window and inserts nothing when the opener cannot be detached', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      const { popupDoc, printWindow } = makePopup({ detachable: false });
      vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
      expect(popupDoc.querySelector('iframe')).toBeNull();
      expect(popupDoc.querySelector('meta')).toBeNull();
      expect(popupDoc.body.innerHTML).toBe('');
      expect(printWindow.print).not.toHaveBeenCalled();
      expect(printWindow.close).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('artifact-print-blocked')).toBeTruthy();
    });
    it('closes the print window and never prints when the document height cannot be measured', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      const { printWindow, frames, finishProbe } = makePopup();
      vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
      finishProbe(frames().probe!, 0);
      expect(frames().view).toBeNull();
      expect(printWindow.print).not.toHaveBeenCalled();
      expect(printWindow.close).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.getByTestId('artifact-print-blocked')).toBeTruthy());
    });
    it('closes the print window when print() itself fails after the content loaded', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      const { printWindow, frames, finishProbe } = makePopup();
      printWindow.print.mockImplementation(() => { throw new Error('print failed'); });
      vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
      finishProbe(frames().probe!, 800);
      frames().view!.dispatchEvent(new Event('load'));
      expect(printWindow.print).toHaveBeenCalledTimes(1);
      expect(printWindow.close).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.getByTestId('artifact-print-blocked')).toBeTruthy());
    });
    it('uses a fresh build for actions after rebuilding with the edited form', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('B')));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(iframeHtml()).toContain('synthetic A'));
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      expect(noticeState()).toBe('stale');
      fireEvent.click(buildButton());
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      expect(noticeState()).toBe('current');
      expect(screen.getByTestId('artifact-version-tag').textContent).toMatch(/Build #2 · matches form/);
      fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }));
      await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(resultFor('B').html));
      expect(screen.getByRole('button', { name: /Copied|Copy HTML/ }).getAttribute('aria-describedby')).toBeNull();
    });
    it('does not create a second request when Build is pressed twice with the same snapshot', async () => {
      const d = deferred();
      fetchMock().mockImplementationOnce(() => d.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.click(buildButton());
      fireEvent.click(buildButton());
      expect(fetchMock().mock.calls).toHaveLength(1);
      expect(screen.queryByTestId('superseded-attempts')).toBeNull();
      d.resolve(okResponse(resultFor('A')));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic A'));
      expect(fetchMock().mock.calls).toHaveLength(1);
      // Once the attempt settled, the same snapshot may be submitted again as a new build.
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A2')));
      fireEvent.click(buildButton());
      await waitFor(() => expect(iframeHtml()).toContain('synthetic A2'));
      expect(fetchMock().mock.calls).toHaveLength(2);
    });
    it('Local probe: A to B to A does not resend a snapshot still in flight', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      const original = (screen.getByLabelText('Title') as HTMLInputElement).value;
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: original } });
      fireEvent.click(buildButton());
      expect(fetchMock().mock.calls).toHaveLength(2);
      dB.resolve(okResponse(resultFor('B')));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      expect(noticeState()).toBe('stale');
      dA.resolve(okResponse(resultFor('A', { governanceReceiptAttemptId: 'probe-attempt-A' })));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').textContent).toContain('probe-attempt-A'));
      expect(iframeHtml()).toContain('synthetic B');
    });
    it('records a replaced pending attempt separately and never lets its late success reach the preview', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      expect(fetchMock().mock.calls).toHaveLength(2);
      const pendingNote = screen.getByTestId('superseded-attempt-notice');
      expect(pendingNote.getAttribute('data-status')).toBe('pending');
      expect(pendingNote.textContent).toMatch(/Build #1 was replaced by a newer build/);
      dB.resolve(okResponse(resultFor('B')));
      await waitFor(() => expect(iframeHtml()).toContain('synthetic B'));
      dA.resolve(okResponse(resultFor('A', { governanceReceiptAttemptId: 'attempt-id-synthetic-1' })));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').getAttribute('data-status')).toBe('success'));
      const note = screen.getByTestId('superseded-attempt-notice').textContent ?? '';
      expect(note).toMatch(/Build #1/);
      expect(note).toContain('attempt-id-synthetic-1');
      expect(note).toMatch(/cannot establish a governance result/);
      expect(note).not.toMatch(/retry|try again/i);
      expect(iframeHtml()).toContain('synthetic B');
      expect(screen.queryByText('#receipt-A')).toBeNull();
      expect(screen.queryByTestId('governance-receipt-attempt-id')).toBeNull();
    });
    it('falls back to the receipt ID when a superseded success has no attempt ID', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      dA.resolve(okResponse(resultFor('A', {
        governanceReceipt: { receiptId: 'receipt-id-synthetic-1', decision: 'ALLOW', evaluatedAt: '2026-05-16T10:00:00.000Z', riskLevel: 'R0' },
      })));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').getAttribute('data-status')).toBe('success'));
      expect(screen.getByTestId('superseded-attempt-notice').textContent).toContain('receipt-id-synthetic-1');
    });
    it('states that no governance result could be established for a superseded success without an ID', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      dA.resolve(okResponse(resultFor('A')));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').getAttribute('data-status')).toBe('success'));
      const note = screen.getByTestId('superseded-attempt-notice').textContent ?? '';
      expect(note).toMatch(/carried no ID/);
      expect(note).toMatch(/no governance result could be established/);
      expect(note).not.toMatch(/retry|try again/i);
    });
    it('states that no governance result could be established for a superseded failure', async () => {
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      dA.resolve(failResponse('synthetic timeout'));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').getAttribute('data-status')).toBe('failure'));
      const note = screen.getByTestId('superseded-attempt-notice').textContent ?? '';
      expect(note).toMatch(/Build #1 was replaced/);
      expect(note).toMatch(/request failed/);
      expect(note).toMatch(/No governance result could be established/);
      expect(note).not.toMatch(/retry|try again/i);
      expect(screen.queryByTestId('export-error-recovery')).toBeNull();
    });
    it('labels a newer failure with its build number apart from the older preview that stays visible', async () => {
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      fetchMock().mockResolvedValueOnce(failResponse('synthetic outage'));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(iframeHtml()).toContain('synthetic A'));
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
      fireEvent.click(buildButton());
      await waitFor(() => expect(screen.getByTestId('export-error-recovery').textContent).toBe('synthetic outage'));
      expect(screen.getByTestId('export-error-build').textContent).toBe('Build #2');
      expect(screen.getByTestId('export-error-preview-note').textContent).toMatch(/still shows build #1, not this build/);
      expect(screen.getByTestId('artifact-version-tag').textContent).toMatch(/Build #1 · earlier version/);
      expect(iframeHtml()).toContain('synthetic A');
    });
    it('labels a newer failure against an initialResult preview as unknown source', async () => {
      fetchMock().mockResolvedValueOnce(failResponse('synthetic outage'));
      render(<ArtifactExportPanel initialResult={EXPORT_RESULT} />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(screen.getByTestId('export-error-build').textContent).toBe('Build #1'));
      expect(screen.getByTestId('export-error-preview-note').textContent).toMatch(/unknown source, not this build/);
    });
    it('shows superseded-attempt copy in Vietnamese without retry advice', async () => {
      mockLanguage = 'vi';
      const dA = deferred();
      const dB = deferred();
      fetchMock().mockImplementationOnce(() => dA.promise);
      fetchMock().mockImplementationOnce(() => dB.promise);
      render(<ArtifactExportPanel />);
      const vnButton = () => screen.getByRole('button', { name: /Tạo HTML|Đang tạo/ });
      fireEvent.click(vnButton());
      fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Tiêu đề mới' } });
      fireEvent.click(vnButton());
      dA.resolve(okResponse(resultFor('A', { governanceReceiptAttemptId: 'attempt-id-vi-1' })));
      await waitFor(() => expect(screen.getByTestId('superseded-attempt-notice').getAttribute('data-status')).toBe('success'));
      const note = screen.getByTestId('superseded-attempt-notice').textContent ?? '';
      expect(note).toMatch(/Lần tạo #1 đã bị thay/);
      expect(note).toContain('attempt-id-vi-1');
      expect(note).not.toMatch(/thử lại/);
    });
    it('shows the stale-version notice in Vietnamese', async () => {
      mockLanguage = 'vi';
      fetchMock().mockResolvedValueOnce(okResponse(resultFor('A')));
      render(<ArtifactExportPanel />);
      fireEvent.click(screen.getByRole('button', { name: /Tạo HTML|Đang tạo/ }));
      await waitFor(() => expect(noticeState()).toBe('current'));
      fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Tiêu đề mới' } });
      expect(noticeState()).toBe('stale');
      expect(screen.getByTestId('artifact-version-notice').textContent).toMatch(/Phiên bản cũ \(lần tạo #1\)/);
      expect(screen.getByTestId('artifact-version-tag').textContent).toMatch(/phiên bản cũ/);
    });
  });
  // Preview passive-resource policy: effective denial and the browser behavior are proven in
  // tests/e2e/artifact-export-preview-sandbox.spec.ts; these units pin the derived-document
  // construction and that canonical Copy/Download/Print bytes never become the derived document.
  describe('B1 Preview passive-resource policy', () => {
    const POLICY_META = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_FRAME_POLICY}">`;
    const okResponse = (data: ArtifactExportResult) => ({
      ok: true, status: 200, json: async () => ({ success: true, data }),
    });
    const failResponse = (error: string) => ({
      ok: false, status: 500, json: async () => ({ success: false, error }),
    });
    const resultFor = (tag: string, html?: string): ArtifactExportResult => ({
      ...EXPORT_RESULT,
      html: html ?? `<!doctype html><html><body><h1>synthetic ${tag}</h1></body></html>`,
      receiptAnchor: `receipt-${tag}`,
      filename: `packet-${tag}.html`,
    });
    const fetchMock = () => fetch as unknown as {
      mockResolvedValueOnce: (v: unknown) => void;
      mockImplementationOnce: (fn: () => Promise<unknown>) => void;
    };
    const buildButton = () => screen.getByRole('button', { name: /Build HTML|Generating/ });
    const previewSrcdoc = () => (screen.getByTitle('Preview') as HTMLIFrameElement).getAttribute('srcdoc');
    const noticeState = () => screen.getByTestId('artifact-version-notice').getAttribute('data-version-state');
    it('denies every network and data resource and keeps only inline style', () => {
      expect(PREVIEW_FRAME_POLICY).toMatch(/default-src 'none'/);
      expect(PREVIEW_FRAME_POLICY).toMatch(/style-src 'unsafe-inline'/);
      expect(PREVIEW_FRAME_POLICY).not.toMatch(/img-src|font-src|connect-src|frame-src|script-src|https?:|\*|data:|blob:/);
    });
    it('places the policy after a plain leading doctype so the document mode is unchanged', () => {
      const html = '<!doctype html><html><body><h1>x</h1></body></html>';
      expect(buildPreviewDocument(html)).toBe(`<!doctype html>${POLICY_META}<html><body><h1>x</h1></body></html>`);
      expect(buildPreviewDocument('\n  <!DOCTYPE HTML><p>x</p>')).toBe(`\n  <!DOCTYPE HTML>${POLICY_META}<p>x</p>`);
    });
    it('places the policy before any payload markup when there is no plain leading doctype', () => {
      const adversaries = [
        '<img src="/probe?k=early"><!doctype html><html><head></head></html>',
        '<link rel="stylesheet" href="/probe?k=css"><head></head><head></head>',
        '<!-- c --><!doctype html><img src="/probe?k=after-comment">',
        '<!doctype html "a>b"><img src="/probe?k=quoted">',
        '<!doctype html public "x><img src=/probe?k=swallow>',
        'plain text only',
        '',
      ];
      for (const html of adversaries) {
        const derived = buildPreviewDocument(html);
        expect(derived.startsWith(POLICY_META)).toBe(true);
        expect(derived.slice(POLICY_META.length)).toBe(html);
      }
    });
    it('keeps a payload-supplied permissive policy after, never before, the Preview policy', () => {
      const permissive = '<meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\'">';
      const derived = buildPreviewDocument(`<!doctype html>${permissive}<img src="/probe?k=x">`);
      expect(derived.indexOf(POLICY_META)).toBeLessThan(derived.indexOf(permissive));
      expect(derived.indexOf(POLICY_META)).toBeLessThan(derived.indexOf('<img'));
    });
    it('renders a derived srcdoc under an empty sandbox while the canonical html stays unchanged', async () => {
      const canonical = resultFor('A', '<img src="/probe?k=early"><!doctype html><html><body><h1>synthetic A</h1></body></html>');
      fetchMock().mockResolvedValueOnce(okResponse(canonical));
      render(<ArtifactExportPanel />);
      fireEvent.click(buildButton());
      await waitFor(() => expect(noticeState()).toBe('current'));
      const frame = screen.getByTitle('Preview') as HTMLIFrameElement;
      expect(frame.getAttribute('sandbox')).toBe('');
      expect(previewSrcdoc()).toBe(POLICY_META + canonical.html);
      expect(previewSrcdoc()).not.toBe(canonical.html);
      expect(canonical.html.startsWith('<img src="/probe?k=early">')).toBe(true);
    });
    describe('canonical Copy and Download stay bound to result.html, not the derived Preview', () => {
      const blobs: Blob[] = [];
      let anchorClick: ReturnType<typeof vi.spyOn>;
      beforeEach(() => {
        blobs.length = 0;
        const urlApi = URL as unknown as Record<string, unknown>;
        const priorCreate = urlApi.createObjectURL;
        const priorRevoke = urlApi.revokeObjectURL;
        urlApi.createObjectURL = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:synthetic'; });
        urlApi.revokeObjectURL = vi.fn();
        onTestFinished(() => { urlApi.createObjectURL = priorCreate; urlApi.revokeObjectURL = priorRevoke; });
        anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      });
      const blobText = (blob: Blob) => new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });
      // Copy, Download and Print each deliver exactly `html`, and the Preview shows a different document.
      const expectCanonicalActions = async (html: string, derivedPreview = buildPreviewDocument(html)) => {
        expect(previewSrcdoc()).not.toBe(html);
        expect(previewSrcdoc()).toBe(derivedPreview);
        expect(previewSrcdoc()).toContain(POLICY_META);
        const copyCalls = (navigator.clipboard.writeText as unknown as { mock: { calls: string[][] } }).mock.calls.length;
        fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }));
        await waitFor(() => expect((navigator.clipboard.writeText as unknown as { mock: { calls: string[][] } }).mock.calls.length).toBe(copyCalls + 1));
        const copied = (navigator.clipboard.writeText as unknown as { mock: { calls: string[][] } }).mock.calls[copyCalls][0];
        expect(copied).toBe(html);
        const before = blobs.length;
        fireEvent.click(screen.getByRole('button', { name: 'Download HTML' }));
        expect(blobs).toHaveLength(before + 1);
        expect(await blobText(blobs[before])).toBe(html);
        const { printWindow, frames, finishProbe, popupDoc } = makePopup();
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
        fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
        const probe = frames().probe!;
        expect(probe.getAttribute('srcdoc')).toBe(html);
        expect(popupDoc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')).not.toBe(PREVIEW_FRAME_POLICY);
        finishProbe(probe, 500);
        expect(frames().view!.getAttribute('srcdoc')).toBe(html);
        openSpy.mockRestore();
      };
      it('current build', async () => {
        const a = resultFor('A', '<img src="/probe?k=early"><!doctype html><html><body><h1>synthetic A</h1></body></html>');
        fetchMock().mockResolvedValueOnce(okResponse(a));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        await waitFor(() => expect(noticeState()).toBe('current'));
        await expectCanonicalActions(a.html);
        expect(anchorClick).toHaveBeenCalledTimes(1);
      });
      it('unsaved edit after the build', async () => {
        const a = resultFor('A');
        fetchMock().mockResolvedValueOnce(okResponse(a));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        await waitFor(() => expect(noticeState()).toBe('current'));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'unsaved edit' } });
        expect(noticeState()).toBe('stale');
        await expectCanonicalActions(a.html);
      });
      it('latest response supersedes an older late response', async () => {
        let resolveA: (v: unknown) => void = () => undefined;
        fetchMock().mockImplementationOnce(() => new Promise(r => { resolveA = r; }));
        const b = resultFor('B', '<link rel="stylesheet" href="/probe?k=css"><h1>synthetic B</h1>');
        fetchMock().mockResolvedValueOnce(okResponse(b));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
        fireEvent.click(buildButton());
        await waitFor(() => expect(previewSrcdoc()).toContain('synthetic B'));
        resolveA(okResponse(resultFor('A')));
        await new Promise(r => setTimeout(r, 0));
        await new Promise(r => setTimeout(r, 0));
        expect(previewSrcdoc()).toContain('synthetic B');
        expect(previewSrcdoc()).not.toContain('synthetic A');
        await expectCanonicalActions(b.html);
      });
      it('failed newer build keeps the previous result', async () => {
        const a = resultFor('A');
        fetchMock().mockResolvedValueOnce(okResponse(a));
        fetchMock().mockResolvedValueOnce(failResponse('synthetic outage'));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        await waitFor(() => expect(noticeState()).toBe('current'));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic B' } });
        fireEvent.click(buildButton());
        await waitFor(() => expect(screen.getByTestId('export-error-recovery')).toBeTruthy());
        expect(previewSrcdoc()).toContain('synthetic A');
        await expectCanonicalActions(a.html);
      });
      it('initialResult with unknown provenance', async () => {
        const initial = resultFor('I', '<img src="/probe?k=early"><h1>synthetic I</h1>');
        render(<ArtifactExportPanel initialResult={initial} />);
        expect(noticeState()).toBe('unknown');
        await expectCanonicalActions(initial.html);
      });
      it('link-bearing build: the Preview drops link targets while Copy, Download and Print keep them', async () => {
        const linked = resultFor('L', '<!doctype html><html><body><h1>synthetic L</h1><a href="https://off.test/p?k=l">go label</a><svg><a xlink:href="/p?k=svg"><text>svg label</text></a></svg><meta http-equiv="refresh" content="0;url=/p?k=r"></body></html>');
        fetchMock().mockResolvedValueOnce(okResponse(linked));
        render(<ArtifactExportPanel />);
        fireEvent.click(buildButton());
        await waitFor(() => expect(noticeState()).toBe('current'));
        const derived = buildPreviewDocument(containPreviewNavigation(linked.html)!);
        expect(derived).not.toBe(buildPreviewDocument(linked.html));
        expect(previewSrcdoc()).not.toMatch(/href=|url=\/p/i);
        expect(previewSrcdoc()).toContain('go label');
        expect(linked.html).toContain('href="https://off.test/p?k=l"');
        await expectCanonicalActions(linked.html, derived);
      });
    });
  });
  // Browser behavior is proven in tests/e2e/artifact-export-preview-sandbox.spec.ts; these units pin construction and fail-closed paths.
  describe('B1 Preview navigation containment', () => {
    const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
    const allElements = (root: ParentNode): Element[] => {
      const found: Element[] = [];
      for (const element of Array.from(root.querySelectorAll('*'))) {
        found.push(element);
        if (element.localName === 'template') found.push(...allElements((element as HTMLTemplateElement).content));
      }
      return found;
    };
    const hrefAttributes = (html: string) => allElements(parse(html)).flatMap(element => Array.from(element.attributes).filter(a => a.localName.toLowerCase() === 'href').map(a => `${element.localName}:${a.name}`));
    const contain = (html: string) => {
      const out = containPreviewNavigation(html);
      expect(out).not.toBeNull();
      return out as string;
    };
    const okResponse = (data: ArtifactExportResult) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) });
    const failClosedParser = () => {
      const stuckLink = { namespaceURI: 'http://www.w3.org/1999/xhtml', localName: 'a', attributes: [{ localName: 'href', name: 'href' }], removeAttribute: () => undefined };
      vi.stubGlobal('DOMParser', class { parseFromString() { return { compatMode: 'CSS1Compat', documentElement: { outerHTML: '' }, querySelectorAll: () => [stuckLink] }; } });
    };
    it('removes every link target in html and svg, area, uppercase, padded and duplicate forms but keeps labels and inline style', () => {
      const html = '<!doctype html><html><body><h1 style="color:rgb(1,2,3)">Title</h1>'
        + '<a id="a1" href="https://off.test/p" target="_blank" download>label one</a>'
        + '<A id="a2" HREF="  &#9;https://off.test/up">label upper</A>'
        + '<a id="a3" href="https://off.test/first" href="#second">label duplicate</a>'
        + '<a id="a4" href="#frag">label fragment</a><div id="frag">target</div>'
        + '<img usemap="#m" src="https://off.test/i.png" alt=""><map name="m"><area shape="default" href="https://off.test/area"></map>'
        + '<svg><a xlink:href="https://off.test/x"><text>label svg x</text></a><a href="https://off.test/s"><text>label svg h</text></a></svg>'
        + '</body></html>';
      const out = contain(html);
      expect(hrefAttributes(html).length).toBe(7);
      expect(hrefAttributes(out)).toEqual([]);
      const doc = parse(out);
      expect(doc.querySelectorAll('a').length).toBe(6);
      expect(doc.querySelectorAll('area').length).toBe(1);
      for (const label of ['label one', 'label upper', 'label duplicate', 'label fragment', 'label svg x', 'label svg h']) expect(doc.body.textContent).toContain(label);
      expect(doc.querySelector('h1')!.getAttribute('style')).toBe('color:rgb(1,2,3)');
      expect(doc.querySelector('#a1')!.matches(':any-link')).toBe(false);
    });
    it('removes SVG animate and set, meta refresh and base, but keeps other meta, internal use references and inline CSS', () => {
      const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
        + '<meta http-equiv="refresh" content="0;url=https://off.test/r"><meta http-equiv=" Refresh " content="5"><meta http-equiv="content-type" content="text/html">'
        + '<base href="https://off.test/"><style>h1{color:red}</style></head><body><h1>t</h1>'
        + '<svg><symbol id="s"><text>sym</text></symbol><use href="#s"/><a><set attributeName="href" to="https://off.test/set"/><animate attributeName="xlink:href" values="https://off.test/an"/><text>an a</text></a></svg></body></html>';
      const doc = parse(contain(html));
      expect(doc.querySelectorAll('set, animate, base').length).toBe(0);
      const equivs = Array.from(doc.querySelectorAll('meta[http-equiv]')).map(m => m.getAttribute('http-equiv'));
      expect(equivs).toEqual(['content-type']);
      expect(doc.querySelectorAll('meta[charset], meta[name="viewport"]').length).toBe(2);
      expect(doc.querySelector('use')!.getAttribute('href')).toBe('#s');
      expect(doc.querySelector('style')!.textContent).toBe('h1{color:red}');
    });
    it('neutralizes anchors inside template contents at any depth and inside noscript', () => {
      const html = '<!doctype html><html><body><div id="host"><template shadowrootmode="open"><a href="https://off.test/shadow">shadow label</a>'
        + '<template><a href="https://off.test/deep">deep label</a></template></template></div>'
        + '<noscript><a href="https://off.test/ns">noscript label</a></noscript></body></html>';
      const out = contain(html);
      expect(hrefAttributes(html).length).toBe(3);
      expect(hrefAttributes(out)).toEqual([]);
      for (const label of ['shadow label', 'deep label', 'noscript label']) expect(out).toContain(label);
    });
    it('leaves a clean document byte-identical, is idempotent on its output and keeps standards versus quirks doctype', () => {
      const plain = '\n<!DOCTYPE HTML><html><head><style>p{color:red}</style></head><body><p>x</p><img src="/probe?k=x"><form action="/p"><button>go</button></form></body></html>';
      expect(containPreviewNavigation(plain)).toBe(plain);
      const out = contain('<!doctype html><html><body><a href="/p">l</a></body></html>');
      expect(containPreviewNavigation(out)).toBe(out);
      expect(contain('<!doctype html><a href="/p">l</a>').startsWith('<!doctype html><html>')).toBe(true);
      expect(contain('<a href="/p">l</a>').startsWith('<html>')).toBe(true);
    });
    it('fails closed when the parser is unavailable or removals never converge', () => {
      vi.stubGlobal('DOMParser', undefined);
      expect(containPreviewNavigation('<a href="/p">l</a>')).toBeNull();
      vi.unstubAllGlobals();
      failClosedParser();
      expect(containPreviewNavigation('<a href="/p">l</a>')).toBeNull();
    });
    for (const [language, build, title, notice] of [
      ['en', /Build HTML/, 'Preview', 'Preview unavailable: this packet could not be shown safely here.'],
      ['vi', /Tạo HTML/, 'Xem trước', 'Không hiển thị được bản xem trước một cách an toàn.'],
    ] as const) {
      it(`shows an inert localized unavailable document instead of any payload when containment fails (${language})`, async () => {
        mockLanguage = language;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ ...EXPORT_RESULT, html: '<!doctype html><body><p>payload text must not appear</p><a href="https://off.test/p">x</a></body>' })));
        failClosedParser();
        render(<ArtifactExportPanel />);
        fireEvent.click(screen.getByRole('button', { name: build }));
        await waitFor(() => expect(screen.getByTestId('artifact-version-notice')).toBeTruthy());
        const frame = screen.getByTitle(title) as HTMLIFrameElement;
        const srcdoc = frame.getAttribute('srcdoc')!;
        expect(frame.getAttribute('sandbox')).toBe('');
        expect(srcdoc).toContain(PREVIEW_FRAME_POLICY);
        expect(srcdoc).toContain(notice);
        expect(srcdoc).not.toMatch(/payload text|href/);
      });
    }
  });
});
