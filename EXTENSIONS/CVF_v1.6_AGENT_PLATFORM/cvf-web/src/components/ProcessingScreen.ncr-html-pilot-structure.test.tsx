import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProcessingScreen } from './ProcessingScreen';

vi.mock('./Settings', () => ({ useSettings: () => ({ settings: { preferences: { defaultExportMode: 'governance' }, providers: {} }, isLoaded: true }) }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: vi.fn() }));
const disclosure = { kind: 'REAL_PROVIDER_FICTIONAL_CONTENT', provider: 'alibaba', model: 'qwen-flash',
  endpoint: 'https://example.invalid', sent: 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT',
  retention: 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS', maxPaidStarts: 2, maxTokens: 800, maxUsd: 1,
  maxSeconds: 60, stop: 'LOCAL_STOP_REMOTE_OUTCOME_UNKNOWN', unknown: 'NO_AUTOMATIC_RESEND', profileDigest: 'a'.repeat(64) };
describe('pilot pre-effect UI structure', () => {
  it('shows nonsecret disclosure and does not POST before explicit confirmation', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') throw new Error('UNEXPECTED_POST');
      return { ok: true, json: async () => ({ success: true, disclosure }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ProcessingScreen templateName="Web" templateId="web_build_handoff" inputs={{ websiteGoal: 'fictional' }}
      intent="fictional page" htmlPilotIntent={{ operationKey: 'op1' }} onComplete={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('html-pilot-effect-disclosure')).toBeTruthy());
    expect(screen.getByTestId('html-pilot-confirm-effect')).toBeTruthy();
    expect(fetchMock.mock.calls.every(([, init]) => !init || init.method !== 'POST')).toBe(true);
  });
});
