/**
 * Audit Trail Guard — Enforces mandatory audit trail and tracing requirements
 * @module guards/audit-trail.guard
 */
import type { Guard, GuardRequestContext, GuardResult } from './types.js';
export declare class AuditTrailGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
//# sourceMappingURL=audit-trail.guard.d.ts.map