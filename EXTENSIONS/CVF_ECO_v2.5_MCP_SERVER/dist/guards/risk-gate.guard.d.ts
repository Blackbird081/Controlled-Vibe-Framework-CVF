/**
 * Risk Gate Guard — Enforces CVF R0-R3 risk model with NL guidance
 * @module guards/risk-gate.guard
 */
import type { Guard, GuardRequestContext, GuardResult, CVFRiskLevel } from './types.js';
export declare const RISK_DESCRIPTIONS: Record<CVFRiskLevel, string>;
export declare class RiskGateGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=risk-gate.guard.d.ts.map