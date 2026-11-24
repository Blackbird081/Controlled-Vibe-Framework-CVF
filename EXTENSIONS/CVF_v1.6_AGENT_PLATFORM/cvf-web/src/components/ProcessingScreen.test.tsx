// Text Encoding Exception: Vietnamese status-line fixtures of the provider transparency cases require UTF-8.
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProcessingScreen } from './ProcessingScreen';
import { partialVerdictLine, summarizeRolePlan } from './ProcessingScreen.partial-output';

const selectedSettings = vi.hoisted(() => ({ preferences: { defaultExportMode: 'governance', defaultProvider: undefined as string | undefined }, providers: { anthropic: { selectedModel: 'claude-sonnet-4-20250514' } } }));
vi.mock('./Settings', () => ({ useSettings: () => ({ settings: selectedSettings, isLoaded: true }) }));
beforeEach(() => { selectedSettings.preferences.defaultProvider = undefined; });

const statusLanguage = vi.hoisted(() => ({ value: 'en' as 'en' | 'vi' }));
vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({
    language: statusLanguage.value,
  }),
}));

vi.mock('@/lib/enforcement-log', () => ({
  logEnforcementDecision: vi.fn(),
}));

const trackEventMock = vi.fn();

vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

describe('ProcessingScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    trackEventMock.mockClear();
  });

  it('forwards governed execution overrides to /api/execute', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        output: 'Governed output',
        provider: 'openai',
        model: 'gpt-4o',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(
      <ProcessingScreen
        templateName="App Builder Wizard"
        templateId="app_builder_wizard"
        intent="Build DeskMate"
        inputs={{ appName: 'DeskMate' }}
        executionOverrides={{
          mode: 'full',
          cvfPhase: 'BUILD',
          cvfRiskLevel: 'R2',
          fileScope: ['apps/deskmate/README.md'],
          skillPreflightDeclaration: 'NONCODER_REFERENCE_PACKET:deskmate',
        }}
        onComplete={onComplete}
        onCancel={vi.fn()}
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));

    expect(body.templateId).toBe('app_builder_wizard');
    expect(body.mode).toBe('full');
    expect(body.action).toBe('build template execution request');
    expect(body.cvfPhase).toBe('BUILD');
    expect(body.cvfRiskLevel).toBe('R2');
    expect(body.fileScope).toEqual(['apps/deskmate/README.md']);
    expect(body.skillPreflightDeclaration).toBe('NONCODER_REFERENCE_PACKET:deskmate');
    expect(body.aiCommit).toMatchObject({
      agentId: 'cvf-web-ui',
      description: 'UI execution for App Builder Wizard',
    });
    expect(typeof body.aiCommit.commitId).toBe('string');
    expect(typeof body.aiCommit.timestamp).toBe('number');

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Governed output', undefined));
  });
});

// ── W88-T1: Guided Response UI Realization ────────────────────────────────────

const GUIDED_TEXT = 'Safe approach: use bcrypt with cost factor >= 12.';

const baseProps = {
  templateName: 'Test Template',
  templateId: 'test',
  intent: 'store passwords',
  inputs: { data: 'some input' },
  onComplete: vi.fn(),
  onCancel: vi.fn(),
};

