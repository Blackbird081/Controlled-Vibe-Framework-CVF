import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PilotArtifactSourceSummary } from './ArtifactExportPanel';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

describe('pilot export source presentation', () => {
  it('shows exact run and separates local rendering from acceptance', () => {
    const receipt = { receiptId: 'receipt-1', htmlPilotEvidence: { runId: 'a'.repeat(32) } } as GovernanceEvidenceReceipt;
    render(<PilotArtifactSourceSummary receipt={receipt} />);
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain('a'.repeat(32));
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain('separate actions');
  });
});
