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

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Governed output'));
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

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Normal output'));

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
