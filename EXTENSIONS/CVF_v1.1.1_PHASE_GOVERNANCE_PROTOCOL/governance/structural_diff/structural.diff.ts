import { StateMachine } from "../state_enforcement/state.machine.parser";

export interface StructuralDiffResult {
    passed: boolean;
    baselineProvided: boolean;
    addedStates: string[];
    removedStates: string[];
    modifiedTransitions: string[];
}

/**
 * Calculates the structural difference between the current StateMachine
 * and a previous baseline StateMachine.
 */
export function detectStructuralDiff(
    current: StateMachine,
    baseline?: StateMachine
): StructuralDiffResult {

    const result: StructuralDiffResult = {
        passed: true,
        baselineProvided: !!baseline,
        addedStates: [],
        removedStates: [],
        modifiedTransitions: []
    };

    // If no baseline, there is nothing to drift from
    if (!baseline) return result;

    const currentStates = new Set(current.states);
    const baselineStates = new Set(baseline.states);

    for (const s of current.states) {
        if (!baselineStates.has(s)) {
            result.addedStates.push(s);
            result.passed = false;
        }
    }

    for (const s of baseline.states) {
        if (!currentStates.has(s)) {
            result.removedStates.push(s);
            result.passed = false;
        }
    }

    // Compare transitions
    for (const state of current.states) {
        if (!baseline.transitions[state]) continue;

        const currTargets = new Set(current.transitions[state] || []);
        const baseTargets = new Set(baseline.transitions[state] || []);

        for (const t of currTargets) {
            if (!baseTargets.has(t)) {
                result.modifiedTransitions.push(`${state}->${t} (Added)`);
                result.passed = false;
            }
        }
        for (const t of baseTargets) {
            if (!currTargets.has(t)) {
                result.modifiedTransitions.push(`${state}->${t} (Removed)`);
                result.passed = false;
            }
        }
    }

    return result;
}
