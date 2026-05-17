// CVF v1.8 — Phase Guard
// Enforces the strict phase transition table.
// Any attempt to jump to an invalid next phase results in HARD ABORT.

import type { ExecutionPhase } from '../../types/index.js'
import { ALLOWED_TRANSITIONS } from '../../types/index.js'

export class PhaseViolationError extends Error {
    constructor(
        public readonly executionId: string,
        public readonly fromPhase: ExecutionPhase,
        public readonly toPhase: ExecutionPhase
    ) {
        super(
            `[CVF v1.8] PHASE VIOLATION: executionId=${executionId} ` +
            `Cannot transition ${fromPhase} → ${toPhase}. HARD ABORT.`
        )
        this.name = 'PhaseViolationError'
    }
}

export class PhaseGuard {
    /**
     * Validates that a phase transition is allowed.
     * Throws PhaseViolationError on invalid transition.
     */
    validateTransition(
        executionId: string,
        from: ExecutionPhase,
        to: ExecutionPhase
    ): void {
        const allowed = ALLOWED_TRANSITIONS[from]

        if (!allowed.includes(to)) {
            throw new PhaseViolationError(executionId, from, to)
        }
    }

    /**
     * Returns allowed next phases for a given phase.
     */
    allowedNextPhases(phase: ExecutionPhase): readonly ExecutionPhase[] {
        return ALLOWED_TRANSITIONS[phase]
    }

    /**
     * Whether a phase is terminal (no further transitions allowed).
     */
    isTerminal(phase: ExecutionPhase): boolean {
        return ALLOWED_TRANSITIONS[phase].length === 0
    }
}