describe('ProcessingScreen — guided response (W88-T1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders guided-response panel when BLOCK response includes guidedResponse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked by CVF enforcement.',
        provider: 'openai',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['HIGH_RISK pattern detected'] },
        guidedResponse: GUIDED_TEXT,
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('guided-response-panel')).toBeDefined();
    });

    expect(screen.getByTestId('guided-response-panel').textContent).toContain(GUIDED_TEXT);
  });

  it('renders guided-response panel when NEEDS_APPROVAL response includes guidedResponse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Human approval required.',
        provider: 'openai',
        model: 'approval-required',
        enforcement: { status: 'NEEDS_APPROVAL', reasons: ['Approval required'] },
        guidedResponse: GUIDED_TEXT,
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('guided-response-panel')).toBeDefined();
    });

    expect(screen.getByTestId('guided-response-panel').textContent).toContain(GUIDED_TEXT);
  });

  it('does not render guided-response panel for normal (success) tasks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        output: 'Normal output',
        provider: 'openai',
        model: 'gpt-4o',
      }),
    }));

    const onComplete = vi.fn();
    render(<ProcessingScreen {...baseProps} onComplete={onComplete} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Normal output', undefined));

    expect(screen.queryByTestId('guided-response-panel')).toBeNull();
  });

  it('does not render guided-response panel when BLOCK has no guidedResponse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked.',
        provider: 'openai',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['blocked'] },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => expect(screen.queryByText('Blocked.')).toBeDefined());

    expect(screen.queryByTestId('guided-response-panel')).toBeNull();
  });

  it('renders execution diagnostic and does not fall back to mock output', async () => {
    const onComplete = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'model unavailable',
        provider: 'alibaba',
        model: 'qwen-v3-diagnostic-intentionally-unavailable',
        diagnostic: {
          contractVersion: 'cvf.executionDiagnostic.v1',
          stage: 'provider',
          class: 'model_unavailable',
          retryable: false,
          userAction: 'change_model',
          safeMessage: 'The selected model is unavailable for the current provider account or endpoint.',
          provider: 'alibaba',
          model: 'qwen-v3-diagnostic-intentionally-unavailable',
          receiptId: 'rcpt-env-v3',
          traceId: 'env-v3',
        },
        governanceEvidenceReceipt: {
          receiptId: 'rcpt-env-v3',
          evidenceMode: 'live',
          routeId: '/api/execute',
          decision: 'ALLOW',
          provider: 'alibaba',
          model: 'qwen-v3-diagnostic-intentionally-unavailable',
          envelopeId: 'env-v3',
          generatedAt: '2026-05-24T00:00:00.000Z',
        },
      }),
    }));

    render(<ProcessingScreen {...baseProps} onComplete={onComplete} />);

    await waitFor(() => {
      expect(screen.getByTestId('execution-diagnostic-panel')).toBeDefined();
    });

    const panel = screen.getByTestId('execution-diagnostic-panel');
    expect(panel.textContent).toContain('model_unavailable');
    expect(panel.textContent).toContain('change_model');
    expect(panel.textContent).toContain('rcpt-env-v3');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('keeps incomplete output out of completion and displays its non-retryable diagnostic', async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({
      success: false, output: 'Incomplete answer', provider: 'alibaba', model: 'qwen3.8-flash',
      usage: { inputTokens: 20, outputTokens: 8, totalTokens: 28 },
      diagnostic: { contractVersion: 'cvf.executionDiagnostic.v1', stage: 'output_validation', class: 'output_validation_failed', retryable: false, userAction: 'revise_request', safeMessage: 'Alibaba did not return a complete usable answer.', provider: 'alibaba', model: 'qwen3.8-flash' },
    }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<ProcessingScreen {...baseProps} onComplete={onComplete} />);
    await waitFor(() => expect(screen.getByTestId('execution-diagnostic-panel')).toBeDefined());
    expect(screen.getByTestId('execution-diagnostic-panel').textContent).toContain('revise_request');
    expect(screen.getByTestId('execution-diagnostic-panel').textContent).toContain('output_validation_failed');
    expect(onComplete).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.filter(call => call[0] === '/api/execute')).toHaveLength(1);
  });

  it('renders unclassified live failure without falling back to mock output', async () => {
    const onComplete = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Provider returned empty output',
        provider: 'alibaba',
        model: 'qwen-flash',
        governanceEvidenceReceipt: {
          receiptId: 'rcpt-env-empty',
          evidenceMode: 'live',
          routeId: '/api/execute',
          decision: 'ALLOW',
          provider: 'alibaba',
          model: 'qwen-flash',
          envelopeId: 'env-empty',
          generatedAt: '2026-05-24T00:00:00.000Z',
        },
      }),
    }));

    render(<ProcessingScreen {...baseProps} onComplete={onComplete} />);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Provider returned empty output');
    });

    await new Promise((resolve) => setTimeout(resolve, 4200));
    expect(onComplete).not.toHaveBeenCalled();
  }, 10000);
});

// ── W94-T1: Risk Badge Visibility ────────────────────────────────────────────

