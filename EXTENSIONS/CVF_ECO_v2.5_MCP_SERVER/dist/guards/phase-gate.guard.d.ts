/**
 * Phase Gate Guard — Enforces CVF 4-Phase Process boundaries
 * Enhanced with agentGuidance for NL explanations to AI agents.
 * @module guards/phase-gate.guard
 */
import type { Guard, GuardRequestContext, GuardResult, CVFPhase, CVFRole } from './types.js';
export declare const PHASE_ROLE_MATRIX: Record<CVFPhase, CVFRole[]>;
export declare const PHASE_DESCRIPTIONS: Record<CVFPhase, string>;
export declare class PhaseGateGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=phase-gate.guard.d.ts.map