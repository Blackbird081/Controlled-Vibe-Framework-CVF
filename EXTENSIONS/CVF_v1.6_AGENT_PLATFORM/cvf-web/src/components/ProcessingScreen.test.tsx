/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProcessingScreen } from './ProcessingScreen';

vi.mock('./Settings', () => ({
  useSettings: () => ({
    settings: {
      preferences: {
        defaultExportMode: 'governance',
      },
    },
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({
    language: 'en',
  }),
}));

vi.mock('@/lib/enforcement-log', () => ({
  logEnforcementDecision: vi.fn(),
}));

describe('ProcessingScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
    expect(badge.textContent).toContain('Safe');
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
    expect(badge.textContent).toContain('Attention');
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
    expect(badge.textContent).toContain('Dangerous');
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
    expect(badge.textContent).toContain('Review Required');
    // Description must be non-empty
    expect(badge.textContent!.length).toBeGreaterThan(20);
  });
});

// ── W114-T1 CP5: Governance evidence visibility ─────────────────────────────

describe('ProcessingScreen — governance evidence visibility (W114-T1 CP5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders provider, routing, knowledge, and policy evidence returned by /api/execute', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        output: 'Governed output',
        provider: 'alibaba',
        model: 'qwen-turbo',
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
          model: 'qwen-turbo',
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
    expect(panel.textContent).toContain('CVF governed this run');
    expect(panel.textContent).toContain('ALLOW');
    expect(panel.textContent).toContain('alibaba');
    expect(panel.textContent).toContain('qwen-turbo');
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