describe('ProcessingScreen — risk badge (W94-T1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders risk-badge with R0 level when enforcement riskGate returns R0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        output: 'All good output',
        provider: 'alibaba',
        model: 'qwen3-max',
        enforcement: { status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R0', status: 'ALLOW', reason: 'Allowed' } },
      }),
    }));

    render(<ProcessingScreen {...baseProps} onComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('risk-badge')).toBeDefined();
    });

    const badge = screen.getByTestId('risk-badge');
    expect(badge.textContent).toContain('R0');
    expect(badge.textContent).toContain('Minimal');
  });

  it('renders risk-badge with R1 level when enforcement riskGate returns R1', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked.',
        provider: 'alibaba',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['blocked'], riskGate: { riskLevel: 'R1', status: 'ALLOW', reason: 'Allowed' } },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('risk-badge')).toBeDefined();
    });

    const badge = screen.getByTestId('risk-badge');
    expect(badge.textContent).toContain('R1');
    expect(badge.textContent).toContain('Controlled');
  });

  it('renders risk-badge with R3 when enforcement riskGate returns R3', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Needs approval.',
        provider: 'alibaba',
        model: 'approval-required',
        enforcement: {
          status: 'NEEDS_APPROVAL',
          reasons: ['R3 requires approval'],
          riskGate: { riskLevel: 'R3', status: 'NEEDS_APPROVAL', reason: 'R3' },
        },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('risk-badge')).toBeDefined();
    });

    const badge = screen.getByTestId('risk-badge');
    expect(badge.textContent).toContain('R3');
    expect(badge.textContent).toContain('Critical');
  });

  it('does not render risk-badge when enforcement has no riskGate', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked.',
        provider: 'alibaba',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['blocked'] },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => expect(screen.queryByText('Blocked.')).toBeDefined());

    expect(screen.queryByTestId('risk-badge')).toBeNull();
  });

  it('renders risk-badge description text (not empty)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked.',
        provider: 'alibaba',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['blocked'], riskGate: { riskLevel: 'R2', status: 'BLOCK', reason: 'R2+' } },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('risk-badge')).toBeDefined();
    });

    const badge = screen.getByTestId('risk-badge');
    expect(badge.textContent).toContain('R2');
    expect(badge.textContent).toContain('Elevated');
    // Description must be non-empty
    expect(badge.textContent!.length).toBeGreaterThan(20);
  });
});

// ── W114-T1 CP5: Governance evidence visibility ─────────────────────────────

