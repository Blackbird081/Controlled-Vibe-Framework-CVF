import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';
import type { Execution } from '@/types';

vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const execution = { id: 'exec_pilot_1', templateId: 'web_build_handoff', templateName: 'Web', input: {},
  intent: 'fictional page', status: 'completed', createdAt: new Date(), htmlPilot: {
    operationKey: 'op1', runId: 'a'.repeat(32), rootRunId: 'a'.repeat(32), outputSha256: 'b'.repeat(64),
  } } as Execution;
describe('exact Home result transfer UI', () => {
  it('offers the exact source selector and hides local acceptance for pilot output', () => {
    render(<ResultViewer execution={execution} output="# Fictional page" onAccept={vi.fn()} onReject={vi.fn()}
      onRetry={vi.fn()} onBack={vi.fn()} onFollowUp={vi.fn()} />);
    expect(screen.getByTestId('html-pilot-transfer-exact-run').getAttribute('href')).toBe('/work-transfer?source=exec_pilot_1');
    expect(screen.queryByText('Accept')).toBeNull();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});
