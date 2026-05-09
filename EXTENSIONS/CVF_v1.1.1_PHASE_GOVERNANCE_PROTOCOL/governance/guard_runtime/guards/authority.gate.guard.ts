/**
 * Authority Gate Guard — v1.1.3 Governance Runtime Hardening
 *
 * Enforces the full CVF_PHASE_AUTHORITY_MATRIX.md:
 * 5 roles × 5 phases × max risk levels.
 *
 * v1.1.3 changes:
 *   - Replaced RESTRICTED_ACTIONS with full AUTHORITY_MATRIX
 *   - 5 roles: Observer, Analyst, Builder, Reviewer, Governor
 *   - 5 phases: Intake, Design, Build, Review, Freeze
 *   - Each cell defines: allowed actions and max risk level
 *   - Guards check phase × role × risk simultaneously
 */

import {
  CanonicalCVFPhase,
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFRole,
  CVFPhase,
  CVFRiskLevel,
} from '../guard.runtime.types.js';

// --- Risk Numeric for comparison ---

const RISK_NUMERIC: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

// --- Authority Matrix ---

export interface AuthorityCell {
  allowed: boolean;
  allowedActions: string[];
  maxRisk: CVFRiskLevel;
}

const FORBIDDEN: AuthorityCell = { allowed: false, allowedActions: [], maxRisk: 'R0' };

function normalizePhaseAlias(phase: CVFPhase): CanonicalCVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

/**
 * Full 5×5 Authority Matrix matching CVF_PHASE_AUTHORITY_MATRIX.md.
 * Authority exists ONLY at the intersection of Phase × Role × Risk.
 *
 * "Authority not explicitly granted here does not exist."
 */
