/**
 * Phase Gate Guard — Enforces canonical CVF phase boundaries.
 */

import type { CanonicalCVFPhase, Guard, GuardRequestContext, GuardResult, CVFPhase, CVFRole } from '../types';
import { PHASE_ORDER } from '../types';
import { getPermissions, type TeamRole } from '../enterprise/enterprise';

function normalizePhaseAlias(phase: CVFPhase): CanonicalCVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

export const PHASE_ROLE_MATRIX: Record<CVFPhase, CVFRole[]> = {
  INTAKE: ['OBSERVER', 'ANALYST', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  DESIGN: ['OBSERVER', 'ANALYST', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  BUILD: ['BUILDER', 'HUMAN', 'AI_AGENT', 'OPERATOR'],
  REVIEW: ['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
  FREEZE: ['GOVERNOR', 'HUMAN'],
  DISCOVERY: ['OBSERVER', 'ANALYST', 'GOVERNOR', 'HUMAN', 'OPERATOR'],
};

export const PHASE_DESCRIPTIONS: Record<CVFPhase, string> = {
  INTAKE: 'Problem intake, discovery, and initial scoping',
  DESIGN: 'Architecture design, planning, and evaluation',
  BUILD: 'Implementation and controlled execution',
  REVIEW: 'Validation, critique, testing, and approval',
  FREEZE: 'Governed closure, locking, and evidence completion',
  DISCOVERY: 'Legacy alias for intake and initial scoping',
};

export class PhaseGateGuard implements Guard {
  id = 'phase_gate';
  name = 'Phase Gate Guard';
  description = 'Enforces CVF phase boundaries and role-phase authorization.';
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
        agentGuidance: `The phase "${context.phase}" is not recognized. Use the canonical CVF phases INTAKE, DESIGN, BUILD, REVIEW, or FREEZE.`,
        suggestedAction: 'specify_valid_phase',
        timestamp,
      };
    }

    const userRole = context.metadata?.userRole as TeamRole | undefined;
    if (userRole) {
      try {
        const perms = getPermissions(userRole);
        const normalizedPhase = normalizePhaseAlias(context.phase);
        if (!perms.allowedPhases.includes(normalizedPhase)) {
          return {
            guardId: this.id,
            decision: 'BLOCK',
            severity: 'ERROR',
            reason: `Enterprise role "${userRole}" is not authorized for phase "${normalizedPhase}". Allowed phases: ${perms.allowedPhases.join(', ')}.`,
            agentGuidance: `The active user has the "${userRole}" role, which is not allowed in the "${normalizedPhase}" phase.`,
            suggestedAction: 'switch_to_allowed_phase',
            timestamp,
            metadata: { userRole, phase: normalizedPhase, allowedPhases: perms.allowedPhases },
          };
        }
      } catch {
        // Fall through to the base phase model if enterprise permissions are unavailable.
      }
    }

    if (!allowedRoles.includes(context.role)) {
      const allowedPhases = PHASE_ORDER.filter((phase) => PHASE_ROLE_MATRIX[phase].includes(context.role));

      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized for phase "${context.phase}". Allowed roles: ${allowedRoles.join(', ')}.`,
        agentGuidance: `You are operating as "${context.role}" but the current phase is "${context.phase}". Your role may only operate in phases: ${allowedPhases.join(', ')}.`,
        suggestedAction: allowedPhases.length > 0 ? `switch_to_phase_${allowedPhases[0].toLowerCase()}` : 'request_role_change',
        timestamp,
        metadata: { phase: context.phase, role: context.role, allowedRoles, allowedPhases },
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
