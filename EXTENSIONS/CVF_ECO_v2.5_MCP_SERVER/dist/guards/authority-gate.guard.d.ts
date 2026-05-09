/**
 * Authority Gate Guard — Enforces role-based authority boundaries
 * @module guards/authority-gate.guard
 */
import type { Guard, GuardRequestContext, GuardResult, CVFRole } from './types.js';
export declare const RESTRICTED_ACTIONS: Record<CVFRole, string[]>;
export declare class AuthorityGateGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=authority-gate.guard.d.ts.map