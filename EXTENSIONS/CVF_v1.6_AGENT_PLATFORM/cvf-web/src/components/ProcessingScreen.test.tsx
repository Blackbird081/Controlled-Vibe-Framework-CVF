/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
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
