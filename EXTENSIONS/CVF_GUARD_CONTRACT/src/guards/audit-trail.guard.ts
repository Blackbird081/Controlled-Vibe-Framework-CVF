/**
 * Audit Trail Guard — Enforces mandatory audit trail and tracing requirements
 * @module cvf-guard-contract/guards/audit-trail
 */

import type { Guard, GuardRequestContext, GuardResult } from '../types';

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
        agentGuidance: 'Every action in CVF must have a unique requestId for traceability. Generate a unique ID (e.g., UUID) and include it with your request.',
        suggestedAction: 'add_request_id',
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
        agentGuidance: `Your request is missing audit fields: ${missingFields.join(', ')}. ${missingFields.includes('agentId') ? 'Include your agent identifier. ' : ''}${missingFields.includes('traceHash') ? 'For R2/R3 actions, include a trace hash for verification.' : ''}`,
        suggestedAction: 'complete_audit_fields',
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