describe('ProcessingScreen — governance evidence visibility (W114-T1 CP5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    trackEventMock.mockClear();
  });

  it('renders provider, routing, knowledge, and policy evidence returned by /api/execute', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        output: 'Governed output',
        provider: 'alibaba',
        model: 'qwen-flash',
        enforcement: { status: 'ALLOW', reasons: [], riskGate: { riskLevel: 'R1', status: 'ALLOW', reason: 'Allowed' } },
        providerRouting: { decision: 'ALLOW', selectedProvider: 'alibaba', requestedProvider: 'alibaba' },
        knowledgeInjection: { injected: true, source: 'inline-service', contextLength: 120, chunkCount: 0 },
        outputValidation: { qualityHint: 'usable', issues: [], retryAttempts: 0 },
        governanceEnvelope: { envelopeId: 'env-test-001', policySnapshotId: 'pol-test-001' },
        policySnapshotId: 'pol-test-001',
        governanceEvidenceReceipt: {
          receiptId: 'rcpt-env-test-001',
          evidenceMode: 'live',
          routeId: '/api/execute',
          decision: 'ALLOW',
          riskLevel: 'R1',
          provider: 'alibaba',
          model: 'qwen-flash',
          routingDecision: 'ALLOW',
          policySnapshotId: 'pol-test-001',
          envelopeId: 'env-test-001',
          knowledgeSource: 'retrieval',
          knowledgeInjected: true,
          knowledgeCollectionId: 'w119-lumencart-project',
          knowledgeChunkCount: 2,
          validationHint: 'usable',
          generatedAt: '2026-04-23T00:00:00.000Z',
        },
      }),
    }));

    const onComplete = vi.fn();
    render(<ProcessingScreen {...baseProps} onComplete={onComplete} />);

    await waitFor(() => {
      expect(screen.getByTestId('governance-evidence-panel')).toBeDefined();
    });

    const panel = screen.getByTestId('governance-evidence-panel');
    expect(panel.textContent).toContain('CVF governance details');
    expect(panel.textContent).toContain('Decision: Allowed');
    expect(panel.textContent).toContain('Routing: Allowed');
    expect(panel.textContent).toContain('alibaba');
    expect(panel.textContent).toContain('qwen-flash');
    expect(panel.textContent).toContain('retrieval');
    expect(panel.textContent).toContain('rcpt-env-test-001');
    expect(panel.textContent).toContain('w119-lumencart-project');
    expect(panel.textContent).toContain('2');
    expect(panel.textContent).toContain('pol-test-001');
    expect(panel.textContent).toContain('env-test-001');

    screen.getByTestId('view-results-btn').click();
    expect(onComplete).toHaveBeenCalledWith('Governed output', expect.objectContaining({
      receiptId: 'rcpt-env-test-001',
      knowledgeCollectionId: 'w119-lumencart-project',
    }));
  });

  it('uses execute-route approvalId directly when NEEDS_APPROVAL creates one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Human approval required.',
        provider: 'alibaba',
        model: 'approval-required',
        enforcement: { status: 'NEEDS_APPROVAL', reasons: ['Approval required'], riskGate: { riskLevel: 'R3', status: 'NEEDS_APPROVAL', reason: 'R3' } },
        approvalId: 'apr-route-001',
        approvalStatus: 'pending',
        governanceEnvelope: { envelopeId: 'env-approval-001', policySnapshotId: 'pol-approval-001' },
        policySnapshotId: 'pol-approval-001',
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-panel')).toBeDefined();
    });

    expect(screen.queryByTestId('submit-approval-btn')).toBeNull();
    expect(screen.getByTestId('approval-status-panel').textContent).toContain('apr-route-001');
    expect(screen.getByTestId('governance-evidence-panel').textContent).toContain('apr-route-001');
    expect(screen.getByTestId('approval-status-panel').textContent).toContain('expire after 24 hours');
  });

  it('shows false-positive report button for BLOCK receipt and records report without mutating receipt', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Blocked by CVF enforcement.',
          provider: 'alibaba',
          model: 'blocked',
          enforcement: { status: 'BLOCK', reasons: ['Blocked'], riskGate: { riskLevel: 'R2', status: 'BLOCK', reason: 'R2' } },
          governanceEvidenceReceipt: {
            receiptId: 'rcpt-block-001',
            evidenceMode: 'live',
            routeId: '/api/execute',
            decision: 'BLOCK',
            riskLevel: 'R2',
            provider: 'alibaba',
            model: 'blocked',
            envelopeId: 'env-block-001',
            generatedAt: '2026-05-14T00:00:00.000Z',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, control: { revision: 0, execution: null } }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reportId: 'fp-001',
          receiptId: 'rcpt-block-001',
          decision: 'BLOCK',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('false-positive-report-panel')).toBeDefined();
    });

    screen.getByTestId('report-false-positive-btn').click();

    await waitFor(() => {
      expect(screen.getByTestId('report-false-positive-btn').textContent).toContain('Report recorded');
    });

    const reportCall = fetchMock.mock.calls.find(call => call[0] === '/api/governance/false-positive-report');
    expect(reportCall).toBeDefined();
    const [, init] = reportCall!;
    const body = JSON.parse(String(init?.body));
    expect(reportCall![0]).toBe('/api/governance/false-positive-report');
    expect(body).toMatchObject({
      receiptId: 'rcpt-block-001',
      envelopeId: 'env-block-001',
      decision: 'BLOCK',
      riskLevel: 'R2',
      templateId: 'test',
      routeId: '/api/execute',
    });
    expect(body.falsePositiveReported).toBeUndefined();
    expect(trackEventMock).toHaveBeenCalledWith('task_recovery_prompted', expect.objectContaining({
      receiptId: 'rcpt-block-001',
      decision: 'BLOCK',
    }));
    expect(trackEventMock).toHaveBeenCalledWith('task_recovery_started', expect.objectContaining({
      method: 'false_positive_report',
      receiptId: 'rcpt-block-001',
    }));
  });

  it('does not show false-positive report button for NEEDS_APPROVAL receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Human approval required.',
        provider: 'alibaba',
        model: 'approval-required',
        enforcement: { status: 'NEEDS_APPROVAL', reasons: ['R3 requires explicit human approval before execution.'], riskGate: { riskLevel: 'R3', status: 'NEEDS_APPROVAL', reason: 'R3' } },
        approvalId: 'apr-route-002',
        governanceEvidenceReceipt: {
          receiptId: 'rcpt-approval-001',
          evidenceMode: 'live',
          routeId: '/api/execute',
          decision: 'NEEDS_APPROVAL',
          riskLevel: 'R3',
          provider: 'alibaba',
          model: 'approval-required',
          approvalId: 'apr-route-002',
          generatedAt: '2026-05-14T00:00:00.000Z',
        },
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-panel')).toBeDefined();
    });

    expect(screen.queryByTestId('false-positive-report-panel')).toBeNull();
    expect(screen.getByTestId('approval-status-panel').textContent).toContain('lower-risk planning step');
    await waitFor(() => expect(trackEventMock).toHaveBeenCalledWith('task_recovery_prompted', expect.objectContaining({
      receiptId: 'rcpt-approval-001',
      decision: 'NEEDS_APPROVAL',
    })));
  });
});

// ── W92-T1: NEEDS_APPROVAL Flow Completion ───────────────────────────────────

