/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GovernancePanel } from './GovernancePanel';
import type { GovernanceState } from '@/lib/governance-context';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

const DEFAULT_STATE: GovernanceState = {
    toolkitEnabled: true,
    phase: 'INTAKE',
    role: 'ANALYST',
    riskLevel: 'R1',
};

function renderPanel(overrides?: Partial<{
    governanceState: GovernanceState;
    onRunSelfUAT: (prompt: string) => Promise<string>;
    isOpen: boolean;
    onClose: () => void;
}>) {
    const props = {
        governanceState: overrides?.governanceState ?? DEFAULT_STATE,
        onRunSelfUAT: overrides?.onRunSelfUAT ?? vi.fn(async () => ''),
        isOpen: overrides?.isOpen ?? true,
        onClose: overrides?.onClose ?? vi.fn(),
    };
    return render(<GovernancePanel {...props} />);
}

describe('GovernancePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when isOpen is false', () => {
        const { container } = renderPanel({ isOpen: false });
        expect(container.innerHTML).toBe('');
    });

    it('renders panel when isOpen is true', () => {
        renderPanel();
        expect(screen.getByText(/Governance Panel/)).toBeTruthy();
    });

    it('renders close button', () => {
        const onClose = vi.fn();
        renderPanel({ onClose });
        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('displays current governance state', () => {
        renderPanel({
            governanceState: {
                toolkitEnabled: true,
                phase: 'BUILD',
                role: 'BUILDER',
                riskLevel: 'R2',
            },
        });

        expect(screen.getByText('Current State')).toBeTruthy();
        expect(screen.getByText('BUILD')).toBeTruthy();
        expect(screen.getByText('BUILDER')).toBeTruthy();
        expect(screen.getByText('R2')).toBeTruthy();
        expect(screen.getByText('ON')).toBeTruthy();
    });

    it('shows OFF when toolkit is disabled', () => {
        renderPanel({
            governanceState: { ...DEFAULT_STATE, toolkitEnabled: false },
        });
        expect(screen.getByText('OFF')).toBeTruthy();
    });

    it('shows Allowed Actions section', () => {
        renderPanel();
        expect(screen.getByText('Allowed Actions')).toBeTruthy();
    });

    it('shows allowed actions for the current phase/role', () => {
        renderPanel({
            governanceState: {
                toolkitEnabled: true,
                phase: 'INTAKE',
                role: 'ANALYST',
                riskLevel: 'R1',
            },
        });

        // getAllowedActions should return some actions for ideation/developer
        const actionItems = screen.getAllByText(/✅/);
        expect(actionItems.length).toBeGreaterThan(0);
    });

    it('shows Self-UAT section', () => {
        renderPanel();
        expect(screen.getByText('🧪 Self-UAT')).toBeTruthy();
    });

    it('shows Run Self-UAT button when toolkit is enabled', () => {
        renderPanel();
        expect(screen.getByText(/Run Self-UAT/)).toBeTruthy();
    });

    it('disables Self-UAT button when toolkit is disabled', () => {
        renderPanel({
            governanceState: { ...DEFAULT_STATE, toolkitEnabled: false },
        });

        const btn = screen.getByText(/Run Self-UAT/);
        expect(btn.closest('button')!.disabled).toBe(true);
    });

    it('shows helper text when toolkit is disabled', () => {
        renderPanel({
            governanceState: { ...DEFAULT_STATE, toolkitEnabled: false },
        });
        expect(screen.getByText(/Enable CVF Toolkit to use Self-UAT/)).toBeTruthy();
    });

    it('runs Self-UAT and displays results', async () => {
        const mockUAT = vi.fn(async () => JSON.stringify({
            results: [
                { category: 'governance_awareness', status: 'PASS', evidence: 'AI correctly identifies CVF governance' },
                { category: 'phase_discipline', status: 'PASS', evidence: 'Correct phase' },
                { category: 'role_authority', status: 'PASS', evidence: 'Role respected' },
                { category: 'risk_boundary', status: 'PASS', evidence: 'Risk within bounds' },
                { category: 'skill_governance', status: 'PASS', evidence: 'Skills validated' },
                { category: 'refusal_quality', status: 'PASS', evidence: 'Proper refusal' },
            ],
            final_result: 'PASS',
            production_mode: 'ENABLED',
        }));

        renderPanel({ onRunSelfUAT: mockUAT });

        const runBtn = screen.getByText(/Run Self-UAT/);
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(mockUAT).toHaveBeenCalled();
        });

        // After UAT completes, results should be shown with PASS
        await waitFor(() => {
            const allText = document.body.textContent || '';
            expect(allText).toContain('PASS');
            expect(allText).toContain('100%');
        });
    });

    it('handles Self-UAT error', async () => {
        const mockUAT = vi.fn(async () => {
            throw new Error('API timeout');
        });

        renderPanel({ onRunSelfUAT: mockUAT });
        fireEvent.click(screen.getByText(/Run Self-UAT/));

        await waitFor(() => {
            expect(screen.getByText(/API timeout/)).toBeTruthy();
        });
    });

    it('handles Self-UAT non-Error exception', async () => {
        const mockUAT = vi.fn(async () => {
            throw 'string error';
        });

        renderPanel({ onRunSelfUAT: mockUAT });
        fireEvent.click(screen.getByText(/Run Self-UAT/));

        await waitFor(() => {
            expect(screen.getByText(/Unknown error/)).toBeTruthy();
        });
    });

    it('expands evidence when clicking on a result category', async () => {
        const mockUAT = vi.fn(async () => JSON.stringify({
            results: [
                { category: 'governance_awareness', status: 'PASS', evidence: 'Evidence text here' },
                { category: 'phase_discipline', status: 'PASS', evidence: 'Phase evidence' },
                { category: 'role_authority', status: 'FAIL', evidence: 'Role failure evidence' },
                { category: 'risk_boundary', status: 'PASS', evidence: 'Risk evidence' },
                { category: 'skill_governance', status: 'PASS', evidence: 'Skill evidence' },
                { category: 'refusal_quality', status: 'PASS', evidence: 'Refusal evidence' },
            ],
            final_result: 'FAIL',
            production_mode: 'DISABLED',
        }));

        renderPanel({ onRunSelfUAT: mockUAT });
        fireEvent.click(screen.getByText(/Run Self-UAT/));

        await waitFor(() => {
            expect(mockUAT).toHaveBeenCalled();
        });

        // Wait for results to render
        await waitFor(() => {
            const allText = document.body.textContent || '';
            expect(allText).toContain('Governance Awareness');
        });

        // Click on Governance Awareness to expand evidence
        const govAwareness = screen.getByText('Governance Awareness');
        fireEvent.click(govAwareness);

        // Check if evidence text is displayed
        await waitFor(() => {
            const allText = document.body.textContent || '';
            expect(allText).toContain('Evidence text here');
        });
    });
});
