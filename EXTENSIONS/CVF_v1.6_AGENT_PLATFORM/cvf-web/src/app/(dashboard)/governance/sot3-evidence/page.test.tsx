/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Sot3ActivationEvidenceReadoutReport } from '@/lib/server/sot3-activation-evidence-readout';

const getSot3ActivationEvidenceReadoutMock = vi.fn<() => Sot3ActivationEvidenceReadoutReport>();

vi.mock('@/lib/server/sot3-activation-evidence-readout', () => ({
    getSot3ActivationEvidenceReadout: () => getSot3ActivationEvidenceReadoutMock(),
}));

function baseReport(overrides: Partial<Sot3ActivationEvidenceReadoutReport> = {}): Sot3ActivationEvidenceReadoutReport {
    return {
        state: 'EMPTY',
        generatedAt: '2026-07-18T00:00:00.000Z',
        boundary: 'Read-only projection of existing durable SOT3 activation evidence.',
        diagnosticClass: null,
        totalRecords: 0,
        records: [],
        summary: {
            byMode: { OFF: 0, SHADOW: 0, ENFORCE: 0 },
            byOutcome: { APPROVED: 0, REJECTED: 0, NO_CONTEXT: 0 },
        },
        ...overrides,
    };
}

describe('Sot3ActivationEvidencePage', () => {
    afterEach(() => {
        getSot3ActivationEvidenceReadoutMock.mockReset();
    });

    it('renders the populated state with record identifiers and no mutation control', async () => {
        getSot3ActivationEvidenceReadoutMock.mockReturnValue(
            baseReport({
                state: 'AVAILABLE',
                diagnosticClass: 'PERSISTED',
                totalRecords: 1,
                records: [
                    {
                        recordId: 'SOT3EV-abc123',
                        requestId: 'req-1',
                        organization: 'org_a',
                        team: 'team_a',
                        mode: 'ENFORCE',
                        terminalOutcome: 'APPROVED',
                        failureStage: null,
                        createdAtUtc: '2026-07-18T00:00:00.000Z',
                        diagnosticClass: 'PERSISTED',
                        schemaVersion: 'cvf.sot3.activation-evidence.v1',
                        traceCount: 2,
                    },
                ],
                summary: {
                    byMode: { OFF: 0, SHADOW: 0, ENFORCE: 1 },
                    byOutcome: { APPROVED: 1, REJECTED: 0, NO_CONTEXT: 0 },
                },
            }),
        );

        const { default: Sot3ActivationEvidencePage } = await import('./page');
        render(<Sot3ActivationEvidencePage />);

        expect(screen.getByText('SOT3EV-abc123')).toBeTruthy();
        expect(screen.getByText('req-1')).toBeTruthy();
        expect(screen.getByText('org_a')).toBeTruthy();
        expect(screen.getByText('Available')).toBeTruthy();
        expect(screen.getByText('PERSISTED')).toBeTruthy();
        expect(screen.getByText('Traces: 2')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the empty state with no records', async () => {
        getSot3ActivationEvidenceReadoutMock.mockReturnValue(baseReport({ state: 'EMPTY' }));

        const { default: Sot3ActivationEvidencePage } = await import('./page');
        render(<Sot3ActivationEvidencePage />);

        expect(screen.getByText('No SOT3 activation evidence has been recorded yet.')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the unavailable state with a secret-safe diagnostic class and no raw error text', async () => {
        getSot3ActivationEvidenceReadoutMock.mockReturnValue(
            baseReport({ state: 'UNAVAILABLE', diagnosticClass: 'SOT3_EVIDENCE_CORRUPT_STORE' }),
        );

        const { default: Sot3ActivationEvidencePage } = await import('./page');
        const { container } = render(<Sot3ActivationEvidencePage />);

        expect(screen.getByText('Evidence is currently unavailable.')).toBeTruthy();
        expect(screen.getByText('SOT3_EVIDENCE_CORRUPT_STORE')).toBeTruthy();
        expect(container.textContent).not.toContain('.cvf/runtime');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('states the read-only boundary and links back to the governance overview', async () => {
        getSot3ActivationEvidenceReadoutMock.mockReturnValue(baseReport());

        const { default: Sot3ActivationEvidencePage } = await import('./page');
        render(<Sot3ActivationEvidencePage />);

        expect(screen.getByText(/Read-only projection/)).toBeTruthy();
        const link = screen.getByRole('link', { name: /Governance Overview/i });
        expect(link.getAttribute('href')).toBe('/governance');
    });
});
