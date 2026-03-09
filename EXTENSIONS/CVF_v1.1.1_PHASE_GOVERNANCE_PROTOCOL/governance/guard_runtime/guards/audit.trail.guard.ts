/**
 * Audit Trail Guard — Track IV Phase A.1
 *
 * Enforces mandatory audit trail requirements.
 * Ensures every action has proper tracing fields for forensic auditing.
 *
 * Rules:
 *   - Every request must have a requestId
 *   - R2+ actions must have traceHash
 *   - All actions must have agentId when role is AI_AGENT
 *   - Missing trace fields → ESCALATE (not block) to allow recovery
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

export class AuditTrailGuard implements Guard {
  id = 'audit_trail';
  name = 'Audit Trail Guard';
  description = 'Enforces mandatory audit trail and tracing requirements.';
  priority = 60;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const missingFields: string[] = [];

    if (!context.requestId || context.requestId.trim() === '') {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: 'Missing required field: requestId. Every action must be traceable.',
        timestamp,
      };
    }

    if (context.role === 'AI_AGENT' && (!context.agentId || context.agentId.trim() === '')) {
      missingFields.push('agentId');
    }

    if ((context.riskLevel === 'R2' || context.riskLevel === 'R3') && !context.traceHash) {
      missingFields.push('traceHash');
    }

    if (missingFields.length > 0) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Missing audit trail fields: ${missingFields.join(', ')}. Action requires escalation for trace completion.`,
        timestamp,
        metadata: { missingFields, riskLevel: context.riskLevel, role: context.role },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'All audit trail requirements satisfied.',
      timestamp,
    };
  }
}
