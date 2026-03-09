/**
 * Authority Gate Guard — Enforces role-based authority boundaries
 * @module guards/authority-gate.guard
 */

import type { Guard, GuardRequestContext, GuardResult, CVFRole } from './types.js';

export const RESTRICTED_ACTIONS: Record<CVFRole, string[]> = {
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
        agentGuidance: `The role "${context.role}" is not recognized. CVF uses: HUMAN, AI_AGENT, REVIEWER, OPERATOR. Please identify your role correctly.`,
        suggestedAction: 'specify_valid_role',
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
        agentGuidance: `As "${context.role}", you cannot perform "${context.action}" because it involves "${violation}" which is restricted for your role. This action requires a ${context.role === 'AI_AGENT' ? 'HUMAN or OPERATOR' : 'OPERATOR'} to execute. Please ask the appropriate person to perform this action.`,
        suggestedAction: 'delegate_to_authorized_role',
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