describe('ProcessingScreen — NEEDS_APPROVAL flow (W92-T1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Submit for Review button on NEEDS_APPROVAL response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Human approval required.',
        provider: 'alibaba',
        model: 'approval-required',
        enforcement: { status: 'NEEDS_APPROVAL', reasons: ['Approval required'] },
        guidedResponse: 'Follow safe practices.',
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-approval-btn')).toBeDefined();
    });
  });

  it('does not render Submit for Review button on BLOCK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Blocked by CVF enforcement.',
        provider: 'alibaba',
        model: 'blocked',
        enforcement: { status: 'BLOCK', reasons: ['HIGH_RISK pattern detected'] },
        guidedResponse: 'Safe approach: use bcrypt.',
      }),
    }));

    render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('guided-response-panel')).toBeDefined();
    });

    expect(screen.queryByTestId('submit-approval-btn')).toBeNull();
  });

  it('calls POST /api/approvals with templateId and intent on submit', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Human approval required.',
          provider: 'alibaba',
          model: 'approval-required',
          enforcement: { status: 'NEEDS_APPROVAL', reasons: ['Approval required'] },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          id: 'apr-test-001',
          status: 'pending',
          submittedAt: '2026-04-15T00:00:00.000Z',
          message: 'Request submitted.',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const { getByTestId } = render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(getByTestId('submit-approval-btn')).toBeDefined();
    });

    getByTestId('submit-approval-btn').click();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/approvals');
    const body = JSON.parse(String(init?.body));
    expect(body.templateId).toBe('test');
    expect(body.intent).toBe('store passwords');
    expect(trackEventMock).toHaveBeenCalledWith('task_recovery_started', expect.objectContaining({
      method: 'approval_request',
      approvalId: 'apr-test-001',
      decision: 'NEEDS_APPROVAL',
      templateId: 'test',
    }));
  });

  it('shows approval-status-panel with request ID after successful submission', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Human approval required.',
          provider: 'alibaba',
          model: 'approval-required',
          enforcement: { status: 'NEEDS_APPROVAL', reasons: ['Approval required'] },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          id: 'apr-test-001',
          status: 'pending',
          submittedAt: '2026-04-15T00:00:00.000Z',
          message: 'Request submitted.',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const { getByTestId, queryByTestId } = render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(getByTestId('submit-approval-btn')).toBeDefined();
    });

    getByTestId('submit-approval-btn').click();

    await waitFor(() => {
      expect(getByTestId('approval-status-panel')).toBeDefined();
    });

    expect(getByTestId('approval-status-panel').textContent).toContain('apr-test-001');
    expect(queryByTestId('submit-approval-btn')).toBeNull();
  });
});

// W96-T1: Risk visibility persist after success
describe('ProcessingScreen — W96-T1 completion state', () => {
  const baseProps = {
    templateName: 'Test Template',
    templateId: 'test',
    inputs: { field1: 'value1' },
    intent: 'do something',
    onComplete: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows completion-banner and risk-badge when success response includes riskLevel', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        success: true,
        output: 'Result text',
        provider: 'anthropic',
        model: 'claude',
        enforcement: { status: 'APPROVED', riskGate: { riskLevel: 'R1' } },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getByTestId } = render(<ProcessingScreen {...baseProps} />);

    await waitFor(() => {
      expect(getByTestId('completion-banner')).toBeDefined();
    });

    expect(getByTestId('view-results-btn')).toBeDefined();
    expect(getByTestId('risk-badge')).toBeDefined();
  });

  it('"View Results →" button calls onComplete immediately with output', async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        success: true,
        output: 'Result text',
        provider: 'anthropic',
        model: 'claude',
        enforcement: { status: 'APPROVED', riskGate: { riskLevel: 'R2' } },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getByTestId } = render(
      <ProcessingScreen {...baseProps} onComplete={onComplete} />
    );

    await waitFor(() => {
      expect(getByTestId('view-results-btn')).toBeDefined();
    });

    getByTestId('view-results-btn').click();
    expect(onComplete).toHaveBeenCalledWith('Result text', undefined);
  });

  it('existing success path (no riskGate) calls onComplete without showing completion-banner', async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        success: true,
        output: 'Quick result',
        provider: 'anthropic',
        model: 'claude',
        enforcement: { status: 'APPROVED' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { queryByTestId } = render(
      <ProcessingScreen {...baseProps} onComplete={onComplete} />
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('Quick result', undefined);
    });

    expect(queryByTestId('completion-banner')).toBeNull();
  });
});

