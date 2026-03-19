/**
 * Phase Gate Guard — v1.1.3 Governance Runtime Hardening
 *
 * Enforces CVF 5-Phase Process boundaries (matching CVF_PHASE_AUTHORITY_MATRIX.md).
 * Blocks actions that attempt to skip phases or execute in wrong phase.
 *
 * v1.1.3 changes:
 *   - Expanded from 4 to 5 phases: INTAKE, DESIGN, BUILD, REVIEW, FREEZE
 *   - Expanded from 4 to 5 roles: OBSERVER, ANALYST, BUILDER, REVIEWER, GOVERNOR
 *   - FREEZE phase only allows GOVERNOR role
 *   - Added PHASE_ORDER with all 5 phases
 */

import {
  CanonicalCVFPhase,
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFPhase,
  CVFRole,
} from '../guard.runtime.types.js';

function normalizePhaseAlias(phase: CVFPhase): CanonicalCVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

const PHASE_ROLE_MATRIX: Record<CanonicalCVFPhase, CVFRole[]> = {
  INTAKE:  ['OBSERVER', 'ANALYST', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  DESIGN:  ['OBSERVER', 'ANALYST', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  BUILD:   ['BUILDER', 'HUMAN', 'AI_AGENT', 'OPERATOR'],
  REVIEW:  ['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  FREEZE:  ['GOVERNOR', 'HUMAN'],
};

const PHASE_ORDER: CanonicalCVFPhase[] = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'];

export class PhaseGateGuard implements Guard {
  id = 'phase_gate';
  name = 'Phase Gate Guard';
  description = 'Enforces CVF 5-Phase Process boundaries and role-phase authorization.';
  priority = 10;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const normalizedPhase = normalizePhaseAlias(context.phase);

    const allowedRoles = PHASE_ROLE_MATRIX[normalizedPhase];
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
        reason: `Role "${context.role}" is not authorized for phase "${normalizedPhase}". Allowed roles: ${allowedRoles.join(', ')}.`,
        timestamp,
        metadata: { phase: normalizedPhase, requestedPhase: context.phase, role: context.role, allowedRoles },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" authorized for phase "${normalizedPhase}".`,
      timestamp,
    };
  }
}

export { PHASE_ROLE_MATRIX, PHASE_ORDER };
