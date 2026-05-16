/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import KnowledgeIntakePage from './page';

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('KnowledgeIntakePage', () => {
  it('renders the intake form with submit disabled when fields are empty', () => {
    render(<KnowledgeIntakePage />);

    expect(screen.getByText('Knowledge Intake')).toBeTruthy();
    expect((screen.getByTestId('submit-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables submit when source title and note are filled', () => {
    render(<KnowledgeIntakePage />);

    fireEvent.change(screen.getByTestId('source-title-input'), {
      target: { value: 'Customer Onboarding Notes' },
    });
    fireEvent.change(screen.getByTestId('note-input'), {
      target: { value: 'Key updates to the onboarding flow.' },
    });

    expect((screen.getByTestId('submit-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the success state with collection ID after a successful submission', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, collectionId: 'customer-onboarding-notes' }),
    } as Response);

    render(<KnowledgeIntakePage />);

    fireEvent.change(screen.getByTestId('source-title-input'), {
      target: { value: 'Customer Onboarding Notes' },
    });
    fireEvent.change(screen.getByTestId('note-input'), {
      target: { value: 'Key updates to the onboarding flow.' },
    });
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('intake-success')).toBeTruthy();
      expect(screen.getByTestId('collection-id').textContent).toBe('customer-onboarding-notes');
    });

    expect(screen.getByText('Open Artifact Export')).toBeTruthy();
  });

  it('shows an error message when the API returns a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: "Collection 'x' already exists." }),
    } as Response);

    render(<KnowledgeIntakePage />);

    fireEvent.change(screen.getByTestId('source-title-input'), {
      target: { value: 'Duplicate Note' },
    });
    fireEvent.change(screen.getByTestId('note-input'), {
      target: { value: 'This will conflict.' },
    });
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('intake-error')).toBeTruthy();
      expect(screen.getByTestId('intake-error').textContent).toContain('already exists');
    });
  });
});
