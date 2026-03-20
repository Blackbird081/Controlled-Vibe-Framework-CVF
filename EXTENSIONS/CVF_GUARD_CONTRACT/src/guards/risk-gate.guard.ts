/**
 * Risk Gate Guard — Enforces CVF R0-R3 risk model with canonical role handling.
 */

import type { Guard, GuardRequestContext, GuardResult, CVFRiskLevel } from '../types';
import { RISK_NUMERIC } from '../types';
import { getPermissions, type TeamRole } from '../enterprise/enterprise';

export const RISK_DESCRIPTIONS: Record<CVFRiskLevel, string> = {
  R0: 'Safe — no risk, free to proceed',
  R1: 'Controlled — low risk, proceed with logging',
  R2: 'Elevated — requires review or approval for builder-class roles',
  R3: 'Critical — high-risk action requiring human or governor oversight',
};

export class RiskGateGuard implements Guard {
  id = 'risk_gate';
  name = 'Risk Gate Guard';
  description = 'Enforces CVF R0-R3 risk model with role-based escalation.';
  priority = 20;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const riskNum = RISK_NUMERIC[context.riskLevel];

    if (riskNum === undefined) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown risk level: "${context.riskLevel}". Valid levels: R0, R1, R2, R3.`,
        agentGuidance: 'Use a valid CVF risk level before retrying this action.',
        suggestedAction: 'specify_valid_risk_level',
        timestamp,
      };
    }

    const userRole = context.metadata?.userRole as TeamRole | undefined;
    if (userRole) {
      try {
        const perms = getPermissions(userRole);
        if (RISK_NUMERIC[context.riskLevel] > RISK_NUMERIC[perms.maxRiskLevel]) {
          return {
            guardId: this.id,
            decision: 'BLOCK',
            severity: 'CRITICAL',
            reason: `Role "${userRole}" has maximum risk level ${perms.maxRiskLevel}. Cannot execute ${context.riskLevel} action.`,
            agentGuidance: `The active user role "${userRole}" does not permit ${context.riskLevel} actions.`,
            suggestedAction: 'request_role_elevation',
            timestamp,
            metadata: { userRole, maxRiskLevel: perms.maxRiskLevel, requestedRisk: context.riskLevel },
          };
        }
      } catch {
        // Fall through to base behavior.
      }
    }

    if (context.riskLevel === 'R3') {
      if (context.role === 'GOVERNOR' || context.role === 'HUMAN' || context.role === 'OPERATOR') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'ERROR',
          reason: `R3 (Critical) action by ${context.role} requires explicit audit trail.`,
          agentGuidance: 'Critical actions require explicit human or governor oversight and a full audit trail.',
          suggestedAction: 'confirm_with_audit',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }

      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `R3 (Critical) actions are blocked for role "${context.role}". Requires governor or human approval.`,
        agentGuidance: 'Do not proceed autonomously with this critical action.',
        suggestedAction: 'request_human_approval',
        timestamp,
        metadata: { riskLevel: context.riskLevel, role: context.role },
      };
    }

    if (context.riskLevel === 'R2') {
      if (context.role === 'OBSERVER') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'R2 (Elevated) actions are blocked for Observer role.',
          agentGuidance: 'Observer role may not execute elevated-risk actions.',
          suggestedAction: 'delegate_to_authorized_role',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }

      if (context.role === 'BUILDER' || context.role === 'ANALYST' || context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `R2 (Elevated) action by "${context.role}" requires approval. Escalating to review.`,
          agentGuidance: 'Present a plan for approval before performing this elevated-risk action.',
          suggestedAction: 'present_plan_for_approval',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }

      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'WARN',
        reason: `R2 (Elevated) action allowed for role "${context.role}" with logging.`,
        timestamp,
      };
    }

    if (context.riskLevel === 'R1' && context.role === 'OBSERVER') {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'WARN',
        reason: 'R1 (Controlled) actions are blocked for Observer role. Max risk: R0.',
        agentGuidance: 'Observer role is limited to R0 activity.',
        suggestedAction: 'reduce_risk_or_delegate',
        timestamp,
        metadata: { riskLevel: context.riskLevel, role: context.role },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Risk level "${context.riskLevel}" (${RISK_DESCRIPTIONS[context.riskLevel]}) is within safe bounds for role "${context.role}".`,
      timestamp,
    };
  }
}
