import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LpciPage from './page';

function auditedResponse(outcome: 'NO_PROVIDER_CONFIGURED' | 'PROVIDER_ERROR') {
  return {
    outcome,
    message: outcome === 'NO_PROVIDER_CONFIGURED'
      ? 'No answer provider is configured.'
      : 'The answer provider is temporarily unavailable.',
    query: 'retention',
    corpusId: 'GOVERNANCE_PILOT_NO_LEGAL_CORPUS',
    auditId: 'audit-ui-1',
    authorizationDecision: 'PUBLIC_ONLY',
    evidenceOutcome: outcome === 'NO_PROVIDER_CONFIGURED' ? 'ELIGIBLE_NOT_SENT' : 'PROVIDER_FAILED',
    routeGovernanceProof: {
      actorId: 'session-user',
      authMode: 'session',
      decision: 'ALLOW',
    },
    auditReceipt: {
      auditId: 'audit-ui-1',
      query: 'retention',
      query_timestamp: '2026-08-09T00:00:00.000Z',
      matched_paths: ['docs/a.md', 'docs/b.md'],
      answer_class: 'SUMMARY_WITH_SOURCE',
      freshness_flag: false,
      conflict_flag: false,
      model_response_hash: 'abc123',
      response_boundary_class: 'NEGATIVE_RECEIPT',
      applied_filters: { sensitivityClearance: false },
      sensitivity_pre_filter_applied: true,
    },
  };
}

async function submitQuery() {
  fireEvent.change(screen.getByLabelText('Query'), { target: { value: 'retention' } });
  fireEvent.click(screen.getByRole('button', { name: 'Query' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
}

describe('LpciPage response consumer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the audit receipt matched-path count for no-provider results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(auditedResponse('NO_PROVIDER_CONFIGURED')),
    }));

    render(<LpciPage />);
    await submitQuery();

    expect(await screen.findByText(/2 source\(s\) matched/)).toBeTruthy();
    expect(screen.getByText(/No answer provider configured/)).toBeTruthy();
    expect(screen.getByText(/ID: audit-ui-1/)).toBeTruthy();
  });

  it('renders the fixed provider error from the discriminated response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(auditedResponse('PROVIDER_ERROR')),
    }));

    render(<LpciPage />);
    await submitQuery();

    expect((await screen.findByRole('status')).textContent).toBe(
      'The answer provider is temporarily unavailable.',
    );
    expect(screen.queryByText(/source\(s\) matched/)).toBeNull();
  });
});
