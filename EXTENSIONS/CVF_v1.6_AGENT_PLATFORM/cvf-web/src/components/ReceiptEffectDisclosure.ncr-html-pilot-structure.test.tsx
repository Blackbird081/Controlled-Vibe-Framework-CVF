import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HtmlPilotEffectDisclosure } from './ReceiptEffectDisclosure';
import type { HtmlPilotPublicDisclosure } from '@/lib/server/ncr-html-pilot-runtime-profile';

const disclosure: HtmlPilotPublicDisclosure = { kind: 'REAL_PROVIDER_FICTIONAL_CONTENT', provider: 'alibaba', model: 'qwen-flash',
  endpoint: 'https://example.invalid', sent: 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT',
  retention: 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS', maxPaidStarts: 2, maxTokens: 800, maxUsd: 1,
  maxSeconds: 60, stop: 'LOCAL_STOP_REMOTE_OUTCOME_UNKNOWN', unknown: 'NO_AUTOMATIC_RESEND', profileDigest: 'a'.repeat(64) };
describe('effect disclosure presentation', () => {
  it('names provider, caps, retention, Stop and UNKNOWN', () => {
    render(<HtmlPilotEffectDisclosure disclosure={disclosure} language="en" />);
    const text = screen.getByTestId('html-pilot-effect-disclosure').textContent ?? '';
    for (const fact of ['alibaba', 'qwen-flash', '30 days', 'USD 1', 'Stop', 'unknown', 'never resent']) expect(text).toContain(fact);
  });
});
