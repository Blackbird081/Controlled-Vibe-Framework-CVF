/**
 * Phase Gate Guard — Enforces CVF 4-Phase Process boundaries
 * Enhanced with agentGuidance for NL explanations to AI agents.
 * @module cvf-guard-contract/guards/phase-gate
 */

import type { Guard, GuardRequestContext, GuardResult, CVFPhase, CVFRole } from '../types';
import { PHASE_ORDER } from '../types';
import { getPermissions, type TeamRole } from '../enterprise/enterprise';

export const PHASE_ROLE_MATRIX: Record<CVFPhase, CVFRole[]> = {
  DISCOVERY: ['HUMAN', 'OPERATOR'],
  DESIGN: ['HUMAN', 'OPERATOR'],
  BUILD: ['HUMAN', 'AI_AGENT', 'OPERATOR'],
  REVIEW: ['HUMAN', 'REVIEWER', 'OPERATOR'],
};

export const PHASE_DESCRIPTIONS: Record<CVFPhase, string> = {
  DISCOVERY: 'Requirements gathering and problem definition',
  DESIGN: 'Architecture decisions and solution design',
  BUILD: 'Implementation and coding',
  REVIEW: 'Testing, validation, and quality assurance',
};

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
        agentGuidance: `The phase "${context.phase}" is not recognized. CVF uses a 4-phase process: DISCOVERY → DESIGN → BUILD → REVIEW. Please specify one of these phases.`,
        suggestedAction: 'specify_valid_phase',
        timestamp,
      };
    }

    // Enterprise RBAC Check (Task 8.6 Phase 3)
    const userRole = context.metadata?.userRole as TeamRole | undefined;
    if (userRole) {
      try {
        const perms = getPermissions(userRole);
        if (perms && !perms.allowedPhases.includes(context.phase)) {
          return {
            guardId: this.id,
            decision: 'BLOCK',
            severity: 'ERROR',
            reason: `Enterprise Role "${userRole}" is not authorized for phase "${context.phase}". Allowed phases: ${perms.allowedPhases.join(', ')}.`,
            agentGuidance: `The active user has the "${userRole}" role, which is not allowed in the "${context.phase}" phase. Allowed phases are: ${perms.allowedPhases.join(', ')}.`,
            suggestedAction: 'switch_to_allowed_phase',
            timestamp,
            metadata: { userRole, phase: context.phase, allowedPhases: perms.allowedPhases },
          };
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!allowedRoles.includes(context.role)) {
      const currentPhaseIndex = PHASE_ORDER.indexOf(context.phase);
      const allowedPhases = PHASE_ORDER.filter((p) =>
        PHASE_ROLE_MATRIX[p].includes(context.role)
      );

      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized for phase "${context.phase}". Allowed roles: ${allowedRoles.join(', ')}.`,
        agentGuidance: `You are operating as "${context.role}" but the current phase is "${context.phase}" (${PHASE_DESCRIPTIONS[context.phase]}). Your role can only operate in phases: ${allowedPhases.join(', ')}. ${currentPhaseIndex < 2 ? 'Wait for the human to complete this phase before proceeding.' : 'Request phase advancement from the human operator.'}`,
        suggestedAction: allowedPhases.length > 0 ? `switch_to_phase_${allowedPhases[0]}` : 'request_role_change',
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
