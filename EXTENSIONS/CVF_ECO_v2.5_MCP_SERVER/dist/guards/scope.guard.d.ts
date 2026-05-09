/**
 * Scope Guard — Enforces workspace isolation and protected path boundaries
 * @module guards/scope.guard
 */
import type { Guard, GuardRequestContext, GuardResult } from './types.js';
export declare const PROTECTED_PATHS: string[];
export declare const CVF_ROOT_INDICATORS: string[];
export declare class ScopeGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=scope.guard.d.ts.map