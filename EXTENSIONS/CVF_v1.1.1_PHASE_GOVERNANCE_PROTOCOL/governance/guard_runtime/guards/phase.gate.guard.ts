/**
 * Phase Gate Guard — Track IV Phase A.1
 *
 * Enforces CVF 4-Phase Process boundaries.
 * Blocks actions that attempt to skip phases or execute in wrong phase.
 *
 * Rules:
 *   - AI agents can only execute in BUILD phase
 *   - DISCOVERY and DESIGN require HUMAN role
 *   - REVIEW requires HUMAN or REVIEWER role
 *   - Phase must be explicitly set (no implicit default)
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFPhase,
  CVFRole,
} from '../guard.runtime.types.js';

const PHASE_ROLE_MATRIX: Record<CVFPhase, CVFRole[]> = {
  DISCOVERY: ['HUMAN', 'OPERATOR'],
  DESIGN: ['HUMAN', 'OPERATOR'],
  BUILD: ['HUMAN', 'AI_AGENT', 'OPERATOR'],
  REVIEW: ['HUMAN', 'REVIEWER', 'OPERATOR'],
};

const PHASE_ORDER: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];

export class PhaseGateGuard implements Guard {
  id = 'phase_gate';
  name = 'Phase Gate Guard';
  description = 'Enforces CVF 4-Phase Process boundaries and role-phase authorization.';
  priority = 10;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();

    const allowedRoles = PHASE_ROLE_MATRIX[context.phase];
    if (!allowedRoles) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown phase: "${context.phase}". Valid phases: ${PHASE_ORDER.join(', ')}.`,
        timestamp,
      };
    }

    if (!allowedRoles.includes(context.role)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized for phase "${context.phase}". Allowed roles: ${allowedRoles.join(', ')}.`,
        timestamp,
        metadata: { phase: context.phase, role: context.role, allowedRoles },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" authorized for phase "${context.phase}".`,
      timestamp,
    };
  }
}

export { PHASE_ROLE_MATRIX, PHASE_ORDER };
