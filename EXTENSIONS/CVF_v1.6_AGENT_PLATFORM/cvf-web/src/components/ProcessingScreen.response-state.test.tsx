// Text Encoding Exception: Vietnamese user-facing fixtures and language-matching literals require UTF-8.
/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProcessingScreen } from './ProcessingScreen';

// The held-execution notice (held-release slice 8223fe6aa) makes its own control status call whenever a run fails; it is
// covered by ProcessingScreen.test.tsx and HeldExecutionNotice.test.tsx. Here it is isolated so this suite's fetch counts and
// queued responses only describe the execute and provider calls under test.
vi.mock('./HeldExecutionNotice', () => ({ default: () => null }));

const locale = vi.hoisted(() => ({ language: 'en' }));
const settings = vi.hoisted(() => ({ preferences: { defaultExportMode: 'governance', defaultProvider: undefined as string | undefined }, providers: {} }));
vi.mock('./Settings', () => ({ useSettings: () => ({ settings, isLoaded: true }) }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => locale }));
vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const props = { templateName: 'Example', templateId: 'example', inputs: { task: 'test' }, intent: 'test', onComplete: vi.fn(), onCancel: vi.fn() };

describe('ProcessingScreen response state', () => {
  beforeEach(() => { locale.language = 'en'; settings.preferences.defaultProvider = undefined; vi.restoreAllMocks(); props.onComplete.mockClear(); });

  it.each([['en', 'Sign in', /session has expired/], ['vi', 'Đăng nhập', /Phiên đăng nhập/]])('stops on 401 and offers sign in (%s)', async (language, label, message) => {
    locale.language = language;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401, json: async () => ({ error: 'Unauthorized: please login' }) }));
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe('/login?from=/home');
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(screen.queryByTestId('governance-evidence-panel')).toBeNull();
    expect(screen.queryByText(/Connected to AI Provider/)).toBeNull();
    expect(screen.queryByText(/90%/)).toBeNull();
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('offers CVF sign in when Claude readiness returns 401 without attempting execution', async () => {
    settings.preferences.defaultProvider = 'anthropic';
    const fetchMock = vi.fn().mockResolvedValue({ status: 401, ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(/session has expired/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/providers');
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('stops on network failure without an empty governance claim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(/Network error/)).toBeTruthy();
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(screen.queryByTestId('governance-evidence-panel')).toBeNull();
    expect(screen.getByText('Unable to complete')).toBeTruthy();
  });

  it('shows waiting while pending and completion only after success', async () => {
    let respond!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(resolve => { respond = resolve; })));
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Request sent, waiting for a response...')).toBeTruthy();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('Complete')).toBeNull();
    respond({ status: 200, json: async () => ({ success: true, output: 'Done' }) });
    await waitFor(() => expect(screen.getByText('Complete')).toBeTruthy());
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.queryByTestId('governance-evidence-panel')).toBeNull();
    await waitFor(() => expect(props.onComplete).toHaveBeenCalledWith('Done', undefined));
  });

  const wordLimit422 = {
    success: false, error: 'Generated response exceeds the explicit word limit.', automaticRetryAllowed: false,
    diagnostic: { stage: 'output_validation', class: 'output_validation_failed', retryable: false, userAction: 'revise_request', safeMessage: 'The generated output did not satisfy CVF output validation.' },
    outputValidation: { qualityHint: 'needs_improvement', issues: ['WORD_LIMIT_EXCEEDED'], retryAttempts: 0, wordLimit: { observed: 114, limit: 99, countingMethod: 'visible_whitespace_units_v1' } },
    governanceEvidenceReceipt: { receiptId: 'receipt-cap', decision: 'BLOCK' },
  };
  it.each([['en', /The result has 114 words, above the 99-word limit/], ['vi', /Kết quả dài 114 từ, vượt giới hạn 99 từ/]])('states the measured word-limit refusal reason without showing output (%s)', async (language, message) => {
    locale.language = language;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 422, json: async () => wordLimit422 }));
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(message)).toBeTruthy();
    // The generic validation sentence is replaced in the user message; the technical diagnostic panel stays.
    expect(screen.queryByText(/Next action: revise request|Bước tiếp theo: revise request/)).toBeNull();
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('keeps the generic validation text when the 422 is not a word-limit refusal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 422, json: async () => ({ ...wordLimit422, outputValidation: { qualityHint: 'needs_improvement', issues: ['TOO_SHORT'], retryAttempts: 1 } }) }));
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(/did not satisfy CVF output validation\. Next action: revise request\./)).toBeTruthy();
  });

  const rateLimited429 = {
    success: false, error: 'Too many requests. Please slow down.', retryAfterSeconds: 30,
    diagnostic: { stage: 'rate_limit', class: 'rate_limited', retryable: true, userAction: 'wait_and_retry', safeMessage: 'The request was rate limited.' },
  };
  it.each([['en', /did not send this call to the AI\. Wait about 30 seconds/], ['vi', /không gửi lần gọi này tới AI\. Hãy chờ khoảng 30 giây/]])('states a rate-limit refusal with the server wait (%s)', async (language, message) => {
    locale.language = language;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429, headers: new Headers({ 'Retry-After': '30' }), json: async () => ({ ...rateLimited429, retryAfterSeconds: 45 }) }));
    const { container } = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText(/Next action: wait and retry|Bước tiếp theo: wait and retry/)).toBeNull();
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('uses the body wait when the Retry-After header is missing and no number when neither is given', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429, json: async () => ({ ...rateLimited429, retryAfterSeconds: 12 }) }));
    const first = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(/Wait about 12 seconds/)).toBeTruthy();
    first.unmount();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429, json: async () => ({ ...rateLimited429, retryAfterSeconds: undefined }) }));
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText(/Wait a moment, then run again\./)).toBeTruthy();
  });

  it('retains a blocked governance receipt without continuing progress', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403, json: async () => ({ success: false, enforcement: { status: 'BLOCK' }, governanceEvidenceReceipt: { receiptId: 'receipt-1', decision: 'BLOCK' } }) }));
    const { container } = render(<ProcessingScreen {...props} />);
    expect((await screen.findByTestId('governance-evidence-panel')).textContent).toContain('receipt-1');
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(screen.queryByText('90%')).toBeNull();
  });
});
