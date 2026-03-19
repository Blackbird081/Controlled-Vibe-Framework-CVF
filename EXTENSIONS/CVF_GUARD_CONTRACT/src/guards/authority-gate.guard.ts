/**
 * Authority Gate Guard — Enforces phase × role × risk authority.
 */

import type { Guard, GuardRequestContext, GuardResult, CVFPhase, CVFRiskLevel, CVFRole } from '../types';

const RISK_NUMERIC: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

export interface AuthorityCell {
  allowed: boolean;
  allowedActions: string[];
  maxRisk: CVFRiskLevel;
}

const FORBIDDEN: AuthorityCell = { allowed: false, allowedActions: [], maxRisk: 'R0' };

export const AUTHORITY_MATRIX: Record<CVFRole, Record<CVFPhase, AuthorityCell>> = {
  OBSERVER: {
    INTAKE: { allowed: true, allowedActions: ['read', 'ask', 'clarify'], maxRisk: 'R0' },
    DESIGN: { allowed: true, allowedActions: ['observe', 'read'], maxRisk: 'R0' },
    BUILD: FORBIDDEN,
    REVIEW: { allowed: true, allowedActions: ['observe', 'read'], maxRisk: 'R0' },
    FREEZE: FORBIDDEN,
    DISCOVERY: { allowed: true, allowedActions: ['read', 'ask', 'clarify'], maxRisk: 'R0' },
  },
  ANALYST: {
    INTAKE: { allowed: true, allowedActions: ['analyze', 'summarize', 'read', 'ask'], maxRisk: 'R1' },
    DESIGN: { allowed: true, allowedActions: ['compare', 'assess', 'analyze', 'read'], maxRisk: 'R1' },
    BUILD: FORBIDDEN,
    REVIEW: { allowed: true, allowedActions: ['analyze', 'read'], maxRisk: 'R1' },
    FREEZE: FORBIDDEN,
    DISCOVERY: { allowed: true, allowedActions: ['analyze', 'summarize', 'read', 'ask'], maxRisk: 'R1' },
  },
  BUILDER: {
    INTAKE: FORBIDDEN,
    DESIGN: FORBIDDEN,
    BUILD: { allowed: true, allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write'], maxRisk: 'R2' },
    REVIEW: { allowed: true, allowedActions: ['explain', 'read'], maxRisk: 'R1' },
    FREEZE: FORBIDDEN,
    DISCOVERY: FORBIDDEN,
  },
  REVIEWER: {
    INTAKE: FORBIDDEN,
    DESIGN: { allowed: true, allowedActions: ['validate', 'read', 'assess'], maxRisk: 'R1' },
    BUILD: FORBIDDEN,
    REVIEW: { allowed: true, allowedActions: ['critique', 'test', 'approve', 'reject', 'read'], maxRisk: 'R2' },
    FREEZE: FORBIDDEN,
    DISCOVERY: FORBIDDEN,
  },
  GOVERNOR: {
    INTAKE: { allowed: true, allowedActions: ['approve', 'reject', 'scope', 'read'], maxRisk: 'R2' },
    DESIGN: { allowed: true, allowedActions: ['approve', 'reject', 'read'], maxRisk: 'R2' },
    BUILD: FORBIDDEN,
    REVIEW: { allowed: true, allowedActions: ['approve', 'reject', 'read', 'override'], maxRisk: 'R3' },
    FREEZE: { allowed: true, allowedActions: ['lock', 'enforce', 'freeze', 'read'], maxRisk: 'R3' },
    DISCOVERY: { allowed: true, allowedActions: ['approve', 'reject', 'scope', 'read'], maxRisk: 'R2' },
  },
  HUMAN: {
    INTAKE: { allowed: true, allowedActions: ['approve', 'reject', 'scope', 'read', 'ask', 'analyze'], maxRisk: 'R3' },
    DESIGN: { allowed: true, allowedActions: ['approve', 'reject', 'read', 'analyze', 'compare'], maxRisk: 'R3' },
    BUILD: { allowed: true, allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write', 'read', 'deploy', 'release', 'execute'], maxRisk: 'R3' },
    REVIEW: { allowed: true, allowedActions: ['approve', 'reject', 'read', 'critique', 'test', 'override', 'deploy', 'release'], maxRisk: 'R3' },
    FREEZE: { allowed: true, allowedActions: ['lock', 'enforce', 'freeze', 'read'], maxRisk: 'R3' },
    DISCOVERY: { allowed: true, allowedActions: ['approve', 'reject', 'scope', 'read', 'ask', 'analyze'], maxRisk: 'R3' },
  },
  AI_AGENT: {
    INTAKE: FORBIDDEN,
    DESIGN: FORBIDDEN,
    BUILD: { allowed: true, allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write'], maxRisk: 'R2' },
    REVIEW: { allowed: true, allowedActions: ['explain', 'read'], maxRisk: 'R1' },
    FREEZE: FORBIDDEN,
    DISCOVERY: FORBIDDEN,
  },
  OPERATOR: {
    INTAKE: { allowed: true, allowedActions: ['read', 'ask', 'analyze', 'approve'], maxRisk: 'R2' },
    DESIGN: { allowed: true, allowedActions: ['read', 'approve', 'analyze'], maxRisk: 'R2' },
    BUILD: { allowed: true, allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write', 'read', 'deploy', 'release', 'execute'], maxRisk: 'R2' },
    REVIEW: { allowed: true, allowedActions: ['read', 'approve', 'critique', 'test', 'deploy', 'release'], maxRisk: 'R2' },
    FREEZE: FORBIDDEN,
    DISCOVERY: { allowed: true, allowedActions: ['read', 'ask', 'analyze', 'approve'], maxRisk: 'R2' },
  },
};

export const RESTRICTED_ACTIONS: Record<CVFRole, string[]> = Object.fromEntries(
  Object.entries(AUTHORITY_MATRIX).map(([role, phases]) => {
    const allowedActions = new Set<string>();
    for (const cell of Object.values(phases)) {
      if (cell.allowed) {
        for (const action of cell.allowedActions) {
          allowedActions.add(action);
        }
      }
    }
    const baselineRestricted = ['approve', 'merge', 'release', 'deploy', 'delete_governance', 'override_gate'];
    const restricted = baselineRestricted.filter((action) => !allowedActions.has(action));
    return [role, restricted];
  }),
) as Record<CVFRole, string[]>;

export class AuthorityGateGuard implements Guard {
  id = 'authority_gate';
  name = 'Authority Gate Guard';
  description = 'Enforces the canonical CVF phase-role-risk authority matrix.';
  priority = 30;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const roleMatrix = AUTHORITY_MATRIX[context.role];

    if (!roleMatrix) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown role: "${context.role}". Valid roles: ${Object.keys(AUTHORITY_MATRIX).join(', ')}.`,
        agentGuidance: 'Use a valid CVF role before retrying this action.',
        suggestedAction: 'specify_valid_role',
        timestamp,
      };
    }

    const cell = roleMatrix[context.phase];
    if (!cell) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown phase: "${context.phase}" for role "${context.role}".`,
        timestamp,
      };
    }

    if (!cell.allowed) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is forbidden in phase "${context.phase}".`,
        agentGuidance: 'This role cannot act in the current phase. Request a phase change or a different role.',
        suggestedAction: 'switch_phase_or_role',
        timestamp,
        metadata: { role: context.role, phase: context.phase },
      };
    }

    const normalizedAction = context.action.toLowerCase().trim();
    const actionAllowed = normalizedAction.startsWith('phase_transition_to_')
      || cell.allowedActions.some((action) => normalizedAction.includes(action));

    if (!actionAllowed) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Action "${context.action}" is not authorized for role "${context.role}" in phase "${context.phase}". Allowed actions: [${cell.allowedActions.join(', ')}].`,
        agentGuidance: 'Choose an action that is explicitly allowed for this role and phase.',
        suggestedAction: 'choose_authorized_action',
        timestamp,
        metadata: { role: context.role, phase: context.phase, action: context.action, allowedActions: cell.allowedActions },
      };
    }

    const actionRisk = RISK_NUMERIC[context.riskLevel] ?? 0;
    const maxRisk = RISK_NUMERIC[cell.maxRisk] ?? 0;
    if (actionRisk > maxRisk) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Risk level "${context.riskLevel}" exceeds maximum allowed "${cell.maxRisk}" for role "${context.role}" in phase "${context.phase}".`,
        agentGuidance: 'Lower the risk level or escalate to an authorized governor or human.',
        suggestedAction: 'reduce_risk_or_escalate',
        timestamp,
        metadata: { role: context.role, phase: context.phase, riskLevel: context.riskLevel, maxRisk: cell.maxRisk },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" authorized for action "${context.action}" in phase "${context.phase}" at risk "${context.riskLevel}".`,
      timestamp,
    };
  }
}
