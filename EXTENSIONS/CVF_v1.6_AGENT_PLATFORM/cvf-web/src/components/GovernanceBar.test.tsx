/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GovernanceBar } from './GovernanceBar';
import type { GovernanceState } from '@/lib/governance-context';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

// We do NOT mock governance-context — we use the real module for integration-like tests
// since the component heavily relies on real PHASE_OPTIONS, ROLE_OPTIONS etc.

const GOV_STORAGE_KEY = 'cvf_governance_state';

function renderBar(props?: Partial<{ onStateChange: (s: GovernanceState) => void; compact: boolean; lastMessage: string }>) {
    const onStateChange = props?.onStateChange ?? vi.fn();
    return render(
        <GovernanceBar
            onStateChange={onStateChange}
            compact={props?.compact}
            lastMessage={props?.lastMessage}
        />
    );
}

describe('GovernanceBar', () => {
    beforeEach(() => {
        localStorage.removeItem(GOV_STORAGE_KEY);
        localStorage.removeItem('cvf_governance_advanced');
    });

    it('renders the CVF Toolkit label', async () => {
        renderBar();
        await waitFor(() => {
            expect(screen.getByText(/CVF Toolkit/)).toBeTruthy();
        });
    });

    it('renders toggle button with aria-label', async () => {
        renderBar();
        await waitFor(() => {
            expect(screen.getByLabelText('Toggle CVF Toolkit')).toBeTruthy();
        });
    });

    it('toggles toolkit on/off', async () => {
        const onStateChange = vi.fn();
        renderBar({ onStateChange });

        await waitFor(() => {
            expect(screen.getByLabelText('Toggle CVF Toolkit')).toBeTruthy();
        });

        const toggle = screen.getByLabelText('Toggle CVF Toolkit');

        // Initial state depends on DEFAULT_GOVERNANCE_STATE
        fireEvent.click(toggle);

        // State change should fire
        await waitFor(() => {
            expect(onStateChange).toHaveBeenCalled();
        });
    });

    it('shows Active badge when toolkit is enabled', async () => {
        // Pre-set enabled state
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText('Active')).toBeTruthy();
        });
    });

    it('does not show Active badge when toolkit is disabled', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: false,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText(/CVF Toolkit/)).toBeTruthy();
        });
        expect(screen.queryByText('Active')).toBeNull();
    });

    it('shows Auto/Manual toggle when toolkit is enabled', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText(/Auto/)).toBeTruthy();
        });
    });

    it('shows Simple/Advanced mode toggle when enabled', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText('Advanced')).toBeTruthy();
        });
    });

    it('switches to advanced mode and shows selectors', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText('Advanced')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('Advanced'));

        // Should now show Phase, Role, Risk labels (in advanced mode)
        await waitFor(() => {
            expect(screen.getAllByText(/Phase/).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Role/).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Risk/).length).toBeGreaterThan(0);
        });
    });

    it('calls onStateChange when state changes', async () => {
        const onStateChange = vi.fn();
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar({ onStateChange });

        await waitFor(() => {
            expect(onStateChange).toHaveBeenCalled();
        });

        const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0];
        expect(lastCall.toolkitEnabled).toBe(true);
        expect(lastCall.phase).toBe('INTAKE');
    });

    it('saves governance state to localStorage on change', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByLabelText('Toggle CVF Toolkit')).toBeTruthy();
        });

        // Toggle off
        fireEvent.click(screen.getByLabelText('Toggle CVF Toolkit'));

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(GOV_STORAGE_KEY)!);
            expect(stored.toolkitEnabled).toBe(false);
        });
    });

    it('auto-detects governance from lastMessage', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        const onStateChange = vi.fn();
        renderBar({ onStateChange, lastMessage: 'Deploy to production server' });

        await waitFor(() => {
            // Auto-detect should trigger with deployment-related message
            expect(onStateChange).toHaveBeenCalled();
        });
    });

    it('renders in compact mode with narrower padding', async () => {
        const { container } = renderBar({ compact: true });
        await waitFor(() => {
            expect(screen.getByText(/CVF Toolkit/)).toBeTruthy();
        });
        expect((container.firstChild as HTMLElement).className).toContain('p-2');
    });

    it('persists advanced mode to localStorage', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));

        renderBar();
        await waitFor(() => {
            expect(screen.getByText('Advanced')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('Advanced'));

        await waitFor(() => {
            expect(localStorage.getItem('cvf_governance_advanced')).toBe('true');
        });
    });

    it('switches to manual mode when phase selector is changed', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));
        localStorage.setItem('cvf_governance_advanced', 'true');
        const onStateChange = vi.fn();
        renderBar({ onStateChange });

        await waitFor(() => {
            expect(screen.getByText(/Auto/)).toBeTruthy();
        });

        // Change phase selector
        const phaseSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(phaseSelect, { target: { value: 'BUILD' } });

        await waitFor(() => {
            expect(screen.getByText(/Manual/)).toBeTruthy();
        });
    });

    it('switches to manual on role change then back to auto via button', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));
        localStorage.setItem('cvf_governance_advanced', 'true');
        renderBar({ lastMessage: 'deploy to prod' });

        await waitFor(() => {
            expect(screen.getAllByText(/Auto/).length).toBeGreaterThan(0);
        });

        // Change role → manual
        const roleSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(roleSelect, { target: { value: 'BUILDER' } });

        await waitFor(() => {
            expect(screen.getByText(/Manual/)).toBeTruthy();
        });

        // Click to switch back to auto
        fireEvent.click(screen.getByText(/Manual/));

        await waitFor(() => {
            expect(screen.getAllByText(/Auto/).length).toBeGreaterThan(0);
        });
    });

    it('switches to manual on risk change', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));
        localStorage.setItem('cvf_governance_advanced', 'true');
        renderBar();

        await waitFor(() => {
            expect(screen.getByText(/Auto/)).toBeTruthy();
        });

        const riskSelect = screen.getAllByRole('combobox')[2];
        fireEvent.change(riskSelect, { target: { value: 'R3' } });

        await waitFor(() => {
            expect(screen.getByText(/Manual/)).toBeTruthy();
        });
    });

    it('shows risk warning when risk exceeds phase limit', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R3',
        }));
        localStorage.setItem('cvf_governance_advanced', 'true');
        renderBar();

        await waitFor(() => {
            expect(screen.getByText(/Risk exceeds phase limit/i)).toBeTruthy();
        });
    });

    it('shows auto-detect info line when in auto mode with lastMessage', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));
        renderBar({ lastMessage: 'review the code quality' });

        await waitFor(() => {
            expect(screen.getByText(/Auto-detected/)).toBeTruthy();
        });
    });

    it('shows Simple mode label when not in advanced mode', async () => {
        localStorage.setItem(GOV_STORAGE_KEY, JSON.stringify({
            toolkitEnabled: true,
            phase: 'INTAKE',
            role: 'ANALYST',
            riskLevel: 'R1',
        }));
        renderBar();

        await waitFor(() => {
            expect(screen.getByText(/Simple mode/)).toBeTruthy();
        });
    });
});