export const AUTHORITY_MATRIX: Record<CVFRole, Record<CanonicalCVFPhase, AuthorityCell>> = {
  OBSERVER: {
    INTAKE:  { allowed: true,  allowedActions: ['read', 'ask', 'clarify'], maxRisk: 'R0' },
    DESIGN:  { allowed: true,  allowedActions: ['observe', 'read'], maxRisk: 'R0' },
    BUILD:   FORBIDDEN,
    REVIEW:  { allowed: true,  allowedActions: ['observe', 'read'], maxRisk: 'R0' },
    FREEZE:  FORBIDDEN,
  },
  ANALYST: {
    INTAKE:  { allowed: true,  allowedActions: ['analyze', 'summarize', 'read', 'ask'], maxRisk: 'R1' },
    DESIGN:  { allowed: true,  allowedActions: ['compare', 'assess', 'analyze', 'read'], maxRisk: 'R1' },
    BUILD:   FORBIDDEN,
    REVIEW:  { allowed: true,  allowedActions: ['analyze', 'read'], maxRisk: 'R1' },
    FREEZE:  FORBIDDEN,
  },
  BUILDER: {
    INTAKE:  FORBIDDEN,
    DESIGN:  FORBIDDEN,
    BUILD:   { allowed: true,  allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write'], maxRisk: 'R2' },
    REVIEW:  { allowed: true,  allowedActions: ['explain', 'read'], maxRisk: 'R1' },
    FREEZE:  FORBIDDEN,
  },
  REVIEWER: {
    INTAKE:  FORBIDDEN,
    DESIGN:  { allowed: true,  allowedActions: ['validate', 'read', 'assess'], maxRisk: 'R1' },
    BUILD:   FORBIDDEN,
    REVIEW:  { allowed: true,  allowedActions: ['critique', 'test', 'approve', 'reject', 'read'], maxRisk: 'R2' },
    FREEZE:  FORBIDDEN,
  },
  GOVERNOR: {
    INTAKE:  { allowed: true,  allowedActions: ['approve', 'reject', 'scope', 'read'], maxRisk: 'R2' },
    DESIGN:  { allowed: true,  allowedActions: ['approve', 'reject', 'read'], maxRisk: 'R2' },
    BUILD:   FORBIDDEN,
    REVIEW:  { allowed: true,  allowedActions: ['approve', 'reject', 'read', 'override'], maxRisk: 'R3' },
    FREEZE:  { allowed: true,  allowedActions: ['lock', 'enforce', 'freeze', 'read'], maxRisk: 'R3' },
  },
  // Legacy roles — backward compatibility
  HUMAN: {
    INTAKE:  { allowed: true,  allowedActions: ['approve', 'reject', 'scope', 'read', 'ask', 'analyze'], maxRisk: 'R3' },
    DESIGN:  { allowed: true,  allowedActions: ['approve', 'reject', 'read', 'analyze', 'compare'], maxRisk: 'R3' },
    BUILD:   { allowed: true,  allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write', 'read', 'deploy', 'release', 'execute'], maxRisk: 'R3' },
    REVIEW:  { allowed: true,  allowedActions: ['approve', 'reject', 'read', 'critique', 'test', 'override', 'deploy', 'release'], maxRisk: 'R3' },
    FREEZE:  { allowed: true,  allowedActions: ['lock', 'enforce', 'freeze', 'read'], maxRisk: 'R3' },
  },
  AI_AGENT: {
    INTAKE:  FORBIDDEN,
    DESIGN:  FORBIDDEN,
    BUILD:   { allowed: true,  allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write'], maxRisk: 'R2' },
    REVIEW:  { allowed: true,  allowedActions: ['explain', 'read'], maxRisk: 'R1' },
    FREEZE:  FORBIDDEN,
  },
  OPERATOR: {
    INTAKE:  { allowed: true,  allowedActions: ['read', 'ask', 'analyze', 'approve'], maxRisk: 'R2' },
    DESIGN:  { allowed: true,  allowedActions: ['read', 'approve', 'analyze'], maxRisk: 'R2' },
    BUILD:   { allowed: true,  allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write', 'read', 'deploy', 'release', 'execute'], maxRisk: 'R2' },
    REVIEW:  { allowed: true,  allowedActions: ['read', 'approve', 'critique', 'test', 'deploy', 'release'], maxRisk: 'R2' },
    FREEZE:  FORBIDDEN,
  },
};

export class AuthorityGateGuard implements Guard {
  id = 'authority_gate';
  name = 'Authority Gate Guard';
  description = 'Enforces CVF_PHASE_AUTHORITY_MATRIX.md: 5 roles × 5 phases × risk levels.';
  priority = 30;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const normalizedPhase = normalizePhaseAlias(context.phase);

    // Check role exists
    const roleMatrix = AUTHORITY_MATRIX[context.role];
    if (!roleMatrix) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown role: "${context.role}". Valid roles: ${Object.keys(AUTHORITY_MATRIX).join(', ')}.`,
        timestamp,
      };
    }

    // Check phase exists for role
    const cell = roleMatrix[normalizedPhase];
    if (!cell) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown phase: "${context.phase}" for role "${context.role}".`,
        timestamp,
      };
    }

    // Check if role is allowed in this phase at all
    if (!cell.allowed) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is FORBIDDEN in phase "${normalizedPhase}" per CVF_PHASE_AUTHORITY_MATRIX.md.`,
        timestamp,
        metadata: { role: context.role, phase: normalizedPhase, requestedPhase: context.phase },
      };
    }

    // Check if action is in allowed actions list
    const normalizedAction = context.action.toLowerCase().trim();
    const actionAllowed = normalizedAction.startsWith('phase_transition_to_') || cell.allowedActions.some((a) =>
      normalizedAction.includes(a)
    );
    if (!actionAllowed) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action "${context.action}" is not authorized for role "${context.role}" in phase "${normalizedPhase}". ` +
          `Allowed actions: [${cell.allowedActions.join(', ')}].`,
        timestamp,
        metadata: { role: context.role, phase: normalizedPhase, requestedPhase: context.phase, action: context.action, allowedActions: cell.allowedActions },
      };
    }

    // Check risk level does not exceed max for this cell
    const actionRisk = RISK_NUMERIC[context.riskLevel] ?? 0;
    const maxRisk = RISK_NUMERIC[cell.maxRisk] ?? 0;
    if (actionRisk > maxRisk) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Risk level "${context.riskLevel}" exceeds maximum allowed "${cell.maxRisk}" ` +
          `for role "${context.role}" in phase "${normalizedPhase}".`,
        timestamp,
        metadata: { role: context.role, phase: normalizedPhase, requestedPhase: context.phase, riskLevel: context.riskLevel, maxRisk: cell.maxRisk },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" authorized for action "${context.action}" in phase "${normalizedPhase}" at risk "${context.riskLevel}".`,
      timestamp,
    };
  }
}
