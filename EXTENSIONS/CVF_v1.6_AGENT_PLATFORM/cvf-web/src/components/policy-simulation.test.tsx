import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { parsePolicyDSL, PolicyEditor } from './PolicyEditor';
import { applyRules, runSimulation, SimulationRunner, type SimulationScenario } from './SimulationRunner';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

describe('parsePolicyDSL', () => {
    it('parses valid DSL', () => {
        const dsl = `RULE block_high
WHEN cvf_risk_level >= R3
THEN BLOCK

RULE allow_low
WHEN cvf_risk_level <= R1
THEN ALLOW`;
        const rules = parsePolicyDSL(dsl);
        expect(rules.length).toBe(2);
        expect(rules[0].name).toBe('block_high');
        expect(rules[0].condition).toBe('cvf_risk_level >= R3');
        expect(rules[0].action).toBe('BLOCK');
    });

    it('returns empty array for empty input', () => {
        expect(parsePolicyDSL('')).toEqual([]);
    });

    it('handles single rule', () => {
        const rules = parsePolicyDSL('RULE test\nWHEN risk_score > 50\nTHEN NEEDS_APPROVAL');
        expect(rules.length).toBe(1);
        expect(rules[0].action).toBe('NEEDS_APPROVAL');
    });
});

describe('applyRules', () => {
    const rules = [
        { name: 'block_r4', condition: 'cvf_risk_level >= R4', action: 'BLOCK' },
        { name: 'approve_r3', condition: 'cvf_risk_level = R3', action: 'NEEDS_APPROVAL' },
        { name: 'allow_rest', condition: 'cvf_risk_level <= R2', action: 'ALLOW' },
    ];

    const scenario: SimulationScenario = {
        id: 1,
        description: 'Test',
        cvf_risk_level: 'R3',
        cvf_phase: 'BUILD',
        risk_score: 50,
        violation: false,
    };

    it('matches R3 to NEEDS_APPROVAL', () => {
        expect(applyRules(rules, scenario)).toBe('NEEDS_APPROVAL');
    });

    it('matches R4 to BLOCK', () => {
        expect(applyRules(rules, { ...scenario, cvf_risk_level: 'R4' })).toBe('BLOCK');
    });

    it('matches R1 to ALLOW', () => {
        expect(applyRules(rules, { ...scenario, cvf_risk_level: 'R1' })).toBe('ALLOW');
    });

    it('returns ALLOW when no rules match', () => {
        expect(applyRules([], scenario)).toBe('ALLOW');
    });
});

describe('runSimulation', () => {
    const baselineRules = [
        { name: 'block_r3', condition: 'cvf_risk_level >= R3', action: 'BLOCK' },
    ];
    const newRules = [
        { name: 'approve_r3', condition: 'cvf_risk_level >= R3', action: 'NEEDS_APPROVAL' },
    ];
    const scenarios: SimulationScenario[] = [
        { id: 1, description: 'High risk', cvf_risk_level: 'R3', cvf_phase: 'BUILD', risk_score: 80, violation: false },
        { id: 2, description: 'Low risk', cvf_risk_level: 'R1', cvf_phase: 'INTAKE', risk_score: 10, violation: false },
    ];

    it('calculates impact correctly', () => {
        const summary = runSimulation(baselineRules, newRules, scenarios);
        expect(summary.totalScenarios).toBe(2);
        expect(summary.changedCount).toBe(1); // R3: BLOCK → NEEDS_APPROVAL
        expect(summary.impactRatio).toBe(50);
    });

    it('detects changed decisions', () => {
        const summary = runSimulation(baselineRules, newRules, scenarios);
        const changed = summary.results.filter(r => r.changed);
        expect(changed.length).toBe(1);
        expect(changed[0].before).toBe('BLOCK');
        expect(changed[0].after).toBe('NEEDS_APPROVAL');
    });

    it('returns zero impact ratio for empty scenarios', () => {
        const summary = runSimulation(baselineRules, newRules, []);
        expect(summary.totalScenarios).toBe(0);
        expect(summary.changedCount).toBe(0);
        expect(summary.impactRatio).toBe(0);
    });
});