describe('subscription ProcessingScreen selection', () => {
  it('selects advertised sonnet alias explicitly and sends exactly one execute POST despite stale stored API model', async () => {
    selectedSettings.preferences.defaultProvider = 'anthropic';
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ providers: [{ provider: 'claude', executionSurface: 'claude_cli_subscription', nativeAuthState: 'available', readiness: 'live_task_ready', model: 'sonnet' }] }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true, output: 'native fixture response', provider: 'claude', model: 'sonnet' }) });
    vi.stubGlobal('fetch', fetch); const done = vi.fn();
    render(<ProcessingScreen templateName="Documentation" inputs={{ subject: 'fixture' }} intent="Write fixture" onComplete={done} onCancel={vi.fn()} />);
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(fetch.mock.calls[0][0]).toBe('/api/providers'); const calls = fetch.mock.calls.filter(c => c[0] === '/api/execute');
    expect(calls).toHaveLength(1); expect(JSON.parse(calls[0][1].body)).toMatchObject({ provider: 'claude', model: 'sonnet' });
  });
  it.each(['unknown', 'unavailable'])('selected native %s never posts execute', async nativeAuthState => {
    selectedSettings.preferences.defaultProvider = 'anthropic'; const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [{ provider: 'claude', executionSurface: 'claude_cli_subscription', nativeAuthState, readiness: nativeAuthState, model: 'sonnet' }] }) });
    vi.stubGlobal('fetch', fetch);
    render(<ProcessingScreen templateName="Documentation" inputs={{ subject: 'fixture' }} intent="Write fixture" onComplete={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/subscription is not ready/i)).toBeTruthy());
    expect(fetch.mock.calls.filter(c => c[0] === '/api/execute')).toHaveLength(0);
  });
  it('renders friendly no-resend guidance instead of exposing a raw native action token', async () => {
    const fetch = vi.fn().mockResolvedValue({ json: async () => ({ success: false, error: 'Native subscription execution is unconfirmed.', diagnostic: { stage: 'provider', class: 'provider_timeout', retryable: false, userAction: 'do_not_retry_without_new_evidence', safeMessage: 'Native subscription execution is unconfirmed.' } }) });
    vi.stubGlobal('fetch', fetch);
    render(<ProcessingScreen templateName="Documentation" inputs={{ subject: 'fixture' }} intent="Write fixture" onComplete={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Inspect the attempt and new evidence before another run/)).toBeTruthy());
    expect(screen.queryByText('do_not_retry_without_new_evidence')).toBeNull(); expect(fetch.mock.calls.filter(call => call[0] === '/api/execute')).toHaveLength(1);
  });
});

describe('ProcessingScreen - request-sent status names the provider and model', () => {
  const props = { templateName: 'Documentation', inputs: { subject: 'fixture' }, intent: 'Write fixture', onComplete: vi.fn(), onCancel: vi.fn() };
  const providers = selectedSettings.providers as Record<string, { selectedModel?: string }>;
  beforeEach(() => {
    vi.restoreAllMocks(); statusLanguage.value = 'en';
    providers.openai = { selectedModel: 'gpt-fixture' }; providers.alibaba = {};
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)));
  });
  const afterEachCleanup = () => { delete providers.openai; delete providers.alibaba; statusLanguage.value = 'en'; };

  it('names the provider and the model actually sent (English)', async () => {
    selectedSettings.preferences.defaultProvider = 'openai';
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Request sent (openai / gpt-fixture), waiting for a response...')).toBeTruthy();
    const body = JSON.parse(String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body));
    expect(body.provider).toBe('openai'); expect(body.model).toBe('gpt-fixture');
    afterEachCleanup();
  });
  it('names the provider and the model actually sent (Vietnamese)', async () => {
    statusLanguage.value = 'vi'; selectedSettings.preferences.defaultProvider = 'openai';
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Đã gửi yêu cầu (openai / gpt-fixture), đang chờ phản hồi...')).toBeTruthy();
    afterEachCleanup();
  });
  it('names only the provider when no model is known', async () => {
    selectedSettings.preferences.defaultProvider = 'alibaba';
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Request sent (alibaba), waiting for a response...')).toBeTruthy();
    afterEachCleanup();
  });
  it('falls back to the plain status text when neither provider nor model is known', async () => {
    selectedSettings.preferences.defaultProvider = undefined;
    const english = render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Request sent, waiting for a response...')).toBeTruthy();
    english.unmount(); statusLanguage.value = 'vi';
    render(<ProcessingScreen {...props} />);
    expect(await screen.findByText('Đã gửi yêu cầu, đang chờ phản hồi...')).toBeTruthy();
    afterEachCleanup();
  });
});

