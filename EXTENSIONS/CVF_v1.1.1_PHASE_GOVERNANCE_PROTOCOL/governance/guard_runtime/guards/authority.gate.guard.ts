/**
 * Authority Gate Guard — Track IV Phase A.1
 *
 * Enforces role-based authority boundaries.
 * Prevents agents from performing actions outside their authorized scope.
 *
 * Rules:
 *   - AI_AGENT cannot approve, merge, or release
 *   - REVIEWER cannot build or deploy
 *   - HUMAN has full authority
 *   - OPERATOR has full authority
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFRole,
} from '../guard.runtime.types.js';

const RESTRICTED_ACTIONS: Record<CVFRole, string[]> = {
  AI_AGENT: ['approve', 'merge', 'release', 'deploy', 'delete_governance', 'override_gate'],
  REVIEWER: ['build', 'deploy', 'delete_governance', 'override_gate'],
  HUMAN: [],
  OPERATOR: [],
};

export class AuthorityGateGuard implements Guard {
  id = 'authority_gate';
  name = 'Authority Gate Guard';
  description = 'Enforces role-based authority boundaries for CVF actions.';
  priority = 30;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const restricted = RESTRICTED_ACTIONS[context.role];

    if (!restricted) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown role: "${context.role}".`,
        timestamp,
      };
    }

    const normalizedAction = context.action.toLowerCase().trim();
    const violation = restricted.find((r) => normalizedAction.includes(r));

    if (violation) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized to perform "${context.action}" (restricted action: "${violation}").`,
        timestamp,
        metadata: { role: context.role, action: context.action, violation },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" is authorized for action "${context.action}".`,
      timestamp,
    };
  }
}

export { RESTRICTED_ACTIONS };