describe('applyRules - condition variants', () => {
    const scenario: SimulationScenario = {
        id: 9,
        description: 'Condition checks',
        cvf_risk_level: 'R2',
        cvf_phase: 'BUILD',
        risk_score: 45,
        violation: true,
    };

    it('supports numeric operators', () => {
        expect(applyRules([{ name: 'n1', condition: 'risk_score >= 45', action: 'BLOCK' }], scenario)).toBe('BLOCK');
        expect(applyRules([{ name: 'n2', condition: 'risk_score <= 45', action: 'BLOCK' }], scenario)).toBe('BLOCK');
        expect(applyRules([{ name: 'n3', condition: 'risk_score > 44', action: 'BLOCK' }], scenario)).toBe('BLOCK');
        expect(applyRules([{ name: 'n4', condition: 'risk_score < 46', action: 'BLOCK' }], scenario)).toBe('BLOCK');
        expect(applyRules([{ name: 'n5', condition: 'risk_score = 45', action: 'BLOCK' }], scenario)).toBe('BLOCK');
    });

    it('supports boolean and string equality', () => {
        expect(applyRules([{ name: 'b1', condition: 'violation = true', action: 'BLOCK' }], scenario)).toBe('BLOCK');
        expect(applyRules([{ name: 's1', condition: 'cvf_phase = BUILD', action: 'NEEDS_APPROVAL' }], scenario)).toBe('NEEDS_APPROVAL');
    });

    it('supports AND conditions and ignores invalid clauses', () => {
        expect(
            applyRules([{
                name: 'and',
                condition: 'cvf_phase = BUILD AND risk_score > 40',
                action: 'BLOCK',
            }], scenario)
        ).toBe('BLOCK');

        expect(
            applyRules([{
                name: 'invalid',
                condition: 'unknown_field = x',
                action: 'BLOCK',
            }], scenario)
        ).toBe('ALLOW');

        expect(
            applyRules([{
                name: 'baddsl',
                condition: 'this is not a valid condition',
                action: 'BLOCK',
            }], scenario)
        ).toBe('ALLOW');
    });
});

describe('SimulationRunner behavior', () => {
    it('disables run button when newRules is empty', () => {
        render(<SimulationRunner baselineRules={[]} newRules={[]} />);
        const runButton = screen.getByRole('button', { name: /Run Simulation/i }) as HTMLButtonElement;
        expect(runButton.disabled).toBe(true);
    });

    it('runs simulation and invokes onSimulate callback', async () => {
        const onSimulate = vi.fn();
        const baseline = [{ name: 'allowAll', condition: 'risk_score >= 0', action: 'ALLOW' }];
        const next = [{ name: 'blockHigh', condition: 'risk_score > 40', action: 'BLOCK' }];

        render(<SimulationRunner baselineRules={baseline} newRules={next} onSimulate={onSimulate} />);

        fireEvent.click(screen.getByRole('button', { name: /Run Simulation/i }));
        expect(screen.getByRole('button', { name: /Running/i })).toBeTruthy();

        await waitFor(() => {
            expect(onSimulate).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText('Impact')).toBeTruthy();
        expect(screen.getByText(/Impact > 30%/i)).toBeTruthy();
    });
});

describe('PolicyEditor', () => {
    it('renders editor with title', () => {
        render(<PolicyEditor />);
        expect(screen.getByText(/Policy Editor/)).toBeDefined();
    });

    it('shows run button', () => {
        render(<PolicyEditor />);
        expect(screen.getByText(/Run Simulation/)).toBeDefined();
    });
});

describe('SimulationRunner', () => {
    it('renders with no results initially', () => {
        render(<SimulationRunner baselineRules={[]} newRules={[]} />);
        expect(screen.getByText(/Simulation Results/)).toBeDefined();
    });
});