describe('ProcessingScreen - role-plan verdicts and unreviewed partial output (outcome fidelity O5, O6)', () => {
  const props = { templateName: 'Documentation', inputs: { subject: 'fixture' }, intent: 'Write fixture', onCancel: vi.fn() };
  const planEvidence = { taskGraphId: 'graph-1', steps: [{ ordinal: 1 }, { ordinal: 2 }, { ordinal: 3 }, { ordinal: 4 }], reviewerVerdict: 'REVISE', revisionApplied: true, revisionReviewed: true, recheckVerdict: 'PASS', findings: [], recheckFindings: [], stoppedEarly: null, promptContract: 'role-plan-review-v3' };
  const receipt = { receiptId: 'receipt-1', evidenceMode: 'live', routeId: '/api/execute', generatedAt: '2026-11-16T00:00:00Z' };
  beforeEach(() => { vi.restoreAllMocks(); statusLanguage.value = 'en'; selectedSettings.preferences.defaultProvider = undefined; });

  it('attaches a compact rolePlan summary to the receipt passed to onComplete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: true, output: 'Final text', provider: 'alibaba', model: 'qwen-plus-character', governanceEvidenceReceipt: receipt, maoRolePlan: planEvidence }) }));
    const onComplete = vi.fn(); render(<ProcessingScreen {...props} onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 4000 });
    expect(onComplete.mock.calls[0][0]).toBe('Final text');
    expect(onComplete.mock.calls[0][1]).toMatchObject({ receiptId: 'receipt-1', rolePlan: { reviewerVerdict: 'REVISE', revisionApplied: true, revisionReviewed: true, recheckVerdict: 'PASS', stoppedEarly: null, promptContract: 'role-plan-review-v3', stepCount: 4 } });
    expect(Object.keys(onComplete.mock.calls[0][1].rolePlan).sort()).toEqual(['promptContract', 'recheckVerdict', 'reviewerVerdict', 'revisionApplied', 'revisionReviewed', 'stepCount', 'stoppedEarly']);
  });
  it('carries a denied-recheck summary (stoppedEarly ATTEMPT_DENIED, recheck NOT_RUN) and leaves a receipt without role-plan evidence untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: true, output: 'Final text', governanceEvidenceReceipt: receipt, maoRolePlan: { ...planEvidence, steps: [{}, {}, {}], revisionReviewed: false, recheckVerdict: 'NOT_RUN', stoppedEarly: 'ATTEMPT_DENIED' } }) }));
    const first = vi.fn(); const view = render(<ProcessingScreen {...props} onComplete={first} />);
    await waitFor(() => expect(first).toHaveBeenCalled(), { timeout: 4000 });
    expect(first.mock.calls[0][1].rolePlan).toMatchObject({ revisionReviewed: false, recheckVerdict: 'NOT_RUN', stoppedEarly: 'ATTEMPT_DENIED', stepCount: 3 });
    view.unmount();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: true, output: 'Plain text', governanceEvidenceReceipt: receipt }) }));
    const second = vi.fn(); render(<ProcessingScreen {...props} onComplete={second} />);
    await waitFor(() => expect(second).toHaveBeenCalled(), { timeout: 4000 });
    expect(second.mock.calls[0][1]).toEqual(receipt); expect('rolePlan' in second.mock.calls[0][1]).toBe(false);
  });
  it('shows an unreviewed partial output under the error with the bilingual label and a copy action, and never completes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: false, error: 'MAO execution is unavailable or unconfirmed. Do not resend automatically.', partialOutput: { text: 'DRAFT BODY LINE', fromStep: 'draft', reviewed: false }, maoRolePlan: { ...planEvidence, stoppedEarly: 'FAILED' } }) }));
    const onComplete = vi.fn(); render(<ProcessingScreen {...props} onComplete={onComplete} />);
    expect(await screen.findByText('Kết quả chưa hoàn tất, chưa qua bước rà soát cuối / Incomplete result, not finally reviewed')).toBeTruthy();
    expect(screen.getByText(/MAO execution is unavailable/)).toBeTruthy(); expect(screen.getByTestId('partial-output-text').textContent).toBe('DRAFT BODY LINE');
    fireEvent.click(screen.getByTestId('partial-output-copy')); await waitFor(() => expect(writeText).toHaveBeenCalledWith('DRAFT BODY LINE'));
    await screen.findByText('Copied'); await new Promise(resolve => setTimeout(resolve, 700));
    expect(onComplete).not.toHaveBeenCalled();
  });
  it('shows the partial-output label in Vietnamese mode too, with the Vietnamese explanation', async () => {
    statusLanguage.value = 'vi';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: false, error: 'Lỗi', partialOutput: { text: 'NHAP', fromStep: 'revise', reviewed: false } }) }));
    render(<ProcessingScreen {...props} onComplete={vi.fn()} />);
    expect(await screen.findByText('Kết quả chưa hoàn tất, chưa qua bước rà soát cuối / Incomplete result, not finally reviewed')).toBeTruthy(); expect(screen.getByText(/không phải kết quả hoàn tất/)).toBeTruthy();
    statusLanguage.value = 'en';
  });
  it('F7: shows the reviewer-model verdict beside the partial output when the failure evidence carries one, without claiming it was never reviewed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: false, error: 'e', partialOutput: { text: 'DRAFT BODY LINE', fromStep: 'draft', reviewed: false }, maoRolePlan: { ...planEvidence, recheckVerdict: 'NOT_RUN', stoppedEarly: 'FAILED' } }) }));
    render(<ProcessingScreen {...props} onComplete={vi.fn()} />);
    expect((await screen.findByTestId('partial-output-verdict')).textContent).toBe('Reviewer model verdict - Review: REVISE');
    expect(screen.getByTestId('partial-output-panel').textContent).not.toMatch(/has not been reviewed|never reviewed/i);
    expect(screen.getByText(/has not been approved by a person/)).toBeTruthy();
  });
  it('F7: no verdict line when the failure evidence has no reviewer verdict, and the helper formats review and recheck in both languages', () => {
    const diagnosed = summarizeRolePlan({ ...planEvidence, reviewerVerdict: 'UNPARSEABLE', reviewerDiagnostic: 'INVALID_JSON', recheckVerdict: 'UNPARSEABLE', recheckDiagnostic: 'FINDINGS_FILTERED' });
    expect(diagnosed).toMatchObject({ reviewerDiagnostic: 'INVALID_JSON', recheckDiagnostic: 'FINDINGS_FILTERED' });
    expect(summarizeRolePlan({ ...planEvidence, reviewerDiagnostic: 'RAW-TEXT', recheckDiagnostic: 'INVALID_JSON' })).not.toHaveProperty('reviewerDiagnostic');
    expect(summarizeRolePlan({ ...planEvidence, recheckDiagnostic: 'INVALID_JSON' })).not.toHaveProperty('recheckDiagnostic');
    expect(partialVerdictLine(undefined, false)).toBeNull();
    expect(partialVerdictLine(summarizeRolePlan({ ...planEvidence, reviewerVerdict: 'NOT_RUN', recheckVerdict: null }), false)).toBeNull();
    expect(partialVerdictLine(summarizeRolePlan(planEvidence), false)).toBe('Reviewer model verdict - Review: REVISE, Recheck: PASS');
    expect(partialVerdictLine(summarizeRolePlan(planEvidence), true)).toBe('Kết luận của mô hình rà soát - Rà soát: REVISE, Rà soát lại: PASS');
  });
  it.each([
    ['a successful response', { success: true, output: 'Done text', partialOutput: { text: 'X', fromStep: 'draft', reviewed: false } }],
    ['a draft marked reviewed', { success: false, error: 'e', partialOutput: { text: 'X', fromStep: 'draft', reviewed: true } }],
    ['an empty text', { success: false, error: 'e', partialOutput: { text: '  ', fromStep: 'draft', reviewed: false } }],
    ['an unknown step', { success: false, error: 'e', partialOutput: { text: 'X', fromStep: 'review', reviewed: false } }],
    ['a non-object value', { success: false, error: 'e', partialOutput: 'X' }],
  ])('does not show a partial output for %s', async (_name, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ ...response, governanceEvidenceReceipt: receipt }) }));
    render(<ProcessingScreen {...props} onComplete={vi.fn()} />);
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)); await new Promise(resolve => setTimeout(resolve, 400));
    expect(screen.queryByTestId('partial-output-panel')).toBeNull();
  });
});


describe('ProcessingScreen held execution status', () => {
  it.each([{ active: true, shown: true }, { active: false, shown: false }])('queries status on failed run: active=$active', async ({ active, shown }) => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => url === '/api/execute/control'
      ? { ok: true, json: async () => ({ success: true, control: { revision: 1, execution: { active, canonicalId: 'held-id' } } }) }
      : { json: async () => ({ success: false, error: 'Failed' }) });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<ProcessingScreen {...baseProps} />);
    await waitFor(() => expect(fetchMock.mock.calls.some(call => call[0] === '/api/execute/control')).toBe(true));
    if (shown) expect(await screen.findByText(/Previous request outcome unknown/)).toBeTruthy();
    else expect(screen.queryByText(/Previous request outcome unknown/)).toBeNull();
    view.unmount(); vi.unstubAllGlobals();
  });
  it('does not query status on a successful run', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true, output: 'done' }) });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<ProcessingScreen {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Complete')).toBeTruthy());
    expect(fetchMock.mock.calls.some(call => call[0] === '/api/execute/control')).toBe(false);
    expect(screen.queryByText(/Previous request outcome unknown/)).toBeNull();
    view.unmount(); vi.unstubAllGlobals();
  });
});
